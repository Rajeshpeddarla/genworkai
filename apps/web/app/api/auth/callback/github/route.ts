import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const installationId = searchParams.get('installation_id');
  const setupAction = searchParams.get('setup_action');

  // When a user successfully installs the GitHub App, GitHub redirects here
  // We simply redirect them back to the knowledge base dashboard with a success parameter
  
  if (installationId) {
    // Redirect back to the knowledge base grid page
    return NextResponse.redirect(new URL('/knowledge?github_connected=true', req.url));
  }

  // If there's an error or we just got an OAuth code instead, handle gracefully
  // (In V1 we are strictly using the GitHub App installation flow, so we just redirect)
  return NextResponse.redirect(new URL('/knowledge', req.url));
}
