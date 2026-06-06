from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    username: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    photo_url: Optional[str] = None
    phone: Optional[str] = None
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleResponse(RoleBase):
    id: int

    class Config:
        from_attributes = True


class UserWithRoles(UserResponse):
    roles: List[RoleResponse] = []
    condominiums: List[int] = []

    class Config:
        from_attributes = True


class UserCreateAdmin(UserBase):
    password: Optional[str] = None
    phone: Optional[str] = None
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    role_ids: List[int] = []
    condominium_ids: List[int] = []
    must_change_password: Optional[bool] = True


class UserUpdateAdmin(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    is_active: Optional[bool] = None
    role_ids: Optional[List[int]] = None
    condominium_ids: Optional[List[int]] = None
    password: Optional[str] = None


class CondominiumInfo(BaseModel):
    id: int
    name: str
    property_ids: Optional[List[int]] = None


class UserDetailResponse(UserResponse):
    roles: List[RoleResponse] = []
    condominiums: List[CondominiumInfo] = []
    needs_password_change: bool = False
    must_change_password: Optional[bool] = False
    totp_enabled: Optional[bool] = False

    class Config:
        from_attributes = True
