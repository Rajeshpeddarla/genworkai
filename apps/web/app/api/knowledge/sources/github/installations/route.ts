import { NextResponse } from 'next/server';
import { App } from 'octokit';
import { db } from '@/db';
import { githubInstallations } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!appId || !privateKey) {
      return NextResponse.json({ error: 'GitHub App ID or Private Key is missing from environment variables.' }, { status: 500 });
    }

    const authResult = await requireUser();
    if (authResult.error) return authResult.error;

    // Initialize the GitHub App
    const app = new App({
      appId,
      privateKey,
    });

    const userInstallations = await db.select().from(githubInstallations).where(eq(githubInstallations.userId, authResult.user.id));
    const userInstallationIds = userInstallations.map(ui => ui.installationId);

    if (userInstallationIds.length === 0) {
      return NextResponse.json({ success: true, repositories: [] });
    }

    const allRepos = [];

    // For each installation, fetch the accessible repositories
    for (const installationId of userInstallationIds) {
      try {
        const octokit = await app.getInstallationOctokit(installationId);
        const reposResponse = await octokit.rest.apps.listReposAccessibleToInstallation();
        
        for (const repo of reposResponse.data.repositories) {
          allRepos.push({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            url: repo.html_url,
            defaultBranch: repo.default_branch,
            installationId: installationId,
            ownerAvatarUrl: repo.owner.avatar_url,
            ownerLogin: repo.owner.login
          });
        }
      } catch (err) {
        console.error(`Failed to fetch repos for installation ${installationId}:`, err);
        // Continue to the next installation even if one fails
      }
    }

    return NextResponse.json({ success: true, repositories: allRepos });

  } catch (error: any) {
    console.error('GitHub API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch GitHub data' }, { status: 500 });
  }
}
