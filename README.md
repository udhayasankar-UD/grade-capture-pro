# Thaal (தாள்) - AI Exam Grade Capture

Thaal is a professional, high-density web application built to digitize physical handwritten exam answer sheets. It bridges the physical world of grading with modern digital school administration by reading answer grids securely, instantly verifying marks, and appending them to master CSV classroom rosters.

## 🌟 Key Features

### 1. Master Roster Management
- Start your workflow by dropping in a standard Master CSV template for your class. 
- Thaal reads the template, extracts the maximum marks dynamically mapping to Parts A, B, and C.

### 2. High-Speed AI Data Extraction
- **Image Quality Pre-Check:** Natively analyzes camera uploads using OpenCV. It detects blurry photos (via Laplacian Variance) and dark photos, rejecting them instantaneously before wasting an API call.
- **Image Compression:** Raw 4K 10MB phone camera uploads are instantly re-scaled to ~300KB locally, giving you a 10x faster AI extraction speed.
- **Gemini OCR Integration:** Leverages Google's `gemini-2.5-flash` model via an optimized zero-shot strictly-constrained JSON prompt to accurately transcribe handwritten numbers, fractions, and even recognize blank spots in your answer grid.
- **Auto-Retries:** Features bulletproof frontend network resistance. If an API request is dropped or rate-limited (429 errors), the application gracefully handles the delay and auto-retries without dropping the user's workflow.

### 3. Verification Workspace
- A specialized split-screen verification environment.
- **Live Image Canvas:** Built-in tools for zooming, panning, and rotating the uploaded answer sheet artifact.
- **Keyboard-First Data Entry:** Enter, tab, and save shortcuts intended for rapid, mouse-free corrections by teachers.

### 4. Embedded "Excel-Like" Spreadsheet Dashboard
- View the entire class roster at a glance on an advanced, horizontally scrolling data grid natively inside the browser.
- **Frozen Sticky Columns:** Easily scroll through heavy Part A/B/C data columns without losing track of the student's Register Number.
- **Live Sorting & Filtering:** Native search capabilities, alongside instant Sorting by Register Number or Grand Total.
- **Conditional Formatting:** Instantly flags over-graded sections (e.g. grading 13 points on a max 10 Part A) with bright red backgrounds constraint alerts.
- **Detail Drill-Down Modal:** Clicking any student opens an expanded Master-Detail popup, breaking down exact question-by-question scoring.

## 🛠️ Tech Stack & Architecture

### Frontend (React + Vite)
- **Framework:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Custom React Hooks + `sonner` (Toast Notifications)
- **Interactivity:** `react-zoom-pan-pinch` for the image workspace canvas
- **Data Engineering:** In-browser custom CSV parsing/compiling engine

### Backend (Python + FastAPI)
- **Framework:** FastAPI, Uvicorn
- **Image Processing:** OpenCV (`cv2`), Numpy, Pillow (`PIL`)
- **AI Core:** `google-genai` SDK

## 🚀 Getting Started

### 1. Requirements
- Node.js (v18+)
- Python (v3.9+)
- A Google Gemini API Key

### 2. Backend Setup
Open a terminal and set up your Python environment:
```bash
# Navigate to the Python directory
cd src/Python

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1   # (Windows)
# or `source venv/bin/activate` (Mac/Linux)

# Install dependencies
pip install fastapi uvicorn python-multipart python-dotenv opencv-python numpy pillow google-genai

# Run server
python main.py
```

### 3. Frontend Setup
Open a new terminal at the root directory:
```bash
# Install NPM dependencies
npm install

# Start Vite development server
npm run dev
```

### 4. Configuration
Ensure you create a `.env` file in the root directory:
```env
GENAI_API_KEY=your_gemini_api_key_here
BACKEND_PORT=8000
```
## 📜 License

This project is licensed under the MIT License.

---

<p align="center">
  Crafted with ❤️ by 
  <a href="https://udhayasankar.vercel.app/">உதய UD</a>
</p>
