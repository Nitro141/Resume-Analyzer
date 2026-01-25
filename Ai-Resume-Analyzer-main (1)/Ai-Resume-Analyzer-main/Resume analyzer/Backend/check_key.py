import os
import json
import base64
from dotenv import load_dotenv

# Load from the correct path relative to where we run it
load_dotenv("app/.env")

def get_role(token):
    if not token:
        return "Missing Token"
    if token.count('.') != 2:
        return "Invalid Token Format"
    try:
        payload = token.split('.')[1]
        # Add padding if needed
        payload += '=' * (-len(payload) % 4)
        decoded = base64.b64decode(payload)
        data = json.loads(decoded)
        return data.get("role", "unknown")
    except Exception as e:
        return f"Error decoding: {e}"

key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
role = get_role(key)

print("-" * 50)
print(f"🔑 CHECKING BACKEND KEY...")
print(f"Role found in key: '{role}'")

if role == 'service_role':
    print("✅ GREAT! You are using the correct SERVICE_ROLE key.")
else:
    print("❌ PROBLEM: You are using the 'anon' key.")
    print("👉 FIX: Go to Supabase > Project Settings > API.")
    print("👉 Copy the key labeled 'service_role' (secret).")
    print("👉 Paste it into Backend/app/.env as SUPABASE_SERVICE_ROLE_KEY.")
print("-" * 50)
