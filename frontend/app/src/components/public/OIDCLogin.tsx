import React, { useState } from 'react';
import { authService } from '../../utils/Auth';

interface OIDCLoginProps {
  onLoginSuccess: () => void;
  onLoginError: (error: string) => void;
}

const OIDCLogin: React.FC<OIDCLoginProps> = ({ onLoginSuccess, onLoginError }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleOIDCLogin = async () => {
    setIsLoading(true);
    try {
      const response = await authService.oidcLogin();
      
      // 保存state到localStorage用于回调验证
      localStorage.setItem('oidc_state', response.state);
      
      // 重定向到Keycloak登录页面
      window.location.href = response.auth_url;
    } catch (error) {
      console.error('OIDC login error:', error);
      onLoginError('OIDC登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="oidc-login">
      <button
        onClick={handleOIDCLogin}
        disabled={isLoading}
        className="btn btn-primary btn-lg w-100"
      >
        {isLoading ? '正在跳转...' : '使用Keycloak登录'}
      </button>
    </div>
  );
};

export default OIDCLogin; 