import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../App';

export const Home: React.FC = () => {
  const { authenticated } = useContext(AuthContext);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body text-center">
              <h1 className="card-title text-primary mb-4">
                🚀 Web System 2 - SSO Test
              </h1>
              <p className="card-text lead">
                这是第二套 Web 系统，用于测试 SSO/Single Logout 跨系统行为。
              </p>
              
              {authenticated ? (
                <div>
                  <div className="alert alert-success" role="alert">
                    ✅ 您已通过 SSO 登录到系统 2
                  </div>
                  <div className="mt-4">
                    <Link to="/targets" className="btn btn-primary me-3">
                      查看目标列表
                    </Link>
                    <Link to="/targets/create" className="btn btn-success">
                      创建新目标
                    </Link>
                  </div>
                  <div className="mt-3">
                    <small className="text-muted">
                      您现在可以测试在系统 1 和系统 2 之间的 SSO 切换
                    </small>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="alert alert-info" role="alert">
                    🔐 请登录以访问系统 2 的功能
                  </div>
                  <Link to="/login" className="btn btn-primary btn-lg">
                    登录系统 2
                  </Link>
                  <div className="mt-3">
                    <small className="text-muted">
                      使用相同的 Keycloak 账户登录，测试 SSO 功能
                    </small>
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-3 border-top">
                <h5>系统信息</h5>
                <ul className="list-unstyled">
                  <li>🌐 系统标识: Web System 2</li>
                  <li>🔗 API 路径: /api2</li>
                  <li>🎯 用途: SSO/Single Logout 测试</li>
                  <li>🔑 认证: 共享 Keycloak 实例</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


