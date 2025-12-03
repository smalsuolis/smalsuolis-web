// API Tracking utility to store information about API calls
// Stores last call time and record count for each API endpoint

export interface ApiCallInfo {
  lastCallTime: string | null;
  recordCount: number;
  lastSuccessfulCall: string | null;
}

export interface ApiTrackingData {
  [apiName: string]: ApiCallInfo;
}

const STORAGE_KEY = 'smalsuolis_api_tracking';

// Initialize tracking data structure
const defaultTrackingData: ApiTrackingData = {
  infostatyba: {
    lastCallTime: null,
    recordCount: 0,
    lastSuccessfulCall: null,
  },
  izuvinimas: {
    lastCallTime: null,
    recordCount: 0,
    lastSuccessfulCall: null,
  },
  miskoKirtimai: {
    lastCallTime: null,
    recordCount: 0,
    lastSuccessfulCall: null,
  },
};

// Get tracking data from localStorage
export const getApiTrackingData = (): ApiTrackingData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading API tracking data:', error);
  }
  return defaultTrackingData;
};

// Save tracking data to localStorage
export const saveApiTrackingData = (data: ApiTrackingData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving API tracking data:', error);
  }
};

// Track an API call
export const trackApiCall = (
  apiName: string,
  recordCount: number,
  success: boolean = true,
): void => {
  const trackingData = getApiTrackingData();
  const now = new Date().toISOString();

  if (!trackingData[apiName]) {
    trackingData[apiName] = {
      lastCallTime: null,
      recordCount: 0,
      lastSuccessfulCall: null,
    };
  }

  trackingData[apiName].lastCallTime = now;

  if (success && recordCount > 0) {
    trackingData[apiName].recordCount = recordCount;
    trackingData[apiName].lastSuccessfulCall = now;
  }

  saveApiTrackingData(trackingData);
};

// Get tracking info for a specific API
export const getApiTrackingInfo = (apiName: string): ApiCallInfo | null => {
  const trackingData = getApiTrackingData();
  return trackingData[apiName] || null;
};

// Get all tracking data
export const getAllApiTrackingInfo = (): ApiTrackingData => {
  return getApiTrackingData();
};

// Clear all tracking data (useful for testing)
export const clearApiTrackingData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
