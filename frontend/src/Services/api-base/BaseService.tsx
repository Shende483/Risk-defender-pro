import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = 'your-api-base-url'; // Replace with your actual base URL

class BaseService {
  protected api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = (error.config as AxiosRequestConfig & { _retry?: boolean }) || {};

        // Check if token expired
        if (
          error.response?.status === 403 &&
          (error.response.data as { message?: string })?.message?.includes('jwt expired') &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          console.log('Token expired, attempting to refresh...');

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              console.error('No refresh token found');
              return await Promise.reject(new Error('No refresh token available')); // Fixed: Added 'await'
            }

            const refreshResponse = await axios.post<{ access_token: string }>(
              `${API_BASE_URL}/auth/refresh`,
              { refreshToken }
            );

            const newAccessToken = refreshResponse.data.access_token;
            if (!newAccessToken) {
              console.error('No new access token received');
              return await Promise.reject(new Error('Failed to refresh token')); // Fixed: Added 'await'
            }

            localStorage.setItem('accessToken', newAccessToken);
            console.log('Token refreshed successfully');

            // Update the authorization header
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${newAccessToken}`,
            };

            // Retry the original request
            return await this.api(originalRequest); // Fixed: Added 'await'
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Clear tokens if refresh failed
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            return await Promise.reject(refreshError); // Fixed: Added 'await'
          }
        }

        // For other errors
        console.error('API Error:', {
          url: originalRequest.url,
          status: error.response?.status,
          message: error.message,
        });

        return await Promise.reject(error); // Fixed: Added 'await'
      }
    );
  }
}

export default BaseService;
