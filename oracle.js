/**
 * oracle.js
 * External communication and authentication
 * 
 * Responsibilities:
 * - Farcaster authentication
 * - API endpoint wrappers
 * - Error handling for network requests
 */

import { SIGILS, log, logError } from './sigil.js';

let authState = {
  isAuthenticated: false,
  fid: null,
  username: null,
  pfp: null
};

/**
 * Initialize Farcaster authentication
 * Uses @farcaster/auth-kit or similar
 */
export async function initAuth() {
  log('Initializing Farcaster auth');
  
  // Check if already authenticated (from localStorage)
  const savedAuth = getSavedAuth();
  if (savedAuth) {
    authState = savedAuth;
    return authState;
  }
  
  // TODO: Implement actual Farcaster Auth Kit integration
  // For now, this is a placeholder
  return authState;
}

/**
 * Trigger Farcaster sign-in flow
 * @returns {Promise<Object>} auth state with FID
 */
export async function signInWithFarcaster() {
  log('Starting Farcaster sign-in');
  
  try {
    // TODO: Replace with actual Farcaster Auth Kit implementation
    // This is a placeholder structure
    
    // Example flow:
    // 1. Generate auth challenge
    // 2. Open Warpcast for signature
    // 3. Verify signature
    // 4. Get FID and profile
    
    // Placeholder response
    const mockAuth = {
      isAuthenticated: true,
      fid: '12345', // This should come from actual auth
      username: 'user',
      pfp: null
    };
    
    authState = mockAuth;
    saveAuth(mockAuth);
    
    return authState;
  } catch (error) {
    logError('Farcaster sign-in failed:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export function signOut() {
  authState = {
    isAuthenticated: false,
    fid: null,
    username: null,
    pfp: null
  };
  
  localStorage.removeItem('wen_auth');
  log('Signed out');
}

/**
 * Get current auth state
 */
export function getAuthState() {
  return { ...authState };
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return authState.isAuthenticated && authState.fid !== null;
}

/**
 * Get current user's FID
 */
export function getFID() {
  return authState.fid;
}

// Save/load auth from localStorage
function saveAuth(auth) {
  try {
    localStorage.setItem('wen_auth', JSON.stringify(auth));
  } catch (error) {
    logError('Failed to save auth:', error);
  }
}

function getSavedAuth() {
  try {
    const saved = localStorage.getItem('wen_auth');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    logError('Failed to load saved auth:', error);
  }
  return null;
}

/**
 * API request wrapper with error handling
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - fetch options
 * @returns {Promise<Object>}
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${SIGILS.API_BASE}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  try {
    log('API request:', endpoint);
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    logError('API request failed:', endpoint, error);
    throw error;
  }
}

/**
 * Get user data from API
 * @param {string} fid
 * @returns {Promise<Object>}
 */
export async function getUserData(fid) {
  return apiRequest(`/user/${fid}`);
}

/**
 * Create new user
 * @param {Object} userData
 * @returns {Promise<Object>}
 */
export async function createUser(userData) {
  return apiRequest('/user', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

/**
 * Update user data
 * @param {string} fid
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateUser(fid, updates) {
  return apiRequest(`/user/${fid}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

/**
 * Record a tear entry
 * @param {Object} entry
 * @returns {Promise<Object>}
 */
export async function recordEntry(entry) {
  return apiRequest('/entry', {
    method: 'POST',
    body: JSON.stringify(entry)
  });
}

/**
 * Get user's history
 * @param {string} fid
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getHistory(fid, limit = 30) {
  return apiRequest(`/history/${fid}?limit=${limit}`);
}

/**
 * Health check API
 * @returns {Promise<boolean>}
 */
export async function checkAPIHealth() {
  try {
    await apiRequest('/health');
    return true;
  } catch (error) {
    return false;
  }
}
