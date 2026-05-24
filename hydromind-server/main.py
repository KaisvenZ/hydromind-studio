from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models import init_db, get_session, User
from auth import create_token, ROLE_HIERARCHY
from annotations import router as annotation_router
from ai_proxy import router as ai_router
from sensor_relay import router as sensor_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="HydroMind Server", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(annotation_router)
app.include_router(ai_router)
app.include_router(sensor_router)


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/api/auth/login")
def login(body: LoginRequest):
    with get_session() as s:
        user = s.query(User).filter_by(username=body.username).first()
        if not user or user.password_hash != body.password:
            return {"error": "Invalid credentials"}
        token = create_token(user.username, user.role)
        return {"token": token, "username": user.username, "role": user.role}


@app.get("/api/auth/me")
def me(user: dict = __import__("auth").get_current_user):
    return {"username": user["username"], "role": user["role"]}


@app.get("/api/status")
def status():
    return {"status": "ok", "version": "0.1.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8777, reload=True)
