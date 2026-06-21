import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { githubInstallations } from '../../../../../db/schema';
import { requireUser } from '../../../../../lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const installationId = searchParams.get('installation_id');
  const setupAction = searchParams.get('setup_action');

  // When a user successfully installs the GitHub App, GitHub redirects here
  // We simply redirect them back to the knowledge base dashboard with a success parameter
  
  if (installationId) {
    const authResult = await requireUser();
    
    if (authResult.user) {
      // Create or update the mapping in the database
      const parsedId = parseInt(installationId, 10);
      if (!isNaN(parsedId)) {
        await db.insert(githubInstallations).values({
          userId: authResult.user.id,
          installationId: parsedId,
        }).onConflictDoUpdate({
          target: githubInstallations.installationId,
          set: { userId: authResult.user.id }
        });
      }
    }

    // Redirect back to the knowledge base grid page
    return NextResponse.redirect(new URL('/knowledge?github_connected=true', req.url));
  }

  // If there's an error or we just got an OAuth code instead, handle gracefully
  // (In V1 we are strictly using the GitHub App installation flow, so we just redirect)
  return NextResponse.redirect(new URL('/knowledge', req.url));
}
