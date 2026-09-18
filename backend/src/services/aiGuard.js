// Guard — the AI personal digital-wellbeing coach.
//
// Product rules (from the spec):
//   - Never diagnose addiction or mental-health conditions.
//   - Never make medical claims, shame users, or pretend to be a therapist.
//   - If serious distress / self-harm is mentioned → safety-oriented response that
//     encourages contacting qualified professional or emergency support.
//   - The AI key never leaves the server. If no AI_API_KEY is set, Guard falls back
//     to a built-in offline coach that still answers from the user's own stats.
import { config } from '../config.js';
import { computeWeekly, detectPattern } from './insights.js';

// ------------------------------------------------------------------ safety

const CRISIS_PATTERNS = [
  /suicide/i, /suicid\w+\b/i, /self[- ]?harm/i, /kill myself/i, /hurt myself/i,
  /end my life/i, /don'?t want to (be alive|live)/i, /want to die/i, /no reason to live/i,
];

const SUPPORT_PATTERNS = [
  /feel(ing)? (so )?depress/i, /i'?m depress/i, /anxious|anxiety/i,
  /overwhelm/i, /panic/i, /i can'?t cope/i,
];

export function detectCrisis(text) {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

export function detectDistress(text) {
  return SUPPORT_PATTERNS.some((re) => re.test(text));
}

const SAFETY_RESPONSE = {
  message:
    "Thank you for telling me that. You matter, and you don't have to carry this alone. " +
    "ScrollGuard is a digital-wellbeing coach, not a therapist, and I can't give you the care this deserves. " +
    'Please reach out to someone who can truly help right now.',
  insight: 'What you described sounds serious and painful.',
  suggestedAction: 'Contact a crisis line or a trusted professional today.',
  tone: 'gentle',
  safety: true,
  resources: [
    { label: 'Emergency services (local)', value: 'Call your local emergency number (e.g. 911 / 112 / 999)' },
    { label: 'Crisis Text Line', value: 'Text HOME to 741741 (US & Canada)' },
    { label: 'Find a helpline', value: 'findahelpline.com' },
    { label: '988 Suicide & Crisis Lifeline', value: 'Call or text 988 (US)' },
  ],
};

const SUPPORT_RESPONSE = {
  message:
    "That sounds really heavy. Please know that how you feel is valid — and that a wellbeing " +
    'app isn\'t the right place to work through serious emotional pain. A professional can ' +
    'help you figure out what is going on, and there is absolutely no shame in asking.',
  insight: "I can't and won't diagnose what you're feeling.",
  suggestedAction: 'Consider talking with a mental-health professional or support service.',
  tone: 'gentle',
  safety: false,
  resources: [
    { label: 'Find a therapist', value: 'psychologytoday.com / your local directory' },
    { label: 'Crisis help', value: 'findahelpline.com' },
    { label: 'Emergency', value: 'Call your local emergency number if you are in danger' },
  ],
};

// ------------------------------------------------------------------ context

// The minimal, privacy-respecting summary the coach is allowed to know about the user.
export function buildContext(userId) {
  const weekly = computeWeekly(userId);
  const pattern = detectPattern(userId);
  const top = weekly.platformRank[0];
  return {
    weeklyMinutes: weekly.totalMinutes,
    deltaMinutes: weekly.deltaMinutes,
    sessions: weekly.sessions,
    avgSessionMinutes: Math.round(weekly.avgSessionSeconds / 60),
    longestSessionMinutes: Math.round(weekly.longestSession / 60),
    mostActiveHour: weekly.mostActiveHour,
    topPlatform: top ? top.platformId : null,
    topPlatformMinutes: top ? top.totalMinutes : 0,
    patternText: pattern.text,
  };
}

// ------------------------------------------------------------------ offline coach
// A tiny, honest rule-based coach. It gives genuinely useful, data-driven replies for
// the common questions without needing any API key.

export function offlineCoach(ctx, text) {
  const t = text.toLowerCase();

  if (t.includes('night') || t.includes('sleep') || t.includes('before bed') || t.includes('midnight') || t.includes('moon')) {
    const hour = ctx.mostActiveHour;
    return {
      message:
        `Your data shows most of your longer sessions happen in the evening (around ${formatHour(hour)}). ` +
        'A gentle wind-down reminder about 30 minutes before you usually start could help you close the day on your own terms.',
      insight: 'Night-time scrolling is the most common pattern we see.',
      suggestedAction: 'Set a quiet-time window in your limits to soften reminders after your chosen hour.',
      tone: 'supportive',
    };
  }

  if (t.includes('how did i do') || t.includes('this week') || t.includes('week recap') || t.includes('progress') || t.includes('summar')) {
    const trend =
      ctx.deltaMinutes <= -10
        ? `You reduced your average daily scrolling by ${Math.round(Math.abs(ctx.deltaMinutes) / 7)} minutes compared with last week.`
        : ctx.deltaMinutes > 10
          ? `Your weekly time went up by ${ctx.deltaMinutes} minutes. That's just information, not a judgment — and you decide what to do with it.`
          : `Your weekly time is about the same as last week, which means your habits are stabilising.`;
    return {
      message:
        `${trend} This week you logged ${ctx.weeklyMinutes} minutes across ${ctx.sessions} sessions, ` +
        `with your longest session around ${ctx.longestSessionMinutes} minutes.`,
      insight:
        ctx.topPlatform
          ? `${ctx.topPlatform} took the biggest share of your attention this week.`
          : 'No single platform dominated — nicely balanced.',
      suggestedAction:
        'Pick one small win for next week, like one intentional session per day or a 10-minute screen break.',
      tone: 'encouraging',
    };
  }

  if (t.includes('feel like scrolling') || t.includes('urge') || t.includes('what should i do') || t.includes('bored') || t.includes('stress')) {
    return {
      message:
        'Before you open the app, try a 5-minute alternative first: walk around, stretch, ' +
        'reply to one important message, read one page, or simply put your phone down for two minutes.',
      insight: 'Most openings are triggered by boredom or a short stressful moment, not a real need.',
      suggestedAction: 'Use the "I want to scroll" button to make the next opening intentional.',
      tone: 'supportive',
    };
  }

  if (t.includes('too much') || t.includes('addict') || t.includes('out of control') || t.includes('wasting')) {
    return {
      message:
        "I won't label you, and you're not broken. What your data shows is a pattern — patterns can change. " +
        `Right now you're averaging around ${ctx.avgSessionMinutes} minutes per session. Small, kind adjustments add up faster than dramatic ones.`,
      insight: `Longest session this week: ${ctx.longestSessionMinutes} minutes. Most active: ${formatHour(ctx.mostActiveHour)}.`,
      suggestedAction: 'Start with one daily limit for your most-used platform, then build from there.',
      tone: 'gentle',
    };
  }

  if (t.includes('break') || t.includes('reset') || t.includes('pause')) {
    return {
      message:
        'A short reset does a lot. Two minutes of breathing, a stretch, or looking at something 20 feet away are some of the most effective resets.',
      insight: 'Your attention recovers fastest in the first two minutes of a screen break.',
      suggestedAction: 'Start the 2-minute reset from the reminder card when it appears.',
      tone: 'supportive',
    };
  }

  if (t.includes('attention score') || t.includes('score')) {
    return {
      message:
        `Your current attention score is based on your last week of data: ${ctx.weeklyMinutes} minutes and ${ctx.sessions} sessions. ` +
        'It improves most from two things: staying under your limit, and taking breaks during long sessions.',
      insight: 'The score is a personal signal, not a medical or psychological diagnosis.',
      suggestedAction: 'Set one daily limit and complete today\'s challenge to see it move.',
      tone: 'encouraging',
    };
  }

  // catch-all
  const pattern = detectPatternFromCtx(ctx);
  return {
    message: pattern,
    insight:
      ctx.topPlatform
        ? `${ctx.topPlatform} is where most of your attention goes right now.`
        : 'Your attention looks well distributed.',
    suggestedAction: 'Try today\'s challenge, or ask me about limits, breaks, or night scrolling.',
    tone: 'supportive',
  };
}

function detectPatternFromCtx(ctx) {
  const weekday = formatHour(ctx.mostActiveHour);
  if (ctx.longestSessionMinutes > 40) {
    return `One thing I noticed: your longest sessions stretch past ${ctx.longestSessionMinutes} minutes, usually starting around ${weekday}. That's a great place to add one gentle check-in.`;
  }
  return `Here's one observation: most of your scrolling happens around ${weekday}. Consider setting a wind-down reminder shortly before that.`;
}

function formatHour(hour24) {
  const h = Math.floor(((hour24 || 0) % 24 + 24) % 24);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${suffix}`;
}

// ------------------------------------------------------------------ LLM

const SAFETY_SYSTEM_PROMPT = [
  'You are Guard, a warm, supportive, non-judgmental digital-wellbeing coach built into ScrollGuard.',
  'Rules you must follow:',
  '- NEVER diagnose addiction, depression, anxiety, or any mental-health condition.',
  '- NEVER make medical claims. NEVER shame or guilt the user.',
  '- You are NOT a therapist. Keep replies brief (2-4 sentences), calm, and practical.',
  '- Be honest about what the data shows, and always frame change as a choice the user makes.',
  '- The user is sovereign: ScrollGuard helps them scroll intentionally, not stop social media entirely.',
  '- Use the tone word "supportive", "encouraging", or "gentle" appropriately.',
  '- Respond in the user\'s language.',
  '- Return ONLY valid JSON: {"message":"...","insight":"...","suggestedAction":"...","tone":"..."}',
].join('\n');

export async function callLLM(context, userText, history = []) {
  if (!config.ai.apiKey) return null;
  const messages = [
    { role: 'system', content: SAFETY_SYSTEM_PROMPT },
    {
      role: 'system',
      content: `Context (aggregated, privacy-safe): ${safeJson(context)}`,
    },
    ...(Array.isArray(history) ? history.slice(-8) : []),
    { role: 'user', content: userText },
  ];
  const url = `${config.ai.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.ai.apiKey}`,
    },
    body: JSON.stringify({ model: config.ai.model, messages, temperature: 0.7, response_format: { type: 'json_object' } }),
  });
  if (!res.ok) throw new Error(`AI upstream error ${res.status}`);
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content || '';
  return parseStructured(content);
}

// ------------------------------------------------------------------ validator

export function parseStructured(text) {
  try {
    const obj = JSON.parse(text);
    if (typeof obj === 'object' && obj !== null) return obj;
  } catch {
    /* not JSON — fall through to fallback below */
  }
  // Some models wrap JSON in markdown fences.
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const obj = JSON.parse(match[0]);
      if (typeof obj === 'object' && obj !== null) return obj;
    } catch {
      /* ignore */
    }
  }
  return null;
}

// Ensures the final object matches the contract, filling any blanks safely.
export function validateStructured(input) {
  const base = input || {};
  const message = String(base.message || '').trim().slice(0, 600);
  const insight = String(base.insight || '').trim().slice(0, 300);
  const suggestedAction = String(base.suggestedAction || '').trim().slice(0, 300);
  const tone = ['supportive', 'encouraging', 'gentle', 'playful'].includes(base.tone) ? base.tone : 'supportive';
  if (!message) return null;
  return { message, insight, suggestedAction, tone, safety: Boolean(base.safety) };
}

// ------------------------------------------------------------------ main entry

// Handles a user message + optional chat history. Always returns a valid structured
// reply. `userId` may be null (landing-page preview) → generic context.
export async function guardRespond({ userId, text, history = [] }) {
  const ctx = userId ? buildContext(userId) : null;

  if (detectCrisis(text)) {
    return { reply: SAFETY_RESPONSE, mode: 'safety', context: ctx };
  }
  if (detectDistress(text)) {
    return { reply: SUPPORT_RESPONSE, mode: 'distress', context: ctx };
  }

  // Prefer the LLM when configured…
  try {
    const llmResult = await callLLM(ctx, text, history);
    if (llmResult) {
      const validated = validateStructured(llmResult);
      if (validated) return { reply: validated, mode: 'llm', context: ctx };
    }
  } catch (err) {
    console.warn('[scrollguard:ai] upstream unavailable, using offline coach:', err.message);
  }

  // …otherwise fall back safely to the offline coach.
  return { reply: validateStructured(offlineCoach(ctx, text)), mode: 'offline', context: ctx };
}

function safeJson(obj) {
  try {
    return JSON.stringify(obj || {});
  } catch {
    return '{}';
  }
}