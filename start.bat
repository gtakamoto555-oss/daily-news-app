@echo off
echo Starting Backend Server...
start cmd /k "cd backend && npm start"

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo Application is starting. Please wait a moment and open http://localhost:5173/ in your browser.
