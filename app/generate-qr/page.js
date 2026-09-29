'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function GenerateQR() {
  const [table, setTable] = useState('');
  const [adult, setAdult] = useState('1');
  const [child, setChild] = useState('0');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [old, setOld] = useState(null); // session เก่าที่ค้างอยู่
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const minutes = (s) => Math.max(0, Math.round((Date.now() - new Date(s.created_at).getTime()) / 60000));

  async function openTable() {
    setErr('');
    const t = parseInt(table, 10);
    const a = parseInt(adult, 10) || 0;
    const c = parseInt(child, 10) || 0;
    if (!t || t < 1) return setErr('กรุณากรอกเลขโต๊ะเป็นตัวเลข');
    if (a + c < 1) return setErr('ต้องมีลูกค้าอย่างน้อย 1 คน');
    setBusy(true);
    const { data: existing, error: e1 } = await supabase
      .from('sessions').select('id, table_number, adult_count, child_count, created_at')
      .eq('table_number', t).eq('status', 'open').order('created_at', { ascending: false }).limit(1);
    if (e1) { setBusy(false); return setErr('เชื่อมต่อฐานข้อมูลไม่ได้: ' + e1.message); }
    if (existing && existing.length) { setOld(existing[0]); setBusy(false); return; }
    const { error: e2 } = await supabase.from('sessions')
      .insert({ table_number: t, adult_count: a, child_count: c, status: 'open' });
    setBusy(false);
    if (e2) return setErr('เปิดโต๊ะไม่สำเร็จ: ' + e2.message);
    const url = `${window.location.origin}/order/${t}`;
    setResult({ t, a, c, url });
  }

  async function closeOld() {
    setBusy(true);
    const { error } = await supabase.from('sessions').update({ status: 'closed' })
      .eq('id', old.id).eq('status', 'open');
    setBusy(false);
    if (error) { setConfirming(false); return setErr('ปิดโต๊ะเดิมไม่สำเร็จ: ' + error.message); }
    setConfirming(false); setOld(null);
  }

  async function copy() {
    try { await navigator.clipboard.writeText(result.url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }

  function reset() { setResult(null); setTable(''); setAdult('1'); setChild('0'); setOld(null); setErr(''); }

  if (result) {
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(result.url)}`;
    return (
      <main className="wrap center">
        <div className="panel">
          <h2>เปิดโต๊ะสำเร็จ</h2>
          <img className="qr" src={qr} width={300} height={300} alt={`QR Code โต๊ะ ${result.t}`} />
          <h3>โต๊ะ {result.t} · ผู้ใหญ่ {result.a} · เด็ก {result.c}</h3>
          <div className="url">{result.url}</div>
          <div className="row" style={{ marginTop: '.75rem' }}>
            <button className="btn alt sm" onClick={copy}>{copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</button>
            <button className="btn sm" onClick={reset}>เปิดโต๊ะใหม่</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap">
      <h1>เปิดโต๊ะ</h1>
      <div className="panel">
        <label htmlFor="t">เลขโต๊ะ</label>
        <input id="t" type="number" inputMode="numeric" min="1" value={table} onChange={(e) => setTable(e.target.value)} />
        <div className="row">
          <div><label htmlFor="a">ผู้ใหญ่ (399)</label>
            <input id="a" type="number" inputMode="numeric" min="0" value={adult} onChange={(e) => setAdult(e.target.value)} /></div>
          <div><label htmlFor="c">เด็ก (199)</label>
            <input id="c" type="number" inputMode="numeric" min="0" value={child} onChange={(e) => setChild(e.target.value)} /></div>
        </div>
        {err && <div className="err">{err}</div>}
        <button className="btn block" style={{ marginTop: '1.25rem' }} onClick={openTable} disabled={busy}>
          {busy ? 'กำลังทำงาน...' : 'เปิดโต๊ะ'}
        </button>
      </div>

      {old && !confirming && (
        <div className="alert" role="alert">
          <b>โต๊ะนี้มีลูกค้าอยู่ระหว่างทานอาหาร กรุณาปิดออเดอร์เดิมก่อน</b>
          <button className="btn warn block" style={{ marginTop: '.75rem' }} onClick={() => setConfirming(true)}>ปิดออเดอร์เดิม</button>
        </div>
      )}

      {old && confirming && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="box">
            <h3>ยืนยันปิดโต๊ะเดิม?</h3>
            <p>โต๊ะ {old.table_number} · ผู้ใหญ่ {old.adult_count} · เด็ก {old.child_count}<br />เปิดมาแล้ว {minutes(old)} นาที</p>
            <div className="actions">
              <button className="btn alt" onClick={() => setConfirming(false)} disabled={busy}>ยกเลิก</button>
              <button className="btn warn" onClick={closeOld} disabled={busy}>ยืนยันปิดโต๊ะเดิม</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
