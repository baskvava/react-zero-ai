"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { pipeline } from "@huggingface/transformers";
import type {
  UseEmbeddingsOptions,
  UseEmbeddingsReturn,
  ModelStatus,
  LoadProgress,
} from "../types";
import { getWorkerBridge, workerSupported } from "../workers/worker-bridge";
import { getOrLoadModel, makeProgressCallback } from "../utils";

const DEFAULT_MODEL = "Xenova/all-MiniLM-L6-v2";
const TASK = "feature-extraction" as const;

// ── Cosine similarity (pure, no deps) ────────────────────────────────────────
function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Vector dimensions must match.");
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function useEmbeddings(
  options: UseEmbeddingsOptions = {}
): UseEmbeddingsReturn {
  const { model = DEFAULT_MODEL, autoLoad = false, onReady, onError } = options;

  const [status, setStatus]             = useState<ModelStatus>("idle");
  const [error, setError]               = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState<LoadProgress>({ progress: 0 });

  const bridgeRef   = useRef(getWorkerBridge());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fallbackRef = useRef<any>(null);
  const useWorker   = workerSupported();

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (status === "ready" || status === "loading") return;
    setStatus("loading");
    setError(null);

    try {
      if (useWorker && bridgeRef.current) {
        // Worker path — embedding tensors are computed off the main thread 🚀
        await bridgeRef.current.load(TASK, model, (progress, file) => {
          setLoadProgress({ progress, file });
        });
      } else {
        // Fallback
        const pipe = await getOrLoadModel(model, () =>
          pipeline(TASK, model, {
            progress_callback: makeProgressCallback(setStatus, setLoadProgress),
          })
        );
        fallbackRef.current = pipe;
      }

      setStatus("ready");
      onReady?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus("error");
      setError(msg);
      onError?.(msg);
    }
  }, [model, status, useWorker, onReady, onError]);

  const hasAutoLoaded = useRef(false);
  useEffect(() => {
    if (autoLoad && !hasAutoLoaded.current) {
      hasAutoLoaded.current = true;
      load();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── embed ─────────────────────────────────────────────────────────────────

  const embed = useCallback(
    async (input: string | string[]): Promise<number[][]> => {
      if (status !== "ready") throw new Error("Model not ready.");

      const texts = Array.isArray(input) ? input : [input];

      if (useWorker && bridgeRef.current) {
        // Worker serialises tensors via .tolist() before postMessage
        const { data } = await bridgeRef.current.run(
          TASK, model, texts, { pooling: "mean", normalize: true }
        );
        // data is already number[][] from serialise() in the worker
        return data as number[][];
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const output = await (fallbackRef.current as any)(texts, {
          pooling: "mean",
          normalize: true,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (output as any).tolist() as number[][];
      }
    },
    [status, model, useWorker]
  );

  // ── similarity (pure, runs on main thread — it's just math) ──────────────

  const similarity = useCallback(
    (a: number[], b: number[]): number => cosine(a, b),
    []
  );

  // ── findSimilar ───────────────────────────────────────────────────────────

  const findSimilar = useCallback(
    async (
      query: string,
      candidates: string[],
      topk = 3
    ): Promise<Array<{ text: string; score: number }>> => {
      // Embed query + all candidates in one batched Worker call
      const vectors = await embed([query, ...candidates]);
      const queryVec = vectors[0];

      return candidates
        .map((text, i) => ({
          text,
          score: Math.round(cosine(queryVec, vectors[i + 1]) * 1000) / 1000,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topk);
    },
    [embed]
  );

  return {
    status,
    isReady:   status === "ready",
    isLoading: status === "loading",
    error,
    loadProgress,
    embed,
    similarity,
    findSimilar,
    load,
  };
}
