this.api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Check if token expired
    if (
      error.response?.status === 403 &&
      (error.response.data as any)?.message?.includes('jwt expired') &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      console.log('Token expired, attempting to refresh...');

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.error('No refresh token found');
          return Promise.reject(new Error('No refresh token available'));
        }

        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = refreshResponse.data.access_token;
        if (!newAccessToken) {
          console.error('No new access token received');
          return Promise.reject(new Error('Failed to refresh token'));
        }

        localStorage.setItem('accessToken', newAccessToken);
        console.log('Token refreshed successfully');

        // Update the authorization header
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newAccessToken}`,
        };

        // Retry the original request
        return this.api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear tokens if refresh failed
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return Promise.reject(refreshError);
      }
    }

    // For other errors
    console.error('API Error:', {
      url: originalRequest.url,
      status: error.response?.status,
      message: error.message,
    });

    return Promise.reject(error);
  }
);
