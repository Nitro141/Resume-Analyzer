from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
import json
import os

BASE_DIR = os.path.dirname(__file__)
JOBS_PATH = os.path.join(BASE_DIR, "jobs.json")

def load_jobs():
    with open(JOBS_PATH, "r", encoding="utf-8") as f:
        jobs = json.load(f)
    return jobs

def rank_jobs(resume_text: str, top_k=5):
    jobs = load_jobs()
    corpus = [job["description"] + " " + " ".join(job.get("requirements", [])) for job in jobs]
    docs = [resume_text] + corpus
    vectorizer = TfidfVectorizer(stop_words="english", max_features=2000)
    tfidf = vectorizer.fit_transform(docs)
    cosine_similarities = linear_kernel(tfidf[0:1], tfidf[1:]).flatten()
    ranked_idx = cosine_similarities.argsort()[::-1]
    results = []
    for idx in ranked_idx[:top_k]:
        job = jobs[idx]
        score = float(cosine_similarities[idx])
        results.append({
            "title": job["title"],
            "company": job.get("company"),
            "location": job.get("location"),
            "score": round(score, 4),
            "description": job["description"],
            "requirements": job.get("requirements", [])
        })
    return results
