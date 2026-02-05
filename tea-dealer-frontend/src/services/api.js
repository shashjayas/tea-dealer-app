const API_BASE = 'http://localhost:8080/api';

export const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      // Try to get error message from response body
      try {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || response.statusText;
        throw new Error(`API Error: ${errorMessage}`);
      } catch (e) {
        throw new Error(`API Error: ${response.statusText}`);
      }
    }

    // Check if response has content before parsing JSON
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    // If no content or content-length is 0, return null instead of parsing
    if (contentLength === '0' || !contentType?.includes('application/json')) {
      return null;
    }

    // Try to parse JSON, but handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : null;

  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};