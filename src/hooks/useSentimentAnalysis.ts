"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { pipeline } from "@huggingface/transformers";
import type {
  UseSentimentOptions,
  UseSentimentReturn,
  SentimentResult,
  Sentiment,
  ModelStatus,
  LoadProgress,
} from "../types";
import { getWorkerBridge, workerSupported } from "../workers/worker-bridge";
import { getOrLoadModel, makeProgressCallback, formatConfidence } from "../utils";

const DEFAULT_MODEL = "Xenova/distilbert-base-uncased-finetuned-sst-2-english";
const TASK = "text-classification" as const;

const EMOJI_MAP: Record<Sentiment, "😊" | "😞" | "😐"> = {
  POSITIVE: "😊",
  NEGATIVE: "😞",
  NEUTRAL:  "😐",
};

function normaliseLabel(raw: string): Sentiment {
  const up = raw.toUpperCase();
  if (up.includes("POS")) return "POSITIVE";
  if (up.includes("NEG")) return "NEGATIVE";
  return "NEUTRAL";
}

export function useSentimentAnalysis(
  options: UseSentimentOptions = {}
): UseSentimentReturn {
  const { model = DEFAULT_MODEL, autoLoad = true, onReady, onError } = options;

  const [status, setStatus]           = useState<ModelStatus>("idle");
  const [error, setError]             = useState<string | null>(null);
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
        await bridgeRef.current.load(TASK, model, (progress, file) => {
          setLoadProgress({ progress, file });
        });
      } else {
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

  // ── Analyse ───────────────────────────────────────────────────────────────

  const analyze = useCallback(async (text: string): Promise<SentimentResult> => {
    if (status !== "ready") throw new Error("Model not ready.");
    if (!text.trim())       throw new Error("Input text cannot be empty.");

    if (useWorker && bridgeRef.current) {
      const { data } = await bridgeRef.current.run(TASK, model, text);
      const top = Array.isArray(data) ? data[0] : data;
      const sentiment = normaliseLabel(top.label);
      return {
        sentiment,
        score: top.score,
        confidence: formatConfidence(top.score),
        emoji: EMOJI_MAP[sentiment],
      };
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = await (fallbackRef.current as any)(text);
      const top = Array.isArray(raw) ? raw[0] : raw;
      const sentiment = normaliseLabel(top.label);
      return {
        sentiment,
        score: top.score,
        confidence: formatConfidence(top.score),
        emoji: EMOJI_MAP[sentiment],
      };
    }
  }, [status, model, useWorker]);

  return {
    status,
    isReady: status === "ready",
    isLoading: status === "loading",
    error,
    loadProgress,
    analyze,
    load,
  };
}
