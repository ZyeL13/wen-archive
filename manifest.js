/**
 * manifest.js
 * Generates tear results based on weighted probability
 * 
 * Responsibilities:
 * - Determine what appears when scroll is torn
 * - Apply cultivation level weighting (subtle, background)
 * - No gacha, no surprise mechanics
 * - Emptiness is valid data
 */

import { getCultivationLevel, getTotalEntries } from './memory.js';
import { SIGILS } from './sigil.js';

/**
 * Result types and their base weights
 */
const RESULT_WEIGHTS = {
  INCREMENT: 40,   // +1
  NEUTRAL: 30,     // 0
  EMPTY: 20,       // empty / ∅
  MARKER: 10       // day X
};

/**
 * Generate a result based on current state
 * @param {number} day - Current day number
 * @returns {Object} { type, display, value }
 */
export function generateResult(day) {
  const level = getCultivationLevel();
  const total = getTotalEntries();
  
  // Adjust weights based on cultivation (very subtle)
  const weights = adjustWeights(RESULT_WEIGHTS, level);
  
  // Random selection based on weights
  const resultType = weightedRandom(weights);
  
  // Format result for display
  return formatResult(resultType, day, level);
}

/**
 * Adjust weights based on cultivation level
 * Higher level = slightly more "meaningful" results, but not guaranteed
 * @param {Object} baseWeights
 * @param {number} level
 * @returns {Object} adjusted weights
 */
function adjustWeights(baseWeights, level) {
  // Cultivation has minimal impact (5% per level, capped)
  // Level 1: base weights
  // Level 2: +5% increment, -5% empty
  // Level 3: +10% increment, -10% empty
  // Level 5+: capped at +20% increment, -20% empty
  
  const adjustment = Math.min((level - 1) * 5, 20);
  
  return {
    INCREMENT: baseWeights.INCREMENT + adjustment,
    NEUTRAL: baseWeights.NEUTRAL,
    EMPTY: Math.max(baseWeights.EMPTY - adjustment, 5), // min 5%
    MARKER: baseWeights.MARKER
  };
}

/**
 * Weighted random selection
 * @param {Object} weights - { key: weight, ... }
 * @returns {string} selected key
 */
function weightedRandom(weights) {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * total;
  
  for (const [key, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return key;
    }
  }
  
  // Fallback (should never reach)
  return 'NEUTRAL';
}

/**
 * Format result for display
 * @param {string} type - Result type
 * @param {number} day - Current day
 * @param {number} level - Cultivation level
 * @returns {Object} { type, display, value }
 */
function formatResult(type, day, level) {
  switch (type) {
    case 'INCREMENT':
      return {
        type: 'increment',
        display: '+1',
        value: 1,
        entry_type: 'torn'
      };
    
    case 'NEUTRAL':
      return {
        type: 'neutral',
        display: '0',
        value: 0,
        entry_type: 'torn'
      };
    
    case 'EMPTY':
      // Randomly choose empty representation
      const emptySymbols = ['empty', '∅', '—', '・'];
      return {
        type: 'empty',
        display: emptySymbols[Math.floor(Math.random() * emptySymbols.length)],
        value: 0,
        entry_type: 'empty'
      };
    
    case 'MARKER':
      return {
        type: 'marker',
        display: `day ${day}`,
        value: 0,
        entry_type: 'unchanged'
      };
    
    default:
      return {
        type: 'neutral',
        display: '0',
        value: 0,
        entry_type: 'torn'
      };
  }
}

/**
 * Get contextual flavor text (very rare, only for special milestones)
 * Not shown by default - only logged internally
 * @param {number} day
 * @param {number} total
 * @returns {string|null}
 */
export function getHiddenContext(day, total) {
  // Silent milestones (not shown to user, just internal state)
  const milestones = {
    7: 'first_week',
    30: 'first_month',
    100: 'centurion',
    365: 'year_intact'
  };
  
  return milestones[total] || null;
}

/**
 * Check if result should have subtle visual modifier
 * (e.g., different glow intensity based on rarity)
 * @param {string} type
 * @returns {string} CSS class modifier
 */
export function getResultModifier(type) {
  switch (type) {
    case 'empty':
      return 'result--void';
    case 'marker':
      return 'result--temporal';
    default:
      return 'result--standard';
  }
}

/**
 * Validate result before committing to state
 * Ensures no impossible results
 * @param {Object} result
 * @returns {boolean}
 */
export function validateResult(result) {
  if (!result || typeof result !== 'object') return false;
  if (!result.type || !result.display) return false;
  if (result.value !== undefined && typeof result.value !== 'number') return false;
  
  return true;
}
