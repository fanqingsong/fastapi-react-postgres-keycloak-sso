import React, { useEffect, useState, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { authService } from '../../utils/Auth';
import { AuthContext } from '../../App';

const OIDCCallback: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { setAuthenticated } = useContext(AuthContext);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 解析URL参数
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const savedState = localStorage.getItem('oidc_state2');
        const errorParam = searchParams.get('error');

        // 清除保存的state
        localStorage.removeItem('oidc_state2');

        // 检查是否有错误
        if (errorParam) {
          setError(`OIDC登录失败: ${errorParam}`);
          setIsProcessing(false);
          return;
        }

        // 检查必要参数
        if (!code || !state) {
          setError('缺少必要的认证参数');
          setIsProcessing(false);
          return;
        }

        // 验证state参数
        if (state !== savedState) {
          setError('State参数验证失败');
          setIsProcessing(false);
          return;
        }

        // 处理OIDC回调
        await authService.oidcCallback(code, state);
        setAuthenticated(true); // 主动设置登录状态
        // 登录成功，跳转到主页
        history.push('/');
      } catch (err) {
        console.error('OIDC callback error:', err);
        setError('OIDC认证失败，请重试');
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [location, history, setAuthenticated]);

  if (isProcessing) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">正在处理OIDC认证...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => history.push('/login')}
                >
                  返回登录页面
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OIDCCallback; 