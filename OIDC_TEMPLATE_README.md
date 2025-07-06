# FastAPI + React + Keycloak OIDC 集成模板

这是一个完整的OIDC（OpenID Connect）集成模板，支持FastAPI后端和React前端的Keycloak单点登录。

## 特性

- ✅ 完全移除FastAPIKeycloak依赖
- ✅ 使用python-keycloak库进行OIDC集成
- ✅ 延迟初始化，避免启动失败
- ✅ 完整的OIDC登录流程
- ✅ Token自动刷新
- ✅ 前端OIDC回调处理
- ✅ 双重登录模式（密码 + OIDC）

## 后端配置

### 1. 环境变量配置

在`docker-compose.yaml`中配置以下环境变量：

```yaml
backend:
  environment:
    - KEYCLOAK_SERVER_URL=http://keycloak:8080
    - KEYCLOAK_REALM_NAME=master
    - KEYCLOAK_CLIENT_ID=fastapi-client
    - KEYCLOAK_CLIENT_SECRET_KEY=your-client-secret
```

### 2. Keycloak客户端配置

在Keycloak管理控制台中创建客户端：

1. **客户端ID**: `fastapi-client`
2. **客户端协议**: `openid-connect`
3. **访问类型**: `confidential` (推荐) 或 `public`
4. **有效重定向URI**: `http://localhost/oidc/callback`
5. **Web源**: `http://localhost`
6. **启用服务账户**: 如果使用confidential类型

### 3. 后端API端点

#### OIDC登录
```http
GET /api/auth/oidc/login
```
返回授权URL和state参数

#### OIDC回调
```http
GET /api/auth/oidc/callback?code={code}&state={state}
```
处理OIDC回调，返回访问token

#### 获取用户信息
```http
GET /api/auth/oidc/user
Authorization: Bearer {token}
```

#### 刷新Token
```http
POST /api/auth/oidc/refresh
Content-Type: application/json
{
  "refresh_token": "your-refresh-token"
}
```

#### OIDC登出
```http
POST /api/auth/oidc/logout
Content-Type: application/json
{
  "refresh_token": "your-refresh-token"
}
```

## 前端配置

### 1. 认证服务

`frontend/app/src/utils/Auth.ts` 提供了完整的认证服务：

- `oidcLogin()`: 启动OIDC登录流程
- `oidcCallback()`: 处理OIDC回调
- `getOIDCUserInfo()`: 获取用户信息
- `refreshToken()`: 刷新token
- `oidcLogout()`: OIDC登出

### 2. 组件

#### OIDCLogin组件
```tsx
import OIDCLogin from './components/public/OIDCLogin';

<OIDCLogin 
  onLoginSuccess={() => console.log('登录成功')}
  onLoginError={(error) => console.error(error)}
/>
```

#### OIDCCallback组件
自动处理OIDC回调，验证state参数，获取token。

### 3. 路由配置

在`App.tsx`中添加OIDC回调路由：

```tsx
<Route exact path="/oidc/callback" component={OIDCCallback} />
```

## 使用流程

### 1. 用户点击OIDC登录
```tsx
const handleOIDCLogin = async () => {
  const response = await authService.oidcLogin();
  localStorage.setItem('oidc_state', response.state);
  window.location.href = response.auth_url;
};
```

### 2. 用户重定向到Keycloak
用户被重定向到Keycloak登录页面，输入凭据。

### 3. Keycloak回调到应用
Keycloak将用户重定向回应用的回调URL，包含授权码。

### 4. 应用处理回调
```tsx
// OIDCCallback组件自动处理
const code = searchParams.get('code');
const state = searchParams.get('state');
await authService.oidcCallback(code, state);
```

### 5. 用户登录成功
应用获取到访问token，用户被重定向到主页。

## 安全考虑

### 1. State参数验证
- 生成随机state参数
- 在localStorage中保存
- 回调时验证state参数

### 2. Token验证
- 验证JWT签名
- 检查token过期时间
- 验证token受众

### 3. 错误处理
- 处理OIDC错误响应
- 网络错误处理
- Token刷新失败处理

## 故障排除

### 1. Keycloak连接失败
- 检查Keycloak服务是否运行
- 验证环境变量配置
- 检查网络连接

### 2. OIDC配置错误
- 验证客户端配置
- 检查重定向URI
- 确认客户端密钥

### 3. Token验证失败
- 检查JWT签名
- 验证token格式
- 确认公钥配置

### 4. 前端回调错误
- 检查state参数验证
- 验证回调URL配置
- 确认CORS设置

## 开发建议

### 1. 开发环境
- 使用Docker Compose启动所有服务
- 配置开发环境变量
- 启用详细日志

### 2. 生产环境
- 使用HTTPS
- 配置安全的客户端密钥
- 启用token刷新
- 实现完整的错误处理

### 3. 测试
- 测试OIDC登录流程
- 验证token刷新
- 测试登出功能
- 检查权限验证

## 文件结构

```
backend/
├── app/
│   ├── main.py              # OIDC路由和配置
│   └── service/
│       └── keycloak.py      # Keycloak服务
frontend/
└── app/src/
    ├── utils/
    │   └── Auth.ts          # 认证服务
    └── components/
        └── public/
            ├── Login.tsx    # 登录页面
            ├── OIDCLogin.tsx # OIDC登录组件
            └── OIDCCallback.tsx # OIDC回调处理
```

这个模板提供了一个完整的OIDC集成解决方案，可以轻松集成到现有的FastAPI + React项目中。 