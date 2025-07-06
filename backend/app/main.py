"""Main module."""
from fastapi import Depends, FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from simber import Logger
import uvicorn
import os

from app.router import auth, targets
from app.service.keycloak import verify_token
from app.service.keycloak import verify_permission


from fastapi_keycloak import FastAPIKeycloak, OIDCUser


LOG_FORMAT = "{levelname} [{filename}:{lineno}]:"
logger = Logger(__name__, log_path="/logs/api.log")
logger.update_format(LOG_FORMAT)


app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi")

origins = ["http://localhost", "http://frontend:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OIDC配置 - 延迟初始化
idp = None
OIDC_ENABLED = False

def _init_oidc():
    """初始化OIDC配置"""
    global idp, OIDC_ENABLED
    try:
        idp = FastAPIKeycloak(
            server_url=os.environ.get("KEYCLOAK_SERVER_URL", "http://keycloak:8080"),
            client_id=os.environ.get("KEYCLOAK_CLIENT_ID", "fastapi-client"),
            client_secret=os.environ.get("KEYCLOAK_CLIENT_SECRET_KEY", "your-client-secret"),
            # 暂时注释掉admin_client_secret，避免service account错误
            # admin_client_secret=os.environ.get("KEYCLOAK_CLIENT_SECRET_KEY", "your-client-secret"),
            realm=os.environ.get("KEYCLOAK_REALM_NAME", "master"),
            callback_uri="http://localhost/oidc/callback"  # 前端OIDC回调URL
        )
        # 添加OIDC路由到Swagger文档
        idp.add_swagger_config(app)
        OIDC_ENABLED = True
        logger.info("OIDC configuration loaded successfully")
        return True
    except Exception as e:
        logger.warning(f"OIDC configuration failed: {e}. OIDC features will be disabled.")
        idp = None
        OIDC_ENABLED = False
        return False

def _ensure_oidc_initialized():
    """确保OIDC已初始化"""
    if idp is None:
        if not _init_oidc():
            raise HTTPException(status_code=503, detail="OIDC is not configured")

# 添加OIDC登录路由
@app.get("/api/auth/oidc/login")
async def oidc_login():
    """重定向到Keycloak登录页面"""
    _ensure_oidc_initialized()
    return idp.login_uri()

# 添加OIDC回调路由
@app.get("/api/auth/oidc/callback")
async def oidc_callback(code: str):
    """处理OIDC回调"""
    _ensure_oidc_initialized()
    
    try:
        user = idp.exchange_authorization_code(session_code=code)
        return {
            "access_token": user.access_token,
            "refresh_token": user.refresh_token,
            "expires_in": user.expires_in,
            "refresh_expires_in": user.refresh_expires_in,
            "user_info": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "roles": user.roles
            }
        }
    except Exception as e:
        logger.error(f"OIDC callback error: {e}")
        raise HTTPException(status_code=400, detail="OIDC authentication failed")

# 添加OIDC用户信息路由
@app.get("/api/auth/oidc/user")
async def oidc_user_info():
    """获取当前OIDC用户信息"""
    _ensure_oidc_initialized()
    
    # 这里需要从请求中获取token，然后验证用户
    # 简化处理，直接返回错误信息
    raise HTTPException(status_code=501, detail="OIDC user info endpoint not fully implemented")


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


@app.get("/api")
async def root() -> Response:
    """Health check."""
    return Response(status_code=200)


app.include_router(
    targets.router,
    prefix="/api/targets",
    tags=["targets"],
    dependencies=[Depends(verify_token)],
)

app.include_router(
    auth.router, 
    prefix="/api/auth", 
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
    uvicorn.run("main:app", host="0.0.0.0", reload=True, port=8888)  # nosec
