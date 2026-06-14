import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { documents, businessFeatures, businessFlows } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function getNodeColor(sourceType: string, title: string, customType?: string): string {
  if (customType === 'Product') return '#3b82f6'; // Blue
  if (customType === 'Feature') return '#8b5cf6'; // Violet
  if (customType === 'Sub-Feature') return '#ec4899'; // Pink
  if (customType === 'Component') return '#f59e0b'; // Amber
  if (customType === 'Class') return '#10b981'; // Emerald
  if (customType === 'Function') return '#06b6d4'; // Cyan
  if (customType === 'FlowStep') return '#10b981'; // Emerald
  return '#64748b'; // Slate
}

export async function POST(req: Request) {
  try {
    const { kbId, viewMode = 'features', activeFlowId } = await req.json();

    if (!kbId) {
      return NextResponse.json({ error: 'kbId is required' }, { status: 400, headers: corsHeaders });
    }

    const kbIdInt = parseInt(kbId, 10);
    const kbDocuments = await db.select().from(documents).where(eq(documents.kbId, kbIdInt));
    
    let nodes: any[] = [];
    let edges: any[] = [];
    let availableFlows: any[] = [];

    if (viewMode === 'overview') {
      const features = await db.select().from(businessFeatures).where(eq(businessFeatures.kbId, kbIdInt));
      const flowsCount = await db.select().from(businessFlows).where(eq(businessFlows.kbId, kbIdInt));

      const totalDocuments = kbDocuments.length;
      const totalFeatures = features.filter(f => f.level === 'Feature' || f.level === 'Sub-Feature').length;
      const totalFlows = flowsCount.length;
      
      // Calculate total edges in the features tree (parentId relations)
      const totalDependencies = features.filter(f => f.parentId).length;

      return NextResponse.json({ 
        success: true, 
        overview: {
           stats: { totalDocuments, totalFeatures, totalFlows, totalDependencies }
        }
      }, { headers: corsHeaders });
    }

    if (viewMode === 'features') {
       const features = await db.select().from(businessFeatures).where(eq(businessFeatures.kbId, kbIdInt));
       
       if (features.length === 0) {
          return NextResponse.json({ success: true, nodes: [], edges: [], message: 'No features generated yet. Please run AI extraction.' }, { headers: corsHeaders });
       }

       for (const feat of features) {
          nodes.push({
             id: `feat-${feat.id}`,
             position: { x: 0, y: 0 },
             data: {
                label: feat.name,
                type: feat.level,
                summary: feat.description,
                color: getNodeColor('', feat.name, feat.level || 'Feature'),
                isGroup: true,
                documentIds: feat.documentIds || [],
                dbId: feat.id
             },
             type: 'featureNode'
          });

          if (feat.parentId) {
             edges.push({
                id: `e-feat-${feat.parentId}-feat-${feat.id}`,
                source: `feat-${feat.parentId}`,
                target: `feat-${feat.id}`,
                data: { confidence: 100 }
             });
          }
       }
       
       return NextResponse.json({ success: true, nodes, edges, allDocuments: kbDocuments }, { headers: corsHeaders });
    }
    
    if (viewMode === 'flows') {
       const flows = await db.select().from(businessFlows).where(eq(businessFlows.kbId, kbIdInt));
       availableFlows = flows;

       if (flows.length === 0) {
          return NextResponse.json({ success: true, nodes: [], edges: [], availableFlows: [] }, { headers: corsHeaders });
       }

       // Only set targetFlow if activeFlowId is explicitly provided
       const targetFlow = activeFlowId ? flows.find(f => f.id === parseInt(activeFlowId, 10)) : null;
       
       if (targetFlow && targetFlow.steps) {
          const steps = targetFlow.steps as any[];
          for (let i = 0; i < steps.length; i++) {
             const step = steps[i];
             const nodeId = `flowstep-${step.id}`;
             nodes.push({
                id: nodeId,
                position: { x: 0, y: 0 },
                data: {
                   label: step.stepName,
                   type: 'Flow Step',
                   summary: step.description,
                   color: '#10b981', // Emerald
                   isGroup: false
                },
                type: 'flowNode'
             });

             if (i > 0) {
                const prevStep = steps[i - 1];
                edges.push({
                   id: `e-flow-${prevStep.id}-${step.id}`,
                   source: `flowstep-${prevStep.id}`,
                   target: nodeId,
                   animated: true,
                   data: { confidence: 100, isInteraction: true }
                });
             }
          }
       }

       return NextResponse.json({ success: true, nodes, edges, availableFlows, targetFlow }, { headers: corsHeaders });
    }

    return NextResponse.json({ success: true, nodes, edges }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Architecture Graph API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate architecture graph' }, { status: 500, headers: corsHeaders });
  }
}
