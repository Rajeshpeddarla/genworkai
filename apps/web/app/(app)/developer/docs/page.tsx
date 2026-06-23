import DocsViewer from './DocsViewer';

export const dynamic = 'force-dynamic';

export default async function DeveloperDocsPage() {
  // We can fetch the openapi JSON dynamically or just import the handler
  // For simplicity, we can fetch it from our own API route using the absolute URL
  // But since we are inside the same Next.js app, we can just hit localhost or use an absolute URL
  // Better yet, just import the JSON directly or construct it on the server.
  
  // Let's fetch it from the route so it's always the source of truth
  let openapi = null;
  try {
    const headers = new Headers();
    const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${host}/api/openapi.json`, { cache: 'no-store' });
    if (res.ok) {
      openapi = await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch openapi spec", err);
  }

  return (
    <div className="h-full flex">
      <DocsViewer initialSpec={openapi} />
    </div>
  );
}
