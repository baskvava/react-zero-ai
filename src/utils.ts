import { LoadProgress, ModelStatus } from "./types";

// ─── Model singleton cache ─────────────────────────────────────────────────────
// Prevents re-downloading the same model across multiple hook instances

const modelCache = new Map<string, unknown>();
const loadingPromises = new Map<string, Promise<unknown>>();

export async function getOrLoadModel<T>(
  key: string,
  loader: () => Promise<T>
): Promise<T> {
  if (modelCache.has(key)) {
    return modelCache.get(key) as T;
  }

  // Prevent duplicate concurrent loads
  if (loadingPromises.has(key)) {
    return loadingPromises.get(key) as Promise<T>;
  }

  const promise = loader().then((model) => {
    modelCache.set(key, model);
    loadingPromises.delete(key);
    return model;
  });

  loadingPromises.set(key, promise);
  return promise;
}

// ─── Image → data URL helper ──────────────────────────────────────────────────

export async function toImageData(
  input: File | Blob | string | HTMLImageElement
): Promise<string> {
  if (typeof input === "string") return input;

  if (input instanceof HTMLImageElement) return input.src;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(input as Blob);
  });
}

// ─── Label cleaner ────────────────────────────────────────────────────────────

export function cleanLabel(label: string): string {
  return label
    .split(",")[0]
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// ─── Progress callback builder ────────────────────────────────────────────────

export function makeProgressCallback(
  onStatusChange: (s: ModelStatus) => void,
  onProgressChange: (p: LoadProgress) => void,
  onExternalProgress?: (p: LoadProgress) => void
) {
  return (p: { status: string; progress?: number; file?: string }) => {
    if (p.status === "downloading" || p.status === "loading") {
      onStatusChange("loading");
      const prog: LoadProgress = {
        progress: Math.round(p.progress ?? 0),
        file: p.file?.split("/").pop(),
      };
      onProgressChange(prog);
      onExternalProgress?.(prog);
    }
  };
}

// ─── Format confidence ────────────────────────────────────────────────────────

export function formatConfidence(score: number): string {
  return Math.round(score * 100) + "%";
}
