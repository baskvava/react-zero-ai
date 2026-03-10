import { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface SandboxFile {
  name: string;
  code: string;
  lang?: string;
  folder?: string;
}

interface CodeSandboxProps {
  files: SandboxFile[];
  title?: string;
  /** If provided, renders a live preview panel on the right */
  preview?: React.ReactNode;
}

export default function CodeSandbox({ files, title, preview }: CodeSandboxProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [view, setView] = useState<'code' | 'preview' | 'split'>(preview ? 'split' : 'code');
  const codeRef = useRef<HTMLElement>(null);
  const active = files[activeIdx];

  useEffect(() => {
    if (codeRef.current && (view === 'code' || view === 'split')) {
      Prism.highlightElement(codeRef.current);
    }
  }, [activeIdx, active.code, view]);

  const lines = active.code.split('\n');

  const downloadExample = async () => {
    const zip = new JSZip();

    // 1. Root files
    zip.file('index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title || 'react-zero-ai Example'}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);

    zip.file('package.json', JSON.stringify({
      name: "react-zero-ai-example",
      private: true,
      version: "0.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        preview: "vite preview"
      },
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-zero-ai": "latest"
      },
      devDependencies: {
        "@types/react": "^18.2.15",
        "@types/react-dom": "^18.2.7",
        "@vitejs/plugin-react": "^4.0.3",
        "typescript": "^5.0.2",
        "vite": "^4.4.5"
      }
    }, null, 2));

    zip.file('vite.config.ts', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

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
  plugins: [react(), crossOriginIsolation()],
  optimizeDeps: { exclude: ['@huggingface/transformers'] },
  worker: { format: 'es' },
});`);

    zip.file('tsconfig.json', JSON.stringify({
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true
      },
      include: ["src"],
      references: [{ path: "./tsconfig.node.json" }]
    }, null, 2));

    zip.file('tsconfig.node.json', JSON.stringify({
      compilerOptions: {
        composite: true,
        skipLibCheck: true,
        module: "ESNext",
        moduleResolution: "bundler",
        allowSyntheticDefaultImports: true
      },
      include: ["vite.config.ts"]
    }, null, 2));

    // 2. Src files
    const src = zip.folder('src');
    if (!src) return;

    // Entry point (mounts the first active file, assuming it's the main component)
    const mainComponentName = files[0].name.replace('.tsx', '');
    src.file('main.tsx', `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './${mainComponentName}';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`);

    // Add user files
    files.forEach(f => {
      const folderPath = f.folder ? `${f.folder}/` : '';
      src.file(`${folderPath}${f.name}`, f.code);
    });

    // 3. Generate and save
    const blob = await zip.generateAsync({ type: 'blob' });
    const safeTitle = (title || 'example').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    saveAs(blob, `${safeTitle}.zip`);
  };

  return (
    <div className="csb">
      {/* ── Title bar ── */}
      <div className="csb-titlebar">
        <div className="csb-dots">
          <span className="csb-dot csb-dot--red" />
          <span className="csb-dot csb-dot--yellow" />
          <span className="csb-dot csb-dot--green" />
        </div>
        <span className="csb-title">{title ?? 'Example'}</span>
          <div className="csb-toolbar">
            <div className="csb-view-toggle">
              <button
                className={`csb-view-btn ${view === 'split' ? 'csb-view-btn--active' : ''}`}
                onClick={() => setView('split')}
              >
                ◫ Split
              </button>
              <button
                className={`csb-view-btn ${view === 'preview' ? 'csb-view-btn--active' : ''}`}
                onClick={() => setView('preview')}
              >
                ▶ Preview
              </button>
              <button
                className={`csb-view-btn ${view === 'code' ? 'csb-view-btn--active' : ''}`}
                onClick={() => setView('code')}
              >
                ‹/› Code
              </button>
            </div>
            <button className="csb-action-btn" onClick={downloadExample} title="Download Example as ZIP">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
        {!preview && <span className="csb-badge">Read-only</span>}
      </div>

      {/* ── Body ── */}
      <div className={`csb-body ${view === 'split' ? 'csb-body--split' : ''}`}>
        {/* ── Code Panel ── */}
        {(view === 'code' || view === 'split') && (
          <div className="csb-panel-code">
            {/* ── Sidebar (File Tree) ── */}
            <div className="csb-sidebar">
              <div className="csb-sidebar-header">EXPLORER</div>
              <div className="csb-tree">
                <FileTree files={files} activeIdx={activeIdx} onSelect={setActiveIdx} />
              </div>
            </div>

            <div className="csb-code-container">
              {/* ── Code area ── */}
              <div className="csb-code-area">
                <div className="csb-gutter" aria-hidden="true">
                  {lines.map((_, i) => (
                    <span key={i}>{i + 1}</span>
                  ))}
                </div>
                <pre className="csb-pre" key={`${active.name}-${view}`}>
                  <code ref={codeRef} className={`language-${active.lang ?? 'tsx'}`}>
                    {active.code}
                  </code>
                </pre>
              </div>

              {/* ── Status bar ── */}
              <div className="csb-statusbar">
                <span>{active.lang?.toUpperCase() ?? 'TSX'}</span>
                <span>{lines.length} lines</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Preview Panel ── */}
        {(view === 'preview' || view === 'split') && preview && (
          <div className="csb-panel-preview">
            <div className="csb-preview">
              {preview}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* tiny file icon based on extension */
function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop();
  let color = '#3b82f6';
  let label = 'TS';
  if (ext === 'tsx' || ext === 'jsx') { color = '#61dafb'; label = ext === 'tsx' ? 'TS' : 'JS'; }
  else if (ext === 'css') { color = '#a855f7'; label = 'CS'; }
  else if (ext === 'json') { color = '#facc15'; label = '{}'; }
  else if (ext === 'ts') { color = '#3178c6'; label = 'TS'; }

  return (
    <span className="csb-file-icon" style={{ background: color }}>
      {label}
    </span>
  );
}

/* Helper to render the file tree with folders */
function FileTree({ files, activeIdx, onSelect }: { files: SandboxFile[], activeIdx: number, onSelect: (i: number) => void }) {
  // Group files by folder
  const tree: Record<string, { file: SandboxFile; originalIdx: number }[]> = {};
  
  files.forEach((f, i) => {
    const folder = f.folder || 'src'; // default to src folder
    if (!tree[folder]) tree[folder] = [];
    tree[folder].push({ file: f, originalIdx: i });
  });

  return (
    <>
      {Object.entries(tree).map(([folder, folderFiles]) => (
        <div key={folder} className="csb-folder">
          <div className="csb-folder-name">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: '#ecd53f', opacity: 0.9 }}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            {folder}
          </div>
          <div className="csb-folder-contents">
            {folderFiles.map(({ file, originalIdx }) => (
              <button
                key={file.name}
                className={`csb-tree-item ${originalIdx === activeIdx ? 'csb-tree-item--active' : ''}`}
                onClick={() => onSelect(originalIdx)}
              >
                <FileIcon name={file.name} />
                <span>{file.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
