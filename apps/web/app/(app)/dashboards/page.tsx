"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, LayoutDashboard, MoreVertical, Pencil, Trash, Play, Search, Folder, Database } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [databases, setDatabases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newDashboard, setNewDashboard] = useState({ name: "", description: "", dataSourceId: "", prompt: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchDashboards();
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      const res = await fetch("/api/databases");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDatabases(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboards = async () => {
    try {
      const res = await fetch("/api/dashboards");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDashboards(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDashboard.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const endpoint = newDashboard.prompt.trim() 
        ? "/api/ai/dashboard/generate-dashboard" 
        : "/api/dashboards";

      const bodyData = newDashboard.prompt.trim()
        ? {
            name: newDashboard.name,
            description: newDashboard.description,
            dataSourceId: newDashboard.dataSourceId ? parseInt(newDashboard.dataSourceId, 10) : null,
            prompt: newDashboard.prompt,
          }
        : {
            name: newDashboard.name,
            description: newDashboard.description,
            dataSourceId: newDashboard.dataSourceId ? parseInt(newDashboard.dataSourceId, 10) : null,
            coverColor: "#8b5cf6", // violet
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      const data = await res.json();
      if (data && data.id) {
        router.push(`/dashboards/${data.id}`);
      } else if (data && data.dashboardId) {
        router.push(`/dashboards/${data.dashboardId}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setIsCreating(false);
    }
  };

  const deleteDashboard = async (id: number) => {
    if (!confirm("Are you sure you want to delete this dashboard?")) return;
    try {
      await fetch(`/api/dashboards/${id}`, { method: "DELETE" });
      setDashboards((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = dashboards.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 dark:border-white/10 px-6 bg-card">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Dashboards & BI</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search dashboards..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-white/10 bg-black/5 dark:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 w-64"
            />
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 rounded-xl bg-black/5 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-xl bg-card/50">
              <LayoutDashboard className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
              <h3 className="text-lg font-medium text-foreground">No dashboards yet</h3>
              <p className="text-zinc-500 text-sm mt-1 mb-4">Create your first dashboard to start visualizing data.</p>
              <button 
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Dashboard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((dashboard) => (
                <div key={dashboard.id} className="group relative flex flex-col bg-card rounded-xl border border-zinc-200 dark:border-white/10 overflow-hidden hover:shadow-lg hover:border-violet-500/50 dark:hover:border-violet-400/50 transition-all duration-300">
                  <Link href={`/dashboards/${dashboard.id}`} className="absolute inset-0 z-10" />
                  
                  {/* Cover */}
                  <div 
                    className="h-24 w-full relative bg-black/5 dark:bg-white/5" 
                    style={{ borderTop: `4px solid ${dashboard.coverColor || '#8b5cf6'}` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-foreground truncate" title={dashboard.name}>
                        {dashboard.name}
                      </h3>
                      <div className="relative z-20">
                        <button 
                          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteDashboard(dashboard.id);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 flex-1">
                      {dashboard.description || "No description provided."}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-3 border-t border-zinc-200 dark:border-white/10">
                      <div className="flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5" />
                        <span>{dashboard.dataSourceId ? 'Connected' : 'No Data Source'}</span>
                      </div>
                      <span>{dashboard.updatedAt ? formatDistanceToNow(new Date(dashboard.updatedAt), { addSuffix: true }) : 'Just now'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-white/10 overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-white/10">
              <h2 className="text-xl font-bold text-foreground">Create Dashboard</h2>
              <p className="text-sm text-zinc-500 mt-1">Set up a new visualization workspace.</p>
            </div>
            
            <form onSubmit={createDashboard} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Dashboard Name *
                </label>
                <input
                  type="text"
                  required
                  value={newDashboard.name}
                  onChange={e => setNewDashboard({ ...newDashboard, name: e.target.value })}
                  placeholder="e.g. Sales Overview"
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newDashboard.description}
                  onChange={e => setNewDashboard({ ...newDashboard, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Data Source
                </label>
                <select
                  value={newDashboard.dataSourceId}
                  onChange={e => setNewDashboard({ ...newDashboard, dataSourceId: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">No Data Source (Connect later)</option>
                  {databases.map(db => (
                    <option key={db.id} value={db.id}>
                      {db.name || `${db.engine} - ${db.databaseName}`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-zinc-500 mt-1">Connecting a data source enables AI SQL generation.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  AI Prompt (Optional)
                </label>
                <textarea
                  value={newDashboard.prompt}
                  onChange={e => setNewDashboard({ ...newDashboard, prompt: e.target.value })}
                  placeholder="e.g. Create a sales overview dashboard showing total revenue, top selling items, and daily sales trends"
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[80px]"
                />
                <p className="text-xs text-zinc-500 mt-1">Describe the dashboard you want. AI will generate it for you.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newDashboard.name.trim()}
                  className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {isSubmitting && newDashboard.prompt.trim() ? "Generating dashboard with AI..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
