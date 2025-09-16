// components/Preconnect.jsx
import Head from 'next/head';

export default function Preconnect({ apiBase }) {
  if (!apiBase) return null;
  try {
    const url = new URL(apiBase);
    return (
      <Head>
        <link rel="preconnect" href={`${url.origin}`} crossOrigin="" />
      </Head>
    );
  } catch {
    return null;
  }
}
