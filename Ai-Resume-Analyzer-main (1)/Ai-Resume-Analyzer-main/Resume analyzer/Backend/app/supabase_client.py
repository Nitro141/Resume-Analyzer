import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables")

class SupabaseClient:
    def __init__(self, url, key):
        self.url = url
        self.key = key
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
    
    def table(self, table_name):
        return SupabaseQueryBuilder(self, table_name)
    
    def from_(self, table_name):
        return self.table(table_name)
        
    @property
    def storage(self):
        return SupabaseStorage(self)
        
    @property
    def auth(self):
        return SupabaseAuth(self)

class SupabaseAuth:
    def __init__(self, client):
        self.client = client
        
    def get_user(self, jwt):
        return UserResponse(self.client, jwt)

class UserObject:
    def __init__(self, id, email):
        self.id = id
        self.email = email

class UserResponse:
    def __init__(self, client, jwt):
        # Validate JWT via auth/v1/user endpoint
        url = f"{client.url}/auth/v1/user"
        
        # USE ANON KEY FOR AUTH VALIDATION if available, otherwise fallback to key
        api_key = SUPABASE_ANON_KEY if SUPABASE_ANON_KEY else client.key
        
        headers = {
            "apikey": api_key,
            "Authorization": f"Bearer {jwt}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.user = UserObject(data["id"], data.get("email"))
            else:
                print(f"Auth Failed: Status {response.status_code}")
                print(f"Auth Response: {response.text}")
                print(f"Auth Headers Sent (first 10 chars of token): {headers.get('Authorization', '')[:17]}...")
                self.user = None
        except Exception as e:
            print(f"Auth Exception: {e}")
            self.user = None

class SupabaseQueryBuilder:
    def __init__(self, client, table):
        self.client = client
        self.table = table
        self.params = {}
        
    def select(self, columns="*"):
        self.params["select"] = columns
        return self
        
    def eq(self, column, value):
        self.params[f"{column}"] = f"eq.{value}"
        return self
        
    def upsert(self, data, on_conflict=None):
        self.data = data
        self.method = "POST"
        self.headers = self.client.headers.copy()
        self.headers["Prefer"] = "resolution=merge-duplicates"
        if on_conflict:
            self.params["on_conflict"] = on_conflict
        return self
        
    def execute(self):
        url = f"{self.client.url}/rest/v1/{self.table}"
        
        # Build query string
        query_params = {k: v for k, v in self.params.items()}
        
        if response.status_code >= 400:
            raise Exception(f"Supabase Error: {response.text}")
            
        try:
            return Response(response.json())
        except:
            return Response({})
            
    def execute(self):
        url = f"{self.client.url}/rest/v1/{self.table}"
        
        # Build query string
        query_params = {k: v for k, v in self.params.items()}
        
        if hasattr(self, 'data'):
            # It's an UPSERT (POST)
            response = requests.post(url, headers=self.headers, json=self.data, params=query_params)
        else:
            # It's a SELECT (GET)
            response = requests.get(url, headers=self.client.headers, params=query_params)
            
        if response.status_code >= 400:
            raise Exception(f"Supabase Error: {response.text}")
            
        # Handle empty response (e.g. 204 No Content)
        if response.status_code == 204 or not response.content:
            return Response({})
            
        try:
            return Response(response.json())
        except:
            return Response({})

class SupabaseStorage:
    def __init__(self, client):
        self.client = client
        
    def from_(self, bucket):
        return SupabaseStorageBucket(self.client, bucket)

class SupabaseStorageBucket:
    def __init__(self, client, bucket):
        self.client = client
        self.bucket = bucket
        
    def remove(self, paths):
        url = f"{self.client.url}/storage/v1/object/{self.bucket}"
        headers = self.client.headers.copy()
        response = requests.delete(url, headers=headers, json={"prefixes": paths})
        return response
        
    def upload(self, path, file, file_options=None):
        url = f"{self.client.url}/storage/v1/object/{self.bucket}/{path}"
        headers = {
            "apikey": self.client.key,
            "Authorization": f"Bearer {self.client.key}",
        }
        if file_options:
            headers.update(file_options)
            
        # file is bytes
        response = requests.post(url, headers=headers, data=file)
        
        if response.status_code >= 400:
            raise Exception(f"Storage Error: {response.text}")
        return response

class Response:
    def __init__(self, data):
        self.data = data

# Initialize mockup client
supabase = SupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
