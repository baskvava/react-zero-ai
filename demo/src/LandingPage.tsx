import React, { useEffect, useState } from 'react';
import logo from './assets/logo.png';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`landing-container ${mounted ? 'ready' : ''}`}>
      <div className="bg-glow"></div>
      
      <nav className="main-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <img src={logo} alt="logo" className="nav-logo" />
            <span className="brand-name">react-zero-ai</span>
          </div>
          <div className="nav-links">
            <a href="https://github.com/react-zero-ai/react-zero-ai" target="_blank" rel="noopener noreferrer" className="nav-link">
              GitHub
            </a>
            <button className="nav-btn-action" onClick={onEnter}>
              Demo
            </button>
          </div>
        </div>
      </nav>
      
      <main className="hero">
        <div className="hero-content">
          <div className="hero-kicker">
            <span className="badge">
              <span className="live-dot"></span>
              100% Client-Side
            </span>
            <span className="kicker-line">local-ai-react</span>
          </div>
          
          <h1 className="hero-title">
            Bring AI to the <span className="gradient-text">Edge</span> <br /> with React Hooks
          </h1>
          
          <p className="hero-desc">
            Drop-in React hooks for Hugging Face Transformers.js. Zero backend, zero latencies, strict privacy. Fully Web Worker powered.
          </p>

          <div className="hero-actions">
            <button className="btn-hero primary" onClick={onEnter}>
              See It In Action
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4.16666V15.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.16666 10L10 15.8333L15.8333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <a href="https://github.com/react-zero-ai/react-zero-ai" target="_blank" rel="noopener noreferrer" className="btn-hero secondary">
              View on GitHub
            </a>
          </div>

          <div className="tech-marquee">
            <div className="marquee-content">
              {[
                { name: 'Hugging Face', icon: '🤗' },
                { name: 'Transformers.js', icon: '⚡' },
                { name: 'WebGPU', icon: '💎' },
                { name: 'Web Workers', icon: '🧵' },
                { name: 'React', icon: '⚛️' },
                { name: 'ONNX Runtime', icon: '🚀' },
                { name: 'WASIL', icon: '📦' },
                { name: 'Edge AI', icon: '🌐' }
              ].map((tech, i) => (
                <div key={i} className="tech-item">
                  <span className="tech-icon">{tech.icon}</span>
                  <span>{tech.name}</span>
                </div>
              ))}
              {/* Duplicate for seamless loop */}
              {[
                { name: 'Hugging Face', icon: '🤗' },
                { name: 'Transformers.js', icon: '⚡' },
                { name: 'WebGPU', icon: '💎' },
                { name: 'Web Workers', icon: '🧵' },
                { name: 'React', icon: '⚛️' },
                { name: 'ONNX Runtime', icon: '🚀' },
                { name: 'WASIL', icon: '📦' },
                { name: 'Edge AI', icon: '🌐' }
              ].map((tech, i) => (
                <div key={`dup-${i}`} className="tech-item">
                  <span className="tech-icon">{tech.icon}</span>
                  <span>{tech.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Off-main thread</h3>
              <p>Everything runs in Web Workers to keep your UI butter smooth.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Privacy First</h3>
              <p>Data never leaves the browser. Perfect for sensitive applications.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📦</div>
              <h3>Zero Config</h3>
              <p>Import hooks and start building. We handle model loading and state.</p>
            </div>
          </div>
        </div>
      </main>

      <div className="floating-elements">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>
    </div>
  );
}
