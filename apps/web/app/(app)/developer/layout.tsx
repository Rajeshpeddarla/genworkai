import { ReactNode } from 'react';
import AIAssistantWidget from '../../../components/developer/AIAssistantWidget';
import DeveloperSidebar from '../../../components/developer/DeveloperSidebar';

export default function DeveloperLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
      <DeveloperSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      <AIAssistantWidget />
    </div>
  );
}
