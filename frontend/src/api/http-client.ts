const API_BASE = 'http://localhost:3002/api';

export const httpClient = {
  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('authToken');

    // Исправление типов для headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    return response.json();
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
