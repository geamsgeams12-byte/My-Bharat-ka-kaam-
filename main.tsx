import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker for installable PWA with auto-updates
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('PWA ServiceWorker registered successfully on scope:', reg.scope);
        
        // Check for updates on load
        reg.update();

        // Listen for new service worker being installed and force refresh
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New system content detected! Auto-updating app instantly...');
                // Automatically refresh page to apply latest AI Studio changes
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((err) => {
        console.error('ServiceWorker registration failed:', err);
      });
  });

  // Check for updates when the app/window is focused/reopened
  window.addEventListener('focus', () => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) reg.update();
    });
  });
}
