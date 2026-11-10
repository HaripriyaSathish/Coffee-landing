import './globals.css';

export const metadata = {
  title: 'ColdPress — Slow Brew Cold Coffee',
  description: 'Concept 3D banner for a premium cold-press coffee brand.',
};

export const viewport = { themeColor: '#120a06' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=Syne:wght@600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
