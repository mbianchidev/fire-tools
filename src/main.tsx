import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Remove no-transitions class after initial render to enable smooth transitions
window.addEventListener('load', () => {
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('no-transitions');
  });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
