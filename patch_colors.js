const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/app/(dashboard)/[division]/reports/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Light gray in print header to logo Navy Blue
content = content.replace(/print:text-gray-500/g, 'print:text-[#1b497f] font-bold');

// 2. Yellow to Earthy Orange
content = content.replace(/text-yellow-400/g, 'text-orange-500');

// 3. Emerald to Logo Teal
content = content.replace(/emerald-400/g, '[#00a99d]');
content = content.replace(/emerald-500/g, '[#00a99d]');
content = content.replace(/emerald-600/g, '[#008b82]');

// 4. Change warning stepbox to earthy orange instead of zinc-400
content = content.replace(/status === 'warning' \? 'bg-zinc-800\/50 border-zinc-700'/g, `status === 'warning' ? 'bg-orange-500/10 border-orange-500/20'`);
content = content.replace(/status === 'warning' \? 'text-zinc-400'/g, `status === 'warning' ? 'text-orange-500'`);

fs.writeFileSync(filePath, content);
console.log('Applied branding colors to reports/page.tsx');
