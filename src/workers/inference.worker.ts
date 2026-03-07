/**
 * inference.worker.ts
 *
 * Runs inside a Web Worker — completely off the main thread.
 * All model loading and inference happens here so the UI never freezes.
 *
 * Message protocol:
 *   Main → Worker:  WorkerRequest
 *   Worker → Main:  WorkerResponse | ProgressMessage
 */

import { pipeline, env } from "@huggingface/transformers";

// Disable local model lookup — always fetch from HuggingFace CDN
env.allowLocalModels = false;

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskType =
  | "image-classification"
  | "text-classification"
  | "feature-extraction"
  | "object-detection";

export interface WorkerRequest {
  /** Unique request ID — echoed back in the response */
  id: string;
  type: "load" | "run";
  task: TaskType;
  model: string;
  /** Payload for inference (omitted for "load" messages) */
  input?: string | string[];
  options?: Record<string, unknown>;
}

export interface ProgressMessage {
  type: "progress";
  id: string;
  progress: number;
  file?: string;
}

export interface WorkerResponse {
  type: "ready" | "result" | "error";
  id: string;
  // result payload — shape depends on task
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  error?: string;
  inferenceMs?: number;
}

// ─── Pipeline cache (per model key) ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pipelineCache = new Map<string, any>();

// Dedup concurrent loads of the same model — store the in-flight Promise
const loadingPromises = new Map<string, Promise<void>>();

function cacheKey(task: TaskType, model: string) {
  return `${task}::${model}`;
}

// ─── Serialise pipeline output → plain JS (structured-clone safe) ─────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialise(raw: any): any {
  // Tensor (feature-extraction) — .tolist() converts to nested number[]
  if (raw && typeof raw.tolist === "function") return raw.tolist();
  // Array of Tensors
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0]?.tolist === "function") {
    return raw.map((t: { tolist: () => unknown }) => t.tolist());
  }
  return raw;
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const { id, type, task, model, input, options } = event.data;
  const key = cacheKey(task, model);

  // ── LOAD ──────────────────────────────────────────────────────────────────
  if (type === "load") {
    // Already cached — respond immediately
    if (pipelineCache.has(key)) {
      self.postMessage({ type: "ready", id } satisfies WorkerResponse);
      return;
    }

    // Another request is already loading the same model — wait for it
    if (loadingPromises.has(key)) {
      try {
        await loadingPromises.get(key);
        self.postMessage({ type: "ready", id } satisfies WorkerResponse);
      } catch (err) {
        self.postMessage({
          type: "error", id,
          error: err instanceof Error ? err.message : String(err),
        } satisfies WorkerResponse);
      }
      return;
    }

    // First request for this model — kick off the download
    const loadPromise = (async () => {
      const pipe = await pipeline(task, model, {
        progress_callback: (p: { status: string; progress?: number; file?: string }) => {
          if (p.status === "downloading" || p.status === "loading") {
            self.postMessage({
              type: "progress", id,
              progress: Math.round(p.progress ?? 0),
              file: p.file?.split("/").pop(),
            } satisfies ProgressMessage);
          }
        },
      });
      pipelineCache.set(key, pipe);
    })();

    loadingPromises.set(key, loadPromise);

    try {
      await loadPromise;
      self.postMessage({ type: "ready", id } satisfies WorkerResponse);
    } catch (err) {
      self.postMessage({
        type: "error", id,
        error: err instanceof Error ? err.message : String(err),
      } satisfies WorkerResponse);
    } finally {
      loadingPromises.delete(key);
    }
    return;
  }

  // ── RUN ───────────────────────────────────────────────────────────────────
  if (type === "run") {
    const pipe = pipelineCache.get(key);
    if (!pipe) {
      self.postMessage({
        type: "error", id,
        error: "Model not loaded. Call load() before running inference.",
      } satisfies WorkerResponse);
      return;
    }

    try {
      const t0 = performance.now();
      const raw = await pipe(input, options ?? {});
      const inferenceMs = Math.round(performance.now() - t0);

      self.postMessage({
        type: "result", id,
        data: serialise(raw),
        inferenceMs,
      } satisfies WorkerResponse);
    } catch (err) {
      self.postMessage({
        type: "error", id,
        error: err instanceof Error ? err.message : String(err),
      } satisfies WorkerResponse);
    }
    return;
  }
});
