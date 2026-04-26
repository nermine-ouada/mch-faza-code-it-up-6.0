from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "planned"
    priority: int = 1
    deadline: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[int] = None
    deadline: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[Decimal] = None
    tags: Optional[list[str]] = None


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    status: str
    priority: int
    created_at: datetime
    deadline: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[Decimal] = None
    tags: Optional[list[str]] = None
    owner_id: Optional[int] = None


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_at: datetime
    end_at: Optional[datetime] = None
    all_day: bool = False
    project_id: Optional[int] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    all_day: Optional[bool] = None
    project_id: Optional[int] = None


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str]
    start_at: datetime
    end_at: Optional[datetime]
    all_day: bool
    owner_id: Optional[int]
    project_id: Optional[int]
    created_at: datetime


class InventoryCreate(BaseModel):
    name: str
    category: Optional[str] = None
    quantity: int = 0
    unit: Optional[str] = None
    min_required: int = 0


class InventoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: Optional[str]
    quantity: int
    unit: Optional[str]
    min_required: int
    last_updated: datetime


class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    min_required: Optional[int] = None


class InventoryTransactionCreate(BaseModel):
    inventory_id: int
    change_amount: int
    reason: str
    txn_type: str = "adjust"


class ExperimentCreate(BaseModel):
    project_id: Optional[int] = None
    result: Optional[str] = None
    success: Optional[bool] = None
    notes: Optional[str] = None


class ExperimentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: Optional[int]
    result: Optional[str]
    success: Optional[bool]
    notes: Optional[str]
    created_at: datetime


class ExperimentUpdate(BaseModel):
    project_id: Optional[int] = None
    result: Optional[str] = None
    success: Optional[bool] = None
    notes: Optional[str] = None


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None


class UserAdminCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role: str = "viewer"


class UserAdminUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None


class UserSelfUpdate(BaseModel):
    full_name: Optional[str] = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: Optional[str]
    role: str


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserClaims(BaseModel):
    sub: str
    role: str = "viewer"


class AgentTaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task: Optional[str]
    status: str
    result: Optional[str]
    created_at: datetime
    agent: Optional[str] = None
    input_payload: Optional[dict[str, Any]] = None


class AIActionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    action_type: Optional[str]
    description: Optional[str]
    agent: Optional[str] = None
    created_at: datetime
    action_metadata: Optional[dict[str, Any]] = None
    tokens: Optional[int] = None
    cost_usd: Optional[Decimal] = None


class AgentSqlProposalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    sql_text: str
    rationale: Optional[str]
    status: str
    result_text: Optional[str]
    error_text: Optional[str]
    created_at: datetime
    decided_at: Optional[datetime] = None
