# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel

# app = FastAPI(title="SalesFlow API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# class Task(BaseModel):
#     type: str
#     title: str
#     contact: str
#     company: str
#     time: str
#     completed: bool = False

# class TaskCreate(BaseModel):
#     type: str
#     title: str
#     contact: str
#     company: str
#     time: str


# fake_tasks_db = [
#     {
#         "id": 1,
#         "type": "email",
#         "title": "Send intro email",
#         "contact": "Sarah Chen",
#         "company": "Notion",
#         "time": "9:00 AM",
#         "completed": False,
#     },
#     {
#         "id": 2,
#         "type": "linkedin",
#         "title": "Check LinkedIn reply",
#         "contact": "Marcus Webb",
#         "company": "Stripe",
#         "time": "10:30 AM",
#         "completed": True,
#     },
#     {
#         "id": 3,
#         "type": "follow-up",
#         "title": "Follow-up on proposal",
#         "contact": "Priya Nair",
#         "company": "Linear",
#         "time": "12:00 PM",
#         "completed": False,
#     }
# ]


# @app.get("/api/tasks")
# def get_tasks():
#     return fake_tasks_db


# @app.post("/api/tasks")
# def create_task(task: Task):
#     task_dict = task.dict()
#     new_id = max([t["id"] for t in fake_tasks_db]) + 1 if fake_tasks_db else 1
#     task_dict["id"] = new_id

#     fake_tasks_db.append(task_dict)
#     return {"message": "Task created successfully", "task": task_dict}


# @app.put("/api/tasks/{task_id}")
# def toggle_task_status(task_id: int):
#     for task in fake_tasks_db:
#         if task["id"] == task_id:
#             task["completed"] = not task["completed"]
#             return {"message": "Task status updated", "task": task}
#     return {"error": "Task not found"}

# @app.delete("/api/tasks/{task_id}")
# def delete_task(task_id: int):
#     global fake_tasks_db

#     task_exists = any(task["id"] == task_id for task in fake_tasks_db)

#     if not task_exists:
#         return {"error": "Task not found"}

#     fake_tasks_db = [task for task in fake_tasks_db if task["id"] != task_id]

#     return {"message": f"Task {task_id} deleted successfully"}
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import List

DATABASE_URL = "sqlite:///./salesflow.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class DBTask(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, index=True)
    title = Column(String)
    contact = Column(String)
    company = Column(String)
    time = Column(String)
    completed = Column(Boolean, default=False)


Base.metadata.create_all(bind=engine)


class TaskBase(BaseModel):
    type: str
    title: str
    contact: str
    company: str
    time: str


class TaskCreate(TaskBase):
    pass


class TaskResponse(TaskBase):
    id: int
    completed: bool

    class Config:
        from_attributes = True


app = FastAPI(title="SalesFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/tasks", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(DBTask).all()


@app.post("/api/tasks")
def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    db_task = DBTask(
        type=task_data.type,
        title=task_data.title,
        contact=task_data.contact,
        company=task_data.company,
        time=task_data.time,
        completed=False
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return {"message": "Task created successfully", "task": db_task}


@app.put("/api/tasks/{task_id}")
def toggle_task_status(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(DBTask).filter(DBTask.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db_task.completed = not db_task.completed
    db.commit()
    db.refresh(db_task)
    return {"message": "Task status updated", "task": db_task}


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(DBTask).filter(DBTask.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(db_task)
    db.commit()
    return {"message": f"Task {task_id} deleted successfully"}
