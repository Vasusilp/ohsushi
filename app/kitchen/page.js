'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from('orders').select('*')
        .in('status', ['received', 'cooking']).order('created_at', { ascending: true });
      if (!active) return;
      if (error) setErr(error.message); else setOrders(data);
    })();

    const ch = supabase.channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (p) => {
        const o = p.new;
        setOrders((cur) => {
          if (p.eventType === 'INSERT') return cur.some((x) => x.id === o.id) ? cur : [...cur, o];
          if (p.eventType === 'UPDATE') {
            if (o.status === 'served') return cur.filter((x) => x.id !== o.id);
            return cur.some((x) => x.id === o.id) ? cur.map((x) => (x.id === o.id ? o : x)) : [...cur, o];
          }
          return cur;
        });
      }).subscribe();

    return () => { active = false; supabase.removeChannel(ch); };
  }, []);

  async function setStatus(o, status) {
    // อัปเดตหน้าจอทันที แล้วค่อยบันทึก
    setOrders((cur) => (status === 'served' ? cur.filter((x) => x.id !== o.id) : cur.map((x) => (x.id === o.id ? { ...x, status } : x))));
    const { error } = await supabase.from('orders').update({ status }).eq('id', o.id);
    if (error) setErr(error.message);
  }

  return (
    <main className="wide">
      <div className="topbar"><h2>จอครัว · {orders.length} ออเดอร์ค้าง</h2></div>
      {err && <div className="err" style={{ padding: '0 1rem' }}>{err}</div>}
      {orders.length === 0 && <div className="full" style={{ minHeight: '60vh' }}>ยังไม่มีออเดอร์ ออเดอร์ใหม่จะขึ้นที่นี่ทันที</div>}
      <div className="grid">
        {orders.map((o) => (
          <div key={o.id} className={`card ${o.status === 'cooking' ? 'cooking' : ''}`}>
            <span className="time">{new Date(o.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="tbl">โต๊ะ {o.table_number}</div>
            <ul>{o.items.map((it, k) => <li key={k}><span>{it.name}</span><b>× {it.quantity}</b></li>)}</ul>
            <div className="actions">
              {o.status === 'received' && <button className="btn warn" onClick={() => setStatus(o, 'cooking')}>เริ่มทำ</button>}
              <button className="btn green" onClick={() => setStatus(o, 'served')}>จัดเสิร์ฟแล้ว</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
