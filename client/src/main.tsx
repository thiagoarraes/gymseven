import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Comprehensive ResizeObserver error suppression
const originalError = console.error;
const originalWarn = console.warn;

// Suppress console errors and warnings
console.error = (...args) => {
  const message = args[0];
  if (
    (typeof message === 'string' && message.includes('ResizeObserver')) ||
    (message && typeof message === 'object' && message.message && message.message.includes('ResizeObserver'))
  ) {
    return;
  }
  originalError.apply(console, args);
};

console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('ResizeObserver')) {
    return;
  }
  originalWarn.apply(console, args);
};

// Suppress window error events for ResizeObserver
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('ResizeObserver')) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}, true);

// Also suppress unhandled promise rejections related to ResizeObserver
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('ResizeObserver')) {
    event.preventDefault();
    return false;
  }
});

// Override ResizeObserver to prevent the error loop
if (typeof ResizeObserver !== 'undefined') {
  const OriginalResizeObserver = ResizeObserver;
  window.ResizeObserver = class extends OriginalResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      super((entries, observer) => {
        try {
          callback(entries, observer);
        } catch (error: any) {
          if (error.message && error.message.includes('ResizeObserver loop completed with undelivered notifications')) {
            // Silently ignore this specific error
            return;
          }
          throw error;
        }
      });
    }
  };
}

// Registrar Service Worker para notificações
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registrado:', registration);
      })
      .catch((error) => {
        console.log('Falha ao registrar Service Worker:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
