'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ReactFlow, useNodesState, useEdgesState, Controls, Background, MiniMap, Handle, Position, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { useParams } from 'next/navigation';
import { X, Code2, Target, Box, LayoutGrid, ChevronRight, ChevronDown, PlayCircle, Edit3, Check, Trash2, Search, Loader2, Sparkles, LayoutTemplate, FileText, Workflow, Plus, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Specialized Node Components

const FeatureNode = ({ data, id }: { data: any, id: string }) => {
  const isProduct = data.type === 'Product';
  const isFeature = data.type === 'Feature';
  const isSubFeature = data.type === 'Sub-Feature';
  const isComponent = data.type === 'Component';
  const isClass = data.type === 'Class';
  
  const iconColor = isProduct ? 'text-blue-400' : isFeature ? 'text-violet-400' : isSubFeature ? 'text-pink-400' : isComponent ? 'text-amber-400' : isClass ? 'text-emerald-400' : 'text-cyan-400';
  const borderColor = isProduct ? 'border-blue-500/50' : isFeature ? 'border-violet-500/40' : isSubFeature ? 'border-pink-500/30' : isComponent ? 'border-amber-500/30' : isClass ? 'border-emerald-500/30' : 'border-cyan-500/30';
  const bgColor = isProduct ? 'bg-blue-950/80' : isFeature ? 'bg-violet-950/70' : isSubFeature ? 'bg-pink-950/60' : isComponent ? 'bg-amber-950/50' : isClass ? 'bg-emerald-950/50' : 'bg-cyan-950/50';
  
  return (
    <div 
      className={`group px-6 py-5 shadow-2xl rounded-3xl border ${borderColor} ${bgColor} backdrop-blur-xl min-w-[240px] flex flex-col gap-3 cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] ${data.isDimmed ? 'opacity-20 grayscale pointer-events-none' : 'opacity-100'}`}
      onClick={() => { data.onToggle?.(id); }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
           <div className="mt-1 bg-black/20 p-2 rounded-xl border border-white/10 shadow-inner">
             {isProduct ? <LayoutGrid className={`w-6 h-6 ${iconColor}`} /> : 
              isFeature ? <Box className={`w-6 h-6 ${iconColor}`} /> : 
              isSubFeature ? <Target className={`w-6 h-6 ${iconColor}`} /> :
              isComponent ? <Code2 className={`w-6 h-6 ${iconColor}`} /> :
              isClass ? <Workflow className={`w-6 h-6 ${iconColor}`} /> :
              <Check className={`w-6 h-6 ${iconColor}`} />}
          </div>
          <div className="flex flex-col">
             <span className={`text-[10px] font-black uppercase tracking-widest ${iconColor} opacity-80`}>{data.type}</span>
             <h3 className="text-xl font-black text-white tracking-tight leading-none mt-1 group-hover:text-fuchsia-100 transition-colors">{data.label}</h3>
             
             {data.isGroup && data.type !== 'Product' && (
                <div className="flex items-center gap-2 mt-3">
                   <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${bgColor} w-1/3`} />
                   </div>
                   <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Has Children</span>
                </div>
             )}
          </div>
        </div>

        {data.onDeepDive && (
           <button 
             onClick={(e) => { e.stopPropagation(); data.onDeepDive(); }} 
             className="opacity-30 group-hover:opacity-100 transition-all p-2 bg-fuchsia-600/20 hover:bg-fuchsia-600/40 text-fuchsia-400 hover:text-fuchsia-200 rounded-lg flex items-center justify-center shadow-lg shadow-fuchsia-900/20 border border-fuchsia-500/20 shrink-0"
             title="Deep Dive AI"
           >
              <Sparkles className="w-5 h-5" />
           </button>
        )}
      </div>

      {data.isGroup && (
           <div className="mt-1.5 bg-black/30 p-1.5 rounded-lg border border-white/5">
              {data.isExpanded ? <ChevronDown className={`w-4 h-4 ${iconColor}`} /> : <ChevronRight className={`w-4 h-4 ${iconColor}`} />}
           </div>
        )}
      
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
};

const FlowNode = ({ data, id }: { data: any, id: string }) => {
  return (
    <div className={`px-6 py-4 shadow-xl rounded-full border border-emerald-500/40 bg-emerald-950/80 backdrop-blur-md flex items-center justify-center min-w-[200px] cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] ${data.isDimmed ? 'opacity-20 grayscale pointer-events-none' : 'opacity-100'}`}>
      <Handle type="target" position={Position.Left} className="!bg-emerald-400 !w-3 !h-3 !border-none" />
      <span className="font-black text-emerald-100">{data.label}</span>
      <Handle type="source" position={Position.Right} className="!bg-emerald-400 !w-3 !h-3 !border-none" />
    </div>
  );
};

const nodeTypes = {
  featureNode: FeatureNode,
  flowNode: FlowNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 140 });

  nodes.forEach((node) => {
    let w = 240, h = 100;
    if (node.type === 'featureNode') { w = 280; h = 120; }
    if (node.type === 'flowNode') { w = 220; h = 60; }
    dagreGraph.setNode(node.id, { width: w, height: h });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    if (!nodeWithPosition) return node;
    let offsetX = nodeWithPosition.width / 2;
    let offsetY = nodeWithPosition.height / 2;
    
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - offsetX,
        y: nodeWithPosition.y - offsetY,
      },
    };
  });

  return { nodes: newNodes, edges };
};

export default function ArchitectureExplorerPage() {
  const params = useParams();
  const kbId = params?.kbId as string;
  
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [rawNodes, setRawNodes] = useState<any[]>([]);
  const [rawEdges, setRawEdges] = useState<any[]>([]);
  const [rfInstance, setRfInstance] = useState<any>(null);
  
  // Persist drag positions
  const [userPositions, setUserPositions] = useState<Record<string, {x: number, y: number}>>({});
  
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [viewMode, setViewMode] = useState<'overview' | 'features' | 'flows'>('features');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeTrigger, setUpgradeTrigger] = useState(0);
  
  const [overviewData, setOverviewData] = useState<any>(null);
  const [allDocs, setAllDocs] = useState<any[]>([]);
  
  // Flows Mode specific
  const [availableFlows, setAvailableFlows] = useState<any[]>([]);
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [targetFlow, setTargetFlow] = useState<any>(null);
  
  // Custom Flow Builder
  const [isBuildingFlow, setIsBuildingFlow] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDesc, setNewFlowDesc] = useState('');
  const [newFlowSteps, setNewFlowSteps] = useState([{ stepName: '', description: '' }]);
  const [isSavingFlow, setIsSavingFlow] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);

  // Manual Override State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  // Fit view correctly when mode changes or flow is selected
  useEffect(() => {
    if (rfInstance && nodes.length > 0) {
      setTimeout(() => rfInstance.fitView({ padding: 0.2, duration: 800 }), 100);
    }
  }, [viewMode, activeFlowId, rfInstance]);

  useEffect(() => {
    if (!kbId) return;
    
    async function fetchGraph() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/knowledge/architecture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kbId, viewMode, activeFlowId })
        });
        const data = await res.json();
        if (data.success) {
          if (viewMode === 'overview') {
             setOverviewData(data.overview);
          } else {
             setRawNodes(data.nodes);
             setRawEdges(data.edges);
             if (data.availableFlows) setAvailableFlows(data.availableFlows);
             if (data.targetFlow) setTargetFlow(data.targetFlow);
             if (data.allDocuments) setAllDocs(data.allDocuments);
             
             if (viewMode === 'features') {
                const initialExpanded = new Set<string>();
                // Expand Product, Feature, and Sub-Feature nodes by default to show all 3 Levels
                const toExpand = data.nodes.filter((n: any) => n.data.type === 'Product' || n.data.type === 'Feature' || n.data.type === 'Sub-Feature');
                toExpand.forEach((n: any) => initialExpanded.add(n.id));
                setExpandedNodes(initialExpanded);
             }
          }
        }
      } catch (err) {
        console.error("Failed to load graph", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGraph();
  }, [kbId, viewMode, upgradeTrigger, activeFlowId]);

  useEffect(() => {
    if (viewMode === 'overview') return;

    if (!rawNodes.length) {
       setNodes([]);
       setEdges([]);
       return;
    }

    let visibleNodes = [...rawNodes];
    let visibleEdges = [...rawEdges];

    if (viewMode === 'features') {
      const parentMap = new Map();
      rawEdges.forEach(e => {
         parentMap.set(e.target, e.source);
      });

      visibleNodes = rawNodes.filter(n => {
         if (!parentMap.has(n.id)) return true;
         
         let current = n.id;
         while (parentMap.has(current)) {
            const parentId = parentMap.get(current);
            if (!expandedNodes.has(parentId)) return false;
            current = parentId;
         }
         return true;
      });
      
      visibleNodes = visibleNodes.map(n => {
         if (n.type === 'featureNode') {
            return {
               ...n,
               data: {
                  ...n.data,
                  isExpanded: expandedNodes.has(n.id),
                  onToggle: (id: string) => {
                     setExpandedNodes(prev => {
                        const next = new Set(prev);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                     });
                  }
               }
            };
         }
         return n;
      });

      const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
      visibleEdges = rawEdges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
    }

    const formattedEdges = visibleEdges.map((e: any) => ({
       ...e,
       markerEnd: { type: MarkerType.ArrowClosed, color: e.data?.isInteraction ? '#10b981' : '#6b7280' },
       style: { 
          stroke: e.data?.isInteraction ? '#10b981' : '#6b7280', 
          strokeWidth: e.data?.isInteraction ? 3 : 2,
       }
    }));
    
    let direction = 'TB';
    if (viewMode === 'flows') direction = 'LR';
    
    const layouted = getLayoutedElements(visibleNodes, formattedEdges, direction);

    // Apply user dragged positions if they exist, and inject onDeepDive callback
    const finalNodes = layouted.nodes.map(n => {
       const mapped = { ...n };
       if (userPositions[n.id]) {
          mapped.position = userPositions[n.id];
       }
       mapped.data = {
          ...mapped.data,
          onDeepDive: () => {
             setSelectedNode(n); // Ensure it opens the sidebar
             triggerDeepDive(n);
          }
       };
       return mapped;
    });

    setNodes(finalNodes);
    setEdges(layouted.edges);
  }, [rawNodes, rawEdges, expandedNodes, viewMode, setNodes, setEdges, userPositions]);

  useEffect(() => {
    if (viewMode === 'overview') return;

    setNodes((nds) =>
      nds.map((n) => {
        const matchesSearch = n.data.label.toLowerCase().includes(searchQuery.toLowerCase());
        const isDimmed = !matchesSearch;
        return { ...n, data: { ...n.data, isDimmed } };
      })
    );
  }, [searchQuery, setNodes, viewMode]);

  const onNodeClick = useCallback((event: any, node: any) => {
    setSelectedNode(node);
    setIsEditing(false);
  }, []);

  const onNodeDragStop = useCallback((event: any, node: any) => {
     setUserPositions(prev => ({
        ...prev,
        [node.id]: { x: node.position.x, y: node.position.y }
     }));
  }, []);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/knowledge/architecture/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kbId })
      });
      const data = await res.json();
      if (data.success) {
         setUpgradeTrigger(prev => prev + 1);
         setViewMode('features');
      }
    } catch (err) {
      console.error("Failed to upgrade graph", err);
    } finally {
      setIsUpgrading(false);
    }
  };

  const triggerDeepDive = async (targetNode: any) => {
     if (!targetNode || !targetNode.data) return;
     setIsGeneratingExplanation(true);
     
     try {
        const res = await fetch('/api/knowledge/architecture/node/explain', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
              nodeId: targetNode.id,
              name: targetNode.data.label,
              type: targetNode.data.type,
              currentDesc: targetNode.data.summary
           })
        });
        
        const data = await res.json();
        if (data.success && data.explanation) {
           setSelectedNode((prev: any) => {
              // Ensure we update the sidebar if it's currently focused on this node
              if (prev && prev.id === targetNode.id) {
                 return { ...prev, data: { ...prev.data, summary: data.explanation } };
              }
              return prev;
           });
           
           setRawNodes(prev => prev.map(n => {
              if (n.id === targetNode.id) {
                 return { ...n, data: { ...n.data, summary: data.explanation } };
              }
              return n;
           }));
        } else {
           alert(data.error || 'Failed to generate explanation');
        }
     } catch (err) {
        console.error(err);
        alert('Error generating explanation');
     } finally {
        setIsGeneratingExplanation(false);
     }
  };

  const handleDeepDive = async () => {
     if (!selectedNode) return;
     await triggerDeepDive(selectedNode);
  };

  const handleSaveRename = () => {
     if (!selectedNode || !editName.trim()) return;
     setRawNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: editName } } : n));
     setSelectedNode((prev: any) => ({ ...prev, data: { ...prev.data, label: editName }}));
     setIsEditing(false);
  };

  const handleAIGenerateFlow = async () => {
    if (!newFlowName.trim()) return;
    setIsGeneratingAI(true);
    
    try {
      const res = await fetch('/api/knowledge/architecture/flow/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFlowName })
      });
      const data = await res.json();
      if (data.success) {
         setNewFlowDesc(data.description);
         setNewFlowSteps(data.steps);
      }
    } catch (err) {
      console.error("Failed to generate AI flow", err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveCustomFlow = async () => {
    if (!newFlowName.trim() || newFlowSteps.length === 0) return;
    setIsSavingFlow(true);
    
    const stepsPayload = newFlowSteps.map((s, idx) => ({
      id: (idx + 1).toString(),
      stepName: s.stepName || `Step ${idx + 1}`,
      description: s.description || 'Custom step description'
    }));

    try {
      const res = await fetch('/api/knowledge/architecture/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kbId, name: newFlowName, description: newFlowDesc, steps: stepsPayload })
      });
      const data = await res.json();
      if (data.success) {
         setUpgradeTrigger(prev => prev + 1);
         setIsBuildingFlow(false);
         setNewFlowName('');
         setNewFlowDesc('');
         setNewFlowSteps([{ stepName: '', description: '' }]);
         setActiveFlowId(data.flow.id.toString());
      }
    } catch (err) {
      console.error("Failed to save flow", err);
    } finally {
      setIsSavingFlow(false);
    }
  };

  const primaryViews = [
    { id: 'overview', label: 'Overview', icon: LayoutTemplate },
    { id: 'features', label: 'Features', icon: Box },
    { id: 'flows', label: 'Flows', icon: PlayCircle },
  ];

  if (isLoading && !rawNodes.length && !overviewData) {
    return <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center text-white bg-card">
       <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-zinc-400">Loading Business Architecture...</p>
       </div>
    </div>;
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] flex relative bg-card">
      
      {/* Top Overlay: Search, Filters, and View Switcher */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
         <div className="flex items-center gap-2">
           <div className="bg-card/90 border border-zinc-800 rounded-xl p-1 backdrop-blur-md flex items-center shadow-2xl w-max">
              {primaryViews.map(mode => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => { 
                       setViewMode(mode.id as any); 
                       setSelectedNode(null); 
                       setIsBuildingFlow(false); 
                       setRawNodes([]); 
                       setRawEdges([]); 
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-black rounded-lg transition-all ${
                      viewMode === mode.id 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {mode.label}
                  </button>
                );
              })}
           </div>
         </div>

         {viewMode === 'features' && (
           <div className="flex items-center gap-2 mt-2">
             <div className="relative w-96 shadow-2xl">
               <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
               <input 
                  type="text" 
                  placeholder="Search capabilities, concepts, or business logic..." 
                  className="w-full bg-card/90 border-2 border-zinc-700/50 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 backdrop-blur-md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
             <button 
                className={`text-white px-6 py-3.5 rounded-2xl text-sm font-black transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] ${isUpgrading ? 'bg-blue-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
                onClick={handleUpgrade}
                disabled={isUpgrading}
             >
                {isUpgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isUpgrading ? 'Extracting...' : 'Extract Business Logic'}
             </button>
           </div>
         )}
      </div>

      {viewMode === 'overview' && overviewData ? (
         <div className="flex-1 w-full h-full overflow-y-auto p-12 pt-36 bg-card">
            <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
               <div>
                  <h1 className="text-6xl font-black text-white mb-4 tracking-tight">Business Knowledge</h1>
                  <p className="text-zinc-400 text-xl font-medium max-w-2xl leading-relaxed">
                    Understand the "What" and "Why" of your system before diving into the "How".
                  </p>
               </div>
               <div className="grid grid-cols-4 gap-6">
                  <div className="bg-card/50 border border-zinc-800/80 rounded-3xl p-8 flex flex-col gap-3 shadow-xl">
                     <div className="bg-violet-500/20 p-3 rounded-2xl w-max"><Box className="w-8 h-8 text-violet-500" /></div>
                     <div className="text-5xl font-black text-white mt-2">{overviewData.stats.totalFeatures}</div>
                     <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Business Features</div>
                  </div>
                  <div className="bg-card/50 border border-zinc-800/80 rounded-3xl p-8 flex flex-col gap-3 shadow-xl">
                     <div className="bg-emerald-500/20 p-3 rounded-2xl w-max"><PlayCircle className="w-8 h-8 text-emerald-500" /></div>
                     <div className="text-5xl font-black text-white mt-2">{overviewData.stats.totalFlows}</div>
                     <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest">User Journeys</div>
                  </div>
                  <div className="bg-card/50 border border-zinc-800/80 rounded-3xl p-8 flex flex-col gap-3 shadow-xl">
                     <div className="bg-indigo-500/20 p-3 rounded-2xl w-max"><Workflow className="w-8 h-8 text-indigo-500" /></div>
                     <div className="text-5xl font-black text-white mt-2">{overviewData.stats.totalDependencies}</div>
                     <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Connections</div>
                  </div>
                  <div className="bg-card/50 border border-zinc-800/80 rounded-3xl p-8 flex flex-col gap-3 shadow-xl">
                     <div className="bg-blue-500/20 p-3 rounded-2xl w-max"><FileText className="w-8 h-8 text-blue-500" /></div>
                     <div className="text-5xl font-black text-white mt-2">{overviewData.stats.totalDocuments}</div>
                     <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Impl. Files</div>
                  </div>
               </div>
            </div>
         </div>
      ) : (
        <div className="flex-1 h-full relative">
          
          {/* Flows Sidebar */}
          {viewMode === 'flows' && !isBuildingFlow && (
             <div className="absolute left-4 top-24 bottom-4 z-10 w-80 bg-card/90 border border-zinc-800 rounded-3xl p-5 backdrop-blur-xl shadow-2xl flex flex-col">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <PlayCircle className="w-5 h-5 text-emerald-400" /> Available Flows
                   </h3>
                   <button 
                      onClick={() => setIsBuildingFlow(true)}
                      className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-all"
                      title="Create Custom Flow"
                   >
                      <Plus className="w-5 h-5" />
                   </button>
                </div>
                <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                   {availableFlows.map(flow => (
                      <button 
                         key={flow.id}
                         onClick={() => setActiveFlowId(flow.id.toString())}
                         className={`w-full text-left p-4 rounded-2xl transition-all border ${(!activeFlowId && targetFlow?.id === flow.id) || activeFlowId === flow.id.toString() ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800'}`}
                      >
                         <div className="font-bold text-white mb-2">{flow.name}</div>
                         <div className="text-xs text-zinc-300 leading-relaxed prose prose-invert prose-p:my-0">
                            <ReactMarkdown>{flow.description}</ReactMarkdown>
                         </div>
                      </button>
                   ))}
                </div>
             </div>
          )}

          {/* Custom Flow Builder Modal/Overlay */}
          {viewMode === 'flows' && isBuildingFlow && (
             <div className="absolute inset-0 z-40 bg-card/80 backdrop-blur-md flex items-center justify-center p-8">
                <div className="bg-card border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                   <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-card/50">
                      <div className="flex items-center gap-3">
                         <div className="bg-emerald-500/20 p-2 rounded-xl"><Plus className="w-6 h-6 text-emerald-500" /></div>
                         <h2 className="text-2xl font-black text-white">Create Custom Flow</h2>
                      </div>
                      <button onClick={() => setIsBuildingFlow(false)} className="text-zinc-500 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors">
                         <X className="w-6 h-6" />
                      </button>
                   </div>
                   
                   <div className="p-8 overflow-y-auto flex-1 space-y-8">
                      <div className="space-y-4">
                         <div>
                            <div className="flex items-center justify-between mb-2">
                               <label className="block text-sm font-bold text-zinc-400">Flow Name</label>
                               <button 
                                  onClick={handleAIGenerateFlow}
                                  disabled={isGeneratingAI || !newFlowName.trim()}
                                  className={`flex items-center gap-2 text-sm font-black px-4 py-1.5 rounded-lg transition-all ${isGeneratingAI || !newFlowName.trim() ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]'}`}
                               >
                                  {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                  {isGeneratingAI ? 'Generating...' : 'Generate with AI'}
                               </button>
                            </div>
                            <input 
                               value={newFlowName}
                               onChange={(e) => setNewFlowName(e.target.value)}
                               placeholder="e.g. User Authentication Flow"
                               className="w-full bg-card border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-lg font-bold"
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-bold text-zinc-400 mb-2">Description (Markdown Supported)</label>
                            <textarea 
                               value={newFlowDesc}
                               onChange={(e) => setNewFlowDesc(e.target.value)}
                               placeholder="**Purpose:** Automates the creation of..."
                               className="w-full bg-card border border-zinc-800 rounded-xl px-4 py-3 text-white h-24 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-white">Flow Steps</h3>
                            <button 
                               onClick={() => setNewFlowSteps([...newFlowSteps, { stepName: '', description: '' }])}
                               className="flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-lg transition-colors"
                            >
                               <Plus className="w-4 h-4" /> Add Step
                            </button>
                         </div>
                         
                         <div className="space-y-4">
                            {newFlowSteps.map((step, idx) => (
                               <div key={idx} className="bg-card/50 border border-zinc-800 rounded-2xl p-5 flex gap-4 transition-all hover:border-zinc-700">
                                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-black shrink-0">{idx + 1}</div>
                                  <div className="flex-1 space-y-4">
                                     <input 
                                        value={step.stepName}
                                        onChange={(e) => {
                                           const newSteps = [...newFlowSteps];
                                           if (newSteps[idx]) newSteps[idx].stepName = e.target.value;
                                           setNewFlowSteps(newSteps);
                                        }}
                                        placeholder="Step Name (e.g. API Gateway)"
                                        className="w-full bg-card border border-zinc-800 rounded-xl px-4 py-2 font-bold text-white focus:border-emerald-500 focus:outline-none"
                                     />
                                     <textarea 
                                        value={step.description}
                                        onChange={(e) => {
                                           const newSteps = [...newFlowSteps];
                                           if (newSteps[idx]) newSteps[idx].description = e.target.value;
                                           setNewFlowSteps(newSteps);
                                        }}
                                        placeholder="Detailed step processing explanation..."
                                        className="w-full bg-card border border-zinc-800 rounded-xl px-4 py-3 text-white h-32 focus:border-emerald-500 focus:outline-none leading-relaxed"
                                     />
                                  </div>
                                  <button 
                                     onClick={() => {
                                        if (newFlowSteps.length > 1) {
                                           setNewFlowSteps(newFlowSteps.filter((_, i) => i !== idx));
                                        }
                                     }}
                                     className="text-zinc-500 hover:text-red-400 p-2 h-max rounded-lg hover:bg-zinc-800"
                                  >
                                     <Trash2 className="w-5 h-5" />
                                  </button>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="p-6 border-t border-zinc-800 bg-card/50 flex justify-end gap-3">
                      <button 
                         onClick={() => setIsBuildingFlow(false)}
                         className="px-6 py-2.5 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                         Cancel
                      </button>
                      <button 
                         onClick={handleSaveCustomFlow}
                         disabled={isSavingFlow || !newFlowName.trim()}
                         className={`px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all ${isSavingFlow || !newFlowName.trim() ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`}
                      >
                         {isSavingFlow && <Loader2 className="w-4 h-4 animate-spin" />}
                         Save & Render Flow
                      </button>
                   </div>
                </div>
             </div>
          )}

          {!isBuildingFlow && (
             <ReactFlow
               nodes={nodes}
               edges={edges}
               onNodesChange={onNodesChange}
               onEdgesChange={onEdgesChange}
               onNodeClick={onNodeClick}
               onNodeDragStop={onNodeDragStop}
               onInit={setRfInstance}
               nodeTypes={nodeTypes}
               className="bg-card"
               defaultEdgeOptions={{ type: 'smoothstep' }}
             >
               <Background color="#27272a" gap={24} size={2} />
               <Controls className="bg-card border-zinc-800 fill-zinc-400 hover:fill-white mb-4 ml-4" />
               <MiniMap 
                 nodeColor={(n: any) => n.data.color || '#3b82f6'} 
                 maskColor="rgba(0,0,0,0.8)" 
                 className="bg-card border border-zinc-800 rounded-xl overflow-hidden shadow-2xl" 
               />
             </ReactFlow>
          )}
        </div>
      )}

      {/* Node Details Panel */}
      {selectedNode && viewMode !== 'overview' && !isBuildingFlow && (
        <div className="w-[500px] h-full border-l border-zinc-800/80 bg-card/95 backdrop-blur-2xl flex flex-col shadow-2xl absolute right-0 top-0 animate-in slide-in-from-right-8 duration-200 z-30">
          <div className="p-8 border-b border-zinc-800/80 bg-card/30">
            <div className="flex justify-end mb-4">
               <button onClick={() => { setSelectedNode(null); setIsEditing(false); }} className="text-zinc-500 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors">
                 <X className="w-6 h-6" />
               </button>
            </div>
            
            <div className="flex flex-col gap-4">
               <div className="text-sm font-black text-violet-400 uppercase tracking-widest">{selectedNode.data.type}</div>
               
               {isEditing ? (
                  <div className="flex items-center gap-2">
                     <input 
                       value={editName}
                       onChange={e => setEditName(e.target.value)}
                       className="bg-card border border-zinc-700 text-white font-black text-2xl p-2 rounded-xl focus:outline-none focus:border-violet-500 flex-1"
                       autoFocus
                     />
                     <button onClick={handleSaveRename} className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl shadow-lg">
                        <Check className="w-5 h-5" />
                     </button>
                  </div>
               ) : (
                  <div className="flex items-start justify-between group">
                     <h2 className="text-3xl font-black text-white leading-tight">
                       {selectedNode.data.label}
                     </h2>
                     {(selectedNode.data.type === 'Feature' || selectedNode.data.type === 'Sub-Feature') && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => { setEditName(selectedNode.data.label); setIsEditing(true); }} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg">
                              <Edit3 className="w-4 h-4" />
                           </button>
                           <button className="p-2 bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     )}
                  </div>
               )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-10">
              <div>
                <div className="flex items-center justify-between mb-4">
                   <div className="text-sm font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-5 h-5 text-fuchsia-500" /> Explanation
                   </div>
                   <button 
                      onClick={handleDeepDive} 
                      disabled={isGeneratingExplanation} 
                      className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all font-bold ${
                         isGeneratingExplanation 
                           ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                           : 'bg-fuchsia-600/20 text-fuchsia-400 hover:bg-fuchsia-600/40 hover:text-fuchsia-300 shadow-lg shadow-fuchsia-900/20'
                      }`}
                   >
                      {isGeneratingExplanation ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {isGeneratingExplanation ? 'Deep Diving...' : 'Deep Dive AI'}
                   </button>
                </div>
                <div className="prose prose-invert prose-p:leading-relaxed prose-strong:text-white text-zinc-300">
                  <ReactMarkdown>{selectedNode.data.summary || '*No explanation available. Click Deep Dive AI to generate one.*'}</ReactMarkdown>
                </div>
              </div>

            {/* Implementation Details Section */}
            {(selectedNode.data.documentIds?.length > 0 || selectedNode.data.source) && (
               <div className="pt-6 border-t border-zinc-800/80">
                  <div className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Code2 className="w-5 h-5 text-zinc-400" /> Implementation Details
                  </div>
                  <p className="text-xs text-zinc-500 mb-4 font-medium">The underlying technical files that execute this capability.</p>
                  
                  {selectedNode.data.documentIds?.length > 0 ? (
                     <div className="space-y-2 bg-card/30 p-4 rounded-2xl border border-zinc-800/50">
                        {selectedNode.data.documentIds.map((docId: number) => {
                           const doc = allDocs.find(d => d.id === docId);
                           if (!doc) return null;
                           return (
                              <div key={docId} className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer">
                                 <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                                 <div className="text-sm text-zinc-300 font-mono truncate">{doc.title}</div>
                              </div>
                           );
                        })}
                     </div>
                  ) : (
                     <div className="text-xs text-zinc-400 break-all font-mono bg-card/50 p-4 rounded-2xl border border-zinc-800/50">
                       {selectedNode.data.source}
                     </div>
                  )}
               </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
