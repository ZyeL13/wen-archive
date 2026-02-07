/**
 * ritual.js
 * Main application flow and screen orchestration
 * 
 * Responsibilities:
 * - Screen transitions
 * - Day progression coordination
 * - Event orchestration between modules
 */

import { SIGILS, log } from './sigil.js';
import { initializeState, recordTear, hasTearedToday, getCurrentDay, getLastResult, getCultivationLevel } from './memory.js';
import { generateResult, getResultModifier } from './manifest.js';
import { initTear, disableTear } from './tear.js';
import { initShatter, createCrackEffect, resetShatter } from './shatter.js';

// Screen state
let currentScreen = SIGILS.SCREENS.LANDING;
let tearInProgress = false;

/**
 * Initialize the ritual
 * Called from awaken.js after auth
 */
export async function beginRitual(fid) {
  log('Beginning ritual for FID:', fid);
  
  try {
    // Load state
    await initializeState(fid);
    
    // Show appropriate screen
    if (hasTearedToday()) {
      showTornScreen();
    } else {
      showIntactScreen();
    }
  } catch (error) {
    console.error('Ritual initialization failed:', error);
    showErrorState();
  }
}

/**
 * Show intact scroll screen (ready to tear)
 */
export function showIntactScreen() {
  log('Showing intact scroll');
  
  showScreen(SIGILS.SCREENS.SCROLL_INTACT);
  
  // Initialize tear interaction
  const scrollElement = document.querySelector('.scroll');
  if (scrollElement) {
    initTear(scrollElement);
  }
  
  // Initialize canvas for shatter effect
  const canvas = document.querySelector('.shatter-canvas');
  if (canvas) {
    initShatter(canvas);
  }
  
  // Update day indicator
  updateDayIndicator();
}

/**
 * Show torn scroll screen (after tear)
 */
export function showTornScreen() {
  log('Showing torn scroll');
  
  showScreen(SIGILS.SCREENS.SCROLL_TORN);
  
  // Disable tear interaction
  disableTear();
  
  // Display last result
  const result = getLastResult();
  if (result) {
    displayResult(result);
  }
  
  // Show cultivation level if above 1
  const level = getCultivationLevel();
  if (level > 1) {
    showCultivationLevel(level);
  }
  
  updateDayIndicator();
}

/**
 * Called by tear.js when tear is complete
 * Orchestrates the entire tear sequence
 */
export function onTearComplete() {
  if (tearInProgress) return;
  tearInProgress = true;
  
  log('Tear complete - beginning sequence');
  
  const day = getCurrentDay();
  
  // 1. Create dimensional crack effect
  createCrackEffect();
  
  // 2. Generate result
  setTimeout(() => {
    const result = generateResult(day);
    log('Result generated:', result);
    
    // 3. Record to state
    recordTear(result).then(success => {
      if (success) {
        log('Tear recorded successfully');
        
        // 4. Transition to torn screen
        setTimeout(() => {
          showTornScreen();
          tearInProgress = false;
        }, SIGILS.TIMING.RESULT_DELAY);
      } else {
        log('Tear recording failed');
        tearInProgress = false;
      }
    });
  }, 400);
}

/**
 * Display result in the torn scroll
 * @param {Object} result
 */
function displayResult(result) {
  const resultElement = document.querySelector('.result');
  if (!resultElement) return;
  
  resultElement.textContent = result.display;
  
  // Add modifier class for styling
  const modifier = getResultModifier(result.type);
  resultElement.className = `result ${modifier}`;
}

/**
 * Show cultivation level indicator
 * @param {number} level
 */
function showCultivationLevel(level) {
  const indicator = document.querySelector('.cultivation-indicator');
  if (!indicator) return;
  
  // Option 1: Just show number
  indicator.textContent = `lvl ${level}`;
  
  // Option 2: Show Latin label (if you want more mystique)
  // indicator.textContent = SIGILS.CULTIVATION_LABELS[level - 1];
}

/**
 * Update day indicator on screen
 */
function updateDayIndicator() {
  const day = getCurrentDay();
  const indicators = document.querySelectorAll('.day-indicator');
  
  indicators.forEach(el => {
    el.textContent = `day ${day}`;
  });
}

/**
 * Screen navigation
 * @param {string} screenId
 */
export function showScreen(screenId) {
  log('Switching to screen:', screenId);
  
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  // Show target screen
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add('active');
    currentScreen = screenId;
    
    // Update nav active state
    updateNavigation(screenId);
  }
  
  // Screen-specific setup
  if (screenId === SIGILS.SCREENS.HISTORY) {
    loadHistory();
  }
}

/**
 * Update navigation active state
 * @param {string} screenId
 */
function updateNavigation(screenId) {
  document.querySelectorAll('.nav button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.screen === screenId) {
      btn.classList.add('active');
    }
  });
}

/**
 * Load and display history
 */
async function loadHistory() {
  const historyList = document.querySelector('.history-list');
  if (!historyList) return;
  
  try {
    const { getHistory } = await import('./memory.js');
    const entries = await getHistory(30);
    
    if (entries.length === 0) {
      historyList.innerHTML = '<div class="history-empty">no entries yet</div>';
      return;
    }
    
    historyList.innerHTML = entries.map(entry => `
      <div class="history-entry">
        <span class="history-day">day ${entry.day}</span>
        <span class="history-status">${entry.entry_type}</span>
      </div>
    `).join('');
  } catch (error) {
    console.error('History load error:', error);
    historyList.innerHTML = '<div class="history-error">unable to load</div>';
  }
}

/**
 * Show error state (fallback)
 */
function showErrorState() {
  const errorScreen = document.createElement('div');
  errorScreen.className = 'screen active error-screen';
  errorScreen.innerHTML = `
    <div class="error-content">
      <p>unable to connect</p>
      <button class="btn" onclick="location.reload()">retry</button>
    </div>
  `;
  
  document.body.appendChild(errorScreen);
}

/**
 * Handle navigation button clicks
 */
export function setupNavigation() {
  document.querySelectorAll('.nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      const screenId = btn.dataset.screen;
      
      // Special handling for scroll screen
      if (screenId === SIGILS.SCREENS.SCROLL_INTACT) {
        if (hasTearedToday()) {
          showTornScreen();
        } else {
          showIntactScreen();
        }
      } else {
        showScreen(screenId);
      }
    });
  });
}

/**
 * Get current screen ID
 */
export function getCurrentScreen() {
  return currentScreen;
}
