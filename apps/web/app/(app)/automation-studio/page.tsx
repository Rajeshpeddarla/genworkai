"use client";

import React from 'react';
import { AutomationDashboard } from './AutomationDashboard';

export default function AutomationStudioPage() {
  return (
    <div className="p-8 w-full h-screen overflow-y-auto custom-scrollbar text-zinc-900 dark:text-zinc-900 dark:text-white bg-zinc-50 dark:bg-[#0a0a0a]">
      <div className="max-w-[1600px] mx-auto">
        <AutomationDashboard />
      </div>
    </div>
  );
}
