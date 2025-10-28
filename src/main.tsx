import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Check if service workers are supported
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  // [::1] is the IPv6 localhost address.
  window.location.hostname === '[::1]' ||
  // 127.0.0.0/8 are considered localhost for IPv4.
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

// Register service worker for production or localhost
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && (process.env.NODE_ENV === 'production' || isLocalhost)) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              console.log('New content is available; please refresh.');
              // You can show a notification to the user here
            }
          });
        }
      });
    } catch (error) {
      console.error('Error during service worker registration:', error);
    }
  }
};

// Check if the app is launched as a PWA
const isRunningAsPWA = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://')
  );
};

// Main render function
const renderApp = () => {
  const root = createRoot(document.getElementById('root')!);
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      registerServiceWorker();
    });
  }
  
  // Log PWA status
  if (isRunningAsPWA()) {
    console.log('Running as PWA');
  } else {
    console.log('Running in browser');
  }
};

// Initialize the app
renderApp();

// Handle app updates
if ('serviceWorker' in navigator) {
  // Reload when a new service worker takes control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      window.location.reload();
      refreshing = true;
    }
  });
}
