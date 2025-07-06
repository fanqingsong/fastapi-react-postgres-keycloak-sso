"""Main module."""
from fastapi import Depends, FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from simber import Logger
import uvicorn
import os
import secrets
from urllib.parse import urlencode

from app.router import auth, targets
from app.service.keycloak import (
    verify_token, verify_permission, get_user_info, refresh_token as oidc_refresh_token, logout as oidc_logout
)


# 移除FastAPIKeycloak依赖，直接使用python-keycloak


LOG_FORMAT = "{levelname} [{filename}:{lineno}]:"
logger = Logger(__name__, log_path="/logs/api.log")
logger.update_format(LOG_FORMAT)


app = FastAPI(docs_url="/api2/docs", openapi_url="/api2/openapi")

origins = ["http://localhost", "http://frontend:3000", "http://frontend2:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OIDC配置 - 延迟初始化
# idp = None
# OIDC_ENABLED = False

# def _init_oidc():
#     ...
# def _ensure_oidc_initialized():
#     ...

@app.get("/api2/auth/oidc/login")
async def oidc_login():
    """重定向到Keycloak登录页面"""
    # 生成随机state参数
    state = secrets.token_urlsafe(32)
    # 构建OIDC授权URL
    auth_url = f"{os.environ.get('KEYCLOAK_SERVER_URL_CLIENT', 'http://localhost:8080/')}/realms/{os.environ.get('KEYCLOAK_REALM_NAME', 'master')}/protocol/openid-connect/auth"
    params = {
        'client_id': os.environ.get('KEYCLOAK_CLIENT_ID', 'fastapi-client'),
        'response_type': 'code',
        'scope': 'openid email profile',
        'redirect_uri': 'http://localhost:81/oidc2/callback',
        'state': state
    }
    auth_url_with_params = f"{auth_url}?{urlencode(params)}"
    return {"auth_url": auth_url_with_params, "state": state}

@app.get("/api2/auth/oidc/callback")
async def oidc_callback(code: str, state: str = None):
    """处理OIDC回调"""
    try:
        # 使用keycloak.py暴露的authenticate_user方法换token
        from app.service.keycloak import keycloak_openid
        token_data = keycloak_openid.token(
            grant_type='authorization_code',
            code=code,
            redirect_uri='http://localhost:81/oidc2/callback'
        )
        user_info = keycloak_openid.userinfo(token_data['access_token'])
        return {
            "access_token": token_data['access_token'],
            "refresh_token": token_data.get('refresh_token'),
            "expires_in": token_data.get('expires_in', 300),
            "refresh_expires_in": token_data.get('refresh_expires_in', 1800),
            "user_info": user_info
        }
    except Exception as e:
        logger.error(f"OIDC callback error: {e}")
        raise HTTPException(status_code=400, detail="OIDC authentication failed")

@app.get("/api2/auth/oidc/user")
async def oidc_user_info(token: str = Depends(verify_token)):
    """获取当前OIDC用户信息"""
    try:
        user_info = get_user_info(token)
        return user_info
    except Exception as e:
        logger.error(f"OIDC user info error: {e}")
        raise HTTPException(status_code=400, detail="Failed to get user info")

@app.post("/api2/auth/oidc/refresh")
async def oidc_refresh_token(refresh_token: str):
    """刷新OIDC token"""
    try:
        token_data = oidc_refresh_token(refresh_token)
        return {
            "access_token": token_data['access_token'],
            "refresh_token": token_data.get('refresh_token'),
            "expires_in": token_data.get('expires_in', 300),
            "refresh_expires_in": token_data.get('refresh_expires_in', 1800)
        }
    except Exception as e:
        logger.error(f"OIDC refresh error: {e}")
        raise HTTPException(status_code=400, detail="Token refresh failed")

@app.post("/api2/auth/oidc/logout")
async def oidc_logout_route(refresh_token: str):
    """OIDC登出"""
    try:
        oidc_logout(refresh_token)
        return {"message": "Logout successful"}
    except Exception as e:
        logger.error(f"OIDC logout error: {e}")
        raise HTTPException(status_code=400, detail="Logout failed")

@app.exception_handler(Exception)
async def exception_handler(_: Request, exc: Exception) -> Response:
    """Handle default exceptions.

    Args:
        exc: exception that ocurred

    Returns:
        HTTP 500 Internal Server Error
    """
    logger.error(exc)
    return Response(status_code=500)


@app.get("/api2")
async def root() -> Response:
    """Health check."""
    return Response(status_code=200)


app.include_router(
    targets.router,
    prefix="/api2/targets",
    tags=["targets"],
    dependencies=[Depends(verify_token)],
)

app.include_router(
    auth.router, 
    prefix="/api2/auth", 
    tags=["auth"])
    

@app.get("/user")  # Requires logged in
def current_users(user = Depends(verify_token)):
    return user


@app.get("/admin")  # Requires the admin role
def company_admin(user = Depends(verify_permission(required_roles=["admin"]))):
    return f'Hi admin {user}'


@app.get("/protected", dependencies=[Depends(verify_permission(required_roles=["admin"]))])  # Requires the admin role
def company_admin():
    return f'Hi, this is protected path'



if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", reload=True, port=8889)  # nosec
