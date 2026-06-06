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
    type: str
    title: str
    contact: str
    company: str
    time: str
    completed: bool = False

class TaskCreate(BaseModel):
    type: str
    title: str
    contact: str
    company: str
    time: str


fake_tasks_db = [
    {
        "id": 1,
        "type": "email",
        "title": "Send intro email",
        "contact": "Sarah Chen",
        "company": "Notion",
        "time": "9:00 AM",
        "completed": False,
    },
    {
        "id": 2,
        "type": "linkedin",
        "title": "Check LinkedIn reply",
        "contact": "Marcus Webb",
        "company": "Stripe",
        "time": "10:30 AM",
        "completed": True,
    },
    {
        "id": 3,
        "type": "follow-up",
        "title": "Follow-up on proposal",
        "contact": "Priya Nair",
        "company": "Linear",
        "time": "12:00 PM",
        "completed": False,
    }
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

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int):
    global fake_tasks_db

    task_exists = any(task["id"] == task_id for task in fake_tasks_db)

    if not task_exists:
        return {"error": "Task not found"}
    
    fake_tasks_db = [task for task in fake_tasks_db if task["id"] != task_id]

    return {"message": f"Task {task_id} deleted successfully"}