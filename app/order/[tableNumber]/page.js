'use client';
import { use, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const ADULT = 399, CHILD = 199, MAX_QTY = 5, MAX_ITEMS = 10;

export default function OrderPage({ params }) {
  const { tableNumber } = use(params); // Next.js ใหม่: params เป็น Promise
  const [state, setState] = useState('loading'); // loading | closed | open | thanks
  const [session, setSession] = useState(null);
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState(null);
  const [cart, setCart] = useState({});
  const [toast, setToast] = useState('');
  const [bill, setBill] = useState(false);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      const t = parseInt(tableNumber, 10);
      const { data: s } = await supabase.from('sessions').select('*')
        .eq('table_number', t).eq('status', 'open').order('created_at', { ascending: false }).limit(1);
      if (!s || !s.length) return setState('closed');
      setSession(s[0]);
      const [{ data: c }, { data: i }] = await Promise.all([
        supabase.from('menu_categories').select('*').order('sort_order'),
        supabase.from('menu_items').select('*').order('id'),
      ]);
      setCats(c || []); setItems(i || []); setTab(c?.[0]?.id ?? null);
      setState('open');
    })();
  }, [tableNumber]);

  const kinds = Object.keys(cart).length;
  const pieces = Object.values(cart).reduce((a, b) => a + b, 0);

  function change(name, d) {
    setCart((cur) => {
      const q = (cur[name] || 0) + d;
      const next = { ...cur };
      if (q <= 0) delete next[name];
      else if (q > MAX_QTY) return cur;
      else if (!(name in cur) && Object.keys(cur).length >= MAX_ITEMS) { setErr(`เลือกได้สูงสุด ${MAX_ITEMS} รายการต่อครั้ง`); return cur; }
      else next[name] = q;
      setErr('');
      return next;
    });
  }

  async function send() {
    setBusy(true); setErr('');
    const payload = Object.entries(cart).map(([name, quantity]) => ({ name, quantity }));
    const { error } = await supabase.from('orders').insert({
      session_id: session.id, table_number: parseInt(tableNumber, 10), items: payload, status: 'received',
    });
    setBusy(false);
    if (error) return setErr('ส่งออเดอร์ไม่สำเร็จ: ' + error.message);
    setCart({}); setToast('ส่งออเดอร์แล้ว'); setTimeout(() => setToast(''), 3000);
  }

  async function checkout() {
    setBusy(true);
    const { error } = await supabase.from('sessions').update({ status: 'closed' }).eq('id', session.id);
    setBusy(false);
    if (error) return setErr('เรียกเก็บเงินไม่สำเร็จ: ' + error.message);
    setBill(false); setState('thanks');
  }

  if (state === 'loading') return <div className="full">กำลังโหลด...</div>;
  if (state === 'closed') return <div className="full"><h2>โต๊ะนี้ยังไม่เปิดใช้งาน<br />กรุณาแจ้งพนักงาน</h2></div>;
  if (state === 'thanks') return <div className="full"><div><h1>ขอบคุณที่ใช้บริการ</h1><p>ยอดที่ต้องชำระ {total.toLocaleString()} บาท<br />กรุณาชำระเงินกับพนักงาน</p></div></div>;

  const shown = items.filter((i) => i.category_id === tab);
  return (
    <main style={{ paddingBottom: '5.5rem' }}>
      <div className="topbar">
        <h2>โต๊ะ {tableNumber}</h2>
        <button className="btn sm" onClick={() => { setTotal(session.adult_count * ADULT + session.child_count * CHILD); setBill(true); }}>เรียกเก็บเงิน</button>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
      <div className="tabs" role="tablist">
        {cats.map((c) => (
          <button key={c.id} role="tab" aria-selected={tab === c.id} className="tab" onClick={() => setTab(c.id)}>{c.name}</button>
        ))}
      </div>
      <div className="wrap">
        {shown.map((i) => (
          <div className="item" key={i.id}>
            <span>{i.name}</span>
            <div className="qty">
              {cart[i.name] > 0 && <><button aria-label={`ลด ${i.name}`} onClick={() => change(i.name, -1)}>−</button><span>{cart[i.name]}</span></>}
              <button className="plus" aria-label={`เพิ่ม ${i.name}`} onClick={() => change(i.name, 1)}>+</button>
            </div>
          </div>
        ))}
        {err && <div className="err">{err}</div>}
      </div>
      <div className="cart">
        <div><b>{kinds}</b> รายการ · <b>{pieces}</b> ชิ้น</div>
        <button className="btn" disabled={!kinds || busy} onClick={send}>{busy ? 'กำลังส่ง...' : 'ส่งออเดอร์'}</button>
      </div>

      {bill && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="box">
            <h3>เรียกเก็บเงิน</h3>
            <p>ผู้ใหญ่ {session.adult_count} × {ADULT} + เด็ก {session.child_count} × {CHILD}</p>
            <h2>{total.toLocaleString()} บาท</h2>
            <p>เมื่อยืนยันแล้วจะสั่งอาหารเพิ่มไม่ได้</p>
            <div className="actions">
              <button className="btn alt" onClick={() => setBill(false)} disabled={busy}>ยกเลิก</button>
              <button className="btn" onClick={checkout} disabled={busy}>ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
