from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from workflow import doc_to_excel, multiple_docs_to_excel
from typing import Optional, List
import os
from pathlib import Path
import uuid
import shutil


app = FastAPI(title="Document Parser API", version="1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("temp_uploads")
OUTPUT_DIR = Path("outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

@app.post("/upload")
async def upload_and_process(
    filess: List[UploadFile] = File(...),
    query: str = Form(...)
):
    """Upload document(s) and extract data to Excel"""
    
    # Validate files
    if not filess:
        raise HTTPException(status_code=400, detail="No files provided")
    
    allowed_extensions = ['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.docx']
    temp_paths = []
    
    try:
        # Save all uploaded files
        for file in filess:
            if not file.filename:
                raise HTTPException(status_code=400, detail="File without name provided")
            
            file_extension = Path(file.filename).suffix.lower()
            if file_extension not in allowed_extensions:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unsupported file type: {file_extension}. Allowed: {', '.join(allowed_extensions)}"
                )
            
            # Save file
            file_id = str(uuid.uuid4())
            temp_filename = f"{file_id}_{file.filename}"
            temp_path = UPLOAD_DIR / temp_filename
            
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            temp_paths.append(str(temp_path))
        
        # Process based on number of files
        if len(filess) == 1:
            # Single document processing
            result = doc_to_excel(
                doc_path=temp_paths[0],
                query=query,
                output_filename=f"{str(uuid.uuid4())[:8]}_extracted.xlsx"
            )
        else:
            # Batch processing
            result = multiple_docs_to_excel(
                document_paths=temp_paths,
                query=query,
                output_filename=f"batch_{str(uuid.uuid4())[:8]}.xlsx"
            )
        
        # Clean up temp files
        for path in temp_paths:
            if os.path.exists(path):
                os.remove(path)
        
        if result["status"] == "success":
            return {
                "status": "success",
                "message": result["message"],
                "download_url": f"/download/{Path(result['excel_path']).name}",
                "extracted_data": result.get("extracted_data")
            }
        else:
            raise HTTPException(status_code=500, detail=result["message"])
            
    except Exception as e:
        # Clean up on error
        for path in temp_paths:
            if os.path.exists(path):
                os.remove(path)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    

@app.get("/download/{filename}")
async def download_excel(filename: str):
    """Download generated Excel file"""
    
    file_path = Path(filename)
    
    # Security check - only allow files in current directory
    if not file_path.name == filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@app.delete("/cleanup/{filename}")
async def cleanup_file(filename: str):
    """Delete generated file after download"""
    
    file_path = Path(filename)
    
    if file_path.exists():
        os.remove(file_path)
        return {"status": "File deleted"}
    else:
        raise HTTPException(status_code=404, detail="File not found")

@app.get("/health")
async def health_check():
    """API health check"""
    return {"status": "healthy", "service": "Document Parser API"}

@app.get("/docs")
async def root():
    """API info"""
    return {
        "service": "Document Parser API",
        "version": "1.0.0",
        "endpoints": {
            "upload": "POST /upload - Upload document and extract data",
            "download": "GET /download/{filename} - Download Excel file",
            "health": "GET /health - Health check"
        }
    }
