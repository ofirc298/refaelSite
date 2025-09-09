התקנה מהירה — NavBar עם חיווי עגלה
1) העתק את הקובץ:
   frontend/components/NavBar.jsx

2) הוסף אותו ללייאאוט הראשי שלך (למשל ב-frontend/app/layout.jsx או בקומפוננטת Header):
   import NavBar from '../components/NavBar'
   ...
   <NavBar />

3) אין צורך בשינויי API. הקומפוננטה מאזינה ל:
   - event 'cart_add' (שנשלח מקטלוג כשמוסיפים לעגלה)
   - שינויי localStorage ב-'cart'/'cart_ping'
   ומציגה:
   - נקודה ירוקה קצרה ליד "עגלה"
   - badge עם מספר הפריטים הכולל בעגלה (סכום כמויות)
