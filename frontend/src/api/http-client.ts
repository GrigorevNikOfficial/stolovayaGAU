const API_BASE = 'http://localhost:5000/api';

const isFormDataBody = (data: unknown): data is FormData =>
  typeof FormData !== 'undefined' && data instanceof FormData;

const buildBody = (data?: any): BodyInit | undefined => {
  if (data === undefined || data === null) {
    return undefined;
  }

  if (isFormDataBody(data)) {
    return data;
  }

  return JSON.stringify(data);
};

const serializeQuery = (
  params?: Record<string, string | number | boolean | undefined>
) => {
  if (!params) {
    return '';
  }

  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => [key, String(value)]) as [string, string][];

  if (!query.length) {
    return '';
  }

  const searchParams = new URLSearchParams(query);
  return searchParams.toString();
};

export const httpClient = {
  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('authToken');
    const formDataBody = isFormDataBody(options.body);

    const headers: Record<string, string> = {
      ...(formDataBody ? {} : { 'Content-Type': 'application/json' }),
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let requestBodyLog: unknown;
    if (formDataBody) {
      requestBodyLog = '[FormData]';
    } else if (typeof options.body === 'string') {
      try {
        requestBodyLog = JSON.parse(options.body);
      } catch {
        requestBodyLog = options.body;
      }
    }

    // Логируем запрос
    console.log('🚀 HTTP Request:', {
      url: `${API_BASE}${url}`,
      method: options.method,
      headers,
      body: requestBodyLog,
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

  get<T>(
    url: string,
    options?: {
      params?: Record<string, string | number | boolean | undefined>;
    }
  ): Promise<T> {
    const query = serializeQuery(options?.params);
    const finalUrl = query
      ? `${url}${url.includes('?') ? '&' : '?'}${query}`
      : url;
    return this.request<T>(finalUrl);
  },

  post<T>(url: string, data?: any): Promise<T> {
    const body = buildBody(data);
    return this.request<T>(url, {
      method: 'POST',
      ...(body !== undefined ? { body } : {}),
    });
  },

  put<T>(url: string, data?: any): Promise<T> {
    const body = buildBody(data);
    return this.request<T>(url, {
      method: 'PUT',
      ...(body !== undefined ? { body } : {}),
    });
  },

  patch<T>(url: string, data?: any): Promise<T> {
    const body = buildBody(data);
    return this.request<T>(url, {
      method: 'PATCH',
      ...(body !== undefined ? { body } : {}),
    });
  },

  delete<T>(url: string): Promise<T> {
    return this.request<T>(url, {
      method: 'DELETE',
    });
  },
};
