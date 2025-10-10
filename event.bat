@echo off

:: Start React CMS frontend
start cmd /k "cd /d D:/event-management/events-cms && npm start"

:: Start Node.js backend
start cmd /k "cd /d D:/event-management/events-backend && npm run start:prod"


exit