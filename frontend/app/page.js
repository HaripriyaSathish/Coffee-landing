import Banner from '../components/Banner';
import { normalizeBanner } from '../lib/defaults';

export const dynamic = 'force-dynamic'; // always read the latest content from MySQL

async function getBanner() {
  const base = process.env.API_URL || 'http://127.0.0.1:8000';
  try {
    const res = await fetch(`${base}/api/banner.php`, { cache: 'no-store', signal: AbortSignal.timeout(3000) });
    const json = await res.json();
    if (json.ok) return { data: normalizeBanner(json.data), live: true };
  } catch {
    // fall through to defaults
  }
  return { data: normalizeBanner(null), live: false };
}

export default async function Page() {
  const { data, live } = await getBanner();
  return (
    <main>
      <Banner data={data} live={live} />
    </main>
  );
}
