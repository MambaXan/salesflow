from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SalesFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Task(BaseModel):
    title: str
    contact: str
    completed: bool = False

fake_tasks_db = [
    {"id": 1, "title": "Send intro email", "contact": "Sarah Diaz", "completed": False},
    {"id": 2, "title": "Phone call follow-up", "contact": "Alex Rivera", "completed": True},
    {"id": 3, "title": "LinkedIn connection request", "contact": "Matt Zhang", "completed": False}
]

@app.get("/api/tasks")
def get_tasks():
    return fake_tasks_db

@app.post("/api/tasks")
def create_task(task: Task):
    task_dict = task.dict()
    new_id = max([t["id"] for t in fake_tasks_db]) + 1 if fake_tasks_db else 1
    task_dict["id"] = new_id
    
    fake_tasks_db.append(task_dict)
    return {"message": "Task created successfully", "task": task_dict}

@app.put("/api/tasks/{task_id}")
def toggle_task_status(task_id: int):
    for task in fake_tasks_db:
        if task["id"] == task_id:
            task["completed"] = not task["completed"]
            return {"message": "Task status updated", "task": task}
    return {"error": "Task not found"}