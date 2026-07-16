import datetime
from datetime import timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
import bcrypt

# Настройки для JWT
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Базы данных в памяти
users_db = {}
tasks_db = {}

router = APIRouter(prefix="/auth", tags=["auth"])

# --- СХЕМЫ ДАННЫХ (Классы Pydantic всегда в самом верху) ---

class TaskCreate(BaseModel):
    title: str
    client_name: str
    company: str
    type: str  # 'Email', 'Call', 'Follow-up'
    time: str

class UserAuth(BaseModel):
    email: EmailStr
    password: str

# --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ И ДЕПЕНДЕНСИ (Должны быть выше роутов) ---

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    if email not in users_db:
        raise credentials_exception
        
    return email

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- РОУТЫ (Используют функции, объявленные выше) ---

@router.get("/tasks")
def get_tasks(current_user: str = Depends(get_current_user)):
    if current_user not in tasks_db:
        tasks_db[current_user] = []
    return tasks_db[current_user]

@router.post("/tasks")
def add_task(task: TaskCreate, current_user: str = Depends(get_current_user)):
    if current_user not in tasks_db:
        tasks_db[current_user] = []
        
    new_task = {
        "id": len(tasks_db[current_user]) + 1,
        "title": task.title,
        "client_name": task.client_name,
        "company": task.company,
        "type": task.type,
        "time": task.time,
        "completed": False
    }
    
    tasks_db[current_user].append(new_task)
    return {"status": "success", "task": new_task}

@router.post("/register")
def register(user: UserAuth):
    if user.email in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
    try:
        password_bytes = user.password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
        
        users_db[user.email] = {
            "email": user.email,
            "hashed_password": hashed_password
        }
        return {"status": "success", "message": "User created successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Bcrypt error: {str(e)}"
        )

@router.post("/login")
def login(user: UserAuth):
    if user.email not in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Incorrect email or password"
        )
    
    db_user = users_db[user.email]
    try:
        user_password_bytes = user.password.encode('utf-8')
        db_password_bytes = db_user["hashed_password"].encode('utf-8')
        
        if not bcrypt.checkpw(user_password_bytes, db_password_bytes):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Incorrect email or password"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Bcrypt verify error: {str(e)}"
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}