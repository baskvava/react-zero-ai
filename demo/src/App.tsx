import React, { useState, useRef, useEffect } from 'react';
import { useImageClassifier } from '@/hooks/useImageClassifier';
import { useSentimentAnalysis } from '@/hooks/useSentimentAnalysis';
import { useEmbeddings } from '@/hooks/useEmbeddings';
import { useObjectDetection } from '@/hooks/useObjectDetection';
import './App.css';

// ─── Status Indicator Component ───
const StatusStrip = ({ hook }: { hook: any }) => {
  const { isReady, isLoading, error, loadProgress } = hook;
  
  let dotClass = 'status-dot';
  let txt = 'Not loaded';
  if (error) { dotClass += ' error'; txt = 'Error'; }
  else if (isLoading) { dotClass += ' loading'; txt = 'Downloading model...'; }
  else if (isReady) { dotClass += ' ready'; txt = 'Ready'; }

  return (
    <div className="status-strip">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className={dotClass} />
        <span className="status-txt">{txt}</span>
      </div>
      {isLoading && (
        <div className="status-prog">
          <div className="status-prog-fill" style={{ width: `${loadProgress.progress ?? 0}%`, background: 'var(--amber)' }} />
        </div>
      )}
    </div>
  );
};

// ─── Formatting Helpers ───
const formatConf = (score: number) => `${Math.round(score * 100)}%`;
const formatLabel = (v: string) => v.split(',')[0].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();

// ─── 1. Image Classification ───
const ClassifierDemo = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [time, setTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hook = useImageClassifier({ autoLoad: true });

  const classifyImage = async (url: string) => {
    setImageSrc(url); setResults(null);
    if (!hook.isReady) return;
    const t0 = performance.now();
    const out = await hook.classify(url);
    setTime(Math.round(performance.now() - t0));
    setResults(out.results);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) classifyImage(URL.createObjectURL(file));
  };

  const setSample = (url: string) => {
    fetch(url).then(r => r.blob()).then(blob => classifyImage(URL.createObjectURL(blob)));
  };

  return (
    <div className="panel animate-in">
      <div className="card" style={{ '--accent': 'var(--c-clf)' } as any}>
        <div className="card-header">
          <div style={{ color: 'var(--c-clf)' }}>🖼️ useImageClassifier</div>
          <div className="live-badge"><div className="live-dot"/>Live Worker</div>
        </div>
        <div className="card-body">
          <StatusStrip hook={hook} />
          
          <div className="grid-2">
            <div style={{ display: 'flex', flexDirection: 'column', height: '380px' }}>
              <div className={imageSrc ? 'dropzone has-file' : 'dropzone'} onClick={() => !imageSrc && fileInputRef.current?.click()} style={{ flex: 1, minHeight: 0 }}>
                {!imageSrc ? (
                  <>
                    <div className="dz-icon">📸</div>
                    <div className="dz-hint"><strong>Drop image here</strong><br/>or click to select</div>
                  </>
                ) : (
                  <img src={imageSrc} className="dz-preview" alt="Preview" />
                )}
                <input type="file" className="file-hide" ref={fileInputRef} onChange={handleUpload} accept="image/*" />
              </div>

              <div className="chips">
                <button className="chip" onClick={() => setSample('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop')}>🐱 Cat</button>
                <button className="chip" onClick={() => setSample('https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=400&fit=crop')}>🚗 Car</button>
                {imageSrc && <button className="chip" onClick={() => { setImageSrc(null); setResults(null); }}>✕ Clear</button>}
              </div>
            </div>

            <div>
              {results ? (
                <div>
                  <div className="section-label">Top Predictions</div>
                  <div className="result-list">
                    {results.map((r, i) => (
                      <div className="result-row" key={i} style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="result-rank">{(i+1).toString().padStart(2,'0')}</div>
                        <div className="result-body">
                          <div className="result-label" style={{ color: i===0 ? 'var(--c-clf)' : 'var(--text)' }}>{formatLabel(r.label)}</div>
                          <div className="result-bar-bg">
                            <div className="result-bar" style={{ width: formatConf(r.score), background: i===0?'var(--c-clf)':'rgba(255,255,255,.2)' }} />
                          </div>
                        </div>
                        <div className="result-pct" style={{ color: i===0 ? 'var(--c-clf)' : 'var(--text-2)' }}>{formatConf(r.score)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="timing">⚡ {time}ms inference · 100% local</div>
                </div>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', background: 'var(--bg)', borderRadius: '8px', border: '1px dashed var(--border)', height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Select an image to see classification results
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── 2. Sentiment Analysis ───
const SentimentDemo = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const hook = useSentimentAnalysis({ autoLoad: true });
  const timer = useRef<any>(null);

  const EMOJI: any = { POSITIVE: '😊', NEGATIVE: '😞', NEUTRAL: '😐' };
  const COLORS: any = { POSITIVE: 'var(--green)', NEGATIVE: 'var(--c-snt)', NEUTRAL: 'var(--text-3)' };

  const analyze = async (val: string) => {
    setText(val);
    clearTimeout(timer.current);
    if (val.length < 3 || !hook.isReady) { setResult(null); return; }
    
    timer.current = setTimeout(async () => {
      const { sentiment, confidence } = await hook.analyze(val);
      setResult({ sentiment, confidence });
    }, 300);
  };

  return (
    <div className="panel animate-in">
      <div className="card" style={{ '--accent': 'var(--c-snt)' } as any}>
        <div className="card-header">
          <div style={{ color: 'var(--c-snt)' }}>💬 useSentimentAnalysis</div>
          <div className="live-badge"><div className="live-dot"/>Live Worker</div>
        </div>
        <div className="card-body">
          <StatusStrip hook={hook} />
          
          <span className="field-label">Type something</span>
          <input 
            className="field" 
            placeholder="e.g. This library is absolutely incredible!" 
            value={text} 
            onChange={(e) => analyze(e.target.value)} 
            disabled={!hook.isReady}
          />

          <div className="chips">
            <button className="chip" onClick={() => analyze('React hooks make Web Workers so much easier.')}>👍 Positive</button>
            <button className="chip" onClick={() => analyze('The package size is way too large, I cannot use this.')}>👎 Negative</button>
            <button className="chip" onClick={() => analyze('The model finished downloading in 4 seconds.')}>😐 Neutral</button>
          </div>

          {result && (
            <div className="sent-result" style={{ marginTop: '20px' }}>
              <div className="sent-emoji">{EMOJI[result.sentiment]}</div>
              <div className="sent-body">
                <div className="sent-label" style={{ color: COLORS[result.sentiment] }}>{result.sentiment}</div>
                <div className="sent-conf">confidence: {result.confidence}</div>
                <div className="sent-bar-bg">
                  <div className="sent-bar" style={{ width: result.confidence, background: COLORS[result.sentiment] }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── 3. Embeddings ───
const EmbeddingsDemo = () => {
  const [q, setQ] = useState('How do I cancel my subscription?');
  const [cands, setCands] = useState([
    'Steps to pause or cancel your account',
    'What payment methods do you accept?',
    'I forgot my password',
    'Can I get a refund?'
  ]);
  const [ranked, setRanked] = useState<any[]>([]);
  const [time, setTime] = useState(0);
  const hook = useEmbeddings({ autoLoad: true });

  const runSearch = async () => {
    if (!hook.isReady || !q) return;
    const t0 = performance.now();
    const results = await hook.findSimilar(q, cands, cands.length);
    setTime(Math.round(performance.now() - t0));
    setRanked(results);
  };

  const removeCand = (i: number) => setCands(c => c.filter((_, idx) => idx !== i));
  const updateCand = (i: number, val: string) => setCands(c => { const n = [...c]; n[i] = val; return n; });

  return (
    <div className="panel animate-in">
      <div className="card" style={{ '--accent': 'var(--c-emb)' } as any}>
        <div className="card-header">
          <div style={{ color: 'var(--c-emb)' }}>🧠 useEmbeddings — findSimilar()</div>
          <div className="live-badge"><div className="live-dot"/>Live Worker</div>
        </div>
        <div className="card-body">
          <StatusStrip hook={hook} />
          
          <div className="grid-2">
            <div>
              <span className="field-label">Search Query</span>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input className="field" value={q} onChange={e => setQ(e.target.value)} />
                <button className="btn btn-primary" onClick={runSearch} disabled={!hook.isReady}>Search</button>
              </div>

              <span className="section-label">FAQ Candidates</span>
              <div className="cand-list">
                {cands.map((c, i) => (
                  <div key={i} className="cand-row">
                    <input className="field" style={{ padding: '6px 10px' }} value={c} onChange={e => updateCand(i, e.target.value)} />
                    <button className="cand-remove" onClick={() => removeCand(i)}>✕</button>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" style={{ marginTop: '8px' }} onClick={() => setCands([...cands, ''])}>+ Add</button>
              </div>
            </div>

            <div>
              <span className="section-label" style={{ marginBottom: '12px' }}>Ranked Results</span>
              {ranked.length > 0 ? (
                <>
                  <div className="result-list">
                    {ranked.map((r, i) => (
                      <div className="result-row" key={i} style={{ animationDelay: `${i*0.05}s` }}>
                        <div className="result-rank">{(i+1).toString().padStart(2,'0')}</div>
                        <div className="result-body">
                          <div className="result-label" style={{ color: i===0?'var(--c-emb)':'var(--text)' }}>{r.text}</div>
                          <div className="result-bar-bg">
                            <div className="result-bar" style={{ width: `${r.score*100}%`, background: i===0?'var(--c-emb)':'rgba(139,92,246,.3)' }} />
                          </div>
                        </div>
                        <div className="result-pct" style={{ color: i===0?'var(--c-emb)':'var(--text-2)' }}>{r.score.toFixed(3)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="timing">⚡ {time}ms · 384-dim vectors · {cands.length} items</div>
                </>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', background: 'var(--bg)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                  Click <strong>Search</strong> to rank candidates by semantic similarity
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── 4. Object Detection ───
const DetectionDemo = () => {
  const hook = useObjectDetection({ autoLoad: false }); // 160MB model, manual load
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [boxes, setBoxes] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const drawBoxes = (objects: any[]) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    objects.forEach((obj, i) => {
      const color = `hsl(${(i * 67) % 360}, 75%, 62%)`;
      const { xmin, ymin, xmax, ymax } = obj.box;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, canvas.width / 200);
      ctx.strokeRect(xmin, ymin, xmax - xmin, ymax - ymin);
      
      const fs = Math.max(12, canvas.width / 35);
      ctx.font = `bold ${fs}px Inter, sans-serif`;
      const txt = `${formatLabel(obj.label)} ${obj.confidence}`;
      const tw = ctx.measureText(txt).width + 8;
      
      ctx.fillStyle = color;
      ctx.fillRect(xmin, ymin - fs - 6, tw, fs + 8);
      ctx.fillStyle = '#000';
      ctx.fillText(txt, xmin + 4, ymin - 4);
    });
  };

  const detect = async (url: string) => {
    setImageSrc(url); setBoxes([]);
    if (!hook.isReady) return;
    const t0 = performance.now();
    const { objects } = await hook.detect(url);
    setTime(Math.round(performance.now() - t0));
    setBoxes(objects);
    setTimeout(() => drawBoxes(objects), 50); // wait for img to render
  };

  const loadSample = (url: string) => {
    if (!hook.isReady) hook.load();
    fetch(url).then(r => r.blob()).then(blob => detect(URL.createObjectURL(blob)));
  };

  return (
    <div className="panel animate-in">
      <div className="card" style={{ '--accent': 'var(--c-det)' } as any}>
        <div className="card-header">
          <div style={{ color: 'var(--c-det)' }}>🎯 useObjectDetection</div>
          <div className="live-badge"><div className="live-dot"/>Live Worker</div>
        </div>
        <div className="card-body">
          <StatusStrip hook={hook} />

          {!hook.isReady && !hook.isLoading && (
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '16px' }} onClick={() => hook.load()}>
              Load DETR Model (~160MB)
            </button>
          )}
          
          <div className={imageSrc ? 'dropzone has-file' : 'dropzone'} onClick={() => !imageSrc && fileInputRef.current?.click()} style={{ minHeight: imageSrc ? 'auto' : '140px' }}>
            {!imageSrc ? (
              <>
                <div className="dz-icon">🎯</div>
                <div className="dz-hint"><strong>Drop image here</strong>Bounding boxes drawn on canvas</div>
              </>
            ) : (
              <div className="det-wrap" style={{ width: '100%' }}>
                <img ref={imgRef} src={imageSrc} style={{ display: 'block', width: '100%' }} alt="target" onLoad={() => {
                  if (boxes.length) drawBoxes(boxes);
                }} />
                <canvas ref={canvasRef} className="det-canvas" />
              </div>
            )}
            <input type="file" className="file-hide" ref={fileInputRef} onChange={e => {
              if (!hook.isReady) hook.load();
              const f = e.target.files?.[0]; if(f) detect(URL.createObjectURL(f));
            }} accept="image/*" />
          </div>

          <div className="chips">
            <button className="chip" onClick={() => loadSample('https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop')}>🐕 Dog</button>
            <button className="chip" onClick={() => loadSample('https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=400&fit=crop')}>🚗 Car</button>
            {imageSrc && <button className="chip" onClick={() => { setImageSrc(null); setBoxes([]); }}>✕ Clear</button>}
          </div>

          {boxes.length > 0 && (
            <>
              <div className="det-chips">
                {boxes.map((b, i) => (
                  <div className="det-chip" key={i} style={{ 
                    background: `hsl(${(i * 67) % 360}, 75%, 15%)`, 
                    color: `hsl(${(i * 67) % 360}, 75%, 70%)`,
                    border: `1px solid hsl(${(i * 67) % 360}, 75%, 35%)`,
                    animationDelay: `${i*0.05}s`
                  }}>
                    {formatLabel(b.label)} · {b.confidence}
                  </div>
                ))}
              </div>
              <div className="timing">⚡ {time}ms · {boxes.length} objects · 100% local</div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

// ─── Main App ───
export default function App() {
  const [tab, setTab] = useState('clf');

  return (
    <>
      <div className="app-header">
        <div className="app-kicker"><div className="app-kicker-dot"/> 100% Client-Side</div>
        <h1 className="app-title">local-ai-<span>react</span></h1>
        <p className="app-sub">Drop-in React hooks for Hugging Face Transformers.js. Zero backend, zero latencies, strict privacy. Fully Web Worker powered.</p>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab==='clf'?'active':''}`} onClick={()=>setTab('clf')}>
          <div className="tab-accent" style={{background:'var(--c-clf)'}}/> Image Classifier
        </button>
        <button className={`tab-btn ${tab==='snt'?'active':''}`} onClick={()=>setTab('snt')}>
          <div className="tab-accent" style={{background:'var(--c-snt)'}}/> Sentiment
        </button>
        <button className={`tab-btn ${tab==='emb'?'active':''}`} onClick={()=>setTab('emb')}>
          <div className="tab-accent" style={{background:'var(--c-emb)'}}/> Embeddings
        </button>
        <button className={`tab-btn ${tab==='det'?'active':''}`} onClick={()=>setTab('det')}>
          <div className="tab-accent" style={{background:'var(--c-det)'}}/> Object Detection
        </button>
      </div>

      <div className="tab-container">
        {tab === 'clf' && <ClassifierDemo />}
        {tab === 'snt' && <SentimentDemo />}
        {tab === 'emb' && <EmbeddingsDemo />}
        {tab === 'det' && <DetectionDemo />}
      </div>
      
      <div className="footer-hint">
        Models load instantly and run off the main thread. <code>npm install react-zero-ai</code>
      </div>
    </>
  );
}
