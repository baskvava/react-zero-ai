/**
 * worker-bridge.ts
 *
 * Creates and manages a single shared Web Worker instance.
 * Routes requests/responses via a Promise map so callers get a clean async API.
 *
 * Usage:
 *   const bridge = getWorkerBridge()
 *   await bridge.load('image-classification', 'Xenova/vit-...', onProgress)
 *   const { data, inferenceMs } = await bridge.run('image-classification', model, input, opts)
 */

import type {
  WorkerRequest,
  WorkerResponse,
  ProgressMessage,
  TaskType,
} from "./inference.worker";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BridgeResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  inferenceMs: number;
}

type PendingEntry = {
  resolve: (v: BridgeResult | void) => void;
  reject: (e: Error) => void;
  onProgress?: (progress: number, file?: string) => void;
};

// ─── Singleton bridge ─────────────────────────────────────────────────────────

const pending = new Map<string, PendingEntry>();
let idCounter = 0;

/**
 * Returns true when the runtime supports Web Workers (i.e. in the browser).
 * SSR / Node.js environments don't have Worker, so we fall back gracefully.
 */
export function workerSupported(): boolean {
  return typeof window !== "undefined" && typeof Worker !== "undefined";
}

/**
 * Lazily create (or reuse) the singleton worker.
 * The worker file must be bundled separately — see README for Vite/Next setup.
 */
export function getWorkerBridge(): WorkerBridge | null {
  if (!workerSupported()) return null;
  return WorkerBridge.getInstance();
}

export class WorkerBridge {
  private static _instance: WorkerBridge | null = null;

  static getInstance(): WorkerBridge {
    if (!WorkerBridge._instance) {
      WorkerBridge._instance = new WorkerBridge();
    }
    return WorkerBridge._instance;
  }

  /** Force-reset — useful in tests */
  static reset() {
    WorkerBridge._instance?.destroy();
    WorkerBridge._instance = null;
  }

  private worker: Worker;

  private constructor() {
    // new URL(..., import.meta.url) lets bundlers (Vite, webpack 5) resolve
    // the worker file and emit it as a separate chunk automatically.
    this.worker = new Worker(
      new URL("./workers/inference.worker.js", import.meta.url),
      { type: "module" }
    );

    this.worker.addEventListener("message", this.handleMessage.bind(this));
    this.worker.addEventListener("error", this.handleError.bind(this));
  }

  // ── Internal message handler ──────────────────────────────────────────────

  private handleMessage(event: MessageEvent<WorkerResponse | ProgressMessage>) {
    const msg = event.data;

    if (msg.type === "progress") {
      const p = msg as ProgressMessage;
      pending.get(p.id)?.onProgress?.(p.progress, p.file);
      return;
    }

    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);

    if (msg.type === "error") {
      entry.reject(new Error(msg.error ?? "Unknown worker error"));
    } else if (msg.type === "ready") {
      entry.resolve(undefined);
    } else if (msg.type === "result") {
      entry.resolve({ data: msg.data, inferenceMs: msg.inferenceMs ?? 0 });
    }
  }

  private handleError(event: ErrorEvent) {
    // Reject all pending requests on an unrecoverable worker crash
    for (const [, entry] of pending) {
      entry.reject(new Error(`Worker crashed: ${event.message}`));
    }
    pending.clear();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Tell the worker to download and initialise a model.
   * Returns a Promise that resolves when the model is ready.
   */
  load(
    task: TaskType,
    model: string,
    onProgress?: (progress: number, file?: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = String(++idCounter);
      pending.set(id, {
        resolve: resolve as (v: BridgeResult | void) => void,
        reject,
        onProgress,
      });

      const req: WorkerRequest = { id, type: "load", task, model };
      this.worker.postMessage(req);
    });
  }

  /**
   * Run inference.
   * The model must have been loaded first (via load()).
   */
  run(
    task: TaskType,
    model: string,
    input: string | string[],
    options?: Record<string, unknown>
  ): Promise<BridgeResult> {
    return new Promise((resolve, reject) => {
      const id = String(++idCounter);
      pending.set(id, {
        resolve: resolve as (v: BridgeResult | void) => void,
        reject,
      });

      const req: WorkerRequest = { id, type: "run", task, model, input, options };
      this.worker.postMessage(req);
    });
  }

  /** Terminate the worker and free memory */
  destroy() {
    this.worker.terminate();
    pending.clear();
  }
}
