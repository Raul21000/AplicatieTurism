// API Client for syncing with backend server
// This allows data to be shared across devices

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { error: data.error || `HTTP error: ${response.status}` };
    }

    return { data };
  } catch (error: any) {
    console.error('API call error:', error);
    return { error: error.message || 'Network error' };
  }
}

// ==================== AUTH API ====================

export async function signUpOnServer(
  email: string,
  password: string,
  username?: string
): Promise<ApiResponse<any>> {
  return apiCall('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, username }),
  });
}

export async function signInOnServer(
  email: string,
  password: string
): Promise<ApiResponse<any>> {
  return apiCall('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ==================== LOCATIONS API ====================

export async function getLocationsFromServer(): Promise<ApiResponse<any[]>> {
  return apiCall('/locations');
}

export async function getLocationFromServer(id: string): Promise<ApiResponse<any>> {
  return apiCall(`/locations/${id}`);
}

export async function createLocationOnServer(location: {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  rating?: number;
}): Promise<ApiResponse<any>> {
  return apiCall('/locations', {
    method: 'POST',
    body: JSON.stringify(location),
  });
}

// ==================== REVIEWS API ====================

export async function getLocationReviews(locationId: string): Promise<ApiResponse<any[]>> {
  return apiCall(`/locations/${locationId}/reviews`);
}

export async function getAccountReviews(accountId: string): Promise<ApiResponse<any[]>> {
  return apiCall(`/accounts/${accountId}/reviews`);
}

export async function createReviewOnServer(review: {
  account_id: string;
  location_id: string;
  rating: number;
  review_text?: string;
}): Promise<ApiResponse<any>> {
  return apiCall('/reviews', {
    method: 'POST',
    body: JSON.stringify(review),
  });
}

// ==================== SYNC API ====================

export async function syncAccountToServer(account: {
  accid: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
}): Promise<ApiResponse<any>> {
  return apiCall('/sync/account', {
    method: 'POST',
    body: JSON.stringify(account),
  });
}

export async function syncLocationToServer(location: {
  locid: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  rating?: number;
  created_at: string;
}): Promise<ApiResponse<any>> {
  return apiCall('/sync/location', {
    method: 'POST',
    body: JSON.stringify(location),
  });
}

export async function syncReviewToServer(review: {
  revid: string;
  account_id: string;
  location_id: string;
  rating: number;
  review_text?: string;
  visited_at: string;
}): Promise<ApiResponse<any>> {
  return apiCall('/sync/review', {
    method: 'POST',
    body: JSON.stringify(review),
  });
}

// Health check
export async function checkServerHealth(): Promise<ApiResponse<any>> {
  return apiCall('/health');
}

