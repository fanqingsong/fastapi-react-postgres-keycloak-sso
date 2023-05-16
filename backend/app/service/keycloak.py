"""Module used for keycloak backend calls."""
import os
import typing as tp

from fastapi import Depends, HTTPException
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose.exceptions import JWTError
from keycloak.exceptions import KeycloakAuthenticationError, KeycloakGetError
from keycloak.keycloak_openid import KeycloakOpenID


REALM = 'master'
KEYCLOAK_BASEURL = f'http://localhost:8080/auth/realms' \
                   f'/{REALM}/protocol/openid-connect'

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{KEYCLOAK_BASEURL}/token")

keycloak_openid = KeycloakOpenID(
    server_url=os.environ.get("KEYCLOAK_SERVER_URL"),
    realm_name=os.environ.get("KEYCLOAK_REALM_NAME"),
    client_id=os.environ.get("KEYCLOAK_CLIENT_ID"),
    client_secret_key=os.environ.get("KEYCLOAK_CLIENT_SECRET_KEY"),
)

KEYCLOAK_PUBLIC_KEY = (
    "-----BEGIN PUBLIC KEY-----\n"
    f"{keycloak_openid.public_key()}"
    "\n-----END PUBLIC KEY-----"
)


async def authenticate_user(username: str, password: str) -> tp.Dict[str, str]:
    """Authenticate user with Keycloak backend.

    Args:
        username
        password

    Returns:
        Access token and refresh token with their expiration time
    """
    try:
        return keycloak_openid.token(username, password)
    except KeycloakAuthenticationError as error:
        raise HTTPException(status_code=401, detail="Invalid credentials") from error


def verify_permission(required_roles=[]):

    async def verify_token(token: str = Depends(oauth2_scheme)) -> tp.Dict[str, str]:
        """Verify token with Keycloak public key.

        Args:
            token: access token to decode

        Returns:
            Token decoded
        """
        try:
            token_info = keycloak_openid.decode_token(
                token,
                key=KEYCLOAK_PUBLIC_KEY,
                options={"verify_signature": True, "verify_aud": False, "exp": True},
            )

            print("---------------------------------------")
            print(token_info)

            resource_access = token_info['resource_access']
            app_name = os.environ.get('KEYCLOAK_CLIENT_ID')
            app_property = resource_access[app_name] if app_name in resource_access else {}
            user_roles = app_property['roles'] if 'roles' in app_property else []

            for role in required_roles:
                if role not in user_roles:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f'Role "{role}" is required to perform this action',
                    )

            return token_info
        except (KeycloakGetError, JWTError) as error:
            raise HTTPException(
                status_code=401, detail=str(error), headers={"WWW-Authenticate": "Bearer"}
            ) from error

    return verify_token


async def verify_token(token: str = Depends(oauth2_scheme)) -> tp.Dict[str, str]:
    """Verify token with Keycloak public key.

    Args:
        token: access token to decode

    Returns:
        Token decoded
    """
    try:
        return keycloak_openid.decode_token(
            token,
            key=KEYCLOAK_PUBLIC_KEY,
            options={"verify_signature": True, "verify_aud": False, "exp": True},
        )
    except (KeycloakGetError, JWTError) as error:
        raise HTTPException(
            status_code=401, detail=str(error), headers={"WWW-Authenticate": "Bearer"}
        ) from error


async def refresh_token(token: str) -> tp.Dict[str, str]:
    try:
        return keycloak_openid.refresh_token(token)
    except (KeycloakGetError) as error:
        raise HTTPException(status_code=401, detail=str(error)) from error


async def logout(token: str) -> tp.Dict[str, str]:
    try:
        return keycloak_openid.logout(token)
    except (KeycloakGetError) as error:
        raise HTTPException(status_code=401, detail=str(error)) from error
