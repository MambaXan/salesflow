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


class DBContact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    company = Column(String)
    email = Column(String)
    status = Column(String, default="Active")


class DBDeal(Base):
    __tablename__ = "deals"
    id = Column(Integer, primary_key=True, index=True)
    contact_name = Column(String)
    company = Column(String)
    value = Column(String)
    date = Column(String)
    status = Column(String, default="Lead")


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


class ContactBase(BaseModel):
    name: str
    company: str
    email: str
    status: str


class ContactCreate(ContactBase):
    pass


class ContactResponse(ContactBase):
    id: int

    class Config:
        from_attributes = True


class DealBase(BaseModel):
    contact_name: str
    company: str
    value: str
    date: str
    status: str


class DealCreate(DealBase):
    pass


class DealUpdateStatus(BaseModel):
    status: str


class DealResponse(DealBase):
    id: int

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
    db_task = DBTask(**task_data.dict(), completed=False)
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
    return {"message": "Status updated", "task": db_task}


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(DBTask).filter(DBTask.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
    return {"message": "Deleted successfully"}


@app.get("/api/contacts", response_model=List[ContactResponse])
def get_contacts(db: Session = Depends(get_db)):
    return db.query(DBContact).all()


@app.post("/api/contacts")
def create_contact(contact_data: ContactCreate, db: Session = Depends(get_db)):
    db_contact = DBContact(**contact_data.dict())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return {"message": "Contact created successfully", "contact": db_contact}


@app.delete("/api/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    db_contact = db.query(DBContact).filter(DBContact.id == contact_id).first()
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(db_contact)
    db.commit()
    return {"message": "Contact deleted"}


@app.get("/api/deals", response_model=List[DealResponse])
def get_deals(db: Session = Depends(get_db)):
    return db.query(DBDeal).all()


@app.post("/api/deals")
def create_deal(deal_data: DealCreate, db: Session = Depends(get_db)):
    db_deal = DBDeal(**deal_data.dict())
    db.add(db_deal)
    db.commit()
    db.refresh(db_deal)
    return {"message": "Deal created successfully", "deal": db_deal}


@app.put("/api/deals/{deal_id}/status")
def update_deal_status(deal_id: int, status_data: DealUpdateStatus, db: Session = Depends(get_db)):
    db_deal = db.query(DBDeal).filter(DBDeal.id == deal_id).first()
    if not db_deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    db_deal.status = status_data.status
    db.commit()
    return {"message": "Deal status updated", "deal": db_deal}
