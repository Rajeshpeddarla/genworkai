import React from 'react';
import { db } from '@/db';
import { automationTasks, automationLogs, workspaceArtifacts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { FileText, PlayCircle, Clock, CheckCircle, XCircle, Download, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { AutomationDetailClient } from './AutomationDetailClient';

export default async function AutomationDetail({ params }: { params: { id: string } }) {
  const { user, error } = await requireUser();
  if (error || !user) redirect('/login');

  const taskId = parseInt(params.id);
  if (isNaN(taskId)) redirect('/automation-studio');

  const task = await db.query.automationTasks.findFirst({
    where: eq(automationTasks.id, taskId)
  });

  if (!task || task.userId !== user.id) redirect('/automation-studio');

  const logs = await db.select({
    id: automationLogs.id,
    status: automationLogs.status,
    startedAt: automationLogs.startedAt,
    finishedAt: automationLogs.finishedAt,
    creditsConsumed: automationLogs.creditsConsumed,
    artifactName: workspaceArtifacts.name,
    artifactId: workspaceArtifacts.id
  })
    .from(automationLogs)
    .leftJoin(workspaceArtifacts, eq(automationLogs.artifactId, workspaceArtifacts.id))
    .where(eq(automationLogs.taskId, taskId))
    .orderBy(desc(automationLogs.startedAt));

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full min-h-screen text-white bg-[#0a0a0a]">
      <div className="mb-8 border-b border-gray-800 pb-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{task.name}</h1>
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${task.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                {task.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            <p className="text-gray-400 mt-2">Category: {task.category} | Mode: {task.executionMode}</p>
          </div>
          <div className="flex gap-4">
            <button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <PlayCircle className="w-4 h-4" /> Run Again
            </button>
            <Link href="/automation-studio" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
              Back to Studio
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <AutomationDetailClient task={task} logs={logs} />
      </div>
    </div>
  );
}
