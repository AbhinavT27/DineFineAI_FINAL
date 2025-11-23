// Free trial state management for guest users
// Tracks usage of features before sign-up

export type FreeTrialFeature = 'search' | 'scrape' | 'prosCons' | 'compare';

interface FreeTrialState {
  version: number;
  perFeatureAllowed: number;
  usedPerFeature: {
    search: number;
    scrape: number;
    prosCons: number;
    compare: number;
  };
}

const STORAGE_KEY = 'DF_FREE_TRIAL_STATE';
const DEFAULT_STATE: FreeTrialState = {
  version: 1,
  perFeatureAllowed: 3,
  usedPerFeature: {
    search: 0,
    scrape: 0,
    prosCons: 0,
    compare: 0,
  },
};

// Get current state from localStorage or return default
function getState(): FreeTrialState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(stored);
    // Validate structure
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.version === 1 &&
      parsed.usedPerFeature
    ) {
      return parsed as FreeTrialState;
    }
    return DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

// Save state to localStorage
function setState(state: FreeTrialState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save free trial state:', error);
  }
}

/**
 * Get the number of remaining tries for a feature
 */
export function getRemainingTriesFor(feature: FreeTrialFeature): number {
  const state = getState();
  const used = state.usedPerFeature[feature] || 0;
  const remaining = state.perFeatureAllowed - used;
  return Math.max(0, remaining);
}

/**
 * Check if user has free tries remaining for a feature
 */
export function hasFreeTriesFor(feature: FreeTrialFeature): boolean {
  return getRemainingTriesFor(feature) > 0;
}

/**
 * Register that a free try was used for a feature
 * Call this AFTER the backend call succeeds
 */
export function registerFreeTryFor(feature: FreeTrialFeature): void {
  const state = getState();
  state.usedPerFeature[feature] = (state.usedPerFeature[feature] || 0) + 1;
  setState(state);
}

/**
 * Get all usage counts (useful for UI display)
 */
export function getAllUsage() {
  const state = getState();
  return {
    search: {
      used: state.usedPerFeature.search,
      remaining: getRemainingTriesFor('search'),
      total: state.perFeatureAllowed,
    },
    scrape: {
      used: state.usedPerFeature.scrape,
      remaining: getRemainingTriesFor('scrape'),
      total: state.perFeatureAllowed,
    },
    prosCons: {
      used: state.usedPerFeature.prosCons,
      remaining: getRemainingTriesFor('prosCons'),
      total: state.perFeatureAllowed,
    },
    compare: {
      used: state.usedPerFeature.compare,
      remaining: getRemainingTriesFor('compare'),
      total: state.perFeatureAllowed,
    },
  };
}

/**
 * Reset all usage counts (useful for testing)
 */
export function resetFreeTrial(): void {
  setState(DEFAULT_STATE);
}
