import { Link, useLocation } from 'react-router-dom';
import logo from './assets/logo.png';

interface NavbarProps {
  onGoToDemo: () => void;
}

export default function Navbar({ onGoToDemo }: NavbarProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isDocs = location.pathname.startsWith('/docs');

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <img src={logo} alt="logo" className="nav-logo" />
          <span className="brand-name">react-zero-ai</span>
        </Link>
        <div className="nav-links">
          <Link
            to="/"
            className={`nav-link ${isHome ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/docs"
            className={`nav-link ${isDocs ? 'active' : ''}`}
          >
            Docs
          </Link>
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
