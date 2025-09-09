# REFAEL Catalog — All Fixed (Full)
Built: 2025-09-07 15:12:29

## Quickstart (Windows / PowerShell)
### Backend
```powershell
cd backend
npm i
npm run db:init
npm run dev
```

### Frontend
```powershell
cd ../frontend
npm i
npm run dev       # http://localhost:3000
```

## הכל בפנים
- SQLite + Prisma (dev.db), Admin מוגן JWT
- העלאת תמונות (Multer) + הגשה סטטית `/uploads`
- תיקון תצוגה: URL מלא לתמונה (http://localhost:4001/uploads/...) בתצוגה מקדימה
- ולידציה לפני הזמנה: מינימום מוצר אחד, שם, טלפון תקין
- Gmail App Password (SMTP) בקובץ backend/.env
- CSS גלובלי `app/globals.css`, רידיירקט `/` → `/catalog`, לוגו → קטלוג
