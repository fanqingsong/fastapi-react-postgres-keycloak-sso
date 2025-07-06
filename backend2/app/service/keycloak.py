"""Keycloak service module."""
import os
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from simber import Logger
import jwt
import requests

LOG_FORMAT = "{levelname} [{filename}:{lineno}]:"
logger = Logger(__name__, log_path="/logs/api.log")
logger.update_format(LOG_FORMAT)

# 延迟初始化变量
keycloak_openid = None
KEYCLOAK_ENABLED = False

def _init_keycloak():
    """初始化Keycloak连接"""
    global keycloak_openid, KEYCLOAK_ENABLED
    try:
        from keycloak import KeycloakOpenID
        
        keycloak_openid = KeycloakOpenID(
            server_url=os.environ.get("KEYCLOAK_SERVER_URL", "http://keycloak:8080"),
            realm_name=os.environ.get("KEYCLOAK_REALM_NAME", "master"),
            client_id=os.environ.get("KEYCLOAK_CLIENT_ID", "fastapi-client"),
            client_secret_key=os.environ.get("KEYCLOAK_CLIENT_SECRET_KEY", "your-client-secret"),
            verify=True
        )
        
        KEYCLOAK_ENABLED = True
        logger.info("Keycloak connection initialized successfully")
        return True
    except Exception as e:
        logger.warning(f"Keycloak initialization failed: {e}. Keycloak features will be disabled.")
        keycloak_openid = None
        KEYCLOAK_ENABLED = False
        return False

def _ensure_keycloak_initialized():
    """确保Keycloak已初始化"""
    if keycloak_openid is None:
        if not _init_keycloak():
            raise HTTPException(status_code=503, detail="Keycloak is not configured")

security = HTTPBearer()

def get_pem_public_key():
    _ensure_keycloak_initialized()
    key = keycloak_openid.public_key()
    if not key.startswith('-----BEGIN PUBLIC KEY-----'):
        key = "-----BEGIN PUBLIC KEY-----\n" + key + "\n-----END PUBLIC KEY-----"
    return key

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """验证JWT token并返回用户信息"""
    _ensure_keycloak_initialized()
    
    try:
        # 使用python-keycloak验证token
        token_info = keycloak_openid.decode_token(
            credentials.credentials,
            key=get_pem_public_key(),
            options={
                "verify_signature": True,
                "verify_aud": False,
                "verify_exp": True
            }
        )
        
        return token_info
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def verify_permission(required_roles: list = None, required_permissions: list = None):
    """验证用户权限"""
    def _verify_permission(token_info: dict = Depends(verify_token)) -> dict:
        if not token_info:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # 检查角色
        if required_roles:
            user_roles = token_info.get("realm_access", {}).get("roles", [])
            if not any(role in user_roles for role in required_roles):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
        
        # 检查权限（如果有实现）
        if required_permissions:
            # 这里可以添加权限检查逻辑
            pass
        
        return token_info
    
    return _verify_permission

def get_user_info(token: str) -> dict:
    """获取用户信息"""
    _ensure_keycloak_initialized()
    
    try:
        return keycloak_openid.userinfo(token)
    except Exception as e:
        logger.error(f"Failed to get user info: {e}")
        raise HTTPException(status_code=400, detail="Failed to get user info")

def refresh_token(refresh_token: str) -> dict:
    """刷新token"""
    _ensure_keycloak_initialized()
    
    try:
        return keycloak_openid.refresh_token(refresh_token)
    except Exception as e:
        logger.error(f"Failed to refresh token: {e}")
        raise HTTPException(status_code=400, detail="Failed to refresh token")

def logout(refresh_token: str) -> bool:
    """登出用户"""
    _ensure_keycloak_initialized()
    
    try:
        keycloak_openid.logout(refresh_token)
        return True
    except Exception as e:
        logger.error(f"Failed to logout: {e}")
        raise HTTPException(status_code=400, detail="Failed to logout")

async def authenticate_user(username: str, password: str) -> dict:
    """Authenticate user with Keycloak using password grant."""
    _ensure_keycloak_initialized()
    try:
        token = keycloak_openid.token(
            username=username,
            password=password,
            grant_type='password'
        )
        return token
    except Exception as e:
        logger.error(f"User authentication failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
