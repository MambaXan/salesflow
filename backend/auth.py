import datetime
from datetime import timedelta
import json
import os
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

# Пути к файлам сохранения
USERS_FILE = "users.json"
TASKS_FILE = "tasks.json"
PIPELINE_FILE = "pipeline.json"

# Функции для работы с файлами (перенесли вверх, чтобы не было NameError)
def load_data(filepath, default_value):
    if not os.path.exists(filepath):
        return default_value
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default_value

def save_data(filepath, data):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# Теперь вызовы функций сработают идеально
pipeline_db = load_data(PIPELINE_FILE, {})
users_db = load_data(USERS_FILE, {})
tasks_db = load_data(TASKS_FILE, {})

router = APIRouter(prefix="/auth", tags=["auth"])

# --- СХЕМЫ ДАННЫХ ---
# ... дальше твой старый код без изменений ...

# --- СХЕМЫ ДАННЫХ ---

class TaskCreate(BaseModel):
    title: str
    client_name: str
    company: str
    type: str
    time: str

class UserAuth(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    first_name: str
    last_name: str

class LeadCreate(BaseModel):
    client_name: str
    company: str
    value: int
    stage: str  # 'Lead', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost'

class LeadMove(BaseModel):
    stage: str

# --- ДЕПЕНДЕНСИ ---

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

# --- РОУТЫ ---

@router.get("/me")
def get_current_user_info(current_user: str = Depends(get_current_user)):
    user_tasks = tasks_db.get(current_user, [])
    total_tasks = len(user_tasks)
    completed_tasks = len([t for t in user_tasks if t.get("completed")])
    user_data = users_db.get(current_user, {})
    
    return {
        "email": current_user,
        "first_name": user_data.get("first_name", ""),
        "last_name": user_data.get("last_name", ""),
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks
    }

@router.post("/me")
def update_user_profile(data: UserUpdate, current_user: str = Depends(get_current_user)):
    if current_user in users_db:
        users_db[current_user]["first_name"] = data.first_name
        users_db[current_user]["last_name"] = data.last_name
        save_data(USERS_FILE, users_db)  # Сохраняем изменения профиля
        return {"status": "success", "message": "Profile updated"}
    raise HTTPException(status_code=404, detail="User not found")

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
    save_data(TASKS_FILE, tasks_db)  # Сохраняем таски на диск
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
            "hashed_password": hashed_password,
            "first_name": "",
            "last_name": ""
        }
        save_data(USERS_FILE, users_db)  # Сохраняем нового юзера на диск
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

@router.patch("/tasks/{task_id}")
def toggle_task_status(task_id: int, current_user: str = Depends(get_current_user)):
    if current_user not in tasks_db:
        raise HTTPException(status_code=404, detail="No tasks found for user")
        
    # Ищем задачу по id
    for task in tasks_db[current_user]:
        if task["id"] == task_id:
            task["completed"] = not task["completed"] # инвертируем статус
            save_data(TASKS_FILE, tasks_db) # сохраняем в JSON!
            return {"status": "success", "task": task}
            
    raise HTTPException(status_code=404, detail="Task not found")

@router.get("/pipeline")
def get_pipeline(current_user: str = Depends(get_current_user)):
    if current_user not in pipeline_db:
        pipeline_db[current_user] = []
    return pipeline_db[current_user]

# Добавить новую сделку
# Добавить новую сделку
@router.post("/pipeline")
def add_lead(lead: LeadCreate, current_user: str = Depends(get_current_user)):
    if current_user not in pipeline_db:
        pipeline_db[current_user] = []
        
    # Надежная генерация ID: берем макс. id из существующих + 1, либо 1
    existing_leads = pipeline_db[current_user]
    new_id = max([l["id"] for l in existing_leads]) + 1 if existing_leads else 1
    
    new_lead = {
        "id": new_id,
        "client_name": lead.client_name,
        "company": lead.company,
        "value": lead.value,
        "stage": lead.stage,
        "date": datetime.datetime.now().strftime("%Y-%m-%d")
    }
    
    pipeline_db[current_user].append(new_lead)
    save_data(PIPELINE_FILE, pipeline_db)
    
    # Возвращаем именно ключ "lead", который ждет фронтенд!
    return {"status": "success", "lead": new_lead}

# Перетащить сделку на другой этап (колонку)
@router.patch("/pipeline/{lead_id}")
def move_lead(lead_id: int, data: LeadMove, current_user: str = Depends(get_current_user)):
    if current_user not in pipeline_db:
        raise HTTPException(status_code=404, detail="No leads found for user")
        
    for lead in pipeline_db[current_user]:
        if lead["id"] == lead_id:
            lead["stage"] = data.stage
            save_data(PIPELINE_FILE, pipeline_db)
            return {"status": "success", "lead": lead}
            
    raise HTTPException(status_code=404, detail="Lead not found")