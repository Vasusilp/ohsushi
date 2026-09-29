# ohsushi – ระบบสั่งอาหาร QR + จอครัว

Next.js (App Router) + Supabase

## ตั้งค่า
1. Supabase → SQL Editor → รัน `supabase/schema.sql` (ตาราง + RLS + เมนูตัวอย่าง)
2. Supabase → Database → Publications → `supabase_realtime` → เปิดตาราง `orders`
3. ใส่ Environment Variables (Vercel หรือ `.env.local`):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY  (ใช้ anon key เท่านั้น ห้ามใช้ service_role)
4. `npm install && npm run dev`

## หน้าเว็บ
- `/generate-qr` พนักงานเปิดโต๊ะ + QR + ปุ่มปิดออเดอร์เดิม
- `/order/[tableNumber]` ลูกค้าสั่งอาหาร / เรียกเก็บเงิน
- `/kitchen` จอครัวเรียลไทม์

## หมายเหตุ Next.js
params ของ Dynamic Route เป็น Promise ต้อง unwrap ด้วย `use(params)` จาก React เสมอ
