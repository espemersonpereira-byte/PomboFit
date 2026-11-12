import 'dotenv/config';
import express from 'express';
import { createServer as createHttpServer } from 'http';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import * as webPush from 'web-push';
import type { PushSubscription as WebPushSubscription } from 'web-push';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

// ============================================================================
// POMBOFIT REAL WEB PUSH & BACKGROUND NOTIFICATION SCHEDULER (VAPID RFC 8292)
// ============================================================================

interface StoredPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
  userAgent?: string;
  platform?: string;
  createdAt: number;
  updatedAt: number;
}

interface CustomReminderItem {
  id: string;
  title: string;
  time: string; // "HH:MM"
  days: string[]; // ["Seg", "Ter", ...]
  enabled: boolean;
}

interface UserPushPreferences {
  userId: string;
  pushNotificationsEnabled: boolean;
  notifRestFinished: boolean;
  notifWorkoutCompletion: boolean;
  notifWorkoutReminder: boolean;
  workoutReminderTime: string; // "HH:MM"
  notifWaterReminder: boolean;
  waterReminderIntervalMin: number;
  customReminders: CustomReminderItem[];
  timezoneOffsetMinutes: number;
  lastWaterReminderSentAt?: number;
  lastTriggeredMinuteKey?: string;
  updatedAt: number;
}

type PushJobCategory =
  | 'rest_timer'
  | 'workout_window'
  | 'workout_reminder'
  | 'water_reminder'
  | 'custom_reminder'
  | 'test';

interface ScheduledPushJob {
  id: string;
  userId: string;
  category: PushJobCategory;
  targetTimestamp: number;
  status: 'scheduled' | 'sent' | 'cancelled' | 'failed' | 'skipped_no_sub';
  workoutId?: string;
  workoutName?: string;
  payload: {
    notificationId: string;
    title: string;
    body: string;
    tag: string;
    url: string;
    category: PushJobCategory;
    icon?: string;
    badge?: string;
    vibrate?: number[];
    requireInteraction?: boolean;
    targetTimestamp?: number;
  };
  createdAt: number;
  dispatchedAt?: number;
  cancelledAt?: number;
  deliverySummary?: {
    attempted: number;
    delivered: number;
    removedDeadEndpoints: number;
    errors?: string[];
  };
}

interface ActiveWorkoutServerState {
  userId: string;
  workoutId: string;
  workoutName: string;
  startedAt: number;
  estimatedDurationMin: number;
  estimatedEndTimestamp: number;
  status: 'in_progress' | 'completed' | 'cancelled';
  scheduledJobId?: string;
  updatedAt: number;
}

interface PushAuditLogEntry {
  id: string;
  timestamp: number;
  userId: string;
  event: string;
  category?: string;
  details: string;
}

interface PersistentPushStore {
  subscriptionsByUser: Record<string, StoredPushSubscription[]>;
  preferencesByUser: Record<string, UserPushPreferences>;
  jobsById: Record<string, ScheduledPushJob>;
  activeWorkoutByUser: Record<string, ActiveWorkoutServerState>;
  auditLogs: PushAuditLogEntry[];
}

const DATA_DIR = path.resolve(__dirname, '.aistudio');
const VAPID_FILE = path.join(DATA_DIR, 'vapid-keys.json');
const PUSH_STORE_FILE = path.join(DATA_DIR, 'push-store.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[WebPush] Could not create data dir:', err);
  }
}

function loadOrGenerateVapidKeys(): { publicKey: string; privateKey: string; subject: string } {
  ensureDataDir();
  const envPub = process.env.VAPID_PUBLIC_KEY?.trim();
  const envPriv = process.env.VAPID_PRIVATE_KEY?.trim();
  const envSub = process.env.VAPID_SUBJECT?.trim() || 'mailto:suporte@pombofit.app';

  if (envPub && envPriv) {
    return { publicKey: envPub, privateKey: envPriv, subject: envSub };
  }

  try {
    if (fs.existsSync(VAPID_FILE)) {
      const raw = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
      if (raw.publicKey && raw.privateKey) {
        return {
          publicKey: raw.publicKey,
          privateKey: raw.privateKey,
          subject: raw.subject || envSub,
        };
      }
    }
  } catch (err) {
    console.warn('[WebPush] Failed reading cached VAPID keys, regenerating:', err);
  }

  const generated = webPush.generateVAPIDKeys();
  const config = {
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
    subject: envSub,
  };

  try {
    fs.writeFileSync(VAPID_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[WebPush] Could not persist generated VAPID keys:', err);
  }

  return config;
}

const vapidConfig = loadOrGenerateVapidKeys();
webPush.setVapidDetails(vapidConfig.subject, vapidConfig.publicKey, vapidConfig.privateKey);

const pushStore: PersistentPushStore = {
  subscriptionsByUser: {},
  preferencesByUser: {},
  jobsById: {},
  activeWorkoutByUser: {},
  auditLogs: [],
};

const activeJobTimers = new Map<string, NodeJS.Timeout>();

function loadPushStore() {
  ensureDataDir();
  try {
    if (fs.existsSync(PUSH_STORE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(PUSH_STORE_FILE, 'utf-8')) as Partial<PersistentPushStore>;
      if (parsed.subscriptionsByUser) pushStore.subscriptionsByUser = parsed.subscriptionsByUser;
      if (parsed.preferencesByUser) pushStore.preferencesByUser = parsed.preferencesByUser;
      if (parsed.jobsById) pushStore.jobsById = parsed.jobsById;
      if (parsed.activeWorkoutByUser) pushStore.activeWorkoutByUser = parsed.activeWorkoutByUser;
      if (Array.isArray(parsed.auditLogs)) pushStore.auditLogs = parsed.auditLogs.slice(-250);
    }
  } catch (err) {
    console.warn('[WebPush] Could not load push store from disk:', err);
  }
}

let saveStoreTimeout: NodeJS.Timeout | null = null;
function savePushStoreDebounced() {
  if (saveStoreTimeout) clearTimeout(saveStoreTimeout);
  saveStoreTimeout = setTimeout(() => {
    try {
      ensureDataDir();
      fs.writeFileSync(PUSH_STORE_FILE, JSON.stringify(pushStore, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[WebPush] Failed writing push store:', err);
    }
  }, 150);
}

function appendPushLog(userId: string, event: string, details: string, category?: string) {
  const entry: PushAuditLogEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    userId,
    event,
    category,
    details,
  };
  pushStore.auditLogs.push(entry);
  if (pushStore.auditLogs.length > 250) {
    pushStore.auditLogs.splice(0, pushStore.auditLogs.length - 250);
  }
  savePushStoreDebounced();
}

function getDefaultUserPreferences(userId: string): UserPushPreferences {
  if (!pushStore.preferencesByUser[userId]) {
    pushStore.preferencesByUser[userId] = {
      userId,
      pushNotificationsEnabled: true,
      notifRestFinished: true,
      notifWorkoutCompletion: true,
      notifWorkoutReminder: true,
      workoutReminderTime: '18:00',
      notifWaterReminder: false,
      waterReminderIntervalMin: 120,
      customReminders: [],
      timezoneOffsetMinutes: 180,
      updatedAt: Date.now(),
    };
  }
  return pushStore.preferencesByUser[userId];
}

async function dispatchWebPushToUser(
  userId: string,
  payload: ScheduledPushJob['payload']
): Promise<{
  attempted: number;
  delivered: number;
  removedDeadEndpoints: number;
  errors: string[];
}> {
  const subs = pushStore.subscriptionsByUser[userId] || [];
  if (subs.length === 0) {
    appendPushLog(userId, 'PUSH_SKIPPED_NO_SUBSCRIPTION', `Nenhuma PushSubscription ativa para ${payload.title}`, payload.category);
    return { attempted: 0, delivered: 0, removedDeadEndpoints: 0, errors: ['Nenhuma inscrição Push ativa para este usuário.'] };
  }

  const deadEndpoints = new Set<string>();
  const errors: string[] = [];
  let delivered = 0;

  const serializedPayload = JSON.stringify({
    ...payload,
    serverTimestamp: Date.now(),
  });

  await Promise.all(
    subs.map(async (sub) => {
      // Support loopback test endpoints (e.g. https://test-push.pombofit.local/...) for deterministic E2E testing without external FCM/APNs roundtrip failure
      if (sub.endpoint.startsWith('https://test-push.pombofit.local/')) {
        delivered += 1;
        return;
      }

      const webPushSub: WebPushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      };

      try {
        await webPush.sendNotification(webPushSub, serializedPayload, {
          TTL: 3600,
          urgency: 'high',
          topic: payload.tag.slice(0, 32).replace(/[^a-zA-Z0-9_-]/g, '-'),
        });
        delivered += 1;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`HTTP ${statusCode || 'ERR'}: ${message}`);
        if (statusCode === 404 || statusCode === 410) {
          deadEndpoints.add(sub.endpoint);
        }
      }
    })
  );

  if (deadEndpoints.size > 0) {
    pushStore.subscriptionsByUser[userId] = (pushStore.subscriptionsByUser[userId] || []).filter(
      (s) => !deadEndpoints.has(s.endpoint)
    );
    appendPushLog(
      userId,
      'CLEANED_EXPIRED_SUBSCRIPTIONS',
      `Removidas ${deadEndpoints.size} inscrições expiradas (404/410).`,
      payload.category
    );
  }

  savePushStoreDebounced();
  return {
    attempted: subs.length,
    delivered,
    removedDeadEndpoints: deadEndpoints.size,
    errors,
  };
}

async function executeScheduledJob(jobId: string) {
  const timer = activeJobTimers.get(jobId);
  if (timer) {
    clearTimeout(timer);
    activeJobTimers.delete(jobId);
  }

  const job = pushStore.jobsById[jobId];
  if (!job || job.status !== 'scheduled') {
    return;
  }

  // Verify user preferences before sending
  const prefs = getDefaultUserPreferences(job.userId);
  if (!prefs.pushNotificationsEnabled) {
    job.status = 'cancelled';
    job.cancelledAt = Date.now();
    appendPushLog(job.userId, 'JOB_CANCELLED_PREFS_DISABLED', `Notificações desativadas pelo usuário (${job.category}).`, job.category);
    savePushStoreDebounced();
    return;
  }

  if (job.category === 'rest_timer' && !prefs.notifRestFinished) {
    job.status = 'cancelled';
    job.cancelledAt = Date.now();
    savePushStoreDebounced();
    return;
  }

  if (job.category === 'workout_window') {
    if (!prefs.notifWorkoutCompletion) {
      job.status = 'cancelled';
      job.cancelledAt = Date.now();
      savePushStoreDebounced();
      return;
    }
    const activeWorkout = pushStore.activeWorkoutByUser[job.userId];
    if (!activeWorkout || activeWorkout.status !== 'in_progress' || (job.workoutId && activeWorkout.workoutId !== job.workoutId)) {
      job.status = 'cancelled';
      job.cancelledAt = Date.now();
      appendPushLog(job.userId, 'WORKOUT_JOB_SKIPPED_ALREADY_FINISHED', `Treino já finalizado/cancelado antes do alerta de tempo estimado.`, job.category);
      savePushStoreDebounced();
      return;
    }
  }

  const result = await dispatchWebPushToUser(job.userId, job.payload);
  job.dispatchedAt = Date.now();
  job.deliverySummary = result;

  if (result.attempted === 0) {
    job.status = 'skipped_no_sub';
  } else if (result.delivered > 0) {
    job.status = 'sent';
    appendPushLog(
      job.userId,
      'PUSH_DELIVERED',
      `Notificação enviada (${job.category}): "${job.payload.title}" para ${result.delivered}/${result.attempted} dispositivo(s).`,
      job.category
    );
  } else {
    job.status = 'failed';
    appendPushLog(
      job.userId,
      'PUSH_FAILED',
      `Falha no envio (${job.category}): ${(result.errors || []).join('; ')}`,
      job.category
    );
  }

  savePushStoreDebounced();
}

function armJobTimer(job: ScheduledPushJob) {
  const existing = activeJobTimers.get(job.id);
  if (existing) clearTimeout(existing);

  const delayMs = Math.max(0, job.targetTimestamp - Date.now());
  // Only arm immediate Node timeout if within 2 hours; the 1s tick handles everything else too
  if (delayMs <= 2 * 60 * 60 * 1000) {
    const timer = setTimeout(() => {
      executeScheduledJob(job.id).catch((err) => {
        console.warn('[WebPush] Error executing scheduled job:', err);
      });
    }, delayMs);
    activeJobTimers.set(job.id, timer);
  }
}

function cancelUserJobsByCategory(userId: string, category: PushJobCategory, reason: string): number {
  let cancelledCount = 0;
  for (const job of Object.values(pushStore.jobsById)) {
    if (job.userId === userId && job.category === category && job.status === 'scheduled') {
      job.status = 'cancelled';
      job.cancelledAt = Date.now();
      const timer = activeJobTimers.get(job.id);
      if (timer) {
        clearTimeout(timer);
        activeJobTimers.delete(job.id);
      }
      cancelledCount += 1;
    }
  }
  if (cancelledCount > 0) {
    appendPushLog(userId, 'JOBS_CANCELLED', `${cancelledCount} agendamento(s) [${category}] cancelado(s): ${reason}`, category);
    savePushStoreDebounced();
  }
  return cancelledCount;
}

// Initialize store and restore pending scheduled jobs on startup
loadPushStore();
for (const job of Object.values(pushStore.jobsById)) {
  if (job.status === 'scheduled') {
    armJobTimer(job);
  }
}

// 1-second background scheduler loop for overdue jobs + periodic reminders (workout, water, custom)
const WEEKDAY_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
setInterval(() => {
  const now = Date.now();

  // 1. Check any scheduled jobs due now
  for (const job of Object.values(pushStore.jobsById)) {
    if (job.status === 'scheduled' && job.targetTimestamp <= now && !activeJobTimers.has(job.id)) {
      executeScheduledJob(job.id).catch(() => {});
    }
  }

  // 2. Check recurring user reminders (workout reminder time, hydration interval, custom reminders)
  for (const [userId, prefs] of Object.entries(pushStore.preferencesByUser)) {
    if (!prefs.pushNotificationsEnabled) continue;
    const subs = pushStore.subscriptionsByUser[userId] || [];
    if (subs.length === 0) continue;

    // Compute user's local time using timezoneOffsetMinutes (e.g. 180 for BRT UTC-3)
    const offsetMs = (typeof prefs.timezoneOffsetMinutes === 'number' ? prefs.timezoneOffsetMinutes : 180) * 60 * 1000;
    const userLocalDate = new Date(now - offsetMs);
    const hh = String(userLocalDate.getUTCHours()).padStart(2, '0');
    const mm = String(userLocalDate.getUTCMinutes()).padStart(2, '0');
    const hhmm = `${hh}:${mm}`;
    const dayName = WEEKDAY_PT[userLocalDate.getUTCDay()];
    const minuteKey = `${userLocalDate.getUTCFullYear()}-${userLocalDate.getUTCMonth()}-${userLocalDate.getUTCDate()}-${hhmm}`;

    if (prefs.lastTriggeredMinuteKey !== minuteKey) {
      // Daily workout reminder
      if (prefs.notifWorkoutReminder && prefs.workoutReminderTime === hhmm) {
        prefs.lastTriggeredMinuteKey = minuteKey;
        const notifId = `workout-rem-${userId}-${minuteKey}`;
        dispatchWebPushToUser(userId, {
          notificationId: notifId,
          title: 'PomboFit — Hora do seu treino! 🕊️💪',
          body: 'Seu horário programado de treino chegou. Bora manter a constância hoje!',
          tag: `pombofit-workout-reminder-${userId}`,
          url: '/?tab=workouts',
          category: 'workout_reminder',
        }).catch(() => {});
      }

      // Custom reminders
      if (Array.isArray(prefs.customReminders)) {
        for (const rem of prefs.customReminders) {
          if (
            rem.enabled &&
            rem.time === hhmm &&
            (!Array.isArray(rem.days) || rem.days.length === 0 || rem.days.includes(dayName))
          ) {
            prefs.lastTriggeredMinuteKey = minuteKey;
            const notifId = `custom-rem-${rem.id}-${minuteKey}`;
            dispatchWebPushToUser(userId, {
              notificationId: notifId,
              title: `PomboFit — ${rem.title || 'Lembrete'} 🕊️`,
              body: `Lembrete programado para ${rem.time}. Toque para abrir o PomboFit.`,
              tag: `pombofit-custom-reminder-${rem.id}`,
              url: '/?tab=home',
              category: 'custom_reminder',
            }).catch(() => {});
          }
        }
      }
    }

    // Hydration interval reminder (between 08:00 and 22:00 user local time)
    const hourNum = userLocalDate.getUTCHours();
    if (
      prefs.notifWaterReminder &&
      prefs.waterReminderIntervalMin >= 15 &&
      hourNum >= 8 &&
      hourNum <= 22
    ) {
      const intervalMs = prefs.waterReminderIntervalMin * 60 * 1000;
      const lastSent = prefs.lastWaterReminderSentAt || 0;
      if (now - lastSent >= intervalMs) {
        prefs.lastWaterReminderSentAt = now;
        savePushStoreDebounced();
        dispatchWebPushToUser(userId, {
          notificationId: `water-rem-${userId}-${now}`,
          title: 'PomboFit — Hora de hidratar! 💧🕊️',
          body: 'Beba água para manter sua recuperação e performance muscular em alta.',
          tag: `pombofit-water-reminder-${userId}`,
          url: '/?tab=nutrition',
          category: 'water_reminder',
        }).catch(() => {});
      }
    }
  }
}, 1000);


// Initialize server-side Gemini client for Workout Sheet OCR & Extraction
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no servidor.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// POST /api/ocr-workout: Extracts workout sheets from images, screenshots, PDFs, or text
app.post('/api/ocr-workout', async (req, res) => {
  try {
    const { base64Data, mimeType, rawText, availableExercises } = req.body as {
      base64Data?: string;
      mimeType?: string;
      rawText?: string;
      availableExercises?: Array<{ id: string; name: string; muscleGroup: string }>;
    };

    const ai = getGeminiClient();

    const catalogList = (availableExercises || [])
      .slice(0, 200)
      .map((ex) => `${ex.id}: ${ex.name} (${ex.muscleGroup})`)
      .join('\n');

    const promptText = `Você é um extrator OCR especialista em fichas de treino de academia do aplicativo PomboFit.
Analise apenas o conteúdo fornecido (imagem, PDF ou texto) e extraia fielmente a ficha de treinamento.
REGRAS OBRIGATÓRIAS:
1. NUNCA invente exercícios, séries ou repetições que não estejam presentes no arquivo/texto enviado.
2. Para cada exercício identificado, associe ao ID mais correspondente da biblioteca interna abaixo (ou deixe matchedExerciseId vazio se não houver correspondência direta).
3. Se séries ou repetições não estiverem explícitas para um item, informe exatamente o que foi lido em rawLine e use valores padrão editáveis (ex: sets: 3, reps: "10-12") marcando confidence como "partial".

Biblioteca Interna de Exercícios Disponíveis:
${catalogList}
${rawText ? `\nTexto enviado pelo usuário:\n${rawText}` : ''}`;

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    if (base64Data && mimeType) {
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sheetTitle: {
              type: Type.STRING,
              description: 'Nome identificado para a ficha de treino ou sessão.',
            },
            muscleGroups: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Grupos musculares identificados na ficha.',
            },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rawDetectedName: {
                    type: Type.STRING,
                    description: 'Nome exato lido no documento/imagem.',
                  },
                  matchedExerciseId: {
                    type: Type.STRING,
                    description: 'ID do exercício correspondente na biblioteca interna do PomboFit.',
                  },
                  muscleGroup: {
                    type: Type.STRING,
                    description: 'Grupo muscular principal do exercício.',
                  },
                  sets: {
                    type: Type.INTEGER,
                    description: 'Número de séries identificadas.',
                  },
                  reps: {
                    type: Type.STRING,
                    description: 'Repetições identificadas (ex: 10, 8-12, 15).',
                  },
                  restSeconds: {
                    type: Type.INTEGER,
                    description: 'Descanso em segundos se especificado, ou 60 por padrão.',
                  },
                  notes: {
                    type: Type.STRING,
                    description: 'Observações lidas no arquivo (cadência, técnica, carga, etc.).',
                  },
                },
                required: ['rawDetectedName', 'matchedExerciseId', 'muscleGroup', 'sets', 'reps', 'restSeconds', 'notes'],
              },
            },
          },
          required: ['sheetTitle', 'muscleGroups', 'exercises'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json({ ok: true, data: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha ao processar o arquivo de treino.';
    console.error('OCR Workout Error:', message);
    res.status(500).json({ ok: false, error: message });
  }
});

// POST /api/scan-equipment: Identifies gym machine/equipment from a photo with user confirmation
app.post('/api/scan-equipment', async (req, res) => {
  try {
    const { base64Data, mimeType, availableExercises } = req.body as {
      base64Data: string;
      mimeType: string;
      availableExercises?: Array<{
        id: string;
        name: string;
        muscleGroup: string;
        equipment: string;
      }>;
    };

    if (!base64Data || !mimeType) {
      res.status(400).json({ ok: false, error: 'Imagem do equipamento não fornecida.' });
      return;
    }

    const ai = getGeminiClient();

    const catalogSummary = (availableExercises || [])
      .map((ex) => `${ex.id}: ${ex.name} [${ex.muscleGroup} | ${ex.equipment}]`)
      .join('\n');

    const promptText = `Você é o especialista biomecânico do aplicativo PomboFit.
Analise a fotografia enviada e identifique o equipamento de academia ou acessório de treino.
REGRAS DE SEGURANÇA E PRECISÃO:
1. Identifique o nome correto do aparelho em português (ex: "Cadeira Extensora", "Mesa Flexora", "Leg Press 45°", "Polia Alta / Pulley", " Máquina de Supino Articulado", "Banco Scott", "Par de Halteres", etc.).
2. Nunca confunda equipamentos parecidos (como cadeira extensora vs mesa flexora ou cadeira abdutora). Se a foto estiver ambígua ou escura, defina confidence como "low" ou "medium" e explique o motivo em uncertaintyNote.
3. Selecione APENAS exercícios da biblioteca abaixo que sejam 100% compatíveis com o aparelho identificado. Nunca associe um exercício incompatível.

Biblioteca de Exercícios PomboFit:
${catalogSummary}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            equipmentName: {
              type: Type.STRING,
              description: 'Nome identificado do aparelho ou equipamento.',
            },
            equipmentCategory: {
              type: Type.STRING,
              description: 'Categoria geral (Máquinas, Halteres, Barras, Cabos, Peso corporal, etc.).',
            },
            primaryMuscleGroup: {
              type: Type.STRING,
              description: 'Grupo muscular principal trabalhado neste equipamento.',
            },
            secondaryMuscles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Músculos secundários envolvidos.',
            },
            confidence: {
              type: Type.STRING,
              description: 'Nível de certeza da identificação: high, medium ou low.',
            },
            uncertaintyNote: {
              type: Type.STRING,
              description: 'Observação caso haja incerteza ou recomendação para o usuário conferir os ajustes do aparelho.',
            },
            usageInstructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Passo a passo de ajuste e utilização correta do aparelho.',
            },
            safetyTips: {
              type: Type.STRING,
              description: 'Orientações de segurança e postura no aparelho.',
            },
            compatibleExerciseIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'IDs dos exercícios compatíveis da biblioteca PomboFit.',
            },
          },
          required: [
            'equipmentName',
            'equipmentCategory',
            'primaryMuscleGroup',
            'secondaryMuscles',
            'confidence',
            'uncertaintyNote',
            'usageInstructions',
            'safetyTips',
            'compatibleExerciseIds',
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json({ ok: true, data: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha ao analisar a imagem do aparelho.';
    console.error('Equipment Scanner Error:', message);
    res.status(500).json({ ok: false, error: message });
  }
});

// POST /api/pombo-assistant: Pombo IA intelligent fitness & app assistant
app.post('/api/pombo-assistant', async (req, res) => {
  try {
    const { message, history, userContext } = req.body as {
      message: string;
      history?: Array<{ role: 'user' | 'model'; text: string }>;
      userContext?: {
        displayName?: string;
        goal?: string;
        experienceLevel?: string;
        weeklyDays?: number;
        limitations?: string;
        workoutsSummary?: string;
        recentSessionsSummary?: string;
        muscleBalanceSummary?: string;
        measurementsSummary?: string;
        nutritionSummary?: string;
      };
    };

    if (!message || !message.trim()) {
      res.status(400).json({ ok: false, error: 'Mensagem vazia.' });
      return;
    }

    const ai = getGeminiClient();

    const contextBlock = userContext
      ? `
DADOS AUTORIZADOS DO USUÁRIO ATUAL (${userContext.displayName || 'Atleta'}):
- Objetivo: ${userContext.goal || 'Condicionamento e Hipertrofia'}
- Nível: ${userContext.experienceLevel || 'Intermediário'}
- Meta Semanal: ${userContext.weeklyDays || 4} dias/semana
- Limitações Articulares: ${userContext.limitations || 'Nenhuma informada'}
- Fichas Cadastradas: ${userContext.workoutsSummary || 'Nenhuma ficha'}
- Histórico Recente: ${userContext.recentSessionsSummary || 'Sem sessões recentes'}
- Equilíbrio Muscular (Frequência): ${userContext.muscleBalanceSummary || 'Em construção'}
- Medidas Corporais: ${userContext.measurementsSummary || 'Sem medições recentes'}
- Nutrição e Hidratação Hoje: ${userContext.nutritionSummary || 'Sem registros hoje'}
`
      : '';

    const conversationHistory = (history || [])
      .slice(-8)
      .map((h) => `${h.role === 'user' ? 'Usuário' : 'Pombo IA'}: ${h.text}`)
      .join('\n');

    const systemInstruction = `Você é o Pombo IA, o assistente inteligente e instrutor oficial do aplicativo PomboFit (personificado pelo mascote oficial Pombo Seco).
Sua missão é ajudar o usuário com excelência técnica, clareza, simpatia e responsabilidade:
- Consultar e explicar as fichas de treino do usuário.
- Explicar a biomecânica, posição inicial, execução, amplitude e segurança dos exercícios.
- Analisar o histórico de treinos, volume e evolução de cargas do próprio usuário.
- Identificar desequilíbrios na frequência de treinamento (quais músculos foram mais ou menos trabalhados).
- Ajudar a organizar a rotina semanal e dias de descanso.
- Explicar como ajustar e usar equipamentos de academia.
- Esclarecer dúvidas sobre todas as áreas do aplicativo PomboFit (Início, Treinos, Exercícios, Evolução, Alimentação, Medidas, Calendário e Scanner).
REGRAS:
- Responda sempre em português claro, objetivo e bem estruturado.
- Utilize exclusivamente os dados autorizados do próprio usuário fornecidos abaixo.
- Lembre sempre que orientações nutricionais e de treinamento são informativas e educativas, não substituindo acompanhamento médico ou nutricional presencial.`;

    const fullPrompt = `${contextBlock}
${conversationHistory ? `\nHistórico recente da conversa:\n${conversationHistory}\n` : ''}
Pergunta atual do usuário: ${message.trim()}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
      },
    });

    res.json({
      ok: true,
      reply: response.text || 'Estou pronto para ajudar no seu treino! Como posso orientar você hoje?',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao consultar o Pombo IA.';
    console.error('Pombo IA Error:', message);
    res.status(500).json({ ok: false, error: message });
  }
});

// POST /api/generate-personalized-workouts: AI-driven individualized workout sheet programming per user profile
app.post('/api/generate-personalized-workouts', async (req, res) => {
  try {
    const { profile, availableExercises, performanceSummary } = req.body as {
      profile: {
        userId: string;
        displayName?: string;
        age?: number;
        weightKg?: number;
        heightCm?: number;
        goal: 'lose_weight' | 'gain_muscle' | 'get_strong';
        experienceLevel: 'beginner' | 'intermediate' | 'advanced';
        weeklyDays: number;
        sessionDurationMin: number;
        availableEquipment?: string[];
        priorityMuscles?: string[];
        limitations?: string;
        workoutSplitType?: string;
        customMuscleCombos?: string[];
      };
      availableExercises: Array<{
        id: string;
        name: string;
        muscleGroup: string;
        equipment: string;
        movementType: string;
        jointStressTags: string[];
      }>;
      performanceSummary?: string;
    };

    if (!profile || !availableExercises || availableExercises.length === 0) {
      res.status(400).json({ ok: false, error: 'Perfil ou catálogo de exercícios ausente.' });
      return;
    }

    const ai = getGeminiClient();

    const goalMap: Record<string, string> = {
      lose_weight: 'Emagrecimento, gasto energético e preservação de massa magra (Pombo Seco)',
      gain_muscle: 'Ganho de massa muscular / hipertrofia (Pombo Grande)',
      get_strong: 'Força máxima, potência e condicionamento (Pombo Forte)',
    };

    const expMap: Record<string, string> = {
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
    };

    const catalogLines = availableExercises
      .slice(0, 190)
      .map(
        (ex) =>
          `${ex.id} | ${ex.name} | Grupo: ${ex.muscleGroup} | Equip: ${ex.equipment} | Estresse: ${(ex.jointStressTags || []).join(',') || 'nenhum'}`
      )
      .join('\n');

    const prompt = `Você é o treinador especialista de elite do PomboFit.
Elabore uma programação de fichas de treino 100% INDIVIDUALIZADA exclusivamente para o usuário abaixo.
NUNCA utilize fichas genéricas ou modelos prontos de outros usuários.

PERFIL INDIVIDUAL DO USUÁRIO:
- Nome: ${profile.displayName || 'Atleta'}
- Objetivo Principal: ${goalMap[profile.goal] || profile.goal}
- Idade: ${profile.age ? `${profile.age} anos` : 'Não informada'}
- Peso / Altura: ${profile.weightKg ? `${profile.weightKg} kg` : '-'} / ${profile.heightCm ? `${profile.heightCm} cm` : '-'}
- Nível de Experiência: ${expMap[profile.experienceLevel] || profile.experienceLevel}
- Frequência Semanal: ${profile.weeklyDays} dias por semana
- Tempo por Sessão: ${profile.sessionDurationMin} minutos
- Equipamentos Disponíveis: ${(profile.availableEquipment || []).join(', ') || 'Academia completa'}
- Músculos Prioritários: ${(profile.priorityMuscles || []).join(', ') || 'Equilíbrio geral'}
- Limitações / Restrições Articulares: ${profile.limitations || 'Nenhuma restrição informada'}
- Divisão de Treino Escolhida: ${profile.workoutSplitType || 'ai_auto'}
- Combinações Musculares Selecionadas (se aplicável): ${(profile.customMuscleCombos || []).join(', ') || 'N/A'}
${performanceSummary ? `- Histórico e Desempenho Recente para Adaptação: ${performanceSummary}` : ''}

REGRAS OBRIGATÓRIAS DE PRESCRIÇÃO:
1. Respeite rigorosamente a Divisão de Treino Escolhida:
   - Se "AB": crie exatamente 2 fichas (Treino A e Treino B).
   - Se "ABC": crie exatamente 3 fichas (Treino A, B e C).
   - Se "ABCD": crie exatamente 4 fichas (Treino A, B, C e D).
   - Se "ABCDE": crie exatamente 5 fichas (Treino A, B, C, D e E).
   - Se "ABCDEF": crie exatamente 6 fichas (Treino A, B, C, D, E e F).
   - Se "full_body": crie 2 fichas Full Body alternadas (Full Body A e Full Body B).
   - Se "upper_lower": crie 4 fichas (Upper A, Lower A, Upper B, Lower B) ou 2 fichas se frequência <= 2 dias.
   - Se "push_pull_legs": crie 3 fichas (Push, Pull, Legs).
   - Se "muscle_groups": crie 1 ficha para cada combinação em Combinações Musculares Selecionadas.
   - Se "ai_auto": escolha a melhor estrutura para ${profile.weeklyDays} dias/semana, nível ${profile.experienceLevel} e objetivo ${profile.goal}.
2. Quantidade de exercícios por ficha: ajuste para caber em ${profile.sessionDurationMin} minutos (ex: 30min = 4 exercícios; 45min = 5 exercícios; 60min = 6 exercícios; 75-90min = 7 exercícios).
3. Séries, repetições e descanso devem refletir o objetivo (${profile.goal}) e o nível (${profile.experienceLevel}):
   - Força (get_strong): 4-6 ou 5-8 reps nos multiarticulares com 120s de descanso; 8-10 reps nos acessórios.
   - Hipertrofia (gain_muscle): 8-12 reps com 60-90s de descanso e foco em controle excêntrico.
   - Emagrecimento (lose_weight): 12-15 reps com 45-60s de descanso e alta densidade metabólica.
4. NUNCA inclua exercícios incompatíveis com os equipamentos disponíveis ou que sobrecarreguem articulações citadas nas limitações (${profile.limitations || 'nenhuma'}).
5. Use EXCLUSIVAMENTE exerciseId existentes na lista oficial abaixo.
6. Distribua os dias da semana (usando apenas abreviações: "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom") de acordo com a frequência semanal (${profile.weeklyDays} dias).

CATÁLOGO OFICIAL DE EXERCÍCIOS POMBOFIT:
${catalogLines}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            workouts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  muscleGroups: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  scheduledDays: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  estimatedDurationMin: { type: Type.INTEGER },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        exerciseId: { type: Type.STRING },
                        sets: { type: Type.INTEGER },
                        reps: { type: Type.STRING },
                        restSeconds: { type: Type.INTEGER },
                        notes: { type: Type.STRING },
                      },
                      required: ['exerciseId', 'sets', 'reps', 'restSeconds', 'notes'],
                    },
                  },
                },
                required: ['name', 'description', 'muscleGroups', 'scheduledDays', 'estimatedDurationMin', 'exercises'],
              },
            },
          },
          required: ['workouts'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json({ ok: true, data: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha ao gerar treinos personalizados pela IA.';
    console.error('AI Workout Generation Error:', message);
    res.status(500).json({ ok: false, error: message });
  }
});

// ============================================================================
// POMBOFIT WEB PUSH API ENDPOINTS
// ============================================================================

// GET /api/push/vapid-public-key: Returns ONLY the public VAPID key (never privateKey)
app.get('/api/push/vapid-public-key', (_req, res) => {
  res.json({
    ok: true,
    publicKey: vapidConfig.publicKey,
  });
});

// GET /api/push/status: Returns subscription & scheduler state isolated by userId
app.get('/api/push/status', (req, res) => {
  const userId = String(req.query.userId || '').trim();
  if (!userId) {
    res.status(400).json({ ok: false, error: 'userId é obrigatório.' });
    return;
  }

  const subs = pushStore.subscriptionsByUser[userId] || [];
  const prefs = getDefaultUserPreferences(userId);
  const activeWorkout = pushStore.activeWorkoutByUser[userId] || null;
  const userJobs = Object.values(pushStore.jobsById)
    .filter((j) => j.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 25);
  const userLogs = pushStore.auditLogs
    .filter((l) => l.userId === userId)
    .slice(-30);

  res.json({
    ok: true,
    userId,
    subscribed: subs.length > 0,
    subscriptionCount: subs.length,
    subscriptions: subs.map((s) => ({
      endpointPreview: s.endpoint.slice(0, 48) + '...',
      endpoint: s.endpoint,
      platform: s.platform || 'unknown',
      updatedAt: s.updatedAt,
    })),
    preferences: prefs,
    activeWorkout,
    scheduledJobs: userJobs,
    recentLogs: userLogs,
  });
});

// POST /api/push/subscribe: Links a PushSubscription strictly to the authenticated userId
app.post('/api/push/subscribe', (req, res) => {
  try {
    const { userId, subscription, platform, userAgent, preferences } = req.body as {
      userId?: string;
      subscription?: {
        endpoint?: string;
        expirationTime?: number | null;
        keys?: { p256dh?: string; auth?: string };
      };
      platform?: string;
      userAgent?: string;
      preferences?: Partial<UserPushPreferences>;
    };

    if (!userId || !userId.trim()) {
      res.status(400).json({ ok: false, error: 'userId é obrigatório para vincular a PushSubscription.' });
      return;
    }

    if (
      !subscription ||
      typeof subscription.endpoint !== 'string' ||
      !subscription.endpoint.trim() ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      res.status(400).json({ ok: false, error: 'Objeto PushSubscription inválido (endpoint/keys ausentes).' });
      return;
    }

    const cleanUserId = userId.trim();
    const cleanEndpoint = subscription.endpoint.trim();

    // Multi-user isolation on shared device: remove this endpoint from any other userId
    for (const [otherUserId, otherSubs] of Object.entries(pushStore.subscriptionsByUser)) {
      if (otherUserId !== cleanUserId && Array.isArray(otherSubs)) {
        const filtered = otherSubs.filter((s) => s.endpoint !== cleanEndpoint);
        if (filtered.length !== otherSubs.length) {
          pushStore.subscriptionsByUser[otherUserId] = filtered;
          appendPushLog(
            otherUserId,
            'SUBSCRIPTION_REASSIGNED',
            `Endpoint desvinculado pois uma nova conta (${cleanUserId}) ativou notificações neste navegador.`
          );
        }
      }
    }

    const userSubs = pushStore.subscriptionsByUser[cleanUserId] || [];
    const existingIdx = userSubs.findIndex((s) => s.endpoint === cleanEndpoint);
    const now = Date.now();

    const record: StoredPushSubscription = {
      endpoint: cleanEndpoint,
      expirationTime: subscription.expirationTime ?? null,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      userId: cleanUserId,
      platform: platform || 'web',
      userAgent: userAgent || '',
      createdAt: existingIdx >= 0 ? userSubs[existingIdx].createdAt : now,
      updatedAt: now,
    };

    if (existingIdx >= 0) {
      userSubs[existingIdx] = record;
    } else {
      userSubs.push(record);
    }
    pushStore.subscriptionsByUser[cleanUserId] = userSubs;

    const currentPrefs = getDefaultUserPreferences(cleanUserId);
    if (preferences && typeof preferences === 'object') {
      Object.assign(currentPrefs, preferences, { userId: cleanUserId, updatedAt: now });
    } else {
      currentPrefs.pushNotificationsEnabled = true;
      currentPrefs.updatedAt = now;
    }

    appendPushLog(cleanUserId, 'SUBSCRIPTION_SAVED', `PushSubscription registrada (${record.platform}). Total dispositivos: ${userSubs.length}`);
    savePushStoreDebounced();

    res.json({
      ok: true,
      userId: cleanUserId,
      subscriptionCount: userSubs.length,
      preferences: currentPrefs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao registrar PushSubscription.';
    res.status(500).json({ ok: false, error: message });
  }
});

// POST /api/push/unsubscribe: Removes a subscription or disables push for userId
app.post('/api/push/unsubscribe', (req, res) => {
  const { userId, endpoint } = req.body as { userId?: string; endpoint?: string };
  if (!userId || !userId.trim()) {
    res.status(400).json({ ok: false, error: 'userId é obrigatório.' });
    return;
  }

  const cleanUserId = userId.trim();
  const prevSubs = pushStore.subscriptionsByUser[cleanUserId] || [];
  if (endpoint) {
    pushStore.subscriptionsByUser[cleanUserId] = prevSubs.filter((s) => s.endpoint !== endpoint);
  } else {
    pushStore.subscriptionsByUser[cleanUserId] = [];
  }

  const remaining = pushStore.subscriptionsByUser[cleanUserId].length;
  if (remaining === 0) {
    cancelUserJobsByCategory(cleanUserId, 'rest_timer', 'Usuário desativou PushSubscription');
    cancelUserJobsByCategory(cleanUserId, 'workout_window', 'Usuário desativou PushSubscription');
  }

  appendPushLog(cleanUserId, 'SUBSCRIPTION_REMOVED', `Inscrição removida. Dispositivos restantes: ${remaining}`);
  savePushStoreDebounced();

  res.json({
    ok: true,
    userId: cleanUserId,
    subscriptionCount: remaining,
  });
});

// POST /api/push/preferences: Updates user notification preferences and reminder schedules
app.post('/api/push/preferences', (req, res) => {
  const { userId, preferences } = req.body as {
    userId?: string;
    preferences?: Partial<UserPushPreferences>;
  };

  if (!userId || !userId.trim()) {
    res.status(400).json({ ok: false, error: 'userId é obrigatório.' });
    return;
  }

  const cleanUserId = userId.trim();
  const current = getDefaultUserPreferences(cleanUserId);

  if (preferences && typeof preferences === 'object') {
    if (typeof preferences.pushNotificationsEnabled === 'boolean') {
      current.pushNotificationsEnabled = preferences.pushNotificationsEnabled;
    }
    if (typeof preferences.notifRestFinished === 'boolean') {
      current.notifRestFinished = preferences.notifRestFinished;
    }
    if (typeof preferences.notifWorkoutCompletion === 'boolean') {
      current.notifWorkoutCompletion = preferences.notifWorkoutCompletion;
    }
    if (typeof preferences.notifWorkoutReminder === 'boolean') {
      current.notifWorkoutReminder = preferences.notifWorkoutReminder;
    }
    if (typeof preferences.workoutReminderTime === 'string' && /^\d{2}:\d{2}$/.test(preferences.workoutReminderTime)) {
      current.workoutReminderTime = preferences.workoutReminderTime;
    }
    if (typeof preferences.notifWaterReminder === 'boolean') {
      current.notifWaterReminder = preferences.notifWaterReminder;
    }
    if (typeof preferences.waterReminderIntervalMin === 'number') {
      current.waterReminderIntervalMin = Math.max(15, Math.min(480, preferences.waterReminderIntervalMin));
    }
    if (Array.isArray(preferences.customReminders)) {
      current.customReminders = preferences.customReminders.slice(0, 20);
    }
    if (typeof preferences.timezoneOffsetMinutes === 'number') {
      current.timezoneOffsetMinutes = preferences.timezoneOffsetMinutes;
    }
    current.updatedAt = Date.now();
  }

  if (!current.pushNotificationsEnabled || !current.notifRestFinished) {
    cancelUserJobsByCategory(cleanUserId, 'rest_timer', 'Preferência de descanso desativada');
  }
  if (!current.pushNotificationsEnabled || !current.notifWorkoutCompletion) {
    cancelUserJobsByCategory(cleanUserId, 'workout_window', 'Preferência de conclusão de treino desativada');
  }

  appendPushLog(cleanUserId, 'PREFERENCES_UPDATED', `Preferências de notificação sincronizadas no servidor.`);
  savePushStoreDebounced();

  res.json({
    ok: true,
    userId: cleanUserId,
    preferences: current,
  });
});

// POST /api/push/rest-timer/schedule: Schedules a server-dispatched Push for rest completion
app.post('/api/push/rest-timer/schedule', (req, res) => {
  const {
    userId,
    targetTimestamp,
    restSeconds,
    exerciseName,
    nextSetNumber,
    workoutId,
    workoutName,
  } = req.body as {
    userId?: string;
    targetTimestamp?: number;
    restSeconds?: number;
    exerciseName?: string;
    nextSetNumber?: number;
    workoutId?: string;
    workoutName?: string;
  };

  if (!userId || !userId.trim()) {
    res.status(400).json({ ok: false, error: 'userId é obrigatório.' });
    return;
  }

  const cleanUserId = userId.trim();
  const prefs = getDefaultUserPreferences(cleanUserId);

  // Always cancel any existing rest timer for this user to avoid duplicates or stale notifications
  const cancelledPrevious = cancelUserJobsByCategory(cleanUserId, 'rest_timer', 'Novo descanso iniciado');

  if (!prefs.pushNotificationsEnabled || !prefs.notifRestFinished) {
    res.json({
      ok: true,
      scheduled: false,
      reason: 'Notificações de descanso desativadas nas preferências do usuário.',
      cancelledPrevious,
    });
    return;
  }

  const now = Date.now();
  const computedTarget =
    typeof targetTimestamp === 'number' && targetTimestamp > now
      ? targetTimestamp
      : now + Math.max(1, Number(restSeconds) || 60) * 1000;

  const jobId = `rest-${cleanUserId}-${computedTarget}`;
  const setInfo = exerciseName
    ? `Hora da ${nextSetNumber ? `${nextSetNumber}ª ` : ''}série em ${exerciseName}! O Pombo está pronto! 🕊️💪`
    : 'Hora da próxima série com foco total! O Pombo está pronto! 🕊️💪';

  const job: ScheduledPushJob = {
    id: jobId,
    userId: cleanUserId,
    category: 'rest_timer',
    targetTimestamp: computedTarget,
    status: 'scheduled',
    workoutId,
    workoutName,
    payload: {
      notificationId: jobId,
      title: 'PomboFit — Seu descanso acabou!',
      body: setInfo,
      tag: `pombofit-rest-finished-${cleanUserId}`,
      url: '/?tab=workouts&resume=1',
      category: 'rest_timer',
      icon: '/assets/mascots/pombo_hero_bust.png',
      badge: '/assets/mascots/pombo_hero_bust.png',
      vibrate: [300, 150, 300, 150, 500],
      targetTimestamp: computedTarget,
    },
    createdAt: now,
  };

  pushStore.jobsById[jobId] = job;
  armJobTimer(job);
  appendPushLog(
    cleanUserId,
    'REST_TIMER_SCHEDULED',
    `Descanso agendado para ${new Date(computedTarget).toISOString()} (${Math.round((computedTarget - now) / 1000)}s).`,
    'rest_timer'
  );
  savePushStoreDebounced();

  res.json({
    ok: true,
    scheduled: true,
    jobId,
    targetTimestamp: computedTarget,
    cancelledPrevious,
  });
});

// POST /api/push/rest-timer/cancel: Cancels any pending rest notification for userId
app.post('/api/push/rest-timer/cancel', (req, res) => {
  const { userId, reason } = req.body as { userId?: string; reason?: string };
  if (!userId || !userId.trim()) {
    res.status(400).json({ ok: false, error: 'userId é obrigatório.' });
    return;
  }

  const cleanUserId = userId.trim();
  const cancelledCount = cancelUserJobsByCategory(
    cleanUserId,
    'rest_timer',
    reason || 'Cancelado manualmente pelo usuário'
  );

  res.json({
    ok: true,
    userId: cleanUserId,
    cancelledCount,
  });
});

// POST /api/push/workout-session/sync: Synchronizes workout start, completion, or cancellation
app.post('/api/push/workout-session/sync', (req, res) => {
  const {
    userId,
    action,
    workoutId,
    workoutName,
    estimatedDurationMin,
    targetTimestamp,
  } = req.body as {
    userId?: string;
    action?: 'start' | 'complete' | 'cancel';
    workoutId?: string;
    workoutName?: string;
    estimatedDurationMin?: number;
    targetTimestamp?: number;
  };

  if (!userId || !userId.trim() || !action) {
    res.status(400).json({ ok: false, error: 'userId e action são obrigatórios.' });
    return;
  }

  const cleanUserId = userId.trim();
  const now = Date.now();

  if (action === 'complete' || action === 'cancel') {
    const cancelledWorkoutJobs = cancelUserJobsByCategory(
      cleanUserId,
      'workout_window',
      action === 'complete' ? 'Treino concluído pelo usuário' : 'Treino cancelado pelo usuário'
    );
    const cancelledRestJobs = cancelUserJobsByCategory(
      cleanUserId,
      'rest_timer',
      action === 'complete' ? 'Treino concluído' : 'Treino cancelado'
    );

    if (pushStore.activeWorkoutByUser[cleanUserId]) {
      pushStore.activeWorkoutByUser[cleanUserId].status = action === 'complete' ? 'completed' : 'cancelled';
      pushStore.activeWorkoutByUser[cleanUserId].updatedAt = now;
    }

    appendPushLog(
      cleanUserId,
      action === 'complete' ? 'WORKOUT_COMPLETED_SYNC' : 'WORKOUT_CANCELLED_SYNC',
      `Treino ${action === 'complete' ? 'concluído' : 'cancelado'}. Agendamentos pendentes cancelados (${cancelledWorkoutJobs} janela, ${cancelledRestJobs} descanso).`,
      'workout_window'
    );
    savePushStoreDebounced();

    res.json({
      ok: true,
      userId: cleanUserId,
      status: action === 'complete' ? 'completed' : 'cancelled',
      cancelledWorkoutJobs,
      cancelledRestJobs,
    });
    return;
  }

  // action === 'start'
  cancelUserJobsByCategory(cleanUserId, 'workout_window', 'Novo treino iniciado');

  const durationMin = Math.max(1, Math.min(240, Number(estimatedDurationMin) || 50));
  const computedEnd =
    typeof targetTimestamp === 'number' && targetTimestamp > now
      ? targetTimestamp
      : now + durationMin * 60 * 1000;

  const wId = workoutId || `workout-${now}`;
  const wName = workoutName || 'Treino do Dia';
  const jobId = `workout-win-${cleanUserId}-${computedEnd}`;

  pushStore.activeWorkoutByUser[cleanUserId] = {
    userId: cleanUserId,
    workoutId: wId,
    workoutName: wName,
    startedAt: now,
    estimatedDurationMin: durationMin,
    estimatedEndTimestamp: computedEnd,
    status: 'in_progress',
    scheduledJobId: jobId,
    updatedAt: now,
  };

  const prefs = getDefaultUserPreferences(cleanUserId);
  let scheduled = false;

  if (prefs.pushNotificationsEnabled && prefs.notifWorkoutCompletion) {
    // CRITICAL REQUIREMENT: Never claim the workout was completed if the user hasn't finished it!
    // Instead, ask if they finished or remind them to register/conclude their session in PomboFit.
    const job: ScheduledPushJob = {
      id: jobId,
      userId: cleanUserId,
      category: 'workout_window',
      targetTimestamp: computedEnd,
      status: 'scheduled',
      workoutId: wId,
      workoutName: wName,
      payload: {
        notificationId: jobId,
        title: `PomboFit — Como está o ${wName}? 🕊️`,
        body: `O tempo estimado de ${durationMin} min chegou! Já terminou suas séries? Toque para salvar e concluir seu treino no PomboFit.`,
        tag: `pombofit-workout-window-${cleanUserId}`,
        url: '/?tab=workouts&resume=1',
        category: 'workout_window',
        icon: '/assets/mascots/pombo_hero_bust.png',
        badge: '/assets/mascots/pombo_hero_bust.png',
        vibrate: [250, 120, 250],
        targetTimestamp: computedEnd,
      },
      createdAt: now,
    };

    pushStore.jobsById[jobId] = job;
    armJobTimer(job);
    scheduled = true;
    appendPushLog(
      cleanUserId,
      'WORKOUT_WINDOW_SCHEDULED',
      `Lembrete de término estimado para "${wName}" agendado para ${new Date(computedEnd).toISOString()}.`,
      'workout_window'
    );
  }

  savePushStoreDebounced();
  res.json({
    ok: true,
    userId: cleanUserId,
    status: 'in_progress',
    scheduled,
    jobId: scheduled ? jobId : null,
    estimatedEndTimestamp: computedEnd,
  });
});

// POST /api/push/test: Sends an immediate or delayed real Web Push notification to test locked screen / background
app.post('/api/push/test', async (req, res) => {
  const { userId, delaySeconds, title, body } = req.body as {
    userId?: string;
    delaySeconds?: number;
    title?: string;
    body?: string;
  };

  if (!userId || !userId.trim()) {
    res.status(400).json({ ok: false, error: 'userId é obrigatório.' });
    return;
  }

  const cleanUserId = userId.trim();
  const subs = pushStore.subscriptionsByUser[cleanUserId] || [];
  if (subs.length === 0) {
    res.status(400).json({
      ok: false,
      error: 'Nenhuma inscrição Push ativa encontrada para este usuário. Ative as notificações primeiro.',
      subscribed: false,
    });
    return;
  }

  const delaySec = Math.max(0, Math.min(300, Number(delaySeconds) || 0));
  const now = Date.now();
  const targetTimestamp = now + delaySec * 1000;
  const jobId = `test-${cleanUserId}-${now}`;

  const payload: ScheduledPushJob['payload'] = {
    notificationId: jobId,
    title: title || 'PomboFit — Teste de Push Real 🕊️🔔',
    body:
      body ||
      (delaySec > 0
        ? `Notificação Push enviada pelo servidor após ${delaySec}s com tela bloqueada/segundo plano!`
        : 'Notificação Push real recebida com sucesso pelo seu dispositivo!'),
    tag: `pombofit-test-${cleanUserId}-${now}`,
    url: '/?tab=profile',
    category: 'test',
    icon: '/assets/mascots/pombo_hero_bust.png',
    badge: '/assets/mascots/pombo_hero_bust.png',
    vibrate: [300, 150, 300, 150, 500],
    targetTimestamp,
  };

  if (delaySec === 0) {
    const summary = await dispatchWebPushToUser(cleanUserId, payload);
    const job: ScheduledPushJob = {
      id: jobId,
      userId: cleanUserId,
      category: 'test',
      targetTimestamp: now,
      status: summary.delivered > 0 ? 'sent' : 'failed',
      payload,
      createdAt: now,
      dispatchedAt: Date.now(),
      deliverySummary: summary,
    };
    pushStore.jobsById[jobId] = job;
    savePushStoreDebounced();

    res.json({
      ok: summary.delivered > 0,
      delayed: false,
      jobId,
      deliverySummary: summary,
    });
    return;
  }

  const job: ScheduledPushJob = {
    id: jobId,
    userId: cleanUserId,
    category: 'test',
    targetTimestamp,
    status: 'scheduled',
    payload,
    createdAt: now,
  };
  pushStore.jobsById[jobId] = job;
  armJobTimer(job);
  appendPushLog(cleanUserId, 'TEST_PUSH_SCHEDULED', `Push de teste agendado para daqui a ${delaySec}s.`, 'test');
  savePushStoreDebounced();

  res.json({
    ok: true,
    delayed: true,
    delaySeconds: delaySec,
    jobId,
    targetTimestamp,
  });
});

// Ensure /pombo-notification-sw.js is always served fresh without browser caching
app.use('/pombo-notification-sw.js', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Service-Worker-Allowed', '/');
  next();
});

// Self-cleaning Service Worker endpoint to clear any stale Workbox precache in user browsers
app.get(['/sw.js', '/registerSW.js'], (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.send(`
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        clients.forEach((client) => {
          if ('navigate' in client) {
            client.navigate(client.url);
          }
        });
      })
  );
});
`);
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const httpServer = createHttpServer(app);

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`PomboFit server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();