import datetime
from datetime import timedelta
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
import bcrypt

# Настройки для JWT
SECRET_KEY = "supersecretkey"  # Можешь поменять на свой секрет
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Наша база данных в оперативной памяти
users_db = {}

router = APIRouter(prefix="/auth", tags=["auth"])

class UserAuth(BaseModel):
    email: EmailStr
    password: str

# Функция генерации токена
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Регистрация
@router.post("/register")
def register(user: UserAuth):
    if user.email in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
    
    try:
        # Хэшируем пароль чистым bcrypt напрямую без passlib
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

# Авторизация (Вход)
@router.post("/login")
def login(user: UserAuth):
    if user.email not in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Incorrect email or password"
        )
    
    db_user = users_db[user.email]
    
    try:
        # Сверяем пароли чистым bcrypt
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
        
    # Если всё ок — генерируем JWT-токен
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}