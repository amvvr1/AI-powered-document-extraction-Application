from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class UploadResponse(BaseModel):
    status: str
    message: str
    download_url: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None

class BatchUploadResponse(BaseModel):
    status: str
    message: str
    download_url: Optional[str] = None
    total_documents: Optional[int] = None
    successful_extractions: Optional[int] = None
    failed_documents: Optional[List[Dict[str, str]]] = None

class HealthResponse(BaseModel):
    status: str
    service: str

class APIInfoResponse(BaseModel):
    service: str
    version: str
    endpoints: Dict[str, str]

class ErrorResponse(BaseModel):
    detail: str

class CleanupResponse(BaseModel):
    status: str