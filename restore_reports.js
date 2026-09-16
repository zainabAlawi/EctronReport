const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/app/(dashboard)/[division]/reports/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. targetTable
content = content.replace(
  /const targetTable = division === 'water' \? 'water_daily_production' : 'electricity_daily_production';/g,
  "const targetTable = division === 'water' ? 'water_daily_production' : division === 'electricity-ecs1100' ? 'electricity_ecs1100_daily_production' : 'electricity_daily_production';"
);

// 2. Failers totals
const failersInit = `const todayTotals = { assembly: 0, perso: 0, lasering: 0, packaging: 0, cartons: 0, palets: 0, cards: 0, insolation: 0, radiation_frequency: 0, calibration: 0, multy_test: 0, metrology: 0 };
  const failersTotals = { assembly: 0, perso: 0, lasering: 0, packaging: 0, cartons: 0, palets: 0, cards: 0, insolation: 0, radiation_frequency: 0, calibration: 0, multy_test: 0, metrology: 0 };`;

content = content.replace(
  /const todayTotals = { assembly: 0, perso: 0, lasering: 0, packaging: 0, cartons: 0, palets: 0, cards: 0, insolation: 0, radiation_frequency: 0, calibration: 0, multy_test: 0, metrology: 0 };/g,
  failersInit
);

const failersAgg = `
    // Failers totals
    if (d.failers) {
      failersTotals.assembly += (d.failers.assembly || 0);
      failersTotals.perso += (d.failers.perso || 0);
      failersTotals.lasering += (d.failers.lasering || 0);
      failersTotals.packaging += (d.failers.packaging || 0);
      failersTotals.cartons += (d.failers.cartons || 0);
      failersTotals.palets += (d.failers.palets || 0);
      failersTotals.cards += (d.failers.cards || 0);
      failersTotals.insolation += (d.failers.insolation || 0);
      failersTotals.radiation_frequency += (d.failers.radiation_frequency || 0);
      failersTotals.calibration += (d.failers.calibration || 0);
      failersTotals.multy_test += (d.failers.multy_test || 0);
      failersTotals.metrology += (d.failers.metrology || 0);
    }
`;

content = content.replace(
  /todayTotals\.metrology \+= \(d\.metrology \|\| 0\);/g,
  `todayTotals.metrology += (d.metrology || 0);\n${failersAgg}`
);

// 3. Passing failersTotals to DailyReport
content = content.replace(
  /<DailyReport division={division} totals={todayTotals} date={startDate === endDate \? startDate : \`\${startDate} to \${endDate}\`} target={rangeTarget} shiftData={shiftTotals} \/>/g,
  `<DailyReport division={division} totals={todayTotals} date={startDate === endDate ? startDate : \`\${startDate} to \${endDate}\`} target={rangeTarget} shiftData={shiftTotals} failersData={failersTotals} />`
);

content = content.replace(
  /function DailyReport\({ division, totals, date, target, shiftData }: { division: string, totals: any, date: string, target: number, shiftData: any }\) {/g,
  `function DailyReport({ division, totals, date, target, shiftData, failersData }: { division: string, totals: any, date: string, target: number, shiftData: any, failersData?: any }) {`
);

content = content.replace(
  /target={target}\n\s+\/>/g,
  `target={target}\n          failersData={failersData}\n        />`
);

// 4. Print buttons and print:hidden
content = content.replace(
  /<div className="flex items-center gap-3">/g,
  `<div className="flex items-center gap-3 print:hidden">`
);

content = content.replace(
  /<button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-medium hover:bg-zinc-700 transition-colors border border-zinc-700">/g,
  `<button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-medium hover:bg-zinc-700 transition-colors border border-zinc-700">`
);

content = content.replace(
  /<button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-\[0_0_15px_rgba\(59,130,246,0\.3\)\]">/g,
  `<button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">`
);

content = content.replace(
  /<button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-\[0_0_15px_rgba\(16,185,129,0\.3\)\]">/g,
  `<button onClick={() => {
            import('xlsx').then(XLSX => {
              const ws = XLSX.utils.json_to_sheet(dbData);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Report");
              XLSX.writeFile(wb, \`\${division}_report.xlsx\`);
            });
          }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]">`
);

content = content.replace(
  /<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">/g,
  `<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">`
);

const toolboxConfig = `
    toolbox: {
      feature: {
        saveAsImage: {
          title: 'Export Image',
          pixelRatio: 2,
          name: 'chart_export',
          backgroundColor: '#18181b',
          iconStyle: { borderColor: '#a1a1aa' }
        }
      }
    },`;

content = content.replace(/const options = {/g, `const options = {${toolboxConfig}`);

fs.writeFileSync(filePath, content);
console.log('Restored all changes for reports page!');
