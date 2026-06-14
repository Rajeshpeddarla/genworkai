import { NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import { db } from '../../../../../db';
import { documents, documentChunks, knowledgeSources, syncJobs, sourceSnapshots } from '../../../../../db/schema';
import { generateEmbedding } from '../../../../../lib/embeddings';
import { extractTextFromBuffer, cleanExtractedText, enhanceTextWithAI, smartChunkMarkdown, extractRelationships } from '../../../../../lib/knowledge-pipeline';
import { eq, and } from 'drizzle-orm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function isProcessableFile(filename: string): boolean {
  const ignored = [
    '.git/', 'node_modules/', 'dist/', 'build/', '.next/', '.DS_Store', 
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.ttf', '.eot', '.mp4', '.mp3'
  ];
  return !ignored.some(i => filename.includes(i));
}

export async function POST(req: Request) {
  try {
    const { repoUrl, kbId, oauthToken, branch = 'main' } = await req.json();

    if (!repoUrl || !kbId) {
      return NextResponse.json({ error: 'Repo URL and kbId are required' }, { status: 400, headers: corsHeaders });
    }

    // Parse URL (e.g. https://github.com/owner/repo)
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400, headers: corsHeaders });
    }
    const owner = match[1];
    const repo = match[2].replace('.git', '');

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GenWorkAI'
    };
    if (oauthToken) {
      headers['Authorization'] = `token ${oauthToken}`;
    }

    // 1. Fetch Repository Metadata
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) {
      return NextResponse.json({ error: `Failed to fetch repo info: ${repoRes.statusText}` }, { status: repoRes.status, headers: corsHeaders });
    }
    const repoData = await repoRes.json();

    // 2. Fetch Latest Commit Hash
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${branch}`, { headers });
    let latestHash = '';
    if (commitRes.ok) {
      const commitData = await commitRes.json();
      latestHash = commitData.sha;
    }

    // Determine basic classification
    const classification = {
      category: 'project',
      type: 'github',
      language: repoData.language ? repoData.language.toLowerCase() : 'mixed',
      framework: 'unknown', // Could be expanded by analyzing package.json later
      dependencies: [],
      entryPoints: []
    };

    // 3. Create or Update Knowledge Source
    const existingSources = await db.select().from(knowledgeSources).where(
      and(
        eq(knowledgeSources.kbId, parseInt(kbId, 10)), 
        eq(knowledgeSources.type, 'github')
      )
    ).limit(1);
    
    const existingSource = existingSources[0];

    let sourceId: number;
    
    if (existingSource) {
      // Very basic check: in production we would match the configuration->>'repoUrl'
      if (existingSource.latestHash === latestHash) {
        return NextResponse.json({ message: 'No new commits since last sync', sourceId: existingSource.id }, { headers: corsHeaders });
      }
      sourceId = existingSource.id;
      await db.execute(
        require('drizzle-orm').sql`UPDATE knowledge_sources SET sync_status = 'syncing' WHERE id = ${sourceId}`
      );
    } else {
      const newSource = await db.insert(knowledgeSources).values({
        kbId: parseInt(kbId, 10),
        name: repoData.full_name,
        type: 'github',
        classification,
        configuration: { repoUrl, owner, repo, branch, isPrivate: repoData.private },
        syncStatus: 'syncing',
        latestHash
      }).returning();
      sourceId = newSource[0]!.id;
    }

    // Create a Sync Job
    const syncJob = await db.insert(syncJobs).values({
      sourceId,
      status: 'processing',
      startedAt: new Date()
    }).returning();

    // 4. Download Zipball
    const zipRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`, { headers });
    if (!zipRes.ok) {
      throw new Error(`Failed to download zipball: ${zipRes.statusText}`);
    }
    const arrayBuffer = await zipRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Process Zip
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    
    let filesProcessed = 0;
    let chunksGenerated = 0;
    let embeddingsGenerated = 0;
    let errorsCount = 0;

    const apiKey = process.env.CKEY_API_KEY || '';

    for (const zipEntry of zipEntries) {
      if (zipEntry.isDirectory || !isProcessableFile(zipEntry.entryName)) {
        continue;
      }

      try {
        const fileBuffer = zipEntry.getData();
        const fullPath = zipEntry.entryName; 
        // GitHub zipball wraps contents in a root folder (e.g. owner-repo-hash/...)
        const filename = fullPath.substring(fullPath.indexOf('/') + 1); 
        const fileExtension = filename.split('.').pop()?.toLowerCase() || '';

        const extractedText = await extractTextFromBuffer(fileBuffer, 'application/octet-stream', filename);
        if (!extractedText || extractedText.length < 10) continue;

        const cleanedText = cleanExtractedText(extractedText);

        const enhancedData = apiKey ? await enhanceTextWithAI(cleanedText, apiKey, process.env.CKEY_API_URL) : {
          summary: "", topics: [], keywords: [], classification: "Unclassified",
          knowledgeContent: cleanedText, embeddingContent: cleanedText
        };

        let relType: 'flutter' | 'dotnet' | 'database' | 'openapi' | 'unknown' = 'unknown';
        if (fileExtension === 'dart') relType = 'flutter';
        else if (fileExtension === 'cs') relType = 'dotnet';
        else if (fileExtension === 'sql') relType = 'database';
        
        const relationships = extractRelationships(cleanedText, relType);

        const newDoc = await db.insert(documents).values({
          kbId: parseInt(kbId, 10),
          sourceId,
          title: filename,
          sourceType: fileExtension || 'unknown',
          sourceUrl: filename,
          content: cleanedText,
          summary: enhancedData.summary,
          topics: enhancedData.topics,
          keywords: enhancedData.keywords,
          classification: enhancedData.classification,
          knowledgeContent: enhancedData.knowledgeContent,
          embeddingContent: enhancedData.embeddingContent,
          sizeBytes: fileBuffer.length,
          metadata: { originalName: filename, processingStrategy: "3-artifact", relationships }
        }).returning();

        const chunks = smartChunkMarkdown(enhancedData.embeddingContent || cleanedText);
        chunksGenerated += chunks.length;

        for (const chunk of chunks) {
          if (chunk.length < 5) continue;
          try {
            const vector = await generateEmbedding(chunk);
            await db.insert(documentChunks).values({
              documentId: newDoc[0]!.id,
              content: chunk,
              embedding: vector
            });
            embeddingsGenerated++;
          } catch (embedErr) {
            console.error("Failed to embed chunk:", embedErr);
          }
        }
        
        filesProcessed++;
      } catch (err) {
        console.error(`Error processing zip entry ${zipEntry.entryName}:`, err);
        errorsCount++;
      }
    }

    // Add Source Snapshot
    if (latestHash) {
      await db.insert(sourceSnapshots).values({
        sourceId,
        hash: latestHash,
        metadata: { filesProcessed, chunksGenerated }
      });
    }

    // Update Source Statistics & Sync Job
    await db.execute(
      require('drizzle-orm').sql`UPDATE knowledge_sources 
      SET files_processed = files_processed + ${filesProcessed}, 
          chunks_generated = chunks_generated + ${chunksGenerated}, 
          embeddings_generated = embeddings_generated + ${embeddingsGenerated},
          document_count = document_count + ${filesProcessed},
          chunk_count = chunk_count + ${chunksGenerated},
          errors_count = errors_count + ${errorsCount},
          latest_hash = ${latestHash},
          last_sync_at = NOW(),
          last_successful_sync_at = NOW(),
          sync_status = 'success',
          classification = ${JSON.stringify(classification)}::jsonb
      WHERE id = ${sourceId}`
    );

    await db.execute(
      require('drizzle-orm').sql`UPDATE sync_jobs
      SET status = 'completed', finished_at = NOW()
      WHERE id = ${syncJob[0]!.id}`
    );

    return NextResponse.json({ success: true, sourceId, filesProcessed }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('GitHub Import error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import GitHub repo' }, { status: 500, headers: corsHeaders });
  }
}
