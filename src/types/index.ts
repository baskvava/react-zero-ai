// ─── Shared ───────────────────────────────────────────────────────────────────

export type ModelStatus = "idle" | "loading" | "ready" | "error";

export interface LoadProgress {
  /** 0–100 */
  progress: number;
  /** Which file is being downloaded */
  file?: string;
}

export interface BaseHookState {
  /** Current model status */
  status: ModelStatus;
  /** True once model is downloaded and ready */
  isReady: boolean;
  /** True while model is being downloaded */
  isLoading: boolean;
  /** Error message if status === 'error' */
  error: string | null;
  /** Download progress (0–100) */
  loadProgress: LoadProgress;
}

// ─── useImageClassifier ───────────────────────────────────────────────────────

export interface ClassificationResult {
  /** Human-readable label e.g. "Tabby Cat" */
  label: string;
  /** Confidence 0–1 */
  score: number;
  /** Confidence as percentage string e.g. "94%" */
  confidence: string;
}

export interface ClassifyOutput {
  /** Top N results sorted by score descending */
  results: ClassificationResult[];
  /** Top result shorthand */
  top: ClassificationResult;
  /** Inference time in milliseconds */
  inferenceMs: number;
}

export interface UseImageClassifierOptions {
  /** Number of top results to return (default: 5) */
  topk?: number;
  /** Model to use (default: Xenova/vit-base-patch16-224) */
  model?: string;
  /** Auto-load model on mount (default: true) */
  autoLoad?: boolean;
  /** Called when load progress updates */
  onLoadProgress?: (progress: LoadProgress) => void;
  /** Called when model is ready */
  onReady?: () => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

export interface UseImageClassifierReturn extends BaseHookState {
  /** Classify an image. Accepts File, Blob, data URL, or img URL */
  classify: (
    input: File | Blob | string | HTMLImageElement
  ) => Promise<ClassifyOutput>;
  /** Manually trigger model load (if autoLoad is false) */
  load: () => Promise<void>;
}

// ─── useSentimentAnalysis ─────────────────────────────────────────────────────

export type Sentiment = "POSITIVE" | "NEGATIVE" | "NEUTRAL";

export interface SentimentResult {
  sentiment: Sentiment;
  score: number;
  confidence: string;
  /** Emoji shorthand */
  emoji: "😊" | "😞" | "😐";
}

export interface UseSentimentOptions {
  model?: string;
  autoLoad?: boolean;
  onReady?: () => void;
  onError?: (error: string) => void;
}

export interface UseSentimentReturn extends BaseHookState {
  analyze: (text: string) => Promise<SentimentResult>;
  load: () => Promise<void>;
}

// ─── useEmbeddings ────────────────────────────────────────────────────────────

export interface UseEmbeddingsOptions {
  model?: string;
  autoLoad?: boolean;
  onReady?: () => void;
  onError?: (error: string) => void;
}

export interface UseEmbeddingsReturn extends BaseHookState {
  /** Embed a string or array of strings into vectors */
  embed: (input: string | string[]) => Promise<number[][]>;
  /** Cosine similarity between two vectors (0–1) */
  similarity: (a: number[], b: number[]) => number;
  /** Find most similar strings to a query from a list */
  findSimilar: (
    query: string,
    candidates: string[],
    topk?: number
  ) => Promise<Array<{ text: string; score: number }>>;
  load: () => Promise<void>;
}

// ─── useObjectDetection ───────────────────────────────────────────────────────

export interface DetectedObject {
  label: string;
  score: number;
  confidence: string;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
}

export interface DetectionOutput {
  objects: DetectedObject[];
  count: number;
  inferenceMs: number;
}

export interface UseObjectDetectionOptions {
  model?: string;
  threshold?: number;
  autoLoad?: boolean;
  onReady?: () => void;
  onError?: (error: string) => void;
}

export interface UseObjectDetectionReturn extends BaseHookState {
  detect: (input: File | Blob | string | HTMLImageElement) => Promise<DetectionOutput>;
  load: () => Promise<void>;
}
