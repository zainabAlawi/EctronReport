const fs = require('fs');
const path = require('path');

function patchFile(relativePath, replacements) {
  const filePath = path.resolve(relativePath);
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    const regex = typeof search === 'string' ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : search;
    content = content.replace(regex, replace);
  }
  fs.writeFileSync(filePath, content);
  console.log('Patched ' + relativePath);
}

// 1. ProductionTable
patchFile('src/components/dashboard/ProductionTable.tsx', [
  ['text-zinc-300', 'text-white font-medium'],
  ['text-zinc-400', 'text-zinc-100 font-semibold']
]);

// 2. YearlyTable
patchFile('src/app/(dashboard)/[division]/yearly-production/YearlyTable.tsx', [
  ['text-zinc-300', 'text-white font-medium'],
  ['text-zinc-400', 'text-zinc-100 font-semibold']
]);

// 3. ECharts in Charts.tsx
patchFile('src/components/dashboard/Charts.tsx', [
  [/#a1a1aa/g, '#ffffff']
]);

// 4. ECharts in Reports page
patchFile('src/app/(dashboard)/[division]/reports/page.tsx', [
  [/#a1a1aa/g, '#ffffff']
]);
