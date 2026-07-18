import { Client } from "pg";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Basic admin check - ideally verify a role in db
  if (!user) {
    redirect("/login");
  }

  let stats = {
    totalDocs: 0,
    totalPages: 0,
    totalEmbeddings: 0,
    cachedDocs: 0
  };

  let recentDocs = [];

  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    const client = new Client({ connectionString });
    try {
      await client.connect();

      // Stats
      const docsRes = await client.query('SELECT COUNT(*), SUM(page_count) FROM baseparse_documents');
      stats.totalDocs = parseInt(docsRes.rows[0].count) || 0;
      stats.totalPages = parseInt(docsRes.rows[0].sum) || 0;

      const embedRes = await client.query('SELECT COUNT(*) FROM baseparse_embeddings');
      stats.totalEmbeddings = parseInt(embedRes.rows[0].count) || 0;

      // Recent docs
      const recentRes = await client.query('SELECT id, file_name, status, page_count, created_at, checksum FROM baseparse_documents ORDER BY created_at DESC LIMIT 10');
      recentDocs = recentRes.rows;
      
    } catch (e) {
      console.error(e);
    } finally {
      await client.end();
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto text-zinc-100 min-h-screen font-sans">
      <h1 className="text-3xl font-bold mb-8 tracking-tight">BaseParse V2 Admin</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-lg">
          <div className="text-sm text-zinc-400 font-medium tracking-wide uppercase mb-1">Total Documents</div>
          <div className="text-4xl font-bold text-emerald-400">{stats.totalDocs}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-lg">
          <div className="text-sm text-zinc-400 font-medium tracking-wide uppercase mb-1">Pages Extracted (Gemini)</div>
          <div className="text-4xl font-bold text-violet-400">{stats.totalPages}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-lg">
          <div className="text-sm text-zinc-400 font-medium tracking-wide uppercase mb-1">Semantic Chunks</div>
          <div className="text-4xl font-bold text-cyan-400">{stats.totalEmbeddings}</div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4 border-b border-zinc-800 pb-2">Recent Extractions</h2>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-zinc-400">
            <tr>
              <th className="px-6 py-4 font-medium">File Name</th>
              <th className="px-6 py-4 font-medium">Pages</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">SHA256 Checksum</th>
              <th className="px-6 py-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {recentDocs.map((doc: any) => (
              <tr key={doc.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-200">{doc.file_name}</td>
                <td className="px-6 py-4 text-zinc-400">{doc.page_count}</td>
                <td className="px-6 py-4">
                  <span className="bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded-full text-xs font-semibold border border-emerald-800/50">
                    {doc.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-500 font-mono text-xs max-w-[200px] truncate" title={doc.checksum}>
                  {doc.checksum || 'N/A'}
                </td>
                <td className="px-6 py-4 text-zinc-400">
                  {new Date(doc.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {recentDocs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No documents extracted yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
