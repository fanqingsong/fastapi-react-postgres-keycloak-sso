export const isAuthenticated = () => {
  return localStorage.getItem("access_token") !== null;
};

export const peridodicRefreshTokenCheck = (seconds = 60) => {
  const interval = setInterval(() => {
    if (isAuthenticated()) checkRefreshToken();
  }, seconds * 1000);
  return () => clearInterval(interval);
};

const storeTokens = (data: any) => {
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("access_expires", Date.now() / 1000 + data.expires_in);
  localStorage.setItem("refresh_token", data.refresh_token);
  localStorage.setItem(
    "refresh_expires",
    Date.now() / 1000 + data.refresh_expires_in
  );
};

const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("access_expires");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("refresh_expires");
};

// OIDC登录相关函数
export const startOIDCLogin = () => {
  // 重定向到后端的OIDC登录端点
  window.location.href = "/api/auth/oidc/login";
};

export const handleOIDCCallback = async (code: string) => {
  try {
    const response = await fetch(`/api/auth/oidc/callback?code=${code}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    if (response.status >= 400) {
      const error = await response.json();
      throw error.detail;
    }
    
    const data = await response.json();
    
    // 存储token信息
    storeTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      refresh_expires_in: data.refresh_expires_in
    });
    
    // 可选：存储用户信息
    if (data.user_info) {
      localStorage.setItem("user_info", JSON.stringify(data.user_info));
    }
    
    return data;
  } catch (error) {
    console.error("OIDC callback error:", error);
    throw error;
  }
};

export const getOIDCUserInfo = async () => {
  try {
    const response = await fetch("/api/auth/oidc/user", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json"
      }
    });
    
    if (response.status >= 400) {
      const error = await response.json();
      throw error.detail;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Get OIDC user info error:", error);
    throw error;
  }
};

export const checkRefreshToken = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  const refreshExpires = localStorage.getItem("refresh_expires");
  const now = Date.now() / 1000;

  if (refreshToken && refreshExpires) {
    if (now > parseFloat(refreshExpires) - 180) {
      clearTokens();
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token: refreshToken,
          }),
        });
        if (response.status >= 400) {
          const error = await response.json();
          throw error.detail;
        }
        const data = await response.json();
        storeTokens(data);
      } catch (error) {
        console.error(error);
      }
    }
  }
};

export const checkAccessToken = async () => {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  const accessExpires = localStorage.getItem("access_expires");
  const now = Date.now() / 1000;

  if (accessToken && accessExpires) {
    if (now > parseFloat(accessExpires) - 180) {
      clearTokens();
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token: refreshToken,
          }),
        });
        if (response.status >= 400) {
          const error = await response.json();
          throw error.detail;
        }
        const data = await response.json();
        storeTokens(data);
      } catch (error) {
        console.error(error);
      }
    }
  }
};

export const getTokens = async (username: string, password: string) => {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);
  params.append("grant_type", "password");

  const response = await fetch("/api/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });
  if (response.status >= 400) {
    const error = await response.json();
    throw error.detail;
  }
  const data = await response.json();
  storeTokens(data);
};

export const logout = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  clearTokens();

  await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: refreshToken }),
  });
};

export const authorized_fetch = async (
  url: string,
  headers: any,
  options: any
) => {
  if (isAuthenticated()) {
    await checkAccessToken();
    const token = localStorage.getItem("access_token");
    headers["Authorization"] = "Bearer " + token;
  }

  let response = await fetch(url, {
    headers,
    ...options,
  });

  response = await checkStatus(response);
  return await response.json();
};

const checkStatus = async (response: Response) => {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = await response.json();
    throw error.detail;
  }
};
