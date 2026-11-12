// PomboFit — Intelligent Rest Alerts & Notifications Engine
// Solves mobile browser restrictions (iOS Safari & Android Chrome autoplay policies)

let sharedAudioCtx: AudioContext | null = null;
let audioUnlocked = false;
let synthesizedChimeDataUri: string | null = null;
let persistentChimeAudio: HTMLAudioElement | null = null;

/**
 * Returns the persistent HTML5 Audio element preloaded with the synthesized chime.
 */
function getPersistentAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!persistentChimeAudio) {
    try {
      const wavUri = getChimeWavDataUri();
      persistentChimeAudio = new Audio(wavUri);
      persistentChimeAudio.preload = 'auto';
      // Inline playback attribute for iOS WebKit
      persistentChimeAudio.setAttribute('playsinline', 'true');
    } catch (err) {
      console.warn('Could not initialize persistent audio element:', err);
    }
  }
  return persistentChimeAudio;
}

/**
 * Generates an in-memory 16-bit PCM Mono WAV chime (D5 -> A5 -> D6 triad).
 * Guaranteed to produce real sound across any browser's HTML5 Audio or Web Audio API.
 */
function getChimeWavDataUri(): string {
  if (synthesizedChimeDataUri) return synthesizedChimeDataUri;

  const sampleRate = 22050;
  const duration = 0.9;
  const numSamples = Math.floor(sampleRate * duration);
  const headerLength = 44;
  const buffer = new ArrayBuffer(headerLength + numSamples * 2);
  const view = new DataView(buffer);

  // Helper to write ASCII strings to DataView
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');

  // Format Subchunk
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // Data Subchunk
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Synthesize pleasant 3-tone chime sequence:
  // Note 1: 587.33 Hz (D5) from 0.0s to 0.3s
  // Note 2: 880.00 Hz (A5) from 0.15s to 0.55s
  // Note 3: 1174.66 Hz (D6) from 0.3s to 0.9s
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    // Tone 1: D5
    if (t < 0.35) {
      const decay = Math.exp(-t * 9);
      sample += Math.sin(2 * Math.PI * 587.33 * t) * decay * 0.35;
    }
    // Tone 2: A5
    if (t >= 0.15 && t < 0.6) {
      const relT = t - 0.15;
      const decay = Math.exp(-relT * 8);
      sample += Math.sin(2 * Math.PI * 880.0 * relT) * decay * 0.4;
    }
    // Tone 3: D6 (bright bell resolution)
    if (t >= 0.3) {
      const relT = t - 0.3;
      const decay = Math.exp(-relT * 5.5);
      // Main tone + light harmonic
      sample += (Math.sin(2 * Math.PI * 1174.66 * relT) * 0.45 + Math.sin(2 * Math.PI * 2349.32 * relT) * 0.1) * decay;
    }

    // Soft clip to 16-bit integer range
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  // Convert buffer to Base64
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  synthesizedChimeDataUri = 'data:audio/wav;base64,' + btoa(binary);
  return synthesizedChimeDataUri;
}

/**
 * Returns a singleton AudioContext instance.
 */
function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      try {
        sharedAudioCtx = new AudioCtxClass();
      } catch (err) {
        console.warn('Could not initialize AudioContext:', err);
      }
    }
  }
  return sharedAudioCtx;
}

/**
 * Pre-warms and unlocks the mobile browser audio pipeline during a legitimate user gesture
 * (click, tap, starting a set, touching rest timer).
 * Once unlocked, future timers (setInterval/setTimeout) can freely play audio.
 */
export function unlockMobileAudio(): void {
  if (typeof window === 'undefined') return;

  // 1. Pre-warm Web Audio API
  const ctx = getSharedAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        audioUnlocked = true;
      }).catch(() => {});
    } else {
      audioUnlocked = true;
    }

    // Play an imperceptible silent 1-sample buffer to satisfy Safari's hardware gate
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      // Ignore
    }
  }

  // 2. Pre-warm persistent HTML5 Audio element
  try {
    const audio = getPersistentAudio();
    if (audio) {
      audio.volume = 0.001; // nearly silent
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1.0;
            audioUnlocked = true;
          })
          .catch(() => {});
      }
    }
  } catch {
    // Ignore
  }
}

/**
 * Synthesizes a crisp, pleasant, multi-tone chime (D5 -> A5 -> D6) via Web Audio API.
 */
function playWebAudioChime(ctx: AudioContext): void {
  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.5, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
  masterGain.connect(ctx.destination);

  // Tone 1: 587.33 Hz (D5) - energetic start
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(587.33, now);
  gain1.gain.setValueAtTime(0.35, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc1.connect(gain1);
  gain1.connect(masterGain);
  osc1.start(now);
  osc1.stop(now + 0.3);

  // Tone 2: 880.00 Hz (A5) - melodic ascension
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(880.0, now + 0.15);
  gain2.gain.setValueAtTime(0.4, now + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
  osc2.connect(gain2);
  gain2.connect(masterGain);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.55);

  // Tone 3: 1174.66 Hz (D6) - triumphant bell resolution
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(1174.66, now + 0.3);
  gain3.gain.setValueAtTime(0.5, now + 0.3);
  gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
  osc3.connect(gain3);
  gain3.connect(masterGain);
  osc3.start(now + 0.3);
  osc3.stop(now + 0.9);
}

/**
 * Fallback to HTML5 audio using our persistent synthesized data URI element.
 */
function playHtml5AudioChime(): void {
  try {
    const audio = getPersistentAudio();
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Persistent HTML5 Audio playback caught error, trying ephemeral:', err);
          const wavUri = getChimeWavDataUri();
          const fallback = new Audio(wavUri);
          fallback.volume = 1.0;
          fallback.play().catch(() => {});
        });
      }
    }
  } catch (err) {
    console.warn('Could not play HTML5 Audio fallback:', err);
  }
}

/**
 * Triggers rest sound alert using Web Audio API + HTML5 Audio fallback.
 */
export function playRestSound(): void {
  // Always trigger the persistent HTML5 Audio element (unlocked by gesture)
  playHtml5AudioChime();

  // Also trigger Web Audio if available for richer spatial chime
  const ctx = getSharedAudioContext();
  if (ctx && ctx.state === 'running') {
    try {
      playWebAudioChime(ctx);
    } catch {
      // Ignore
    }
  } else if (ctx && ctx.state === 'suspended') {
    ctx.resume().then(() => {
      playWebAudioChime(ctx);
    }).catch(() => {});
  }
}

/**
 * Triggers physical vibration on supported mobile devices (Android).
 * Returns status indicating whether device natively supports vibration.
 */
export function triggerVibration(): { supported: boolean; executed: boolean } {
  if (typeof navigator === 'undefined') {
    return { supported: false, executed: false };
  }

  const hasVibrate = 'vibrate' in navigator && typeof navigator.vibrate === 'function';
  if (!hasVibrate) {
    return { supported: false, executed: false };
  }

  try {
    // Try rhythmic pattern first: 300ms, pause 150ms, 300ms, pause 150ms, 500ms
    let result = navigator.vibrate([300, 150, 300, 150, 500]);
    if (!result) {
      // Fallback to single 500ms pulse
      result = navigator.vibrate(500);
    }
    return { supported: true, executed: Boolean(result) };
  } catch {
    try {
      const single = navigator.vibrate(400);
      return { supported: true, executed: Boolean(single) };
    } catch {
      return { supported: true, executed: false };
    }
  }
}

/**
 * Test utility for user settings to verify sound and vibration immediately.
 */
export function testRestAlerts(): {
  soundTriggered: boolean;
  vibrationStatus: { supported: boolean; executed: boolean };
} {
  unlockMobileAudio();
  playRestSound();
  const vibrationStatus = triggerVibration();
  return { soundTriggered: true, vibrationStatus };
}

/**
 * Checks if the device is iOS (iPhone, iPad, iPod).
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Parses the iOS version (e.g. 16.4, 17.5) if running on iOS, or null otherwise.
 */
export function getIOSVersion(): number | null {
  if (!isIOSDevice() || typeof navigator === 'undefined') return null;
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/i);
  if (!match) return null;
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  return major + minor / 10;
}

/**
 * Checks if the app is running as an installed Home Screen Web App (standalone mode).
 */
export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  const isStandaloneMedia =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  const isSafariStandalone =
    typeof navigator !== 'undefined' &&
    Boolean((navigator as unknown as { standalone?: boolean }).standalone);
  return isStandaloneMedia || isSafariStandalone;
}

export interface DevicePushCapabilities {
  isIOS: boolean;
  iosVersion: number | null;
  isStandalone: boolean;
  supportsServiceWorker: boolean;
  supportsPushManager: boolean;
  supportsNotification: boolean;
  supportsVibration: boolean;
  requiresHomeScreenInstall: boolean;
  permission: NotificationPermission | 'unsupported';
}

/**
 * Returns full platform capabilities for Web Push, iOS 16.4+ Home Screen requirement, and Vibration.
 */
export function getDevicePushCapabilities(): DevicePushCapabilities {
  const isIOS = isIOSDevice();
  const iosVersion = getIOSVersion();
  const isStandalone = isStandalonePWA();
  const supportsServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const supportsPushManager = typeof window !== 'undefined' && 'PushManager' in window;
  const supportsNotification = typeof window !== 'undefined' && 'Notification' in window;
  const supportsVibration =
    typeof navigator !== 'undefined' &&
    'vibrate' in navigator &&
    typeof navigator.vibrate === 'function';

  // On iPhone/iPad, Web Push requires iOS 16.4+ AND opening from the Home Screen (standalone mode)
  const requiresHomeScreenInstall = isIOS && !isStandalone;

  return {
    isIOS,
    iosVersion,
    isStandalone,
    supportsServiceWorker,
    supportsPushManager,
    supportsNotification,
    supportsVibration,
    requiresHomeScreenInstall,
    permission: getNotificationPermissionStatus(),
  };
}

/**
 * Checks Notification permission status.
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests Notification permission with user gesture.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Converts a URL-safe base64 VAPID public key to Uint8Array for PushManager.subscribe.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Ensures the Service Worker is registered and active, returning its ServiceWorkerRegistration.
 */
export async function ensureServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    let reg = await navigator.serviceWorker.getRegistration('/');
    if (!reg) {
      reg = await navigator.serviceWorker.register('/pombo-notification-sw.js', { scope: '/' });
    }
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn('[WebPush] Could not ensure Service Worker registration:', err);
    return null;
  }
}

/**
 * Fetches the server's public VAPID key.
 */
export async function fetchVapidPublicKey(): Promise<string | null> {
  const envKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_VAPID_PUBLIC_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  try {
    const res = await fetch('/api/push/vapid-public-key');
    const data = await res.json();
    if (data?.ok && typeof data.publicKey === 'string') {
      return data.publicKey;
    }
  } catch (err) {
    console.warn('[WebPush] Failed fetching VAPID public key:', err);
  }
  return null;
}

/**
 * Subscribes the current device to Real Web Push (only call on explicit user gesture!)
 * and links the PushSubscription strictly to the authenticated userId on the server.
 */
export async function subscribeUserToWebPush(
  userId: string,
  preferences?: Record<string, unknown>
): Promise<{
  ok: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  error?: string;
  requiresHomeScreenInstall?: boolean;
}> {
  const caps = getDevicePushCapabilities();
  if (caps.requiresHomeScreenInstall) {
    return {
      ok: false,
      permission: caps.permission,
      subscribed: false,
      requiresHomeScreenInstall: true,
      error:
        'No iPhone/iPad (iOS 16.4+), instale o PomboFit na Tela de Início (Compartilhar → Adicionar à Tela de Início) e abra-o por lá para ativar notificações Push.',
    };
  }

  if (!caps.supportsNotification) {
    return {
      ok: false,
      permission: 'unsupported',
      subscribed: false,
      error: 'Este navegador não suporta a API de Notificações.',
    };
  }

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : await requestNotificationPermission();

  if (permission !== 'granted') {
    return {
      ok: false,
      permission,
      subscribed: false,
      error:
        permission === 'denied'
          ? 'Permissão de notificações bloqueada no navegador. Libere nas configurações do site/celular.'
          : 'Permissão de notificações não concedida.',
    };
  }

  const reg = await ensureServiceWorkerRegistration();
  if (!reg) {
    return {
      ok: false,
      permission,
      subscribed: false,
      error: 'Service Worker indisponível neste navegador.',
    };
  }

  // Inform Service Worker of current userId
  const worker = reg.active || navigator.serviceWorker.controller;
  if (worker) {
    worker.postMessage({ type: 'SET_USER_CONTEXT', userId });
  }

  if (!('pushManager' in reg)) {
    return {
      ok: false,
      permission,
      subscribed: false,
      error: 'PushManager não suportado neste navegador.',
    };
  }

  try {
    const publicKey = await fetchVapidPublicKey();
    if (!publicKey) {
      return {
        ok: false,
        permission,
        subscribed: false,
        error: 'Chave pública VAPID não encontrada no servidor.',
      };
    }

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const appServerKey = urlBase64ToUint8Array(publicKey);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey as unknown as BufferSource,
      });
    }

    const subJson = sub.toJSON();
    const platformLabel = caps.isIOS
      ? `iOS ${caps.iosVersion || ''} (${caps.isStandalone ? 'PWA' : 'Safari'})`
      : /android/i.test(navigator.userAgent)
        ? 'Android'
        : 'Desktop/Web';

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        subscription: subJson,
        platform: platformLabel,
        userAgent: navigator.userAgent,
        preferences: {
          timezoneOffsetMinutes: new Date().getTimezoneOffset(),
          ...preferences,
        },
      }),
    });

    const result = await response.json();
    if (!response.ok || !result?.ok) {
      return {
        ok: false,
        permission,
        subscribed: false,
        error: result?.error || 'Falha ao salvar PushSubscription no servidor.',
      };
    }

    return {
      ok: true,
      permission: 'granted',
      subscribed: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao criar assinatura Web Push.';
    console.warn('[WebPush] Subscription error:', message);
    return {
      ok: false,
      permission,
      subscribed: false,
      error: message,
    };
  }
}

/**
 * Silently syncs an ALREADY GRANTED PushSubscription with the current authenticated userId
 * without prompting the user if permission is 'default' or 'denied'.
 */
export async function syncExistingWebPushSubscription(
  userId: string,
  preferences?: Record<string, unknown>
): Promise<boolean> {
  if (!userId || typeof window === 'undefined') return false;
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;

  try {
    const reg = await ensureServiceWorkerRegistration();
    if (!reg || !('pushManager' in reg)) return false;

    const worker = reg.active || navigator.serviceWorker.controller;
    if (worker) {
      worker.postMessage({ type: 'SET_USER_CONTEXT', userId });
    }

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const publicKey = await fetchVapidPublicKey();
      if (!publicKey) return false;
      const appServerKey = urlBase64ToUint8Array(publicKey);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey as unknown as BufferSource,
      });
    }

    const caps = getDevicePushCapabilities();
    const platformLabel = caps.isIOS
      ? `iOS ${caps.iosVersion || ''} (${caps.isStandalone ? 'PWA' : 'Safari'})`
      : /android/i.test(navigator.userAgent)
        ? 'Android'
        : 'Desktop/Web';

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        subscription: sub.toJSON(),
        platform: platformLabel,
        userAgent: navigator.userAgent,
        preferences: {
          timezoneOffsetMinutes: new Date().getTimezoneOffset(),
          ...preferences,
        },
      }),
    });
    const data = await res.json();
    return Boolean(data?.ok);
  } catch {
    return false;
  }
}

/**
 * Unsubscribes the current browser/device and removes the subscription for userId on the server.
 */
export async function unsubscribeUserFromWebPush(userId: string): Promise<boolean> {
  try {
    let endpoint: string | undefined;
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'pushManager' in reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          endpoint = sub.endpoint;
          await sub.unsubscribe().catch(() => {});
        }
      }
    }

    const res = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, endpoint }),
    });
    const data = await res.json();
    return Boolean(data?.ok);
  } catch (err) {
    console.warn('[WebPush] Unsubscribe error:', err);
    return false;
  }
}

/**
 * Queries the backend Web Push status for the given userId.
 */
export async function getServerPushStatus(userId: string): Promise<{
  ok: boolean;
  subscribed: boolean;
  subscriptionCount: number;
  preferences?: Record<string, unknown>;
  scheduledJobs?: Array<Record<string, unknown>>;
} | null> {
  if (!userId) return null;
  try {
    const res = await fetch(`/api/push/status?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Syncs user notification preferences and reminder schedules to the backend scheduler.
 */
export async function syncServerPushPreferences(
  userId: string,
  preferences: Record<string, unknown>
): Promise<boolean> {
  if (!userId) return false;
  try {
    const res = await fetch('/api/push/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        preferences: {
          timezoneOffsetMinutes: new Date().getTimezoneOffset(),
          ...preferences,
        },
      }),
    });
    const data = await res.json();
    return Boolean(data?.ok);
  } catch {
    return false;
  }
}

/**
 * Schedules a server-side Web Push notification for rest timer completion.
 */
export async function scheduleServerRestPush(params: {
  userId: string;
  targetTimestamp: number;
  restSeconds?: number;
  exerciseName?: string;
  nextSetNumber?: number;
  workoutId?: string;
  workoutName?: string;
}): Promise<boolean> {
  if (!params.userId) return false;
  try {
    const res = await fetch('/api/push/rest-timer/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return Boolean(data?.ok && data?.scheduled);
  } catch {
    return false;
  }
}

/**
 * Cancels any pending server-side Web Push rest timer notification for userId.
 */
export async function cancelServerRestPush(userId: string, reason?: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const res = await fetch('/api/push/rest-timer/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reason }),
    });
    const data = await res.json();
    return Boolean(data?.ok);
  } catch {
    return false;
  }
}

/**
 * Synchronizes workout start, completion, or cancellation with the backend Web Push scheduler.
 */
export async function syncServerWorkoutSessionPush(params: {
  userId: string;
  action: 'start' | 'complete' | 'cancel';
  workoutId?: string;
  workoutName?: string;
  estimatedDurationMin?: number;
}): Promise<boolean> {
  if (!params.userId) return false;
  try {
    const res = await fetch('/api/push/workout-session/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return Boolean(data?.ok);
  } catch {
    return false;
  }
}

/**
 * Triggers an immediate or delayed real Web Push test notification from the backend.
 */
export async function sendServerTestPush(
  userId: string,
  delaySeconds = 0
): Promise<{ ok: boolean; delayed?: boolean; error?: string }> {
  if (!userId) return { ok: false, error: 'Usuário não autenticado.' };
  try {
    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, delaySeconds }),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error || 'Falha ao enviar Push de teste.' };
    }
    return { ok: true, delayed: Boolean(data.delayed) };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro de conexão com o servidor Push.',
    };
  }
}

/**
 * Sends a native mobile notification with Pombo's bust when rest finishes and user is outside the app.
 */
export async function sendRestFinishedNotification(userId?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const title = 'PomboFit — Seu descanso acabou!';
  const tag = userId ? `pombofit-rest-finished-${userId}` : 'pombofit-rest-finished';
  const options: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
    body: 'Hora da próxima série com foco total! O Pombo está pronto! 🕊️💪',
    icon: '/assets/mascots/pombo_hero_bust.png',
    badge: '/assets/mascots/pombo_hero_bust.png',
    tag,
    renotify: true,
    requireInteraction: false,
    silent: false,
    vibrate: [300, 150, 300, 150, 500],
    data: {
      url: '/?tab=workouts&resume=1',
      category: 'rest_timer',
      timestamp: Date.now(),
    },
  };

  // Try Service Worker registration first (standard for Android & iOS 16.4+ standalone PWAs)
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return true;
      }
      const controller = navigator.serviceWorker.controller;
      if (controller) {
        controller.postMessage({
          type: 'SHOW_REST_NOTIFICATION',
          title,
          ...options,
        });
        return true;
      }
    }
  } catch (err) {
    console.warn('Service worker notification failed, trying fallback:', err);
  }

  // Fallback to standard window Notification
  try {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return true;
  } catch (err) {
    console.warn('Standard notification failed:', err);
    return false;
  }
}

/**
 * Schedules a background rest notification in BOTH the backend Web Push server (for locked screen / closed app)
 * AND the local Service Worker (as offline fallback).
 */
export async function scheduleRestNotificationInSW(
  targetTimestampMs: number,
  context?: {
    userId?: string;
    restSeconds?: number;
    exerciseName?: string;
    nextSetNumber?: number;
    workoutId?: string;
    workoutName?: string;
  }
): Promise<boolean> {
  // 1. Schedule real server-side Web Push notification if userId is provided
  if (context?.userId) {
    scheduleServerRestPush({
      userId: context.userId,
      targetTimestamp: targetTimestampMs,
      restSeconds: context.restSeconds,
      exerciseName: context.exerciseName,
      nextSetNumber: context.nextSetNumber,
      workoutId: context.workoutId,
      workoutName: context.workoutName,
    }).catch(() => {});
  }

  // 2. Also schedule in Service Worker for local/offline fallback (deduplicated with server push in SW)
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const worker = registration?.active || navigator.serviceWorker.controller;
    if (worker) {
      const tag = context?.userId
        ? `pombofit-rest-finished-${context.userId}`
        : 'pombofit-rest-finished';
      worker.postMessage({
        type: 'SCHEDULE_REST_NOTIFICATION',
        userId: context?.userId,
        targetTimestamp: targetTimestampMs,
        title: 'PomboFit — Seu descanso acabou!',
        body: context?.exerciseName
          ? `Hora da ${context.nextSetNumber ? `${context.nextSetNumber}ª ` : ''}série em ${context.exerciseName}! O Pombo está pronto! 🕊️💪`
          : 'Hora da próxima série com foco total! O Pombo está pronto! 🕊️💪',
        icon: '/assets/mascots/pombo_hero_bust.png',
        badge: '/assets/mascots/pombo_hero_bust.png',
        tag,
        url: '/?tab=workouts&resume=1',
        vibrate: [300, 150, 300, 150, 500],
      });
      return true;
    }
  } catch (err) {
    console.warn('Could not post SCHEDULE_REST_NOTIFICATION to SW:', err);
  }
  return false;
}

/**
 * Cancels any pending rest notification in BOTH the backend Web Push server and the Service Worker.
 */
export async function cancelRestNotificationInSW(userId?: string, reason?: string): Promise<void> {
  if (userId) {
    cancelServerRestPush(userId, reason).catch(() => {});
  }

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const worker = registration?.active || navigator.serviceWorker.controller;
    if (worker) {
      worker.postMessage({
        type: 'CANCEL_REST_NOTIFICATION',
        userId,
      });
    }
  } catch (err) {
    console.warn('Could not post CANCEL_REST_NOTIFICATION to SW:', err);
  }
}

/**
 * Comprehensive rest alert: runs sound, vibration, and background mobile notification.
 */
export function executeRestAlerts(config: {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  userId?: string;
}): {
  soundTriggered: boolean;
  vibrationStatus: { supported: boolean; executed: boolean };
} {
  let soundTriggered = false;
  if (config.soundEnabled) {
    playRestSound();
    soundTriggered = true;
  }

  let vibrationStatus = { supported: false, executed: false };
  if (config.vibrationEnabled) {
    vibrationStatus = triggerVibration();
  }

  // If user is currently outside the app or phone screen is off/locked, send native notification fallback
  if (typeof document !== 'undefined' && document.hidden) {
    sendRestFinishedNotification(config.userId).catch(() => {});
  }

  return { soundTriggered, vibrationStatus };
}

