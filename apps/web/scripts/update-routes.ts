import * as fs from 'fs';
import * as path from 'path';

const filesToUpdate = [
  'app/api/ai/route.ts',
  'app/api/v1/kb/[kbId]/generate/route.ts',
  'app/api/v1/db/[dbId]/documentation/route.ts',
  'app/api/v1/db/[dbId]/ask/route.ts',
  'app/api/v1/kb/[kbId]/ask/route.ts',
  'app/api/knowledge/architecture/explain/route.ts',
  'app/api/databases/[id]/chat/route.ts',
  'app/api/developer/byok/test/route.ts'
];

for (const file of filesToUpdate) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf-8');

  // Update import
  if (content.includes("import { generateWithFallbacks } from '@repo/ai';")) {
    content = content.replace(
      "import { generateWithFallbacks } from '@repo/ai';",
      "import { generateWithFallbacks, TaskCategory } from '@repo/ai';"
    );
  } else if (content.includes("import { generateWithFallbacks, ProviderConfig } from '@repo/ai';")) {
    content = content.replace(
      "import { generateWithFallbacks, ProviderConfig } from '@repo/ai';",
      "import { generateWithFallbacks, ProviderConfig, TaskCategory } from '@repo/ai';"
    );
  }

  // Update logic
  if (file.includes('generate/route') || file.includes('documentation/route')) {
    content = content.replace(/agentRole:\s*['"]reasoning['"]/g, 'taskCategory: TaskCategory.STRUCTURED');
    content = content.replace(/agentRole:\s*['"]formatting['"]/g, 'taskCategory: TaskCategory.STRUCTURED');
    content = content.replace(/agentRole:\s*['"]fast['"]/g, 'taskCategory: TaskCategory.FAST');
  } else if (file.includes('byok/test/route')) {
    content = content.replace(/agentRole:\s*['"]fast['"]/g, 'taskCategory: TaskCategory.FAST');
    content = content.replace(/agentRole:\s*['"]reasoning['"]/g, 'taskCategory: TaskCategory.FAST');
  } else {
    // Default chat/reasoning
    content = content.replace(/agentRole:\s*['"]reasoning['"]/g, 'taskCategory: TaskCategory.REASONING');
    content = content.replace(/agentRole:\s*['"]fast['"]/g, 'taskCategory: TaskCategory.FAST');
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
