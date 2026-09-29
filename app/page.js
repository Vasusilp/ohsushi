import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <div className="hero">
        <h1><span className="dot" />ohsushi</h1>
        <p>บุฟเฟต์ซูชิและไคเซ็น · ผู้ใหญ่ 399 บาท · เด็ก 199 บาท</p>
      </div>
      <div className="wrap">
        <div className="panel">
          <h3>พนักงานหน้าร้าน</h3>
          <p>เปิดโต๊ะและสร้าง QR Code ให้ลูกค้าสแกน</p>
          <Link className="btn block" href="/generate-qr">สร้าง QR เปิดโต๊ะ</Link>
        </div>
        <div className="panel">
          <h3>พนักงานครัว</h3>
          <p>ดูออเดอร์ใหม่แบบเรียลไทม์</p>
          <Link className="btn alt block" href="/kitchen">เปิดจอครัว</Link>
        </div>
      </div>
    </main>
  );
}
