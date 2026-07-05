const fs = require('fs');
const files = [
  'apps/web/app/(app)/automation-studio/AutomationDashboard.tsx',
  'apps/web/app/(app)/knowledge/page.tsx',
  'apps/web/app/(app)/file-studio/page.tsx',
  'apps/web/app/(app)/mcp-builder/page.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log('Skipping', file);
    continue;
  }
  let c = fs.readFileSync(file, 'utf8');

  // Backgrounds
  c = c.replaceAll('bg-zinc-50 dark:bg-[#0A0A0E]', 'bg-background');
  c = c.replaceAll('bg-zinc-50 dark:bg-background', 'bg-background');
  c = c.replaceAll('bg-white dark:bg-[#15151A]', 'bg-card');
  c = c.replaceAll('bg-white dark:bg-card', 'bg-card');
  c = c.replaceAll('bg-white dark:bg-zinc-900', 'bg-card');
  c = c.replaceAll('bg-zinc-100 dark:bg-background/30', 'bg-muted');
  c = c.replaceAll('bg-zinc-200 dark:bg-background/50', 'bg-muted');
  c = c.replaceAll('bg-background/5 dark:bg-white/5', 'bg-accent');
  
  // Borders
  c = c.replaceAll('border-zinc-200 dark:border-white/5', 'border-border');
  c = c.replaceAll('border-zinc-200 dark:border-white/10', 'border-border');
  c = c.replaceAll('border-zinc-200 dark:border-zinc-800', 'border-border');
  c = c.replaceAll('border-zinc-200 dark:border-zinc-700', 'border-border');
  c = c.replaceAll('border-zinc-200 dark:border-zinc-800/50', 'border-border/50');
  
  // Text
  c = c.replaceAll('text-zinc-900 dark:text-foreground', 'text-foreground');
  c = c.replaceAll('text-zinc-900 dark:text-white', 'text-foreground');
  c = c.replaceAll('text-zinc-800 dark:text-foreground', 'text-foreground');
  c = c.replaceAll('text-zinc-700 dark:text-zinc-300', 'text-foreground');
  c = c.replaceAll('text-zinc-600 dark:text-zinc-400', 'text-muted-foreground');
  c = c.replaceAll('text-zinc-500 dark:text-zinc-500', 'text-muted-foreground');
  c = c.replaceAll('text-zinc-500 dark:text-zinc-400', 'text-muted-foreground');
  c = c.replaceAll('text-zinc-500 dark:text-zinc-300', 'text-muted-foreground');
  
  // Hover Backgrounds
  c = c.replaceAll('hover:bg-background/10 dark:hover:bg-white/10', 'hover:bg-accent');
  c = c.replaceAll('hover:bg-zinc-100 dark:hover:bg-white/5', 'hover:bg-accent');
  c = c.replaceAll('hover:bg-zinc-50 dark:hover:bg-zinc-800', 'hover:bg-accent');
  
  // Hover Text
  c = c.replaceAll('dark:hover:text-foreground', 'hover:text-foreground');

  fs.writeFileSync(file, c);
  console.log('Cleaned up UI classes in', file);
}
