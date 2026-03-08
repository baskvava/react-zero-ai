import React from 'react';

const DocSection = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="doc-section">
    <h2 className="doc-section-title">{title}</h2>
    {children}
  </section>
);

const CodeSnippet = ({ code, lang = 'typescript' }: { code: string, lang?: string }) => (
  <div className="doc-code-wrapper">
    <div className="doc-code-header">
      <div className="code-dot red" />
      <div className="code-dot yellow" />
      <div className="code-dot green" />
      <div className="doc-code-lang">{lang}</div>
    </div>
    <pre className="doc-code">
      <code>{code}</code>
    </pre>
  </div>
);

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

const ProTip = ({ children }: { children: React.ReactNode }) => (
  <div className="pro-tip">
    <div className="pro-tip-icon">💡</div>
    <div className="pro-tip-content">{children}</div>
  </div>
);

export default function Docs() {
  const hooks = [
    { id: 'intro', name: 'Getting Started' },
    { id: 'useImageClassifier', name: 'useImageClassifier' },
    { id: 'useSentimentAnalysis', name: 'useSentimentAnalysis' },
    { id: 'useEmbeddings', name: 'useEmbeddings' },
    { id: 'useObjectDetection', name: 'useObjectDetection' },
  ];

  return (
    <div className="docs-page">
      <aside className="docs-sidebar">
        <nav className="sidebar-nav">
          <div className="sidebar-label">Guides</div>
          <a href="#intro" className="sidebar-link">Introduction</a>
          
          <div className="sidebar-label" style={{ marginTop: '24px' }}>Hooks</div>
          {hooks.slice(1).map(h => (
            <a key={h.id} href={`#${h.id}`} className="sidebar-link">
              {h.name}
            </a>
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

        <DocSection id="intro" title="Getting Started">
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
        </DocSection>

        <hr className="doc-divider" />

        {/* 1. useImageClassifier */}
        <DocSection id="useImageClassifier" title="useImageClassifier">
          <p className="doc-text">
            Classifies images into 1000+ categories using Vision Transformer (ViT) architecture. 
            Ideal for content tagging, visual search, and accessibility.
          </p>
          
          <h3 className="doc-sub-title">Parameters</h3>
          <PropTable data={[
            { name: 'model', type: 'string', default: 'vit-base-patch16-224', desc: 'Hugging Face model repository ID.' },
            { name: 'topk', type: 'number', default: '5', desc: 'Number of highest-score predictions to return.' },
            { name: 'autoLoad', type: 'boolean', default: 'true', desc: 'Immediately start model initialization.' },
            { name: 'onReady', type: '() => void', desc: 'Triggered when the model worker is ready.' }
          ]} />

          <h3 className="doc-sub-title">Usage Example</h3>
          <CodeSnippet code={`import { useImageClassifier } from 'react-zero-ai';

function Component() {
  const { classify, isReady, loadProgress } = useImageClassifier();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    const { results, top, inferenceMs } = await classify(file);
    console.log(\`Detected \${top.label} in \${inferenceMs}ms\`);
  };

  return <input type="file" onChange={handleFile} disabled={!isReady} />;
}`} />
        </DocSection>

        <hr className="doc-divider" />

        {/* 2. useSentimentAnalysis */}
        <DocSection id="useSentimentAnalysis" title="useSentimentAnalysis">
          <p className="doc-text">
            Performs text classification to determine emotional context. Perfect for real-time 
            feedback in form fields or localized social media analysis.
          </p>
          
          <h3 className="doc-sub-title">Parameters</h3>
          <PropTable data={[
            { name: 'model', type: 'string', default: 'distilbert-base-uncased-sst-2', desc: 'Pre-trained DistilBERT model.' },
            { name: 'autoLoad', type: 'boolean', default: 'true', desc: 'Loads model on component mount.' }
          ]} />

          <h3 className="doc-sub-title">Usage Example</h3>
          <CodeSnippet code={`const { analyze } = useSentimentAnalysis();

const { sentiment, score, emoji } = await analyze("I love this project!");
// { sentiment: "POSITIVE", score: 0.999, emoji: "😊" }`} />
        </DocSection>

        <hr className="doc-divider" />

        {/* 3. useEmbeddings */}
        <DocSection id="useEmbeddings" title="useEmbeddings">
          <p className="doc-text">
            Generate high-dimensional vector representations of text strings. Essential for 
            semantic search, recommendation systems, and clustering within the browser.
          </p>
          
          <div className="doc-card">
            <code style={{ color: 'var(--brand-l)' }}>findSimilar(query: string, candidates: string[], topk?: number)</code>
            <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-2)' }}>
              Ranks the candidate strings based on cosine similarity to the query string.
            </p>
          </div>

          <h3 className="doc-sub-title">Usage Example</h3>
          <CodeSnippet code={`const { findSimilar } = useEmbeddings();

const results = await findSimilar("reset my password", [
  "Account Security",
  "Billing Information",
  "Password Assistance"
]);
// results[0].text === "Password Assistance"`} />
        </DocSection>

        <hr className="doc-divider" />

        {/* 4. useObjectDetection */}
        <DocSection id="useObjectDetection" title="useObjectDetection">
          <p className="doc-text">
            Identifies and locates objects within images. Returns canonical labels and 
            bounding box coordinates ready for canvas rendering.
          </p>
          
          <h3 className="doc-sub-title">Parameters</h3>
          <PropTable data={[
            { name: 'threshold', type: 'number', default: '0.5', desc: 'Minimum confidence score for detection.' }
          ]} />

          <h3 className="doc-sub-title">Usage Example</h3>
          <CodeSnippet code={`const { detect } = useObjectDetection();

const { objects, count } = await detect(imageSrc);
// objects: [{ label: 'cat', box: { xmin, ymin, xmax, ymax }, score: 0.98 }]`} />
        </DocSection>
      </main>
    </div>
  );
}
