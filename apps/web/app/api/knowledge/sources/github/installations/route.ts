import { NextResponse } from 'next/server';
import { App } from 'octokit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!appId || !privateKey) {
      return NextResponse.json({ error: 'GitHub App ID or Private Key is missing from environment variables.' }, { status: 500 });
    }

    // Initialize the GitHub App
    const app = new App({
      appId,
      privateKey,
    });

    // Fetch all installations of this app
    let installations;
    try {
      const response = await app.octokit.rest.apps.listInstallations();
      installations = response.data;
    } catch (e: any) {
      console.error("Failed to list GitHub App installations:", e);
      return NextResponse.json({ error: 'Failed to authenticate as GitHub App. Check your Private Key and App ID.' }, { status: 500 });
    }

    const allRepos = [];

    // For each installation, fetch the accessible repositories
    for (const installation of installations) {
      try {
        const octokit = await app.getInstallationOctokit(installation.id);
        const reposResponse = await octokit.rest.apps.listReposAccessibleToInstallation();
        
        for (const repo of reposResponse.data.repositories) {
          allRepos.push({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            url: repo.html_url,
            defaultBranch: repo.default_branch,
            installationId: installation.id,
            ownerAvatarUrl: repo.owner.avatar_url,
            ownerLogin: repo.owner.login
          });
        }
      } catch (err) {
        console.error(`Failed to fetch repos for installation ${installation.id}:`, err);
        // Continue to the next installation even if one fails
      }
    }

    return NextResponse.json({ success: true, repositories: allRepos });

  } catch (error: any) {
    console.error('GitHub API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch GitHub data' }, { status: 500 });
  }
}
