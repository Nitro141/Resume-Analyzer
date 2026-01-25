import os
import httpx
import json
from .ats import client as groq_client

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")
ADZUNA_BASE_URL = "http://api.adzuna.com/v1/api/jobs"

async def get_search_keywords(resume_text: str):
    system_prompt = """
    Extract the candidate's primary JOB TITLE (e.g., "Python Developer", "Data Scientist") 
    and TOP 5 most relevant TECHNICAL SKILLS.
    Return JSON only: {"role": "String", "skills": ["Skill1", "Skill2", ...]}
    """
    
    try:
        completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": resume_text[:3000]}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0,
            response_format={"type": "json_object"}
        )
        data = json.loads(completion.choices[0].message.content)
        return data.get("role", ""), data.get("skills", [])
    except Exception as e:
        print(f"Keyword extraction failed: {e}")
        return "", []

async def fetch_jobs(role: str, skills: list, location: str = "India"):
    if not ADZUNA_APP_ID or "PLACEHOLDER" in ADZUNA_APP_ID:
        return get_mock_jobs()

    what_query = f"{role} {' '.join(skills[:2])}"
    
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "results_per_page": 10,
        "what": what_query,
        "where": location,
        "content-type": "application/json"
    }
    
    country_code = "in"
    if location.lower() in ["us", "usa", "united states"]: country_code = "us"
    elif location.lower() in ["uk", "united kingdom"]: country_code = "gb"
    
    print(f"Adzuna Query: {what_query} in {location} (Country: {country_code})")
    print(f"Adzuna Params: {params}")
    
    url = f"{ADZUNA_BASE_URL}/{country_code}/search/1"
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, params=params)
            
            if resp.status_code != 200:
                print(f"Adzuna API Error {resp.status_code}: {resp.text}")
                return get_mock_jobs(role)
            
            data = resp.json()
            results = data.get("results", [])
            print(f"Adzuna Results Found: {len(results)}")
            
            if not results:
                print("No results found. Returning mock data.")
                return get_mock_jobs(role)
                
            return transform_adzuna_results(results, skills)
        except Exception as e:
            print(f"Adzuna Exception: {e}")
            return get_mock_jobs(role)

def transform_adzuna_results(results, user_skills):
    transformed = []
    user_skills_set = {s.lower() for s in user_skills}
    
    for job in results:
        description = job.get("description", "").lower()
        title = job.get("title", "").lower()
        combined_text = f"{title} {description}"
        
        matched_count = sum(1 for s in user_skills_set if s in combined_text)
        total_skills = len(user_skills_set) if user_skills_set else 1
        match_percentage = min(95, int((matched_count / total_skills) * 100) + 40)
        
        missing = [s for s in user_skills_set if s not in combined_text]
        
        transformed.append({
            "job_title": job.get("title", "Unknown Role").replace("<strong>", "").replace("</strong>", ""),
            "company": job.get("company", {}).get("display_name", "Confidential"),
            "location": job.get("location", {}).get("display_name", "Remote/India"),
            "match_percentage": match_percentage,
            "missing_skills": missing[:3],
            "apply_url": job.get("redirect_url"),
            "source": "Adzuna",
            "description": job.get("description", "")[:200] + "..."
        })
        
    transformed.sort(key=lambda x: x["match_percentage"], reverse=True)
    return transformed

def get_mock_jobs(query="Developer"):
    q = query.replace(" ", "%20")
    return [
        {
            "job_title": "Senior Python Developer",
            "company": "TechFusion Systems",
            "location": "Bangalore, India",
            "match_percentage": 92,
            "missing_skills": ["Kubernetes"],
            "apply_url": f"https://www.adzuna.in/search?q={q}",
            "source": "Adzuna (Mock)",
            "description": "Looking for an experienced Python developer to lead our backend team..."
        },
        {
            "job_title": "Backend Engineer (Remote)",
            "company": "CloudScale Inc",
            "location": "Remote",
            "match_percentage": 85,
            "missing_skills": ["GraphQL", "AWS"],
            "apply_url": f"https://www.adzuna.in/search?q={q}",
            "source": "Adzuna (Mock)",
            "description": "Join our distributed team building scalable cloud solutions..."
        },
        {
            "job_title": "Full Stack Developer",
            "company": "InnovateX",
            "location": "Hyderabad",
            "match_percentage": 78,
            "missing_skills": ["React Native"],
            "apply_url": f"https://www.adzuna.in/search?q={q}",
            "source": "Adzuna (Mock)",
            "description": "We need a full stack wizard with Python and React experience..."
        }
    ]
