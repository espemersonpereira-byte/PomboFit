import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { unlockMobileAudio } from './utils/restAlerts';

// Global unlock on first user gesture (satisfies iOS Safari & Android Chrome autoplay policy)
if (typeof window !== 'undefined') {
  const handleFirstInteraction = () => {
    unlockMobileAudio();
    window.removeEventListener('touchstart', handleFirstInteraction);
    window.removeEventListener('touchend', handleFirstInteraction);
    window.removeEventListener('click', handleFirstInteraction);
  };
  window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
  window.addEventListener('touchend', handleFirstInteraction, { passive: true });
  window.addEventListener('click', handleFirstInteraction, { passive: true });

  // Register dedicated notification service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/pombo-notification-sw.js').catch((err) => {
        console.warn('Notification SW registration failed:', err);
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);

