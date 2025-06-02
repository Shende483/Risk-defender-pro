this.api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

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
        console.log('Token refreshed, new token:', newAccessToken);

        // Update the original request's authorization header
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newAccessToken}`,
        };

        // Retry the original request using the current axios instance
        return this.api.request(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return Promise.reject(refreshError);
      }
    }

    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    return Promise.reject(error);
  }
);
