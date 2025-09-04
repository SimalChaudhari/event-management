@echo off
:: Start Node.js backend
start cmd /k "cd /d D:\event-management\events-backend && npm run start:dev"

:: Start React CMS frontend
start cmd /k "cd /d D:\event-management\events-cms && npm run start"

exit