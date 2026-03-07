import React, { useState } from 'react';
import LandingPage from './LandingPage';
import FunctionalDemo from './FunctionalDemo';
import './App.css';

export default function App() {
  return (
    <div className="app-root">
      <LandingPage onEnter={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })} />
      <div id="demo-section" className="demo-section-wrapper">
        <FunctionalDemo />
      </div>
    </div>
  );
}
