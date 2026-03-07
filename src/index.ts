// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useImageClassifier } from "./hooks/useImageClassifier";
export { useSentimentAnalysis } from "./hooks/useSentimentAnalysis";
export { useEmbeddings } from "./hooks/useEmbeddings";
export { useObjectDetection } from "./hooks/useObjectDetection";

// ─── Worker utilities (advanced) ─────────────────────────────────────────────
// Re-exported so consumers can preload models before mounting any hook,
// or tear down the worker on logout / route change.
export { getWorkerBridge, workerSupported, WorkerBridge } from "./workers/worker-bridge";

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  // Shared
  ModelStatus,
  LoadProgress,
  BaseHookState,

  // useImageClassifier
  ClassificationResult,
  ClassifyOutput,
  UseImageClassifierOptions,
  UseImageClassifierReturn,

  // useSentimentAnalysis
  Sentiment,
  SentimentResult,
  UseSentimentOptions,
  UseSentimentReturn,

  // useEmbeddings
  UseEmbeddingsOptions,
  UseEmbeddingsReturn,

  // useObjectDetection
  DetectedObject,
  DetectionOutput,
  UseObjectDetectionOptions,
  UseObjectDetectionReturn,
} from "./types";
