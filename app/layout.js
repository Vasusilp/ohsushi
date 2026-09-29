import './globals.css';

export const metadata = { title: 'ohsushi', description: 'ระบบสั่งอาหารบุฟเฟต์ด้วย QR Code' };

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Mitr:wght@500;600&family=Noto+Sans+Thai:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
