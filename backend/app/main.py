"""Main module."""
from fastapi import Depends, FastAPI, Request
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

# idp = FastAPIKeycloak(
#     # server_url=os.environ.get("KEYCLOAK_SERVER_URL"),
#     server_url="http://keycloak:8080/auth",
#     client_id=os.environ.get("KEYCLOAK_CLIENT_ID"),
#     client_secret=os.environ.get("KEYCLOAK_CLIENT_SECRET_KEY"),
#     admin_client_secret="065a7a30-9019-4718-a017-697835cf5a20",
#     realm=os.environ.get("KEYCLOAK_REALM_NAME"),
#     callback_uri="http://localhost:8888/callback"
# )

# idp.add_swagger_config(app)





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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", reload=True, port=8888)  # nosec
