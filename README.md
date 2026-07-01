# Voice to Form Translator

Record voice input, submit it for processing, and download the resulting form. Split into a Flask API (`backend/`) and a React app (`frontend/`).

## Project structure

```
backend/    Flask JSON API (port 5001)
frontend/   React app, Create React App (port 3000)
```

## Prerequisites

- Python 3.9+
- Node.js 18+ and npm
- An Azure Storage account (queue) if you want the queue integration to actually connect

## Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in `backend/.env` with your Azure Storage values:

```
AZURE_STORAGE_ACCOUNT_NAME=
AZURE_STORAGE_QUEUE_NAME=voice-processing-queue
AZURE_STORAGE_TABLE_NAME=
AZURE_STORAGE_CONTAINER_AUDIO=
AZURE_STORAGE_CONNECTION_STRING=
PORT=5001
```

Run it:

```bash
python3 app.py
```

The API is now at `http://localhost:5001`.

## Frontend setup

```bash
cd frontend
npm install
npm start
```

The app opens at `http://localhost:3000` and calls the backend via `REACT_APP_API_URL`, set in `frontend/.env` (defaults to `http://localhost:5001`).

## Running both

Start the backend first, then the frontend, in separate terminals:

```bash
# terminal 1
cd backend && source .venv/bin/activate && python3 app.py

# terminal 2
cd frontend && npm start
```

## API endpoints

| Method | Path                       | Description                          |
|--------|----------------------------|---------------------------------------|
| POST   | `/api/submit`              | Submit audio (`audio`, `language`)   |
| GET    | `/api/status/<submissionId>` | Poll processing status              |
| GET    | `/download/<submissionId>` | Download the generated form          |
| GET    | `/api/submissions`         | List all submissions                 |
