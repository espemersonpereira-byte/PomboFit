// PomboFit — Official Web Push & Background Notification Service Worker (v3.0)
// Supports RFC 8030 Web Push, VAPID PushSubscription, background delivery when closed/locked,
// deduplication between server push & local fallback timer, and deep-link navigation on tap.

const SW_VERSION = 'pombofit-sw-v3.0';
const DEFAULT_ICON = '/assets/mascots/pombo_hero_bust.png';
const DEFAULT_BADGE = '/assets/mascots/pombo_hero_bust.png';
const REST_TAG = 'pombofit-rest-finished';

let activeRestTimerId = null;
let activeRestTargetTimestamp = null;
let lastKnownUserId = null;

// Deduplication ring buffer to prevent showing the same notification twice
// (e.g. if both Server Push and local SW fallback timer fire around the same second)
const deliveredKeys = new Map(); // key -> timestamp

function markAndCheckDuplicate(dedupKey, windowMs = 8000) {
  const now = Date.now();
  // Cleanup entries older than 60s
  for (const [k, ts] of deliveredKeys.entries()) {
    if (now - ts > 60000) {
      deliveredKeys.delete(k);
    }
  }
  if (!dedupKey) return false;
  const prev = deliveredKeys.get(dedupKey);
  if (prev && now - prev < windowMs) {
    return true;
  }
  deliveredKeys.set(dedupKey, now);
  return false;
}

// 1. INSTALLATION: Activate immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// 2. ACTIVATION: Claim all connected clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 3. WEB PUSH EVENT: Receives encrypted push payloads directly from the server (works with app closed & screen locked)
self.addEventListener('push', (event) => {
  let payload = {
    notificationId: '',
    title: 'PomboFit — Seu descanso acabou!',
    body: 'Hora da próxima série com foco total! O Pombo está pronto! 🕊️💪',
    icon: DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    tag: REST_TAG,
    category: 'rest_timer',
    vibrate: [300, 150, 300, 150, 500],
    url: '/?tab=workouts',
    targetTimestamp: Date.now(),
  };

  if (event.data) {
    try {
      const json = event.data.json();
      payload = { ...payload, ...json };
    } catch {
      const text = event.data.text();
      if (text) payload.body = text;
    }
  }

  // If a server push for rest_timer arrives, cancel any local fallback timer to prevent duplicate alerts
  if (payload.category === 'rest_timer' && activeRestTimerId) {
    clearTimeout(activeRestTimerId);
    activeRestTimerId = null;
    activeRestTargetTimestamp = null;
  }

  const dedupKey =
    payload.notificationId ||
    `${payload.category || 'push'}:${payload.tag || REST_TAG}:${Math.round((payload.targetTimestamp || Date.now()) / 5000)}`;

  if (markAndCheckDuplicate(dedupKey)) {
    return;
  }

  const actions =
    payload.category === 'water_reminder'
      ? [
          { action: 'open_app', title: 'Registrar Água 💧' },
          { action: 'dismiss', title: 'Ok' },
        ]
      : [
          { action: 'open_app', title: 'Abrir Treino 🕊️' },
          { action: 'dismiss', title: 'Ok' },
        ];

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_BADGE,
    tag: payload.tag || REST_TAG,
    renotify: true,
    requireInteraction: Boolean(payload.requireInteraction),
    silent: false,
    vibrate: payload.vibrate || [300, 150, 300, 150, 500],
    data: {
      url: payload.url || '/?tab=workouts',
      category: payload.category || 'rest_timer',
      notificationId: payload.notificationId || '',
      timestamp: Date.now(),
    },
    actions,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions).then(async () => {
      // Also notify any open window client so in-app UI stays synchronized
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of windowClients) {
        client.postMessage({
          type: 'PUSH_NOTIFICATION_RECEIVED',
          payload,
        });
      }
    })
  );
});

// 4. CLIENT MESSAGE HANDLER: Local fallback scheduling + state sync
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.userId && typeof data.userId === 'string') {
    lastKnownUserId = data.userId;
  }

  switch (data.type) {
    case 'SET_USER_CONTEXT': {
      if (data.userId) {
        lastKnownUserId = data.userId;
      }
      break;
    }

    case 'SCHEDULE_REST_NOTIFICATION': {
      if (activeRestTimerId) {
        clearTimeout(activeRestTimerId);
        activeRestTimerId = null;
      }

      const now = Date.now();
      const targetTime = Number(data.targetTimestamp) || now + (Number(data.delayMs) || 0);
      activeRestTargetTimestamp = targetTime;
      const delay = Math.max(0, targetTime - now);
      const tag = data.tag || (lastKnownUserId ? `pombofit-rest-finished-${lastKnownUserId}` : REST_TAG);
      const dedupKey = `rest_timer:${tag}:${Math.round(targetTime / 5000)}`;

      const promise = new Promise((resolve) => {
        activeRestTimerId = setTimeout(async () => {
          activeRestTimerId = null;
          activeRestTargetTimestamp = null;

          try {
            // Skip if the server Web Push already delivered this exact rest alert
            if (markAndCheckDuplicate(dedupKey)) {
              resolve();
              return;
            }

            const windowClients = await self.clients.matchAll({
              type: 'window',
              includeUncontrolled: true,
            });
            const isAnyClientFocused = windowClients.some((client) => client.focused);

            if (!isAnyClientFocused || data.alwaysNotify) {
              await self.registration.showNotification(
                data.title || 'PomboFit — Seu descanso acabou!',
                {
                  body: data.body || 'Hora da próxima série com foco total! O Pombo está pronto! 🕊️💪',
                  icon: data.icon || DEFAULT_ICON,
                  badge: data.badge || DEFAULT_BADGE,
                  tag,
                  renotify: true,
                  requireInteraction: false,
                  silent: false,
                  vibrate: data.vibrate || [300, 150, 300, 150, 500],
                  data: {
                    url: data.url || '/?tab=workouts&resume=1',
                    category: 'rest_timer',
                    timestamp: Date.now(),
                  },
                  actions: [
                    { action: 'open_app', title: 'Abrir Treino 🕊️' },
                    { action: 'dismiss', title: 'Ok' },
                  ],
                }
              );
            }
          } catch (err) {
            console.warn('[SW] Could not show scheduled rest notification:', err);
          } finally {
            resolve();
          }
        }, delay);
      });

      if (event.waitUntil) {
        event.waitUntil(promise);
      }
      break;
    }

    case 'CANCEL_REST_NOTIFICATION': {
      if (activeRestTimerId) {
        clearTimeout(activeRestTimerId);
        activeRestTimerId = null;
      }
      activeRestTargetTimestamp = null;
      break;
    }

    case 'SHOW_REST_NOTIFICATION': {
      const tag = data.tag || REST_TAG;
      const dedupKey = `manual:${tag}:${Math.round(Date.now() / 4000)}`;
      if (markAndCheckDuplicate(dedupKey, 4000)) {
        break;
      }
      const showPromise = self.registration.showNotification(
        data.title || 'PomboFit — Seu descanso acabou!',
        {
          body: data.body || 'Hora da próxima série com foco total! O Pombo está pronto! 🕊️💪',
          icon: data.icon || DEFAULT_ICON,
          badge: data.badge || DEFAULT_BADGE,
          tag,
          renotify: true,
          requireInteraction: false,
          silent: false,
          vibrate: data.vibrate || [300, 150, 300, 150, 500],
          data: {
            url: data.url || '/?tab=workouts&resume=1',
            category: data.category || 'rest_timer',
            timestamp: Date.now(),
          },
          actions: [
            { action: 'open_app', title: 'Abrir Treino 🕊️' },
            { action: 'dismiss', title: 'Ok' },
          ],
        }
      );
      if (event.waitUntil) {
        event.waitUntil(showPromise);
      }
      break;
    }

    case 'PING': {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          status: 'PONG',
          version: SW_VERSION,
          hasActiveTimer: Boolean(activeRestTimerId),
          targetTimestamp: activeRestTargetTimestamp,
        });
      }
      break;
    }

    default:
      break;
  }
});

// 5. NOTIFICATION CLICK: Focuses existing window or opens target URL and routes user to the right screen
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/?tab=workouts';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          await client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK_NAVIGATE',
            url: targetUrl,
            category: notifData.category || 'rest_timer',
          });
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 6. PUSH SUBSCRIPTION CHANGE: Re-subscribes and syncs with backend if subscription rotates
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const options = event.oldSubscription
          ? event.oldSubscription.options
          : { userVisibleOnly: true };
        const newSubscription = await self.registration.pushManager.subscribe(options);
        const subJson = newSubscription ? newSubscription.toJSON() : null;

        if (subJson && lastKnownUserId) {
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: lastKnownUserId,
              subscription: subJson,
              platform: 'sw-resubscribe',
            }),
          }).catch(() => {});
        }

        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of clients) {
          client.postMessage({
            type: 'PUSH_SUBSCRIPTION_CHANGED',
            subscription: subJson,
          });
        }
      } catch (err) {
        console.warn('[SW] pushsubscriptionchange failed:', err);
      }
    })()
  );
});
