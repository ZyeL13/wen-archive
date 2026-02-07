/**
 * memory.js
 * State management and persistence layer
 * 
 * Responsibilities:
 * - Read/write to Supabase
 * - Local state caching
 * - Streak tracking (no penalties)
 * - Cultivation level calculation
 */

import { SIGILS } from './sigil.js';

// Local state cache
let localState = {
  fid: null,
  current_day: 1,
  total_entries: 0,
  streak: 0,
  cultivation_level: 1,
  last_active_at: null,
  last_result: null,
  is_torn_today: false
};

/**
 * Initialize state from Supabase or create new user
 * @param {string} fid - Farcaster ID
 * @returns {Promise<Object>} user state
 */
export async function initializeState(fid) {
  try {
    // Fetch from Supabase
    const response = await fetch(`${SIGILS.API_BASE}/user/${fid}`);
    
    if (response.ok) {
      const userData = await response.json();
      localState = { ...userData, fid };
      
      // Check if we need to increment day
      checkDayProgression();
      
      return localState;
    } else if (response.status === 404) {
      // New user - create entry
      return await createNewUser(fid);
    } else {
      throw new Error('Failed to fetch user data');
    }
  } catch (error) {
    console.error('State initialization error:', error);
    // Fallback to localStorage
    return loadFromLocalStorage(fid);
  }
}

/**
 * Create new user in database
 * @param {string} fid
 * @returns {Promise<Object>}
 */
async function createNewUser(fid) {
  const newUser = {
    fid,
    current_day: 1,
    total_entries: 0,
    streak: 0,
    cultivation_level: 1,
    last_active_at: new Date().toISOString()
  };

  try {
    const response = await fetch(`${SIGILS.API_BASE}/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });

    if (response.ok) {
      localState = { ...newUser, is_torn_today: false, last_result: null };
      saveToLocalStorage();
      return localState;
    }
  } catch (error) {
    console.error('User creation error:', error);
  }

  // Fallback to local state
  localState = { ...newUser, is_torn_today: false, last_result: null };
  saveToLocalStorage();
  return localState;
}

/**
 * Check if a new day has started
 * Increments day counter if needed
 */
function checkDayProgression() {
  if (!localState.last_active_at) return;

  const lastActive = new Date(localState.last_active_at);
  const now = new Date();
  
  // Check if it's a new day (simplified - uses UTC)
  const lastDay = lastActive.toISOString().split('T')[0];
  const currentDay = now.toISOString().split('T')[0];

  if (lastDay !== currentDay) {
    // New day detected
    const daysDiff = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
    
    localState.current_day += daysDiff;
    localState.is_torn_today = false;
    localState.last_result = null;
    
    // Update streak (but don't penalize absence)
    if (daysDiff === 1) {
      // Consecutive day
      localState.streak += 1;
    } else if (daysDiff > 1) {
      // Gap - reset streak (silently, no notification)
      localState.streak = 0;
    }
    
    saveToLocalStorage();
  }
}

/**
 * Record a tear entry
 * @param {Object} result - from manifest.js
 * @returns {Promise<boolean>} success
 */
export async function recordTear(result) {
  if (localState.is_torn_today) {
    console.warn('Already torn today');
    return false;
  }

  const entry = {
    fid: localState.fid,
    day: localState.current_day,
    entry_type: result.entry_type,
    value: result.value,
    created_at: new Date().toISOString()
  };

  try {
    // Save to Supabase
    const response = await fetch(`${SIGILS.API_BASE}/entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });

    if (response.ok) {
      // Update local state
      localState.total_entries += 1;
      localState.last_active_at = entry.created_at;
      localState.is_torn_today = true;
      localState.last_result = result;
      
      // Recalculate cultivation level
      localState.cultivation_level = calculateCultivationLevel(localState.total_entries);
      
      // Update user record
      await updateUser();
      
      saveToLocalStorage();
      return true;
    }
  } catch (error) {
    console.error('Entry recording error:', error);
  }

  // Fallback to local-only
  localState.total_entries += 1;
  localState.last_active_at = entry.created_at;
  localState.is_torn_today = true;
  localState.last_result = result;
  localState.cultivation_level = calculateCultivationLevel(localState.total_entries);
  
  saveToLocalStorage();
  return true;
}

/**
 * Update user record in Supabase
 * @returns {Promise<void>}
 */
async function updateUser() {
  try {
    await fetch(`${SIGILS.API_BASE}/user/${localState.fid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_day: localState.current_day,
        total_entries: localState.total_entries,
        streak: localState.streak,
        cultivation_level: localState.cultivation_level,
        last_active_at: localState.last_active_at
      })
    });
  } catch (error) {
    console.error('User update error:', error);
  }
}

/**
 * Calculate cultivation level based on total entries
 * Progression is slow and silent
 * @param {number} total
 * @returns {number} level (1-10)
 */
function calculateCultivationLevel(total) {
  // Level thresholds (exponential)
  const thresholds = [0, 30, 75, 150, 250, 400, 600, 850, 1150, 1500];
  
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (total >= thresholds[i]) {
      return i + 1;
    }
  }
  
  return 1;
}

/**
 * Get user's history (last N days)
 * @param {number} limit - number of days to fetch
 * @returns {Promise<Array>} entries
 */
export async function getHistory(limit = 30) {
  try {
    const response = await fetch(
      `${SIGILS.API_BASE}/history/${localState.fid}?limit=${limit}`
    );
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('History fetch error:', error);
  }
  
  return [];
}

// Getters
export function hasTearedToday() {
  return localState.is_torn_today;
}

export function getCurrentDay() {
  return localState.current_day;
}

export function getCultivationLevel() {
  return localState.cultivation_level;
}

export function getTotalEntries() {
  return localState.total_entries;
}

export function getLastResult() {
  return localState.last_result;
}

export function getStreak() {
  return localState.streak;
}

export function getState() {
  return { ...localState };
}

// LocalStorage fallback
function saveToLocalStorage() {
  try {
    localStorage.setItem('wen_state', JSON.stringify(localState));
  } catch (error) {
    console.error('LocalStorage save error:', error);
  }
}

function loadFromLocalStorage(fid) {
  try {
    const saved = localStorage.getItem('wen_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.fid === fid) {
        localState = parsed;
        checkDayProgression();
        return localState;
      }
    }
  } catch (error) {
    console.error('LocalStorage load error:', error);
  }
  
  // Return fresh state
  localState = {
    fid,
    current_day: 1,
    total_entries: 0,
    streak: 0,
    cultivation_level: 1,
    last_active_at: new Date().toISOString(),
    last_result: null,
    is_torn_today: false
  };
  
  saveToLocalStorage();
  return localState;
}
