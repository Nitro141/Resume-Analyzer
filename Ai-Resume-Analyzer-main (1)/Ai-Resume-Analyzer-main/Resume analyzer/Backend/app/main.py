import os
import json
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
import shutil
from typing import Optional

from .resume_parser import extract_text_from_pdf, parse_resume_text
from .matcher import rank_jobs
from .ats import analyze_resume_with_groq
from .supabase_client import supabase
from .adzuna_service import get_search_keywords, fetch_jobs

UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

PROFILE_DIR = BASE_DIR / "profile_storage"
PROFILE_DIR.mkdir(exist_ok=True)
PROFILE_RESUME_PATH = PROFILE_DIR / "resume.pdf"
PROFILE_METADATA_PATH = PROFILE_DIR / "metadata.json"

app = FastAPI(title="Smart AI Resume Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        token = authorization.replace("Bearer ", "")
        
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return user_response.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


@app.post("/profile/resume")
async def upload_profile_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    try:
        content = await file.read()
        
        temp_path = UPLOAD_DIR / f"temp_{user_id}.pdf"
        with open(temp_path, "wb") as f:
            f.write(content)
        
        try:
            text = extract_text_from_pdf(str(temp_path))
        finally:
            if temp_path.exists():
                temp_path.unlink()
        
        if not text or len(text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract sufficient text from this PDF (scanned or empty).")
        
        storage_path = f"{user_id}/resume.pdf"
        
        try:
            supabase.storage.from_("resumes").remove([storage_path])
        except:
            pass
        
        supabase.storage.from_("resumes").upload(
            path=storage_path,
            file=content,
            file_options={"content-type": "application/pdf"}
        )
        
        from datetime import datetime
        metadata = {
            "user_id": user_id,
            "filename": file.filename,
            "uploaded_at": datetime.now().isoformat(),
            "text": text,
            "storage_path": storage_path
        }
        
        try:
            supabase.table("profile_resumes").upsert(metadata, on_conflict="user_id").execute()
        except Exception as e:
            print(f"Upsert DB Error: {e}")
            raise HTTPException(status_code=500, detail=f"Database Upsert Error: {str(e)}")
        
        return {
            "message": "Resume saved to profile",
            "filename": file.filename,
            "uploaded_at": metadata["uploaded_at"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save resume: {str(e)}")

@app.get("/profile/resume")
async def get_profile_resume(user_id: str = Depends(get_current_user)):
    try:
        response = supabase.table("profile_resumes").select("*").eq("user_id", user_id).execute()
        
        if not response.data or len(response.data) == 0:
            return {"exists": False}
        
        resume_data = response.data[0]
        return {
            "exists": True,
            "filename": resume_data.get("filename"),
            "uploaded_at": resume_data.get("uploaded_at")
        }
    except Exception as e:
        return {"exists": False}


@app.post("/analyze_ats")
async def analyze_ats(
    job_description: str = Form(...),
    file: UploadFile = File(None),
    resume_source: str = Form("upload")
):
    text = ""
    
    if resume_source == "profile":
        if not PROFILE_METADATA_PATH.exists():
            raise HTTPException(status_code=400, detail="No resume found in profile. Please upload one first.")
        
        try:
            with open(PROFILE_METADATA_PATH, "r") as f:
                data = json.load(f)
                text = data.get("text", "")
        except:
             raise HTTPException(status_code=500, detail="Profile resume data is corrupted.")

    elif file:
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        if file.filename.lower().endswith(".pdf"):
            text = extract_text_from_pdf(str(file_path))
        else:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
            except:
                pass
    else:
        raise HTTPException(status_code=400, detail="You must either provide a file or select 'Use Profile Resume'.")

    if not text or len(text.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Unable to extract sufficient text from resume"
        )
    
    result = analyze_resume_with_groq(text, job_description)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result

@app.post("/generate_resume")
async def generate_resume_endpoint(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(None),
    location: str = Form(None),
    target_job_title: str = Form(...),
    years_of_experience: str = Form(...),
    skills: str = Form(...),
    work_experience: str = Form(...),
    education: str = Form(...),
    projects: str = Form(None),
    certifications: str = Form(None),
    job_description: str = Form(...)
):
    from .ats import generate_resume_with_groq
    
    data = {
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "location": location,
        "target_job_title": target_job_title,
        "years_of_experience": years_of_experience,
        "skills": skills,
        "work_experience": work_experience,
        "education": education,
        "projects": projects,
        "certifications": certifications,
        "job_description": job_description
    }

    result = generate_resume_with_groq(data)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@app.post("/jobs/recommend")
async def recommend_jobs(
    file: Optional[UploadFile] = File(None),
    use_profile: bool = Form(False),
    location: str = Form("India"),
    user_id: str = Depends(get_current_user)
):
    resume_text = ""
    
    if use_profile:
        try:
            response = supabase.table("profile_resumes").select("text").eq("user_id", user_id).execute()
            if not response.data or len(response.data) == 0:
                raise HTTPException(status_code=404, detail="No profile resume found.")
            resume_text = response.data[0]["text"]
        except Exception as e:
            msg = str(e)
            if "404" in msg: raise HTTPException(status_code=404, detail="No profile resume found.")
            raise HTTPException(status_code=500, detail=f"Database Fetch Error: {msg}")
            
    elif file:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
        
        try:
            temp_filename = f"temp_{user_id}_{file.filename}"
            with open(temp_filename, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            resume_text = extract_text_from_pdf(temp_filename)
            
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File Parse Error: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Please upload a resume or use profile resume.")
        
    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from resume.")
        
    role, skills = await get_search_keywords(resume_text)
    
    jobs = await fetch_jobs(role, skills, location)
    
    return {
        "recommended_jobs": jobs,
        "keywords": {"role": role, "skills": skills[:5]} 
    }
