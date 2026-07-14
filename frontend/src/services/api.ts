export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

class ApiService {
  private getHeaders(token?: string | null): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('ep_token') : null);
    if (activeToken) {
      headers.set('Authorization', `Bearer ${activeToken}`);
    }

    return headers;
  }

  async get<T>(path: string, token?: string | null): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, body: any, token?: string | null): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(path: string, body: any, token?: string | null): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string, token?: string | null): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });
    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.detail || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    }
    
    // For 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }
}

export const api = new ApiService();
