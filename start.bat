@echo off
echo ===================================================
echo Starting Store Rating Platform (Backend + Frontend)
echo ===================================================
start "StoreRate Server" cmd /k "cd server && npm run dev"
start "StoreRate Client" cmd /k "cd client && npm run dev"
echo Backend starting at: http://localhost:5000
echo Frontend starting at: http://localhost:5173
echo ===================================================
