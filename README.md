<div align="center">
  <img src="https://img.icons8.com/fluency/96/000000/test-passed.png" alt="Thaal Logo" width="80" />
  <h1>Thaal (தாள்) &mdash; AI Exam Grade Capture System</h1>
  <p><strong>A hyper-efficient, AI-powered web application for digitizing physical exam answer sheets.</strong></p>
  
  <p>
    <a href="https://trythaal.web.app/"><img src="https://img.shields.io/badge/Live_Demo-trythaal.web.app-10b981?style=for-the-badge&logo=firebase" alt="Live Demo" /></a>
  </p>
</div>

---

## Overview

**Thaal** bridges the physical world of grading with modern digital school administration. By leveraging Google's **Gemini OCR** and an advanced React frontend, Thaal intelligently reads complex handwritten answer grids, securely verifies student marks, flags grading errors, and perfectly aligns the captured data into your school's master class Lists via CSV.

---

## ✨ Core Features

### 1. Master Roster Management & Embedded Spreadsheet
- **Smart CSV Intake:** Start your workflow by simply dropping in a standard Master CSV template for your class.
- **Embedded Class Roster:** View the entire class at a glance on an advanced, horizontally scrolling data grid natively inside the browser.
- **Data Engineering:** Features Frozen Sticky Columns, Live Sorting (Register Number, Grand Total), Global Native Search, and Conditional Formatting for instantaneous over-grade warnings.

### 2. High-Speed AI Data Extraction
- **Image Preprocessing & Validation:** The FastAPI backend natively analyzes camera uploads using OpenCV. It rejects blurry or dark photos instantaneously before wasting an API call.
- **Intelligent Compression:** Raw 4K 10MB phone camera uploads are instantly re-scaled to ~300KB, yielding a **10x faster AI extraction speed**.
- **Gemini-2.5-Flash OCR:** Leverages a strictly-constrained zero-shot JSON prompt to flawlessly transcribe handwritten numbers, fractions (+½), and blank spots from the exam grid.

### 3. Verification Workspace
- **Split-Screen Ergonomics:** A specialized verification environment combining the physical artifact with the digitized inputs.
- **Live Image Canvas:** Built-in rich tools for purely front-end zooming, panning, and infinite rotation of the uploaded answer sheet.
- **Rapid Keyboard-First Entry:** Enter, tab, and `Ctrl+S` auto-save shortcuts intended for rapid, mouse-free corrections by teachers.

### 4. Authentication & Profile System
- **Firebase Authentication:** Fully secured login flow ensuring only authorized faculty can access the grading workspace.
- **Credits & Limits:** Built-in tracking of AI API credits directly tied to the logged-in user's profile, synced live from Firestore.
- **Dynamic Profile Menu:** A sleek, globally-available dropdown to manage sessions, view credit allocations, and verify active account credentials.

---

## 🛠️ Tech Stack & Architecture

### **Frontend (Vite + React)**
* **Core:** React 18, TypeScript, Vite
* **Styling:** Vanilla Tailwind CSS, Shadcn-like raw components
* **State & Flow:** Custom React Hooks, Context API
* **Interactions:** `react-zoom-pan-pinch` (Canvas), `lucide-react` (Icons)
* **Hosting:** Firebase Hosting

### **Backend (Python + FastAPI)**
* **Core:** Python 3.9+, FastAPI, Uvicorn
* **Image Processing:** OpenCV (`cv2`), Numpy, Pillow (`PIL`)
* **AI Engine:** Google `google-genai` SDK
* **Database:** Firebase Admin SDK (Firestore)
* **Hosting:** Render

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Google Gemini API Key
- Firebase Project Setup (Authentication + Firestore)

### 2. Environment Variables
Create a `.env` file in the root directory and populate it with your specific keys:

```env
# AI
GENAI_API_KEY=your_gemini_api_key_here

# Backend
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173,https://trythaal.web.app

# Firebase
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=thaal-ocr.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=thaal-ocr
VITE_FIREBASE_STORAGE_BUCKET=thaal-ocr.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_BACKEND_URL=http://localhost:8000
```

*Note: For production, remember to change `VITE_BACKEND_URL` to your Render deployment URL.*

### 3. Backend Setup
Open a terminal and set up your Python environment:

```bash
# Navigate to the Python directory
cd src/Python

# Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1
# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn python-multipart python-dotenv opencv-python numpy pillow google-genai firebase-admin

# Run the local server
python main.py
```

### 4. Frontend Setup
Open a new terminal at the root directory:

```bash
# Install NPM dependencies
npm install

# Start Vite development server
npm run dev
```

---

## 🌐 Production Deployment

**Frontend (Firebase Hosting)**
```bash
npm run build
firebase deploy --only hosting
```
*(Make sure to specify your exact target in `firebase.json` if using multiple sites).*

**Backend (Render)**
Deploy the Python FastAPI application via a Render Web Service. Ensure you configure your `FRONTEND_URL` environment variable on Render to gracefully handle CORS requests originating from your live Firebase domain!

---

## 📜 License

This project is licensed under the MIT License.

---

<p align="center">  
  Crafted with ❤️ by 
  <a href="https://udhayasankar.vercel.app/" target="_blank"><b>உதய UD</b></a>
</p>
