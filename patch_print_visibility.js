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
  ['text-white', 'text-white print:text-black'],
  ['text-zinc-100', 'text-zinc-100 print:text-[#1b497f]']
]);

// 2. YearlyTable
patchFile('src/app/(dashboard)/[division]/yearly-production/YearlyTable.tsx', [
  ['text-white', 'text-white print:text-black'],
  ['text-zinc-100', 'text-zinc-100 print:text-[#1b497f]']
]);

// 3. ECharts in Charts.tsx
patchFile('src/components/dashboard/Charts.tsx', [
  [/#ffffff/g, '#00a99d']
]);

// 4. ECharts in Reports page
patchFile('src/app/(dashboard)/[division]/reports/page.tsx', [
  ['text-white', 'text-white print:text-black'],
  [/#ffffff/g, '#00a99d']
]);

// 5. ECharts in Dashboard page
patchFile('src/app/(dashboard)/[division]/dashboard/page.tsx', [
  ['text-white', 'text-white print:text-black'],
  [/#ffffff/g, '#00a99d'] // if any
]);
