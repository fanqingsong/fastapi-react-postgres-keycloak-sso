// Auth.ts - 认证工具类
export interface User {
  id: string;
  username: string;
  email: string;
  roles?: string[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  refresh_expires_in?: number;
  user_info?: any;
}

export interface OIDCLoginResponse {
  auth_url: string;
  state: string;
}

class AuthService {
  private baseUrl = 'http://localhost:81/api2';
  private tokenKey = 'access_token2';
  private refreshTokenKey = 'refresh_token2';
  private userKey = 'user_info2';

  // 密码登录
  async login(username: string, password: string): Promise<TokenResponse> {
    const response = await fetch(`${this.baseUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username,
        password,
        grant_type: 'password',
      }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    this.setTokens(data);
    return data;
  }

  // OIDC登录 - 获取授权URL
  async oidcLogin(): Promise<OIDCLoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/oidc/login`);
    
    if (!response.ok) {
      throw new Error('OIDC login failed');
    }

    return await response.json();
  }

  // OIDC回调处理
  async oidcCallback(code: string, state: string): Promise<TokenResponse> {
    const response = await fetch(`${this.baseUrl}/auth/oidc/callback?code=${code}&state=${state}`);
    
    if (!response.ok) {
      throw new Error('OIDC callback failed');
    }

    const data = await response.json();
    this.setTokens(data);
    return data;
  }

  // 获取OIDC用户信息
  async getOIDCUserInfo(): Promise<User> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token');
    }

    const response = await fetch(`${this.baseUrl}/auth/oidc/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return await response.json();
  }

  // 刷新token
  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await fetch(`${this.baseUrl}/auth/oidc/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    this.setTokens(data);
    return data;
  }

  // OIDC登出
  async oidcLogout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return;
    }

    try {
      await fetch(`${this.baseUrl}/auth/oidc/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  // 传统登出
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    this.clearTokens();
  }

  // 检查是否已登录
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // 获取当前用户
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  // 获取访问token
  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // 获取刷新token
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // 设置tokens
  private setTokens(data: TokenResponse): void {
    if (data.access_token) {
      localStorage.setItem(this.tokenKey, data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem(this.refreshTokenKey, data.refresh_token);
    }
    if (data.user_info) {
      localStorage.setItem(this.userKey, JSON.stringify(data.user_info));
    }
  }

  // 清除tokens
  private clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  // 检查token是否过期
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  // 自动刷新token
  async ensureValidToken(): Promise<string | null> {
    if (this.isTokenExpired()) {
      try {
        await this.refreshToken();
      } catch {
        this.clearTokens();
        return null;
      }
    }
    return this.getAccessToken();
  }
}

export const authService = new AuthService();
export default authService;
