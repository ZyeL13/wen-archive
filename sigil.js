/**
 * sigil.js
 * Constants, configuration, and sacred parameters
 * 
 * All numbers, timings, and thresholds live here
 */

export const SIGILS = {
  // Visual
  COLORS: {
    PARCHMENT: '#F4EFE3',
    INK: '#3E3A32',
    FADED_INK: '#8B7355',
    BORDER: '#D4C5B0',
    SCROLL_LIGHT: '#FAF7F0',
    SCROLL_DARK: '#F0EBE0'
  },

  // Animation timings (ms)
  TIMING: {
    TEAR_DRAG: 300,
    SHATTER_DURATION: 1200,
    RESULT_MANIFEST: 1200,
    RESULT_DELAY: 600,
    CULTIVATION_FADE: 500,
    CULTIVATION_DELAY: 1800
  },

  // Interaction thresholds
  TEAR_THRESHOLD: 50, // pixels of drag needed to tear
  
  // Glass shatter parameters
  SHATTER: {
    SHARD_COUNT: 30,
    SHARD_MIN_SIZE: 3,
    SHARD_MAX_SIZE: 8,
    GRAVITY: 0.15,
    AIR_RESISTANCE: 0.98,
    MAX_FRAMES: 120,
    DECAY_MIN: 0.01,
    DECAY_MAX: 0.02
  },

  // API endpoints (replace with your actual endpoints)
  API_BASE: process.env.API_BASE || 'https://your-api.vercel.app/api',
  
  // Farcaster
  FARCASTER: {
    CLIENT_ID: process.env.FARCASTER_CLIENT_ID || 'your_client_id',
    REDIRECT_URI: process.env.REDIRECT_URI || window.location.origin
  },

  // Feature flags
  FEATURES: {
    SOUND_ENABLED: false,
    DARK_MODE: false,
    HISTORY_EXPORT: false,
    LLM_SUMMARY: false // for v0.5+
  },

  // Copy (minimal, only what's necessary)
  COPY: {
    LANDING_TITLE: 'WEN',
    LANDING_TAGLINE: 'one scroll\none day\none tear',
    LANDING_CTA: 'enter',
    
    SCROLL_INSTRUCTION: 'drag to tear',
    ALREADY_TORN: 'you have not torn today',
    
    HISTORY_HEADER: 'entries recorded',
    HISTORY_FOOTER: 'continuity intact',
    
    ABOUT_LINE_1: 'one scroll. one day. one tear.',
    ABOUT_LINE_2: 'presence recorded.\nmeaning is yours.',
    ABOUT_LINE_3: 'nothing promised.\nnothing owed.',
    
    RETURN_CTA: 'return tomorrow'
  },

  // Cultivation level display (only if shown)
  CULTIVATION_LABELS: [
    'initiatus',      // level 1
    'observans',      // level 2
    'persistens',     // level 3
    'devotus',        // level 4
    'immersus',       // level 5
    'transcendens',   // level 6
    'illuminatus',    // level 7
    'perfectus',      // level 8
    'aeternus',       // level 9
    'infinitus'       // level 10
  ],

  // Screen IDs
  SCREENS: {
    LANDING: 'landing',
    SCROLL_INTACT: 'scroll-intact',
    SCROLL_TORN: 'scroll-torn',
    HISTORY: 'history',
    ABOUT: 'about'
  }
};

// Validation helpers
export function validateConfig() {
  if (!SIGILS.API_BASE.startsWith('http')) {
    console.warn('API_BASE is not set correctly');
  }
  
  if (!SIGILS.FARCASTER.CLIENT_ID || SIGILS.FARCASTER.CLIENT_ID === 'your_client_id') {
    console.warn('Farcaster CLIENT_ID is not configured');
  }
}

// Environment check
export function isDevelopment() {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
}

export function isProduction() {
  return !isDevelopment();
}

// Logging helper (only logs in dev)
export function log(...args) {
  if (isDevelopment()) {
    console.log('[WEN]', ...args);
  }
}

export function logError(...args) {
  console.error('[WEN ERROR]', ...args);
}
