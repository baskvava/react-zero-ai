"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { pipeline } from "@huggingface/transformers";
import type {
  UseObjectDetectionOptions,
  UseObjectDetectionReturn,
  DetectionOutput,
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

const DEFAULT_MODEL = "Xenova/detr-resnet-50";
const TASK = "object-detection" as const;

export function useObjectDetection(
  options: UseObjectDetectionOptions = {}
): UseObjectDetectionReturn {
  const {
    model     = DEFAULT_MODEL,
    threshold = 0.5,
    autoLoad  = false,
    onReady,
    onError,
  } = options;

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
        // Worker path — 160 MB model + ONNX inference stay off the main thread 🚀
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

  // ── Detect ────────────────────────────────────────────────────────────────

  const detect = useCallback(
    async (input: File | Blob | string | HTMLImageElement): Promise<DetectionOutput> => {
      if (status !== "ready") throw new Error("Model not ready.");

      const src = await toImageData(input);

      if (useWorker && bridgeRef.current) {
        const { data, inferenceMs } = await bridgeRef.current.run(
          TASK, model, src, { threshold }
        );
        const objects = (data as Array<{
          label: string;
          score: number;
          box: { xmin: number; ymin: number; xmax: number; ymax: number };
        }>).map((r) => ({
          label:      cleanLabel(r.label),
          score:      r.score,
          confidence: formatConfidence(r.score),
          box:        r.box,
        }));
        return { objects, count: objects.length, inferenceMs };
      } else {
        const t0 = performance.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = await (fallbackRef.current as any)(src, { threshold });
        const inferenceMs = Math.round(performance.now() - t0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const objects = (raw as any[]).map((r) => ({
          label:      cleanLabel(r.label),
          score:      r.score,
          confidence: formatConfidence(r.score),
          box:        r.box,
        }));
        return { objects, count: objects.length, inferenceMs };
      }
    },
    [status, model, threshold, useWorker]
  );

  return {
    status,
    isReady:   status === "ready",
    isLoading: status === "loading",
    error,
    loadProgress,
    detect,
    load,
  };
}
