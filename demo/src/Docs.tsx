import React, { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-bash';
import CodeSandbox from './CodeSandbox';
import {
  ImageClassifierPreview,
  SentimentPreview,
  EmbeddingsPreview,
  ObjectDetectionPreview
} from './HookPreviews';

/* ─── Shared UI components ─── */

const DocSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="doc-section">
    <h2 className="doc-section-title">{title}</h2>
    {children}
  </section>
);

const CodeSnippet = ({ code, lang = 'tsx' }: { code: string; lang?: string }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, lang]);

  return (
    <div className="doc-code-wrapper">
      <div className="doc-code-header">
        <div className="code-dot red" />
        <div className="code-dot yellow" />
        <div className="code-dot green" />
        <div className="doc-code-lang">{lang}</div>
      </div>
      <pre className="doc-code">
        <code ref={codeRef} className={`language-${lang}`}>
          {code}
        </code>
      </pre>
    </div>
  );
};

const PropTable = ({ data }: { data: Array<{ name: string; type: string; default?: string; desc: string }> }) => (
  <div className="table-wrapper">
    <table className="doc-table">
      <thead>
        <tr>
          <th>Property</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <td style={{ fontWeight: 600, color: '#fff' }}><code>{row.name}</code></td>
            <td><span className="type-badge">{row.type}</span></td>
            <td style={{ opacity: 0.6 }}><code>{row.default || '-'}</code></td>
            <td>{row.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ReturnTable = ({ data }: { data: Array<{ name: string; type: string; desc: string }> }) => (
  <div className="table-wrapper">
    <table className="doc-table">
      <thead>
        <tr>
          <th>Property</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <td style={{ fontWeight: 600, color: '#fff' }}><code>{row.name}</code></td>
            <td><span className="type-badge">{row.type}</span></td>
            <td>{row.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ProTip = ({ children }: { children: React.ReactNode }) => (
  <div className="pro-tip">
    <div className="pro-tip-icon">💡</div>
    <div className="pro-tip-content">{children}</div>
  </div>
);

/* ─── Hook doc definitions ─── */

const IntroSection = () => (
  <DocSection title="Getting Started">
    <p className="doc-text">
      <code>react-zero-ai</code> is a collection of high-performance React hooks built on top of Hugging Face's
      Transformers.js. It allows you to run state-of-the-art machine learning models directly in the user's browser,
      completely off-loading the computation from your servers while ensuring maximum privacy.
    </p>

    <ProTip>
      <strong>Performance Tip:</strong> Models are automatically cached in the browser after the first download.
      Subsequent loads are near-instant as they are served from <code>IndexedDB</code>.
    </ProTip>

    <h3 className="doc-sub-title">Installation</h3>
    <CodeSnippet lang="bash" code="npm install react-zero-ai" />

    <h3 className="doc-sub-title">Vite Configuration</h3>
    <p className="doc-text">
      If you are using Vite, you must configure it to output the internal Web Worker as an ES module and prevent the transformers library from being overly bundled during development. 
      Furthermore, running machine learning models in the browser heavily relies on WebAssembly multithreading via <code>SharedArrayBuffer</code>, which requires the page to be Cross-Origin Isolated.
    </p>
    <CodeSnippet lang="typescript" code={`import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

// 1. Cross-Origin Isolation (Needed for SharedArrayBuffer / WASM Multithreading)
function crossOriginIsolation(): Plugin {
  return {
    name: 'cross-origin-isolation',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [crossOriginIsolation()],
  
  // 2. Prevent Vite from bundling the massive transformers library
  optimizeDeps: {
    exclude: ['@huggingface/transformers'],
  },
  
  // 3. Emit the internal ML worker as a correct ES module
  worker: {
    format: 'es',
  },
});`} />

    <h3 className="doc-sub-title">Quick Start</h3>
    <CodeSandbox
      title="Quick Start"
      files={[
        {
          name: 'App.tsx',
          code: `import { useImageClassifier } from 'react-zero-ai';

export default function App() {
  const { classify, isReady, loadProgress } = useImageClassifier();

  if (!isReady) {
    return <p>Loading model… {loadProgress.progress}%</p>;
  }

  return (
    <input
      type="file"
      accept="image/*"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const { top } = await classify(file);
        alert(\`Detected: \${top.label} (\${top.confidence})\`);
      }}
    />
  );
}`,
        },
      ]}
    />
  </DocSection>
);

const UseImageClassifierDoc = () => (
  <DocSection title="useImageClassifier">
    <p className="doc-text">
      Classifies images into 1000+ categories using Vision Transformer (ViT) architecture.
      Ideal for content tagging, visual search, and accessibility.
    </p>

    <h3 className="doc-sub-title">Parameters</h3>
    <PropTable data={[
      { name: 'model', type: 'string', default: 'Xenova/vit-base-patch16-224', desc: 'Hugging Face model repository ID.' },
      { name: 'topk', type: 'number', default: '5', desc: 'Number of highest-score predictions to return.' },
      { name: 'autoLoad', type: 'boolean', default: 'true', desc: 'Immediately start model initialization on mount.' },
      { name: 'onLoadProgress', type: '(progress) => void', desc: 'Called with download progress updates ({ progress, file }).' },
      { name: 'onReady', type: '() => void', desc: 'Triggered when the model is fully loaded and ready.' },
      { name: 'onError', type: '(error: string) => void', desc: 'Called when model loading fails.' },
    ]} />

    <h3 className="doc-sub-title">Return Value</h3>
    <ReturnTable data={[
      { name: 'status', type: 'ModelStatus', desc: '"idle" | "loading" | "ready" | "error"' },
      { name: 'isReady', type: 'boolean', desc: 'True when the model is loaded and ready to classify.' },
      { name: 'isLoading', type: 'boolean', desc: 'True while the model is being downloaded.' },
      { name: 'error', type: 'string | null', desc: 'Error message if loading failed.' },
      { name: 'loadProgress', type: 'LoadProgress', desc: 'Current download progress ({ progress: number, file?: string }).' },
      { name: 'classify', type: '(input) => Promise<ClassifyOutput>', desc: 'Classify an image. Accepts File, Blob, data URL, or HTMLImageElement.' },
      { name: 'load', type: '() => Promise<void>', desc: 'Manually trigger model load (if autoLoad is false).' },
    ]} />

    <h3 className="doc-sub-title">Usage Example</h3>
    <CodeSandbox
      title="useImageClassifier — Demo"
      preview={<ImageClassifierPreview />}
      files={[
        {
          name: 'ImageClassifier.tsx',
          code: `import { useState } from 'react';
import { useImageClassifier } from 'react-zero-ai';
import type { ClassificationResult } from 'react-zero-ai';

export default function ImageClassifier() {
  const {
    classify,
    isReady,
    isLoading,
    loadProgress,
    error,
  } = useImageClassifier({ topk: 3 });

  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [timing, setTiming] = useState<number | null>(null);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show image preview
    setPreview(URL.createObjectURL(file));

    // Run classification
    const output = await classify(file);
    setResults(output.results);
    setTiming(output.inferenceMs);

    console.log(
      \`Top: \${output.top.label} (\${output.top.confidence})\`
    );
  };

  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div>
      {isLoading && (
        <div className="progress-bar">
          <div style={{ width: \`\${loadProgress.progress}%\` }} />
          <span>
            Loading model… {Math.round(loadProgress.progress)}%
          </span>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={!isReady}
      />

      {preview && (
        <img src={preview} alt="Preview" style={{ maxWidth: 300 }} />
      )}

      {results.length > 0 && (
        <ul>
          {results.map((r, i) => (
            <li key={i}>
              {r.label} — <strong>{r.confidence}</strong>
              {" "}(score: {r.score.toFixed(4)})
            </li>
          ))}
          {timing && <p>Inference: {timing}ms</p>}
        </ul>
      )}
    </div>
  );
}`,
        },
        {
          name: 'types.ts',
          lang: 'typescript',
          code: `// Return type of classify()
interface ClassifyOutput {
  results: ClassificationResult[];
  top: ClassificationResult;
  inferenceMs: number;
}

interface ClassificationResult {
  label: string;       // "Tabby Cat"
  score: number;       // 0.94
  confidence: string;  // "94%"
}`,
        },
      ]}
    />
  </DocSection>
);

const UseSentimentAnalysisDoc = () => (
  <DocSection title="useSentimentAnalysis">
    <p className="doc-text">
      Performs text classification to determine emotional context. Perfect for real-time
      feedback in form fields or localized social media analysis.
    </p>

    <h3 className="doc-sub-title">Parameters</h3>
    <PropTable data={[
      { name: 'model', type: 'string', default: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', desc: 'Pre-trained DistilBERT model for sentiment classification.' },
      { name: 'autoLoad', type: 'boolean', default: 'true', desc: 'Loads model automatically on component mount.' },
      { name: 'onReady', type: '() => void', desc: 'Called when the model is ready.' },
      { name: 'onError', type: '(error: string) => void', desc: 'Called when model loading fails.' },
    ]} />

    <h3 className="doc-sub-title">Return Value</h3>
    <ReturnTable data={[
      { name: 'status', type: 'ModelStatus', desc: '"idle" | "loading" | "ready" | "error"' },
      { name: 'isReady', type: 'boolean', desc: 'True when the model is loaded and ready.' },
      { name: 'isLoading', type: 'boolean', desc: 'True while the model is downloading.' },
      { name: 'error', type: 'string | null', desc: 'Error message if loading failed.' },
      { name: 'loadProgress', type: 'LoadProgress', desc: 'Download progress ({ progress, file }).' },
      { name: 'analyze', type: '(text: string) => Promise<SentimentResult>', desc: 'Analyze sentiment of the input text.' },
      { name: 'load', type: '() => Promise<void>', desc: 'Manually trigger model load.' },
    ]} />

    <h3 className="doc-sub-title">Usage Example</h3>
    <CodeSandbox
      title="useSentimentAnalysis — Demo"
      preview={<SentimentPreview />}
      files={[
        {
          name: 'SentimentDemo.tsx',
          code: `import { useState } from 'react';
import { useSentimentAnalysis } from 'react-zero-ai';
import type { SentimentResult } from 'react-zero-ai';

export default function SentimentDemo() {
  const { analyze, isReady, isLoading, loadProgress } =
    useSentimentAnalysis();

  const [text, setText] = useState('');
  const [result, setResult] = useState<SentimentResult | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    const sentiment = await analyze(text);
    setResult(sentiment);
  };

  if (isLoading) {
    return (
      <p>Loading model… {Math.round(loadProgress.progress)}%</p>
    );
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type something to analyze…"
        disabled={!isReady}
      />
      <button
        onClick={handleAnalyze}
        disabled={!isReady || !text.trim()}
      >
        Analyze Sentiment
      </button>

      {result && (
        <div className="result-card">
          <span className="emoji">{result.emoji}</span>
          <h3>{result.sentiment}</h3>
          <p>
            Confidence: {result.confidence}
            {" "}(score: {result.score.toFixed(4)})
          </p>
        </div>
      )}
    </div>
  );
}`,
        },
        {
          name: 'LiveFeedback.tsx',
          code: `import { useState } from 'react';
import { useSentimentAnalysis } from 'react-zero-ai';

// Real-time sentiment feedback as the user types
export default function LiveFeedback() {
  const { analyze, isReady } = useSentimentAnalysis();
  const [emoji, setEmoji] = useState('');

  const handleInput = async (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    if (!isReady || value.length < 5) return;

    const { emoji } = await analyze(value);
    setEmoji(emoji);
  };

  return (
    <div>
      <textarea
        onChange={handleInput}
        placeholder="Start typing…"
      />
      {emoji && (
        <span style={{ fontSize: 48 }}>{emoji}</span>
      )}
    </div>
  );
}`,
        },
        {
          name: 'types.ts',
          lang: 'typescript',
          code: `// Return type of analyze()
interface SentimentResult {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;        // 0–1
  confidence: string;   // "99%"
  emoji: '😊' | '😞' | '😐';
}`,
        },
      ]}
    />
  </DocSection>
);

const UseEmbeddingsDoc = () => (
  <DocSection title="useEmbeddings">
    <p className="doc-text">
      Generate high-dimensional vector representations of text strings. Essential for
      semantic search, recommendation systems, and clustering within the browser.
    </p>

    <h3 className="doc-sub-title">Parameters</h3>
    <PropTable data={[
      { name: 'model', type: 'string', default: 'Xenova/all-MiniLM-L6-v2', desc: 'Sentence-transformer model for embedding generation.' },
      { name: 'autoLoad', type: 'boolean', default: 'false', desc: 'Whether to load the model automatically on mount.' },
      { name: 'onReady', type: '() => void', desc: 'Called when the model is ready.' },
      { name: 'onError', type: '(error: string) => void', desc: 'Called when model loading fails.' },
    ]} />

    <h3 className="doc-sub-title">Return Value</h3>
    <ReturnTable data={[
      { name: 'status', type: 'ModelStatus', desc: '"idle" | "loading" | "ready" | "error"' },
      { name: 'isReady', type: 'boolean', desc: 'True when model is loaded.' },
      { name: 'isLoading', type: 'boolean', desc: 'True while downloading.' },
      { name: 'error', type: 'string | null', desc: 'Error message if loading failed.' },
      { name: 'loadProgress', type: 'LoadProgress', desc: 'Download progress ({ progress, file }).' },
      { name: 'embed', type: '(input: string | string[]) => Promise<number[][]>', desc: 'Convert text(s) into embedding vectors.' },
      { name: 'similarity', type: '(a: number[], b: number[]) => number', desc: 'Cosine similarity between two vectors (0–1).' },
      { name: 'findSimilar', type: '(query, candidates, topk?) => Promise<Result[]>', desc: 'Rank candidates by semantic similarity to query.' },
      { name: 'load', type: '() => Promise<void>', desc: 'Manually trigger model load.' },
    ]} />

    <div className="doc-card">
      <code style={{ color: 'var(--brand-l)' }}>findSimilar(query: string, candidates: string[], topk?: number)</code>
      <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-2)' }}>
        Ranks the candidate strings based on cosine similarity to the query string.
        Returns an array of <code>{`{ text: string; score: number }`}</code> sorted by score descending.
      </p>
    </div>

    <h3 className="doc-sub-title">Usage Example</h3>
    <CodeSandbox
      title="useEmbeddings — Semantic Search"
      preview={<EmbeddingsPreview />}
      files={[
        {
          name: 'SemanticSearch.tsx',
          code: `import { useState } from 'react';
import { useEmbeddings } from 'react-zero-ai';

export default function SemanticSearch() {
  const {
    findSimilar,
    isReady,
    load,
    isLoading,
    loadProgress,
  } = useEmbeddings();

  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<
    Array<{ text: string; score: number }>
  >([]);

  const faqItems = [
    'How do I reset my password?',
    'Where can I view my billing history?',
    'How to enable two-factor authentication',
    'Cancel my subscription',
    'Change my email address',
    'Download my data export',
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    const results = await findSimilar(query, faqItems, 3);
    setMatches(results);
  };

  return (
    <div>
      {!isReady ? (
        <button onClick={load} disabled={isLoading}>
          {isLoading
            ? \`Loading… \${Math.round(loadProgress.progress)}%\`
            : 'Load Embeddings Model'}
        </button>
      ) : (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your issue…"
            onKeyDown={(e) =>
              e.key === 'Enter' && handleSearch()
            }
          />
          <button onClick={handleSearch}>Search</button>
        </>
      )}

      {matches.length > 0 && (
        <ul>
          {matches.map((m, i) => (
            <li key={i}>
              <strong>{m.text}</strong>
              <span>
                Similarity: {(m.score * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}`,
        },
        {
          name: 'Advanced.tsx',
          code: `import { useEmbeddings } from 'react-zero-ai';

// Low-level: compute raw embeddings & compare vectors
export default function Advanced() {
  const { embed, similarity, isReady, load } =
    useEmbeddings();

  const run = async () => {
    // Embed multiple strings in one batched call
    const vectors = await embed([
      'Hello world',
      'Hi there',
      'Goodbye',
    ]);
    // vectors: number[][] — 384-dim per vector

    // Compare two vectors directly
    const score = similarity(vectors[0], vectors[1]);
    console.log('Cosine similarity:', score); // ~0.85
  };

  return (
    <button onClick={isReady ? run : load}>
      {isReady ? 'Run Embeddings' : 'Load Model'}
    </button>
  );
}`,
        },
      ]}
    />
  </DocSection>
);

const UseObjectDetectionDoc = () => (
  <DocSection title="useObjectDetection">
    <p className="doc-text">
      Identifies and locates objects within images. Returns canonical labels and
      bounding box coordinates ready for canvas rendering.
    </p>

    <h3 className="doc-sub-title">Parameters</h3>
    <PropTable data={[
      { name: 'model', type: 'string', default: 'Xenova/detr-resnet-50', desc: 'DETR object detection model.' },
      { name: 'threshold', type: 'number', default: '0.5', desc: 'Minimum confidence score for a detection to be included.' },
      { name: 'autoLoad', type: 'boolean', default: 'false', desc: 'Whether to load the model automatically.' },
      { name: 'onReady', type: '() => void', desc: 'Called when the model is ready.' },
      { name: 'onError', type: '(error: string) => void', desc: 'Called when model loading fails.' },
    ]} />

    <h3 className="doc-sub-title">Return Value</h3>
    <ReturnTable data={[
      { name: 'status', type: 'ModelStatus', desc: '"idle" | "loading" | "ready" | "error"' },
      { name: 'isReady', type: 'boolean', desc: 'True when ready to detect.' },
      { name: 'isLoading', type: 'boolean', desc: 'True while downloading.' },
      { name: 'error', type: 'string | null', desc: 'Error message if loading failed.' },
      { name: 'loadProgress', type: 'LoadProgress', desc: 'Download progress ({ progress, file }).' },
      { name: 'detect', type: '(input) => Promise<DetectionOutput>', desc: 'Detect objects. Accepts File, Blob, data URL, or HTMLImageElement.' },
      { name: 'load', type: '() => Promise<void>', desc: 'Manually trigger model load.' },
    ]} />

    <h3 className="doc-sub-title">Usage Example</h3>
    <CodeSandbox
      title="useObjectDetection — Canvas Overlay"
      preview={<ObjectDetectionPreview />}
      files={[
        {
          name: 'ObjectDetector.tsx',
          code: `import { useState, useRef, useEffect } from 'react';
import { useObjectDetection } from 'react-zero-ai';
import type { DetectedObject } from 'react-zero-ai';

export default function ObjectDetector() {
  const { detect, isReady, load, isLoading, loadProgress } =
    useObjectDetection({ threshold: 0.6 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [objects, setObjects] = useState<DetectedObject[]>([]);
  const [timing, setTiming] = useState<number | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const src = URL.createObjectURL(file);
    setImageSrc(src);

    const output = await detect(file);
    setObjects(output.objects);
    setTiming(output.inferenceMs);
    console.log(
      \`Found \${output.count} objects in \${output.inferenceMs}ms\`
    );
  };

  // Draw bounding boxes on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc || objects.length === 0) return;

    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      objects.forEach((obj) => {
        const { xmin, ymin, xmax, ymax } = obj.box;
        const w = xmax - xmin;
        const h = ymax - ymin;

        // Bounding box
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3;
        ctx.strokeRect(xmin, ymin, w, h);

        // Label background
        ctx.fillStyle = '#00ff88';
        const label = \`\${obj.label} (\${obj.confidence})\`;
        const tw = ctx.measureText(label).width;
        ctx.fillRect(xmin, ymin - 22, tw + 10, 22);

        // Label text
        ctx.fillStyle = '#000';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(label, xmin + 5, ymin - 6);
      });
    };
  }, [objects, imageSrc]);

  return (
    <div>
      {!isReady ? (
        <button onClick={load} disabled={isLoading}>
          {isLoading
            ? \`Loading… \${Math.round(loadProgress.progress)}%\`
            : 'Load Detection Model'}
        </button>
      ) : (
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
        />
      )}

      {imageSrc && (
        <canvas
          ref={canvasRef}
          style={{ maxWidth: '100%' }}
        />
      )}

      {objects.length > 0 && (
        <div>
          <p>
            Found {objects.length} objects in {timing}ms
          </p>
          <ul>
            {objects.map((obj, i) => (
              <li key={i}>
                {obj.label} — {obj.confidence}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}`,
        },
        {
          name: 'types.ts',
          lang: 'typescript',
          code: `// Return type of detect()
interface DetectionOutput {
  objects: DetectedObject[];
  count: number;
  inferenceMs: number;
}

interface DetectedObject {
  label: string;       // "cat"
  score: number;       // 0.98
  confidence: string;  // "98%"
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}`,
        },
      ]}
    />
  </DocSection>
);

/* ─── Hook map ─── */

const HOOKS = [
  { id: 'useImageClassifier', name: 'useImageClassifier', Component: UseImageClassifierDoc },
  { id: 'useSentimentAnalysis', name: 'useSentimentAnalysis', Component: UseSentimentAnalysisDoc },
  { id: 'useEmbeddings', name: 'useEmbeddings', Component: UseEmbeddingsDoc },
  { id: 'useObjectDetection', name: 'useObjectDetection', Component: UseObjectDetectionDoc },
];

/* ─── Main Docs component ─── */

export default function Docs() {
  const { hookId } = useParams<{ hookId: string }>();

  const activeHook = hookId ? HOOKS.find(h => h.id === hookId) : null;

  return (
    <div className="docs-page">
      <aside className="docs-sidebar">
        <nav className="sidebar-nav">
          <div className="sidebar-label">Guides</div>
          <Link
            to="/docs"
            className={`sidebar-link ${!hookId ? 'active' : ''}`}
          >
            Introduction
          </Link>

          <div className="sidebar-label" style={{ marginTop: '24px' }}>Hooks</div>
          {HOOKS.map(h => (
            <Link
              key={h.id}
              to={`/docs/${h.id}`}
              className={`sidebar-link ${hookId === h.id ? 'active' : ''}`}
            >
              {h.name}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="docs-content">
        <header className="docs-header">
          <h1 className="docs-title">API Reference</h1>
          <p className="docs-subtitle">
            Experience the power of local-first AI. Detailed specifications for every hook in the <code>react-zero-ai</code> ecosystem.
          </p>
        </header>

        {activeHook ? (
          <activeHook.Component />
        ) : (
          <IntroSection />
        )}
      </main>
    </div>
  );
}
