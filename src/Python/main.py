from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from extract_marks import extract_marks_from_image, load_template_config, is_image_quality_acceptable, TEMPLATE_CSV_FILE
import os
import shutil
import uuid
import firebase_admin
from firebase_admin import credentials, auth, firestore
from dotenv import load_dotenv

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv(dotenv_path=env_path) # Loads the .env file from root

# Initialize Firebase Admin
db = None
def init_firebase():
    global db
    try:
        firebase_admin.get_app()
        db = firestore.client()
        print("✅ Firebase already initialized.")
    except ValueError:
        print("⏳ Initializing Firebase Admin SDK...")
        cred_json = os.getenv("FIREBASE_SERVICE_ACCOUNT")
        
        if cred_json:
            try:
                import json
                cred_dict = json.loads(cred_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                db = firestore.client()
                print("✅ Firebase initialized via Env Var.")
            except Exception as e:
                print(f"❌ Failed to initialize Firebase from Env Var: {e}")
        else:
            cred_path = os.path.join(os.path.dirname(__file__), "service-account.json")
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                db = firestore.client()
                print("✅ Firebase initialized via local file.")
            else:
                print("⚠️ Warning: No Firebase credentials found.")

try:
    init_firebase()
except Exception as e:
    print(f"🔥 UNEXPECTED INIT ERROR: {e}")

app = FastAPI()

# Allow frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"Auth Error: {e}")
        # Return the actual error temporarily so we can fix the Render setup
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

@app.post("/api/extract-marks")
async def extract_marks(image: UploadFile = File(...), user: dict = Depends(verify_token)):
    uid = user['uid']
    user_ref = db.collection('user').document(uid)
    
    # 1. Check Credits
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=403, detail="User record not found in database. Contact Admin.")
    
    credits = user_doc.to_dict().get('credits_remaining', 0)
    if credits <= 0:
        raise HTTPException(status_code=402, detail="Out of credits. Please contact administrator.")

    if not image.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Save uploaded image temporarily
    temp_filename = f"temp_{uuid.uuid4().hex}_{image.filename}"
    temp_filepath = os.path.join(os.path.dirname(__file__), temp_filename)
    
    try:
        with open(temp_filepath, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        # 2. Extract Data using your script
        cfg_path = os.path.join(os.path.dirname(__file__), TEMPLATE_CSV_FILE)
        cfg = load_template_config(cfg_path)
        
        # 1.5 Pre-process: Check Image Quality
        is_ok, quality_msg = is_image_quality_acceptable(temp_filepath)
        if not is_ok:
            raise HTTPException(status_code=400, detail=quality_msg)
        
        raw_data = extract_marks_from_image(temp_filepath, cfg)

        if raw_data is None:
            raise HTTPException(status_code=429, detail="AI Extraction failed or Rate limited.")

        # 3. Deduct Credit on Success
        user_ref.update({
            "credits_remaining": firestore.Increment(-1),
            "total_papers_scanned": firestore.Increment(1)
        })

        return raw_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except Exception as e:
                print(f"Warning: Could not remove temporary file {temp_filepath}: {e}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", 8000))
    print(f"Starting server on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
