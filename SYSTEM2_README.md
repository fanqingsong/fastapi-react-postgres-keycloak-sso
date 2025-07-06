# Web System 2 - SSO 测试系统

## 概述

这是第二套 Web 系统，用于测试 SSO/Single Logout 跨系统行为。两套系统共享同一个 Keycloak 实例，实现真正的单点登录和单点登出。

## 系统架构

### 服务配置
- **Frontend 2**: 端口 8001，路径 `/system2`
- **Backend 2**: 端口 8889，API 路径 `/api2`
- **Nginx**: 代理配置，支持两套系统

### 访问地址
- **系统 1**: http://localhost (主系统)
- **系统 2**: http://localhost/system2 (测试系统)
- **Keycloak**: http://localhost:8081 (SSO 服务)

## 功能特性

### 1. 独立存储
- 每套系统使用独立的 localStorage 键名
- 系统 1: `access_token`, `refresh_token`, `user_info`
- 系统 2: `access_token2`, `refresh_token2`, `user_info2`

### 2. 共享认证
- 两套系统使用相同的 Keycloak 客户端
- 支持跨系统的 SSO 登录
- 支持跨系统的 Single Logout

### 3. 独立 API
- 系统 1: `/api/*`
- 系统 2: `/api2/*`
- 各自独立的后端服务

## 测试流程

### 1. 启动系统
```bash
# 使用统一的启动脚本（启动所有系统）
./bin/start.sh

# 或手动启动
docker-compose up -d

# 检查服务状态
docker-compose ps
```

### 2. SSO 登录测试
1. 访问系统 1: http://localhost
2. 点击 "使用 Keycloak 登录"
3. 在 Keycloak 中完成登录
4. 访问系统 2: http://localhost/system2
5. 验证是否自动登录（SSO 效果）

### 3. Single Logout 测试
1. 在系统 1 中点击 "登出"
2. 访问系统 2，验证是否也被登出
3. 在系统 2 中重新登录
4. 访问系统 1，验证是否自动登录

## 配置说明

### Nginx 配置
```nginx
# 系统 1
location / {
    proxy_pass http://fastapi_sso_frontend:8000;
}

location /api {
    proxy_pass http://fastapi_sso_backend:8888;
}

# 系统 2
location /system2 {
    proxy_pass http://fastapi_sso_frontend2:8001;
}

location /api2 {
    proxy_pass http://fastapi_sso_backend2:8889;
}

# OIDC 回调
location /oidc2/callback {
    proxy_pass http://fastapi_sso_frontend2:8001;
}
```

### Docker Compose 服务
```yaml
frontend2:
  container_name: fastapi_sso_frontend2
  ports:
    - 8001:8001

backend2:
  container_name: fastapi_sso_backend2
  ports:
    - 8889:8889
```

## 故障排除

### 1. 服务启动失败
```bash
# 查看日志
docker-compose logs frontend2
docker-compose logs backend2

# 重新构建
docker-compose build frontend2 backend2
```

### 2. SSO 登录失败
- 检查 Keycloak 客户端配置
- 验证回调 URL 设置
- 确认 nginx 代理配置正确

### 3. 跨系统登录状态不同步
- 检查 localStorage 键名配置
- 验证 AuthContext 状态管理
- 确认 OIDC 回调处理逻辑

## 开发说明

### 修改系统 2 配置
1. 前端配置: `frontend2/app/src/utils/Auth.ts`
2. 后端配置: `backend2/app/main.py`
3. Nginx 配置: `nginx/nginx.conf`
4. Docker 配置: `docker-compose.yaml`

### 添加新功能
1. 在 `frontend2/app/src/components/` 中添加组件
2. 在 `backend2/app/router/` 中添加路由
3. 更新 nginx 配置以支持新的 API 路径

## 注意事项

1. **端口冲突**: 确保端口 8001 和 8889 未被占用
2. **Keycloak 配置**: 两套系统使用相同的 Keycloak 客户端
3. **数据库**: 两套系统共享同一个 PostgreSQL 数据库
4. **日志**: 系统 2 的日志存储在 `logs/backend2/` 目录

## 扩展建议

1. **多系统支持**: 可以继续添加系统 3、系统 4 等
2. **负载均衡**: 为每套系统配置独立的负载均衡器
3. **监控**: 添加系统监控和日志聚合
4. **安全**: 实现更细粒度的权限控制 