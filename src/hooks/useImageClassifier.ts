"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { pipeline } from "@huggingface/transformers";
import type {
  UseImageClassifierOptions,
  UseImageClassifierReturn,
  ClassifyOutput,
  ModelStatus,
  LoadProgress,
} from "../types";
import { getWorkerBridge, workerSupported } from "../workers/worker-bridge";
import {
  getOrLoadModel,
  toImageData,
  cleanLabel,
  makeProgressCallback,
  formatConfidence,
} from "../utils";

const DEFAULT_MODEL = "Xenova/vit-base-patch16-224";
const TASK = "image-classification" as const;

export function useImageClassifier(
  options: UseImageClassifierOptions = {}
): UseImageClassifierReturn {
  const {
    topk = 5,
    model = DEFAULT_MODEL,
    autoLoad = true,
    onLoadProgress,
    onReady,
    onError,
  } = options;

  const [status, setStatus] = useState<ModelStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState<LoadProgress>({ progress: 0 });

  const bridgeRef   = useRef(getWorkerBridge());   // null on SSR
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fallbackRef = useRef<any>(null);            // main-thread fallback
  const useWorker   = workerSupported();

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (status === "ready" || status === "loading") return;
    setStatus("loading");
    setError(null);

    try {
      if (useWorker && bridgeRef.current) {
        // ✅ Worker path — model lives in background thread, UI stays smooth
        await bridgeRef.current.load(TASK, model, (progress, file) => {
          const prog: LoadProgress = { progress, file };
          setLoadProgress(prog);
          onLoadProgress?.(prog);
        });
      } else {
        // ⚠️  Fallback — runs on main thread (Safari private mode, SSR, etc.)
        const pipe = await getOrLoadModel(model, () =>
          pipeline(TASK, model, {
            progress_callback: makeProgressCallback(setStatus, setLoadProgress, onLoadProgress),
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
  }, [model, status, useWorker, onLoadProgress, onReady, onError]);

  // Auto-load
  const hasAutoLoaded = useRef(false);
  useEffect(() => {
    if (autoLoad && !hasAutoLoaded.current) {
      hasAutoLoaded.current = true;
      load();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Classify ──────────────────────────────────────────────────────────────

  const classify = useCallback(
    async (input: File | Blob | string | HTMLImageElement): Promise<ClassifyOutput> => {
      if (status !== "ready") {
        throw new Error("Model not ready. Wait for isReady to be true.");
      }

      const src = await toImageData(input);

      if (useWorker && bridgeRef.current) {
        // Worker path — non-blocking 🚀
        const { data, inferenceMs } = await bridgeRef.current.run(
          TASK, model, src, { topk }
        );
        const results = (data as Array<{ label: string; score: number }>).map((r) => ({
          label: cleanLabel(r.label),
          score: r.score,
          confidence: formatConfidence(r.score),
        }));
        return { results, top: results[0], inferenceMs };
      } else {
        // Fallback path
        const t0 = performance.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = await (fallbackRef.current as any)(src, { topk });
        const inferenceMs = Math.round(performance.now() - t0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results = (raw as any[]).map((r) => ({
          label: cleanLabel(r.label),
          score: r.score,
          confidence: formatConfidence(r.score),
        }));
        return { results, top: results[0], inferenceMs };
      }
    },
    [status, model, topk, useWorker]
  );

  return {
    status,
    isReady: status === "ready",
    isLoading: status === "loading",
    error,
    loadProgress,
    classify,
    load,
  };
}
