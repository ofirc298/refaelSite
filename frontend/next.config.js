/** Next.js config – מותאם ל-Netlify Export עבור פרויקט REFAEL */
const nextConfig = {
  output: 'export',             // יוצר תיקיית out/ לצורך פרסום סטטי
  images: { unoptimized: true },// תמיכה ב-<Image/> בזמן export
  trailingSlash: false
};
module.exports = nextConfig;
