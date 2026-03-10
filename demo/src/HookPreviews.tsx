/**
 * Lightweight, self-contained demo components for each hook.
 * These are rendered inside the CodeSandbox preview pane.
 */
import React, { useState, useRef } from 'react';
import { useImageClassifier } from '@/hooks/useImageClassifier';
import { useSentimentAnalysis } from '@/hooks/useSentimentAnalysis';
import { useEmbeddings } from '@/hooks/useEmbeddings';
import { useObjectDetection } from '@/hooks/useObjectDetection';

/* ─── Shared status bar ── */
const MiniStatus = ({ hook }: { hook: { isReady: boolean; isLoading: boolean; error: string | null; loadProgress: { progress: number } } }) => {
  if (hook.error) return <div className="csb-mini-status csb-mini-status--error">⚠ {hook.error}</div>;
  if (hook.isLoading) return (
    <div className="csb-mini-status csb-mini-status--loading">
      <div className="csb-mini-bar">
        <div className="csb-mini-bar-fill" style={{ width: `${hook.loadProgress.progress}%` }} />
      </div>
      <span>Downloading model… {Math.round(hook.loadProgress.progress)}%</span>
    </div>
  );
  if (hook.isReady) return <div className="csb-mini-status csb-mini-status--ready">● Model ready</div>;
  return <div className="csb-mini-status">Model idle</div>;
};

/* ─── 1. Image Classifier ── */
export function ImageClassifierPreview() {
  const hook = useImageClassifier({ autoLoad: true });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [time, setTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const classify = async (src: string) => {
    setImageSrc(src);
    setResults(null);
    if (!hook.isReady) return;
    const t0 = performance.now();
    const out = await hook.classify(src);
    setTime(Math.round(performance.now() - t0));
    setResults(out.results);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) classify(URL.createObjectURL(f));
  };

  const loadSample = (url: string) => {
    fetch(url).then(r => r.blob()).then(b => classify(URL.createObjectURL(b)));
  };

  return (
    <div className="csb-demo">
      <MiniStatus hook={hook} />

      <div className="csb-demo-zone" onClick={() => !imageSrc && inputRef.current?.click()}>
        {imageSrc ? (
          <img src={imageSrc} alt="preview" className="csb-demo-img" />
        ) : (
          <div className="csb-demo-placeholder">
            <span style={{ fontSize: 28 }}>📸</span>
            <span>Drop an image or click to upload</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} hidden />
      </div>

      <div className="csb-demo-chips">
        <button onClick={() => loadSample('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop')}>🐱 Cat</button>
        <button onClick={() => loadSample('https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=400&fit=crop')}>🚗 Car</button>
        {imageSrc && <button onClick={() => { setImageSrc(null); setResults(null); }}>✕ Clear</button>}
      </div>

      {results && (
        <div className="csb-demo-results">
          {results.slice(0, 3).map((r, i) => (
            <div key={i} className="csb-demo-result-row">
              <span className="csb-demo-label">{r.label.split(',')[0].replace(/_/g, ' ')}</span>
              <div className="csb-demo-bar-bg">
                <div
                  className="csb-demo-bar-fill"
                  style={{ width: `${r.score * 100}%`, opacity: i === 0 ? 1 : 0.5 }}
                />
              </div>
              <span className="csb-demo-pct">{Math.round(r.score * 100)}%</span>
            </div>
          ))}
          <div className="csb-demo-timing">⚡ {time}ms</div>
        </div>
      )}
    </div>
  );
}

/* ─── 2. Sentiment Analysis ── */
export function SentimentPreview() {
  const hook = useSentimentAnalysis({ autoLoad: true });
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const timer = useRef<any>(null);

  const EMOJI: any = { POSITIVE: '😊', NEGATIVE: '😞', NEUTRAL: '😐' };

  const handleChange = (val: string) => {
    setText(val);
    clearTimeout(timer.current);
    if (val.length < 3 || !hook.isReady) { setResult(null); return; }
    timer.current = setTimeout(async () => {
      const res = await hook.analyze(val);
      setResult(res);
    }, 300);
  };

  return (
    <div className="csb-demo">
      <MiniStatus hook={hook} />

      <textarea
        className="csb-demo-textarea"
        placeholder="Type something to analyze sentiment…"
        value={text}
        onChange={e => handleChange(e.target.value)}
        disabled={!hook.isReady}
        rows={3}
      />

      <div className="csb-demo-chips">
        <button onClick={() => handleChange('This library is absolutely incredible!')}>👍 Positive</button>
        <button onClick={() => handleChange('The package is way too large to use.')}>👎 Negative</button>
        <button onClick={() => handleChange('The model finished downloading.')}>😐 Neutral</button>
      </div>

      {result && (
        <div className="csb-demo-sentiment">
          <span className="csb-demo-emoji">{EMOJI[result.sentiment]}</span>
          <div>
            <div className="csb-demo-sent-label">{result.sentiment}</div>
            <div className="csb-demo-sent-conf">Confidence: {result.confidence}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── 3. Embeddings ── */
export function EmbeddingsPreview() {
  const hook = useEmbeddings({ autoLoad: true });
  const [query, setQuery] = useState('How do I cancel my subscription?');
  const [ranked, setRanked] = useState<any[]>([]);
  const [time, setTime] = useState(0);

  const candidates = [
    'Steps to pause or cancel your account',
    'What payment methods do you accept?',
    'I forgot my password',
    'Can I get a refund?',
  ];

  const search = async () => {
    if (!hook.isReady || !query) return;
    const t0 = performance.now();
    const results = await hook.findSimilar(query, candidates, candidates.length);
    setTime(Math.round(performance.now() - t0));
    setRanked(results);
  };

  return (
    <div className="csb-demo">
      <MiniStatus hook={hook} />

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="csb-demo-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search query…"
          onKeyDown={e => e.key === 'Enter' && search()}
          disabled={!hook.isReady}
        />
        <button className="csb-demo-btn" onClick={search} disabled={!hook.isReady}>Search</button>
      </div>

      {ranked.length > 0 ? (
        <div className="csb-demo-results" style={{ marginTop: 12 }}>
          {ranked.map((r, i) => (
            <div key={i} className="csb-demo-result-row">
              <span className="csb-demo-rank">#{i + 1}</span>
              <span className="csb-demo-label" style={{ flex: 1 }}>{r.text}</span>
              <span className="csb-demo-pct">{(r.score * 100).toFixed(1)}%</span>
            </div>
          ))}
          <div className="csb-demo-timing">⚡ {time}ms · 384-dim vectors</div>
        </div>
      ) : (
        <div className="csb-demo-placeholder" style={{ marginTop: 12, padding: '20px 0' }}>
          <span>Click <strong>Search</strong> to rank by semantic similarity</span>
        </div>
      )}
    </div>
  );
}

/* ─── 4. Object Detection ── */
export function ObjectDetectionPreview() {
  const hook = useObjectDetection({ autoLoad: false });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [time, setTime] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const drawBoxes = (objects: any[]) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    objects.forEach((obj, i) => {
      const color = `hsl(${(i * 67) % 360}, 75%, 62%)`;
      const { xmin, ymin, xmax, ymax } = obj.box;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, canvas.width / 200);
      ctx.strokeRect(xmin, ymin, xmax - xmin, ymax - ymin);

      const fs = Math.max(11, canvas.width / 40);
      ctx.font = `bold ${fs}px Inter, sans-serif`;
      const txt = `${obj.label.split(',')[0]} ${obj.confidence}`;
      const tw = ctx.measureText(txt).width + 8;
      ctx.fillStyle = color;
      ctx.fillRect(xmin, ymin - fs - 6, tw, fs + 8);
      ctx.fillStyle = '#000';
      ctx.fillText(txt, xmin + 4, ymin - 4);
    });
  };

  const detect = async (src: string) => {
    setImageSrc(src); setBoxes([]);
    if (!hook.isReady) await hook.load();
    const t0 = performance.now();
    const { objects } = await hook.detect(src);
    setTime(Math.round(performance.now() - t0));
    setBoxes(objects);
    setTimeout(() => drawBoxes(objects), 50);
  };

  const loadSample = (url: string) => {
    fetch(url).then(r => r.blob()).then(b => detect(URL.createObjectURL(b)));
  };

  return (
    <div className="csb-demo">
      <MiniStatus hook={hook} />

      {!hook.isReady && !hook.isLoading && (
        <button className="csb-demo-btn" style={{ width: '100%', marginBottom: 8 }} onClick={() => hook.load()}>
          Load DETR Model (~160 MB)
        </button>
      )}

      <div className="csb-demo-zone" onClick={() => !imageSrc && inputRef.current?.click()} style={{ minHeight: imageSrc ? 'auto' : 120 }}>
        {imageSrc ? (
          <div style={{ position: 'relative', width: '100%' }}>
            <img ref={imgRef} src={imageSrc} alt="target" style={{ display: 'block', width: '100%', borderRadius: 8 }}
              onLoad={() => { if (boxes.length) drawBoxes(boxes); }}
            />
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
          </div>
        ) : (
          <div className="csb-demo-placeholder">
            <span style={{ fontSize: 28 }}>🎯</span>
            <span>Drop an image or click to upload</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) detect(URL.createObjectURL(f)); }} hidden />
      </div>

      <div className="csb-demo-chips">
        <button onClick={() => loadSample('https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop')}>🐕 Dog</button>
        <button onClick={() => loadSample('https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=400&fit=crop')}>🚗 Car</button>
        {imageSrc && <button onClick={() => { setImageSrc(null); setBoxes([]); }}>✕ Clear</button>}
      </div>

      {boxes.length > 0 && (
        <div className="csb-demo-results">
          {boxes.map((b, i) => (
            <div key={i} className="csb-demo-result-row">
              <span className="csb-demo-label">{b.label.split(',')[0]}</span>
              <span className="csb-demo-pct">{b.confidence}</span>
            </div>
          ))}
          <div className="csb-demo-timing">⚡ {time}ms · {boxes.length} objects</div>
        </div>
      )}
    </div>
  );
}
