import pdfplumber
import re
from typing import Optional

nlp = None

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += "\n" + page_text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""
    return text

def clean_text(text: str) -> str:
    text = re.sub(r'\r', '\n', text)
    text = re.sub(r'\n\s+\n', '\n', text)
    return text.strip()

def extract_name(text: str) -> Optional[str]:
    if not text: return None
    first_line = text.splitlines()[0].strip()
    if len(first_line.split()) <= 5:
        return first_line
    return None

def extract_emails(text: str):
    pattern = r'[\w\.-]+@[\w\.-]+'
    return re.findall(pattern, text)

def extract_phone_numbers(text: str):
    pattern = r'(\+?\d[\d\-\s]{7,}\d)'
    phones = re.findall(pattern, text)
    phones = [re.sub(r'\s+', '', p) for p in phones]
    return phones

def extract_skills(text: str, skills_list):
    text_lower = text.lower()
    found = set()
    for skill in skills_list:
        if skill.lower() in text_lower:
            found.add(skill)
    return sorted(found)

def parse_resume_text(text: str, skills_list):
    text = clean_text(text)
    name = extract_name(text)
    emails = extract_emails(text)
    phones = extract_phone_numbers(text)
    skills = extract_skills(text, skills_list)
    summary = text[:800] + ("..." if len(text) > 800 else "")
    return {
        "name": name,
        "emails": emails,
        "phones": phones,
        "skills": skills,
        "summary": summary,
        "full_text": text
    }
