import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import LandingPage from './LandingPage';
import FunctionalDemo from './FunctionalDemo';
import Docs from './Docs';
import './App.css';

export default function App() {
  const navigate = useNavigate();

  const handleGoToDemo = () => {
    navigate('/');
    setTimeout(() => {
      document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="app-root">
      <Navbar onGoToDemo={handleGoToDemo} />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <LandingPage onEnter={handleGoToDemo} />
              <div id="demo-section" className="demo-section-wrapper">
                <FunctionalDemo />
              </div>
            </>
          }
        />
        <Route path="/docs" element={<Docs />} />
        <Route path="/docs/:hookId" element={<Docs />} />
      </Routes>
    </div>
  );
}
