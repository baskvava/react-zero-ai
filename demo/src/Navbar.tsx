
import logo from './assets/logo.png';

interface NavbarProps {
  currentView: 'home' | 'docs';
  onGoHome: () => void;
  onGoToDocs: () => void;
  onGoToDemo: () => void;
}

export default function Navbar({ currentView, onGoHome, onGoToDocs, onGoToDemo }: NavbarProps) {
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-brand" onClick={onGoHome} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="logo" className="nav-logo" />
          <span className="brand-name">react-zero-ai</span>
        </div>
        <div className="nav-links">
          <button 
            className={`nav-link ${currentView === 'home' ? 'active' : ''}`} 
            onClick={onGoHome}
          >
            Home
          </button>
          <button 
            className={`nav-link ${currentView === 'docs' ? 'active' : ''}`} 
            onClick={onGoToDocs}
          >
            Docs
          </button>
          <a href="https://github.com/react-zero-ai/react-zero-ai" target="_blank" rel="noopener noreferrer" className="nav-link">
            GitHub
          </a>
          <button className="nav-btn-action" onClick={onGoToDemo}>
            Demo
          </button>
        </div>
      </div>
    </nav>
  );
}
