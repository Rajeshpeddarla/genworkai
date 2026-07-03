import { Sidebar } from "../../components/layout/sidebar";
import { GlobalQuotaToast } from "../../components/layout/GlobalQuotaToast";
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background text-foreground print:block print:h-auto print:bg-transparent print:text-black">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden bg-zinc-50 dark:bg-[#0A0A0B] transition-colors print:block print:h-auto print:bg-transparent print:overflow-visible">
        <main className="flex-1 flex flex-col overflow-hidden p-3 pt-4 pr-4 print:block print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
      <div className="print:hidden">
        <GlobalQuotaToast />
      </div>
    </div>
  );
}
