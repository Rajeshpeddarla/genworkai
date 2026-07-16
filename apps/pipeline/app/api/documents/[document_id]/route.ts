import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ document_id: string }> }
) {
  try {
    const { document_id } = await params;

    if (!document_id) {
      return NextResponse.json({ error: 'No document_id provided' }, { status: 400 });
    }

    // Fetch chunks
    const { data: chunks, error: chunkError } = await supabase
      .from('document_chunks')
      .select('content, assets')
      .eq('document_id', parseInt(document_id))
      .order('id', { ascending: true });

    if (chunkError) {
      console.error('Error fetching chunks:', chunkError);
      return NextResponse.json({ error: 'Failed to fetch document chunks' }, { status: 500 });
    }

    // Combine markdown
    let fullMarkdown = "";
    let combinedAssets: Record<string, string> = {};

    if (chunks && chunks.length > 0) {
      chunks.forEach(chunk => {
        if (chunk.content) {
          fullMarkdown += chunk.content + "\n\n";
        }
        if (chunk.assets) {
          Object.assign(combinedAssets, chunk.assets);
        }
      });
    }

    return NextResponse.json({
      markdown: fullMarkdown,
      assets: combinedAssets
    });

  } catch (error: any) {
    console.error('Fetch document error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
