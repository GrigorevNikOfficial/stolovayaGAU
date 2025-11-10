const API_BASE = 'http://localhost:5000/api';

export const httpClient = {
  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('authToken');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Логируем запрос
    console.log('🚀 HTTP Request:', {
      url: `${API_BASE}${url}`,
      method: options.method,
      headers,
      body: options.body ? JSON.parse(options.body as string) : undefined,
    });

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    // Логируем ответ
    console.log('📨 HTTP Response:', {
      url: `${API_BASE}${url}`,
      status: response.status,
      statusText: response.statusText,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.log('❌ Error details:', errorData);
      } catch {
        errorMessage = errorText || errorMessage;
        console.log('❌ Error text:', errorText);
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log('✅ Response data:', responseData);
    return responseData;
  },

  get<T>(url: string): Promise<T> {
    return this.request<T>(url);
  },

  post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  patch<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete<T>(url: string): Promise<T> {
    return this.request<T>(url, {
      method: 'DELETE',
    });
  },
};
