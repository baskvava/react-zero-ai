import { useState } from 'react';
import Navbar from './Navbar';
import LandingPage from './LandingPage';
import FunctionalDemo from './FunctionalDemo';
import Docs from './Docs';
import './App.css';

export default function App() {
  const [view, setView] = useState<'home' | 'docs'>('home');

  const handleGoToDemo = () => {
    if (view !== 'home') setView('home');
    setTimeout(() => {
      document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="app-root">
      <Navbar 
        currentView={view} 
        onGoHome={() => setView('home')} 
        onGoToDocs={() => setView('docs')} 
        onGoToDemo={handleGoToDemo}
      />
      
      {view === 'home' ? (
        <>
          <LandingPage onEnter={handleGoToDemo} />
          <div id="demo-section" className="demo-section-wrapper">
            <FunctionalDemo />
          </div>
        </>
      ) : (
        <Docs />
      )}
    </div>
  );
}
