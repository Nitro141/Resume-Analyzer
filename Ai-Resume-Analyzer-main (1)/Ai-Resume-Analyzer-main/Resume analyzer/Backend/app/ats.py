import os
import json
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not found in environment variables")

client = Groq(api_key=GROQ_API_KEY)


def analyze_resume_with_groq(resume_text: str, job_description: str):
    if not job_description or len(job_description.strip()) < 50:
        return {"error": "Job description is required and must be at least 50 characters."}

    if not resume_text or len(resume_text.strip()) < 50:
        return {"error": "Resume text is too short or empty."}

    system_prompt = """
You are a strict, enterprise-grade Applicant Tracking System (ATS).

RULES:
- Analyze the resume ONLY against the provided Job Description (JD).
- SCORING IS STRICT:
  - 85-100 (Strong Match): Candidate matches ALL critical skills and has direct, relevant experience.
  - 70-84 (Moderate Match): Good match but missing 1-2 non-critical skills or slightly less experience.
  - 0-69 (Weak Match): Missing CRITICAL skills (e.g., missing AI/LLM experience for an AI role), or irrelevant background.
- IMPORTANT: If the candidate lacks direct experience in the CORE technology of the JD (e.g., Python for a Python dev, LLMs for an AI job), the score MUST be below 70 and verdict "Weak Match".
- Do NOT inflate scores. Be realistic. A missing critical skill is a dealbreaker.

OUTPUT JSON FORMAT ONLY:
{
  "ats_score": number (0-100),
  "section_scores": {
    "parsing": number (0-20),
    "skills": number (0-35),
    "experience": number (0-25),
    "role_alignment": number (0-10),
    "education": number (0-10)
  },
  "skills_match_percentage": number (0-100),
  "missing_skills": [string],
  "strengths": [string],
  "weaknesses": [string],
  "ats_warnings": [string],
  "improvement_suggestions": [string],
  "final_verdict": "Strong Match | Moderate Match | Weak Match"
}
""".strip()

    user_prompt = f"""
RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}
""".strip()

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content

        try:
            cleaned_content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned_content)
        except json.JSONDecodeError:
            try:
                import re
                match = re.search(r"\{.*\}", content, re.DOTALL)
                if match:
                    return json.loads(match.group(0))
            except:
                pass
            
            return {
                "error": "AI response was not valid JSON",
                "raw_response": content
            }

    except Exception as e:
        return {
            "error": "Groq API call failed",
            "details": str(e)
        }


def generate_resume_with_groq(data: dict):
    job_description = data.get("job_description", "")
    if len(job_description.strip()) < 50:
        return {"error": "Job description must be at least 50 characters."}
    
    required_fields = ["full_name", "target_job_title", "skills", "work_experience", "education"]
    for field in required_fields:
        if not data.get(field):
             return {"error": f"Missing required field: {field.replace('_', ' ').title()}"}

    system_prompt = """
You are a professional resume writer and an Applicant Tracking System (ATS).

Rules:
- Generate a resume ONLY based on user input and the provided job description
- Resume must be ATS-friendly:
  - Single-column text format
  - No formatted tables
  - No icons or graphics
  - Standard headings only (Professional Summary, Skills, Work Experience, Education, etc.)
- Do NOT fabricate experience
- Use job description keywords naturally
- Optimize for keyword matching, role alignment, and clarity
- Output must be concise, professional, and recruiter-ready
- Do NOT include any markdown code blocks or ```json markers, just the raw JSON string.

Resume Sections (in order):
- Header (Name, Contact)
- Professional Summary
- Skills
- Work Experience
- Projects (if provided)
- Education
- Certifications (if provided)

OUTPUT FORMAT (STRICT JSON):
{
  "ats_score": number (0-100),
  "resume_text": "string (the full formatted resume text content with line breaks)",
  "skills_match_percentage": number (0-100),
  "missing_skills": [string],
  "optimization_notes": [string]
}
""".strip()

    user_prompt = f"""
USER DETAILS:
Name: {data.get('full_name')}
Email: {data.get('email')}
Phone: {data.get('phone')}
Location: {data.get('location')}
Target Role: {data.get('target_job_title')}
Experience: {data.get('years_of_experience')} years
Skills: {data.get('skills')}

WORK EXPERIENCE:
{data.get('work_experience')}

EDUCATION:
{data.get('education')}

PROJECTS:
{data.get('projects', 'None')}

CERTIFICATIONS:
{data.get('certifications', 'None')}

TARGET JOB DESCRIPTION:
{job_description}
""".strip()

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2,
            max_tokens=3000,
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content

        try:
            cleaned_content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned_content)
        except json.JSONDecodeError:
            try:
                import re
                match = re.search(r"\{.*\}", content, re.DOTALL)
                if match:
                    return json.loads(match.group(0))
            except:
                pass
            return {"error": "Failed to generate valid JSON resume"}

    except Exception as e:
        return {"error": f"Generation failed: {str(e)}"}
