import os
import json
import csv
import re
import cv2
import numpy as np
from google import genai
from PIL import Image

# ==========================================
# CONFIGURATION
# ==========================================
from dotenv import load_dotenv
# Get Gemini API key from .env file
# Try to find .env in root directory
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv(dotenv_path=env_path)

GENAI_API_KEY = os.getenv("GENAI_API_KEY")
if not GENAI_API_KEY:
    print("⚠️ Warning: GENAI_API_KEY not found in .env file. Things will likely fail!")

TEMPLATE_CSV_FILE = "CO-BL-CIA2_RDBMS.xlsx - CIA-Template.csv"

# Initialize the Google GenAI client
client = genai.Client(api_key=GENAI_API_KEY)

# ==========================================
# 1. TEMPLATE PARSER (Dynamic Constraints)
# ==========================================
def load_template_config(csv_path):
    """Reads the template to dynamically get max marks and the next S.No"""
    if not os.path.exists(csv_path):
        print(f"⚠️ Warning: Template '{csv_path}' not found. Using defaults.")
        return {"max_a": 2.0, "max_b": 4.0, "max_c": 7.0, "next_s_no": 1}

    config = {"max_a": 2.0, "max_b": 4.0, "max_c": 7.0, "next_s_no": 1}
    
    # USING cp1252 ENCODING TO PREVENT EXCEL/WINDOWS CRASHES
    try:
        with open(csv_path, mode='r', encoding='cp1252', errors='replace') as file:
            reader = list(csv.reader(file))
            
            # Extract Max Marks from "MARKS" row
            for row in reader:
                if row and row[0].strip().upper() == 'MARKS':
                    try:
                        config["max_a"] = float(row[3]) if len(row) > 3 and row[3] else config["max_a"]
                        config["max_b"] = float(row[8]) if len(row) > 8 and row[8] else config["max_b"]
                        config["max_c"] = float(row[18]) if len(row) > 18 and row[18] else config["max_c"]
                    except ValueError:
                        pass
                    break
                    
            # Find the next S.No
            for row in reversed(reader):
                if row and row[0].strip().isdigit():
                    config["next_s_no"] = int(row[0]) + 1
                    break
    except Exception as e:
        print(f"Error reading template: {e}")
        
    return config

# ==========================================
# 2. IMAGE PRE-PROCESSING / QUALITY CHECK
# ==========================================
def is_image_quality_acceptable(image_path, min_variance=100.0, min_brightness=40.0):
    """
    Validates if the image is clear and bright enough for the AI to process.
    - Uses Laplacian variance to detect blur.
    - Uses average pixel intensity to detect darkness.
    """
    try:
        # Load image via OpenCV
        img = cv2.imread(image_path)
        if img is None:
            return False, "Could not read the image file format."
            
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 1. Check Blur (Laplacian Variance)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        if variance < min_variance:
            return False, "This image is too blurry for accurate AI extraction. Please hold the camera steady and retake."
            
        # 2. Check Brightness (Average Pixel Value)
        brightness = np.mean(gray)
        if brightness < min_brightness:
            return False, "This image is too dark. Please ensure good lighting and retake the photo."
            
        return True, "Image quality is acceptable."
    except Exception as e:
        print(f"Quality check bypassed due to error: {str(e)}")
        # If OpenCV fails, we don't want to break the whole app, allow it to pass to AI
        return True, "Quality check bypassed."

# ==========================================
# 2. AI VISION EXTRACTOR
# ==========================================
def extract_marks_from_image(image_path, config):
    """Sends image to Gemini API and returns strict JSON dictionary."""
    print(f"Processing image: {image_path}...")
    img = Image.open(image_path)
    
    # 🏎️ SPEED OPTIMIZATION: Phone cameras take massive 5MB-10MB photos. 
    # Resizing it to 1500px reduces it to ~300KB, making the Gemini upload 10x faster!
    img.thumbnail((1500, 1500))

    prompt = f"""
    You are a highly accurate data extraction AI. Extract the marks from the uploaded exam answer sheet table.
    
    CRITICAL RULES:
    1. TABLE STRUCTURE: Part A (Q1-5), Part B (Q6-10), Part C (Q11-15). Each has an 'A' and 'B' column.
    2. IGNORE QUESTION NUMBERS. Do not confuse the printed question number with the handwritten mark.
    3. IGNORE TICKS (✓), CROSSES (✗), circles, and signatures. ONLY extract numerical marks.
    4. MAX MARKS (STRICT BOUNDS):
       - Part A (Q1-5) max is {config['max_a']}.
       - Part B (Q6-10) max is {config['max_b']}.
       - Part C (Q11-15) max is {config['max_c']}.
    5. EMPTY/ABSENT: If blank, dashed (-), or "AB", output 0.
    6. FRACTIONS: Convert to decimals (e.g., "1/2" -> 0.5, "1 1/2" -> 1.5).
    
    Extract the 8-digit Register Number from the top right.
    Output strictly ONLY a valid JSON object:
    {{
      "Reg No": "12345678",
      "1a": 0, "1b": 0, "2a": 0, "2b": 0, "3a": 0, "3b": 0, "4a": 0, "4b": 0, "5a": 0, "5b": 0,
      "6a": 0, "6b": 0, "7a": 0, "7b": 0, "8a": 0, "8b": 0, "9a": 0, "9b": 0, "10a": 0, "10b": 0,
      "11a": 0, "11b": 0, "12a": 0, "12b": 0, "13a": 0, "13b": 0, "14a": 0, "14b": 0, "15a": 0, "15b": 0
    }}
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[img, prompt]
        )
        
        # REGEX PARSER: Safely pulls only the JSON from the AI output
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        else:
            print("Failed to parse JSON.")
            return None
    except Exception as e:
        print("Error parsing data:", e)
        return None

# ==========================================
# 3. VALIDATION & MAPPING
# ==========================================
def validate_and_map(data, config):
    """Calculates totals, generates remarks, and formats array for the CSV template."""
    remarks =[]
    
    def get_mark(key):
        try:
            return float(data.get(key, 0))
        except (ValueError, TypeError):
            return 0.0

    # Validate Limits & Rules
    for q in range(1, 16):
        a_val = get_mark(f"{q}a")
        b_val = get_mark(f"{q}b")
        
        if a_val > 0 and b_val > 0: remarks.append(f"Q{q}: Both A & B filled")
        if a_val % 1 != 0 or b_val % 1 != 0: remarks.append(f"Q{q}: Half marks")
            
        max_allowed = config['max_a'] if q <= 5 else (config['max_b'] if q <= 10 else config['max_c'])
        if a_val > max_allowed: remarks.append(f"Q{q}a: Exceeds max {max_allowed}")
        if b_val > max_allowed: remarks.append(f"Q{q}b: Exceeds max {max_allowed}")

    final_remarks = " | ".join(list(set(remarks))) if remarks else "Valid"

    # Format for CSV Template (30 Columns)
    out_row = [""] * 30 
    out_row[0] = config["next_s_no"]
    out_row[1] = data.get("Reg No", "UNKNOWN")
    out_row[2] = "" # Name empty

    grand_total = 0
    # Q1-Q5 (Combined A+B into single column)
    for q in range(1, 6):
        val = get_mark(f"{q}a") + get_mark(f"{q}b")
        out_row[2 + q] = int(val) if val.is_integer() else val
        grand_total += val

    # Q6-Q15 (Separate A and B columns)
    col_idx = 8
    for q in range(6, 16):
        val_a = get_mark(f"{q}a")
        val_b = get_mark(f"{q}b")
        out_row[col_idx] = int(val_a) if val_a.is_integer() else val_a
        out_row[col_idx + 1] = int(val_b) if val_b.is_integer() else val_b
        col_idx += 2
        grand_total += (val_a + val_b)

    out_row[28] = int(grand_total) if grand_total.is_integer() else grand_total
    out_row[29] = final_remarks

    return out_row, final_remarks

# ==========================================
# 4. DATABASE / CSV SAVER
# ==========================================
def save_to_csv(mapped_row):
    """Appends the formatted row safely to the CSV file"""
    try:
        # USING cp1252 TO ALLOW SAVING SPECIAL CHARACTERS
        with open(TEMPLATE_CSV_FILE, mode='a', newline='', encoding='cp1252', errors='replace') as file:
            writer = csv.writer(file)
            writer.writerow(mapped_row)
        print(f"✅ Saved S.No {mapped_row[0]} | Reg: {mapped_row[1]} to CSV.")
        return True
    except PermissionError:
        print(f"❌ ERROR: Cannot save data! Close '{TEMPLATE_CSV_FILE}' in Excel.")
        return False

# ==========================================
# MAIN SCRIPT EXECUTION
# ==========================================
if __name__ == "__main__":
    IMAGE_FILE = "answer_sheet.jpeg" 
    
    # Run Pipeline
    cfg = load_template_config(TEMPLATE_CSV_FILE)
    if cfg:
        raw_json = extract_marks_from_image(IMAGE_FILE, cfg)
        if raw_json:
            final_row, errors = validate_and_map(raw_json, cfg)
            save_to_csv(final_row)