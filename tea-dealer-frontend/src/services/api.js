// Use REACT_APP_API_URL env var when deployed (e.g. on Vercel pointing to Render backend).
// Falls back to current hostname:8080 for local network access.
const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8080/api`;

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
        const errorMessage = errorData.error || errorData.message || response.statusText || `${response.status}`;
        throw new Error(`API Error (${response.status}): ${errorMessage}`);
      } catch (e) {
        // If JSON parsing fails, use status code and text
        const statusText = response.statusText || (response.status === 404 ? 'Not Found' : 'Error');
        throw new Error(`API Error (${response.status}): ${statusText}`);
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