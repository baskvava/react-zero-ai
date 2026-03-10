<div align="center">
  <h1>⚡ react-zero-ai</h1>
  <p><strong>Insanely fast, 100% Client-Side AI React Hooks. Zero backend. Zero API keys. Absolute Privacy.</strong></p>

  <p>
    <a href="https://www.npmjs.com/package/react-zero-ai"><img src="https://img.shields.io/npm/v/react-zero-ai?color=6366f1&style=flat-square" alt="NPM Version" /></a>
    <a href="https://bundlephobia.com/package/react-zero-ai"><img src="https://img.shields.io/bundlephobia/minzip/react-zero-ai?color=10b981&style=flat-square" alt="Bundle Size" /></a>
    <img src="https://img.shields.io/badge/Web%20Workers-Enabled-f59e0b?style=flat-square" alt="Web Workers" />
  </p>
</div>

---

Imagine dropping an **entire AI model** straight into your React component with a single hook. No expensive backend servers to spin up. No API keys to leak. No CORS nightmare. Just pure, offline-capable AI running directly in your user's browser at 60fps.

`react-zero-ai` gives you production-ready Transformers.js models wrapped in beautiful, buttery-smooth React Hooks. All inference runs entirely on a background Web Worker thread, meaning your UI never blocks, even when doing heavy ML computations.

## 🤯 Why React developers are going crazy over this:
- **Zero Config**: `npm install react-zero-ai` and you are done. No Webpack configuring, no WASM nightmare.
- **Main Thread === Unblocked**: We automatically spawn a background Web Worker pool. Your React tree stays silky smooth while ML models crunch gigabytes of data.
- **100% Free**: Run unlimited inferences. No OpenAI billing. No Hugging Face API limits. Compute is offloaded to your users' devices.
- **Total Privacy**: The data never leaves the browser. Perfect for analyzing sensitive PII, internal documents, or private images.

## 🚀 Quick Start

```bash
npm install react-zero-ai
```

### 1. 💬 Sentiment Analysis
Analyze text sentiment instantly as the user types.

```tsx
import { useSentimentAnalysis } from 'react-zero-ai';

function ReviewBox() {
  const { analyze, isReady, isLoading } = useSentimentAnalysis();
  const [result, setResult] = useState(null);

  if (isLoading) return <div>Downloading AI Model...</div>;

  return (
    <div>
      <textarea 
        onChange={async (e) => setResult(await analyze(e.target.value))} 
        placeholder="Type a review..."
      />
      {result && <span>{result.sentiment} (Confidence: {result.confidence})</span>}
    </div>
  );
}
```

### 2. 🧠 Semantic Embeddings (Vector Search)
Build local semantic search *without* a vector database! Find related sentences or documents purely offline.

```tsx
import { useEmbeddings } from 'react-zero-ai';

function OfflineSearch() {
  const { findSimilar, isReady } = useEmbeddings();
  const candidates = ["How to reset password", "Contact support", "Pricing limits"];
  
  const search = async (query) => {
    const results = await findSimilar(query, candidates, 3);
    console.log(results); // [{ text: "How to reset password", score: 0.89 }, ...]
  };

  return <button onClick={() => search("I forgot my login")}>Search</button>;
}
```

### 3. 🖼️ Image Classification
Drop an image in, get predictions out. Support for any Hugging Face Vision Transformer model.

```tsx
import { useImageClassifier } from 'react-zero-ai';

function Dropzone() {
  const { classify, isReady } = useImageClassifier({ topk: 3 });

  const onFileDrop = async (file) => {
    const { results } = await classify(file);
    console.log(results); // [{ label: "Golden Retriever", score: 0.95 }, ...]
  };

  return <input type="file" onChange={(e) => onFileDrop(e.target.files[0])} />;
}
```

### 4. 🎯 Object Detection
Draw bounding boxes around objects in images.

```tsx
import { useObjectDetection } from 'react-zero-ai';

function ObjectScanner() {
  const { detect, isReady } = useObjectDetection();

  const scan = async (imageUrl) => {
    const { objects } = await detect(imageUrl);
    objects.forEach(obj => {
      console.log(`Found ${obj.label} at`, obj.box);
    });
  };
}
```

## 🛠️ Advanced: Bring Your Own Model
By default we use highly optimized, tiny models. But `react-zero-ai` lets you slot in ANY model from the Hugging Face hub:

```tsx
const { analyze } = useSentimentAnalysis({ 
  model: "cardiffnlp/twitter-roberta-base-sentiment-latest" 
});
```

## ⚠️ Important Setup (Cross-Origin Isolation)
For maximum performance, Web Workers require `SharedArrayBuffer` support. You **must** configure your bundler to inject COOP/COEP headers.

**Vite (`vite.config.ts`)**
```ts
export default defineConfig({
  plugins: [
    {
      name: 'configure-response-headers',
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          next();
        });
      },
    }
  ]
});
```
*Next.js and Webpack guides coming soon.*

## 📄 License
MIT © Local AI React Team
