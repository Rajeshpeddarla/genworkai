// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import GridLayout, { useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Loader2, Settings, Plus, RefreshCw, PanelRightClose, PanelRightOpen, ArrowLeft, Edit3, Trash2, Sparkles, MoreHorizontal, Maximize2, X, Table2 } from "lucide-react";
import Link from "next/link";
import CopilotSidebar from "./CopilotSidebar";
import WidgetComponent from "./WidgetComponent";

interface DashboardClientProps {
  dashboardId: string;
}

export default function DashboardClient({ dashboardId }: DashboardClientProps) {
  const { width, containerRef } = useContainerWidth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [widgetData, setWidgetData] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);

  const [isCreatingWidget, setIsCreatingWidget] = useState(false);
  const [expandedWidget, setExpandedWidget] = useState<any>(null);
  const [newWidget, setNewWidget] = useState({ 
    name: '', 
    description: '', 
    widgetType: 'table', 
    sqlQuery: '', 
    xAxisKey: '', 
    yAxisKeys: '',
    aiPrompt: ''
  });
  const [isSubmittingWidget, setIsSubmittingWidget] = useState(false);
  const [isGeneratingSql, setIsGeneratingSql] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, [dashboardId]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/dashboards/${dashboardId}`);
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
        setWidgets(data.widgets || []);
        
        // Fetch data for all widgets
        if (data.widgets) {
          data.widgets.forEach((w: any) => refreshWidget(w.id));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshWidget = async (widgetId: number) => {
    try {
      // Set loading state
      setWidgetData(prev => ({ ...prev, [widgetId]: { isLoading: true } }));
      
      const res = await fetch(`/api/dashboards/${dashboardId}/widgets/${widgetId}/refresh`, {
        method: "POST"
      });
      
      if (res.ok) {
        const data = await res.json();
        setWidgetData(prev => ({
          ...prev,
          [widgetId]: { isLoading: false, data: data.results, error: data.error }
        }));
      } else {
         const data = await res.json();
         setWidgetData(prev => ({
          ...prev,
          [widgetId]: { isLoading: false, error: data.error || "Failed to refresh" }
        }));
      }
    } catch (err: any) {
      setWidgetData(prev => ({
        ...prev,
        [widgetId]: { isLoading: false, error: err.message }
      }));
    }
  };



  const handleWidgetCreated = async (config: any) => {
    try {
      if (editingWidgetId) {
        // Update existing widget
        const res = await fetch(`/api/dashboards/${dashboardId}/widgets/${editingWidgetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        if (res.ok) {
          const updatedWidgetRes = await res.json();
          setWidgets(widgets.map(w => w.id === updatedWidgetRes.id ? updatedWidgetRes : w));
          refreshWidget(updatedWidgetRes.id);
        }
      } else {
        // Create new widget
        const res = await fetch(`/api/dashboards/${dashboardId}/widgets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             ...config,
             layoutConfig: { x: (widgets.length * 4) % 12, y: Infinity, w: 4, h: 4 }
          })
        });
        if (res.ok) {
          const newWidgetRes = await res.json();
          setWidgets([...widgets, newWidgetRes]);
          refreshWidget(newWidgetRes.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualWidgetCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWidget.name.trim() || !newWidget.sqlQuery.trim()) return;
    
    setIsSubmittingWidget(true);
    
    const config = {
      name: newWidget.name,
      description: newWidget.description,
      widgetType: newWidget.widgetType,
      sqlQuery: newWidget.sqlQuery,
      visualizationConfig: {
        xAxisKey: newWidget.xAxisKey.trim() || undefined,
        yAxisKeys: newWidget.yAxisKeys.trim() ? newWidget.yAxisKeys.split(',').map(s => s.trim()) : undefined
      }
    };
    
    await handleWidgetCreated(config);
    
    setIsSubmittingWidget(false);
    setIsCreatingWidget(false);
    setEditingWidgetId(null);
    setNewWidget({ name: '', description: '', widgetType: 'table', sqlQuery: '', xAxisKey: '', yAxisKeys: '', aiPrompt: '' });
  };

  const handleGenerateSql = async () => {
    const promptText = newWidget.aiPrompt.trim() || `${newWidget.name} ${newWidget.description}`.trim();
    if (!promptText) {
      alert("Please enter a prompt to tell the AI what query to generate.");
      return;
    }
    
    setIsGeneratingSql(true);
    try {
      const res = await fetch('/api/ai/dashboard/generate-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardId,
          prompt: promptText,
          widgetType: newWidget.widgetType
        })
      });
      
      const data = await res.json();
      if (data.sql) {
        setNewWidget(prev => ({ ...prev, sqlQuery: data.sql }));
      } else {
        alert(data.error || "Failed to generate SQL");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate SQL");
    } finally {
      setIsGeneratingSql(false);
    }
  };

  const openEditWidget = (widget: any) => {
    setEditingWidgetId(widget.id);
    setNewWidget({
      name: widget.name || '',
      description: widget.description || '',
      widgetType: widget.widgetType || 'table',
      sqlQuery: widget.sqlQuery || '',
      xAxisKey: widget.visualizationConfig?.xAxisKey || '',
      yAxisKeys: widget.visualizationConfig?.yAxisKeys?.join(', ') || '',
      aiPrompt: ''
    });
    setIsCreatingWidget(true);
  };

  const deleteWidget = async (widgetId: number) => {
    if (!confirm("Delete this widget?")) return;
    try {
      await fetch(`/api/dashboards/${dashboardId}/widgets/${widgetId}`, { method: 'DELETE' });
      setWidgets(widgets.filter(w => w.id !== widgetId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <h2 className="text-xl font-bold text-foreground">Dashboard not found</h2>
        <Link href="/dashboards" className="mt-4 text-violet-500 hover:underline">Return to Dashboards</Link>
      </div>
    );
  }

  const layout = widgets.map(w => ({
    i: w.id.toString(),
    x: w.layoutConfig?.x || 0,
    y: w.layoutConfig?.y || 0,
    w: w.layoutConfig?.w || 4,
    h: w.layoutConfig?.h || 4,
    minW: 2,
    minH: 2
  }));

  return (
    <div className="flex h-screen w-full flex-col bg-background overflow-hidden">
      {/* Toolbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 dark:border-white/10 px-4 bg-card z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboards" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-6 w-px bg-zinc-200 dark:bg-white/10" />
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            {dashboard.name}
            {!dashboard.dataSourceId && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                No Data Source
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setEditingWidgetId(null);
              setNewWidget({ name: '', description: '', widgetType: 'table', sqlQuery: '', xAxisKey: '', yAxisKeys: '', aiPrompt: '' });
              setIsCreatingWidget(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Widget
          </button>
          


          <button 
            onClick={() => widgets.forEach(w => refreshWidget(w.id))}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md transition-colors"
            title="Refresh All"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <div className="h-6 w-px bg-zinc-200 dark:bg-white/10 mx-1" />

          <button 
            onClick={() => setIsCopilotOpen(!isCopilotOpen)}
            className={`p-1.5 rounded-md transition-colors ${
              isCopilotOpen 
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400' 
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10'
            }`}
            title="Toggle Copilot"
          >
            {isCopilotOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-y-auto relative">
          {widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <div className="w-16 h-16 bg-card rounded-2xl shadow-sm flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
              </div>
              <p className="text-lg font-medium text-foreground">Empty Dashboard</p>
              <p className="text-sm mt-1 mb-4">Ask the AI Copilot to generate widgets, or add them manually.</p>
              <button 
                onClick={() => {
                  setEditingWidgetId(null);
                  setNewWidget({ name: '', description: '', widgetType: 'table', sqlQuery: '', xAxisKey: '', yAxisKeys: '', aiPrompt: '' });
                  setIsCreatingWidget(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Widget
              </button>
            </div>
          ) : (
            <div className="p-4" ref={containerRef}>
              <GridLayout
                className="layout"
                layout={layout}
                cols={12}
                rowHeight={60}
                width={width}
                isDraggable={false}
                isResizable={false}
                margin={[16, 16]}
              >
                {widgets.map(widget => {
                   const state = widgetData[widget.id] || { isLoading: false, data: [] };
                   return (
                      <div key={widget.id} className="bg-card rounded-xl shadow-sm border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col group">
                        {/* Widget Header */}
                        <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-card">
                           <div>
                             <h3 className="text-sm font-bold text-foreground truncate tracking-wide">{widget.name}</h3>
                             {widget.description && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-[200px]">{widget.description}</p>}
                           </div>
                           
                           <div className="relative group/menu">
                              <button className="p-1.5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                                 <MoreHorizontal className="w-4 h-4" />
                              </button>
                              
                              <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-zinc-200 dark:border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 flex flex-col p-1">
                                <button onClick={() => setExpandedWidget(widget)} className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md text-left">
                                  <Maximize2 className="w-3.5 h-3.5" /> Expand
                                </button>
                                <button onClick={() => refreshWidget(widget.id)} className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md text-left">
                                  <RefreshCw className={`w-3.5 h-3.5 ${state.isLoading ? 'animate-spin' : ''}`} /> Refresh
                                </button>
                                <button onClick={() => openEditWidget(widget)} className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md text-left">
                                  <Edit3 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1 mx-2"></div>
                                <button onClick={() => deleteWidget(widget.id)} className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md text-left font-medium">
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                           </div>
                        </div>
                        {/* Widget Body */}
                        <div className="flex-1 p-4 relative overflow-hidden bg-background">
                           <WidgetComponent 
                             widget={widget} 
                             data={state.data} 
                             isLoading={state.isLoading} 
                             error={state.error} 
                           />
                        </div>
                      </div>
                   );
                })}
              </GridLayout>
            </div>
          )}
        <div className={`fixed inset-y-0 right-0 z-40 transform transition-transform duration-300 ease-in-out ${
        isCopilotOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <CopilotSidebar dashboardId={dashboardId} onWidgetCreated={handleWidgetCreated} onRefresh={fetchDashboard} onClose={() => setIsCopilotOpen(false)} />
      </div>
        </div>
      </div>

      {/* Manual Widget Creation Modal */}
      {isCreatingWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-200 dark:border-white/10 shrink-0">
              <h2 className="text-xl font-bold text-foreground">
                {editingWidgetId ? 'Edit Widget' : 'Add Widget'}
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                {editingWidgetId ? 'Modify an existing dashboard widget.' : 'Manually define a dashboard widget.'}
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="widget-form" onSubmit={handleManualWidgetCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      Widget Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newWidget.name}
                      onChange={e => setNewWidget({ ...newWidget, name: e.target.value })}
                      placeholder="e.g. Total Users"
                      className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      Widget Type *
                    </label>
                    <select
                      required
                      value={newWidget.widgetType}
                      onChange={e => setNewWidget({ ...newWidget, widgetType: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="table">Table</option>
                      <option value="line">Line Chart</option>
                      <option value="bar">Bar Chart</option>
                      <option value="pie">Pie Chart</option>
                      <option value="area">Area Chart</option>
                      <option value="stat">Single Stat</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newWidget.description}
                    onChange={e => setNewWidget({ ...newWidget, description: e.target.value })}
                    placeholder="Optional description"
                    className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <div className="flex flex-col gap-2 p-3 mb-4 rounded-md border border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-500/10">
                    <label className="block text-sm font-medium text-violet-900 dark:text-violet-300">
                      ✨ AI SQL Generator
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newWidget.aiPrompt}
                        onChange={e => setNewWidget({ ...newWidget, aiPrompt: e.target.value })}
                        placeholder="e.g. Show me total users grouped by month"
                        className="flex-1 px-3 py-1.5 text-sm rounded-md border border-violet-300 dark:border-violet-700/50 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-violet-400 dark:placeholder:text-violet-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateSql}
                        disabled={isGeneratingSql || (!newWidget.aiPrompt && !newWidget.name && !newWidget.description)}
                        className="px-3 py-1.5 text-sm font-medium bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
                      >
                        {isGeneratingSql ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Generate
                      </button>
                    </div>
                  </div>

                  <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    SQL Query *
                  </label>
                  <textarea
                    required
                    value={newWidget.sqlQuery}
                    onChange={e => setNewWidget({ ...newWidget, sqlQuery: e.target.value })}
                    placeholder="SELECT * FROM users..."
                    className="w-full h-32 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-background font-mono text-sm text-zinc-900 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Only READ (SELECT) queries are allowed.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-md border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5">
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-foreground">Visualization config (Optional)</h4>
                    <p className="text-xs text-zinc-500">If left blank, the chart will attempt to map the first columns automatically.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      X-Axis Column Name
                    </label>
                    <input
                      type="text"
                      value={newWidget.xAxisKey}
                      onChange={e => setNewWidget({ ...newWidget, xAxisKey: e.target.value })}
                      placeholder="e.g. created_at"
                      className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      Y-Axis Column Names
                    </label>
                    <input
                      type="text"
                      value={newWidget.yAxisKeys}
                      onChange={e => setNewWidget({ ...newWidget, yAxisKeys: e.target.value })}
                      placeholder="Comma separated (e.g. count, revenue)"
                      className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-white/10 shrink-0 flex items-center justify-end gap-3 bg-black/5 dark:bg-white/5">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingWidget(false);
                  setEditingWidgetId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                form="widget-form"
                type="submit"
                disabled={isSubmittingWidget || !newWidget.name.trim() || !newWidget.sqlQuery.trim()}
                className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingWidget && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editingWidgetId ? 'Save Changes' : 'Add Widget'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Expanded Widget Modal */}
      {expandedWidget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between bg-card shrink-0">
               <div>
                 <h2 className="text-xl font-bold text-foreground">{expandedWidget.name}</h2>
                 {expandedWidget.description && <p className="text-sm text-zinc-500 mt-1">{expandedWidget.description}</p>}
               </div>
               <button onClick={() => setExpandedWidget(null)} className="p-2 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="flex-1 overflow-auto flex flex-col">
              {/* Chart Fullscreen */}
              <div className="h-[50vh] p-6 border-b border-zinc-200 dark:border-white/10 shrink-0">
                 <WidgetComponent 
                   widget={expandedWidget} 
                   data={widgetData[expandedWidget.id]?.data || []} 
                   isLoading={widgetData[expandedWidget.id]?.isLoading || false} 
                   error={widgetData[expandedWidget.id]?.error} 
                 />
              </div>
              
              {/* Raw Data Table */}
              <div className="flex-1 p-6 bg-background">
                 <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Table2 className="w-4 h-4 text-violet-500" />
                   Detailed Data View
                 </h3>
                 <div className="rounded-lg border border-zinc-200 dark:border-white/10 overflow-hidden bg-background shadow-sm">
                    <WidgetComponent 
                      widget={{ ...expandedWidget, widgetType: 'table' }} 
                      data={widgetData[expandedWidget.id]?.data || []} 
                      isLoading={widgetData[expandedWidget.id]?.isLoading || false} 
                      error={widgetData[expandedWidget.id]?.error} 
                    />
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
