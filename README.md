# Project Demo

This is a modern web application consisting of a **React (Vite)** frontend and a **FastAPI** backend with **MongoDB**.

## Project Structure

- `frontend/`: A React application built with Vite (`npm`).
- `backend/`: A FastAPI backend utilizing a Python virtual environment and an organized file app code structure.

---

## 🚀 Getting Started

### 1. Backend Setup

Open a terminal and navigate to the backend directory:
```bash
cd backend
```

Create a virtual environment:
```bash
python -m venv venv
```

Activate the virtual environment:
- On Windows: `.\venv\Scripts\activate`
- On Mac/Linux: `source venv/bin/activate`

Install dependencies:
```bash
pip install -r requirements.txt
```

Run the backend server:
```bash
uvicorn app.main:app --reload
```
The server will start at `http://127.0.0.1:8000`.

### 2. Frontend Setup

Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

Install the dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Your React app will typically be available at `http://localhost:5173`.
