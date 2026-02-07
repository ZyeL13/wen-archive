/**
 * awaken.js
 * Application entry point
 * 
 * Responsibilities:
 * - Initialize all modules
 * - Handle authentication flow
 * - Render initial screen
 */

import { SIGILS, validateConfig, log, isDevelopment } from './sigil.js';
import { initAuth, signInWithFarcaster, isAuthenticated, getFID } from './oracle.js';
import { beginRitual, showScreen, setupNavigation } from './ritual.js';

/**
 * Main initialization function
 * Called when DOM is ready
 */
async function awaken() {
  log('=== WEN AWAKENING ===');
  
  // Validate configuration
  validateConfig();
  
  // Setup navigation
  setupNavigation();
  
  // Check authentication
  await initAuth();
  
  if (isAuthenticated()) {
    // User already authenticated - start ritual
    const fid = getFID();
    log('User authenticated, FID:', fid);
    await beginRitual(fid);
  } else {
    // Show landing page
    showScreen(SIGILS.SCREENS.LANDING);
    setupLandingPage();
  }
}

/**
 * Setup landing page interactions
 */
function setupLandingPage() {
  const enterButton = document.querySelector('.btn');
  
  if (enterButton) {
    enterButton.addEventListener('click', async () => {
      try {
        // Disable button during auth
        enterButton.disabled = true;
        enterButton.textContent = 'connecting...';
        
        // Trigger Farcaster auth
        const authState = await signInWithFarcaster();
        
        if (authState.isAuthenticated) {
          log('Auth successful, beginning ritual');
          await beginRitual(authState.fid);
        } else {
          throw new Error('Authentication failed');
        }
      } catch (error) {
        console.error('Sign-in error:', error);
        enterButton.disabled = false;
        enterButton.textContent = 'retry';
        
        // Show error message
        showAuthError();
      }
    });
  }
}

/**
 * Show authentication error
 */
function showAuthError() {
  const landing = document.getElementById(SIGILS.SCREENS.LANDING);
  if (!landing) return;
  
  // Check if error already shown
  if (landing.querySelector('.auth-error')) return;
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'auth-error';
  errorDiv.textContent = 'unable to connect. please try again.';
  
  landing.appendChild(errorDiv);
  
  // Remove error after 3 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}

/**
 * Handle page visibility changes
 * Check for day progression when user returns
 */
function setupVisibilityHandler() {
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && isAuthenticated()) {
      log('Page visible again - checking for day change');
      
      // Re-initialize state to check for new day
      const fid = getFID();
      await beginRitual(fid);
    }
  });
}

/**
 * Setup development helpers
 */
function setupDevTools() {
  if (!isDevelopment()) return;
  
  // Expose utilities to window for debugging
  window.WEN_DEBUG = {
    getState: async () => {
      const { getState } = await import('./memory.js');
      return getState();
    },
    forceNewDay: async () => {
      const { getState } = await import('./memory.js');
      const state = getState();
      state.is_torn_today = false;
      state.current_day += 1;
      localStorage.setItem('wen_state', JSON.stringify(state));
      location.reload();
    },
    resetState: () => {
      localStorage.removeItem('wen_state');
      localStorage.removeItem('wen_auth');
      location.reload();
    },
    signOut: async () => {
      const { signOut } = await import('./oracle.js');
      signOut();
      location.reload();
    }
  };
  
  log('Dev tools available at window.WEN_DEBUG');
}

/**
 * Error boundary for uncaught errors
 */
function setupErrorBoundary() {
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    
    // Show error screen
    const errorScreen = document.createElement('div');
    errorScreen.className = 'screen active error-screen';
    errorScreen.innerHTML = `
      <div class="error-content">
        <p>something broke</p>
        <button class="btn" onclick="location.reload()">restart</button>
      </div>
    `;
    
    document.body.innerHTML = '';
    document.body.appendChild(errorScreen);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupErrorBoundary();
    setupVisibilityHandler();
    setupDevTools();
    awaken();
  });
} else {
  // DOM already loaded
  setupErrorBoundary();
  setupVisibilityHandler();
  setupDevTools();
  awaken();
}

// Export for potential external use
export { awaken };
