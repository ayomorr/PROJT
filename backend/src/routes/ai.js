// AI coach routes — all calls go through the backend so the API key is never exposed.
import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { validate, required } from '../middleware/validate.js';
import { guardRespond, buildContext, validateStructured, detectCrisis, detectDistress } from '../services/aiGuard.js';
import { HttpError } from '../middleware/errors.js';

const router = Router();
router.use(authRequired);

// Free-form chat with Guard (used by the Coach page).
router.post(
  '/chat',
  validate({ text: required }),
  (req, res, next) => {
    try {
      const text = String(req.body.text || '').trim().slice(0, 1000);
      if (!text) throw new HttpError(400, 'Say something first — Guard is listening.');
      const history = Array.isArray(req.body.history) ? req.body.history.slice(-12) : [];
      guardRespond({ userId: req.user.id, text, history }).then(
        (result) => {
          res.json({
            reply: result.reply,
            mode: result.mode,
            safety: Boolean(result.reply.safety),
            resources: result.reply.resources || undefined,
          });
        },
        (err) => next(err),
      );
    } catch (err) {
      next(err);
    }
  },
);

// Structured "pattern" response used by the "I want to scroll" flow.
router.post(
  '/pattern',
  validate({ text: required }),
  (req, res, next) => {
    const text = String(req.body.text || '').trim().slice(0, 500);
    const ctx = buildContext(req.user.id);

    if (detectCrisis(text)) return res.json({ structured: structuredOf(ctx, 'gentle'), safety: true });
    if (detectDistress(text)) return res.json({ structured: structuredOf(ctx, 'gentle'), notes: 'consider-support' });

    const plan = scrollIntentPlan(text, ctx);
    res.json({ structured: validateStructured(plan), safety: false });
  },
);

// A tiny purpose-built engine for the "I want to scroll" flow. It never shames the
// user and always converts unconscious scrolls into intentional, time-boxed ones.
function scrollIntentPlan(text, ctx) {
  const t = (text || '').toLowerCase();
  const top = ctx.topPlatform || 'social media';

  if (t.includes('bored')) {
    return {
      message: 'Boredom is a valid feeling — and social media is only one answer for it.',
      insight: 'Boredom passes faster when you give your hands something to do.',
      suggestedAction: 'Try the 2-minute vs 5-minute "instead of scrolling" ideas below.',
      tone: 'supportive',
    };
  }
  if (t.includes('stress')) {
    return {
      message: 'When we are stressed, a quick scroll feels like relief. The tension usually comes right back, though.',
      insight: 'A 2-minute breathing reset releases more tension than 2 minutes of feed.',
      suggestedAction: 'Try the 2-minute reset instead, then decide if you really want to open the app.',
      tone: 'gentle',
    };
  }
  if (t.includes('avoid') || t.includes('postpone') || t.includes('procrast')) {
    return {
      message: 'That makes sense. The task is heavy and the feed is light.',
      insight: 'Avoidance shrinks when you split the task into one tiny next step.',
      suggestedAction: 'Do just the first 2 minutes of that task. If it is awful after that, the feed will still be there.',
      tone: 'supportive',
    };
  }
  if (t.includes('news')) {
    return {
      message: 'Staying informed matters. Being over-informed is what tires us out.',
      insight: 'One fixed news window a day fills the need without the endless refresh.',
      suggestedAction: 'Set a 10-minute news timer and stick to one source during it.',
      tone: 'supportive',
    };
  }
  if (t.includes('connection') || t.includes('friend') || t.includes('someone')) {
    return {
      message: 'Connection is a real need. The feed is a weak substitute for an actual person.',
      insight: `Most connection urges are satisfied by one real exchange.`,
      suggestedAction: 'Message one specific person you have been meaning to talk to.',
      tone: 'encouraging',
    };
  }
  if (t.includes('entertainment')) {
    return {
      message: 'Entertainment is worth having. Giving it a time box makes it guilt-free.',
      insight: 'A planned 15 minutes feels like entertainment; an endless hour feels like a fog.',
      suggestedAction: 'Set a 15-minute timer, pick what you will watch, and enjoy it fully.',
      tone: 'playful',
    };
  }
  if (t.includes('check') || t.includes('notification') || t.includes('message')) {
    return {
      message: "Let's make it intentional. What exactly do you want to check?",
      insight: 'Unintentional checking is the biggest time leak of all.',
      suggestedAction: 'Type your exact goal, then set a 5-minute timer and do only that.',
      tone: 'supportive',
    };
  }
  return {
    message: `Let's make this scroll intentional. What are you looking for right now?`,
    insight: `Most sessions on ${top} start without a goal. A goal turns scrolling into a decision.`,
    suggestedAction: 'Pick one of the options above, or set a 5-minute timer before you open the app.',
    tone: 'supportive',
  };
}

function structuredOf(ctx, tone) {
  return validateStructured({
    message: 'It sounds like this goes deeper than apps. You deserve real support.',
    insight: "I'm here for digital wellbeing, not as a substitute for professional care.",
    suggestedAction: 'Reach out to your support network or a qualified professional.',
    tone,
  });
}

export default router;