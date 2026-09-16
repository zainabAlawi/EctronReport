const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/app/(dashboard)/[division]/dashboard/page.tsx',
  'src/app/(dashboard)/[division]/reports/page.tsx',
  'src/app/(dashboard)/[division]/upload/page.tsx',
  'src/app/(dashboard)/[division]/yearly-production/page.tsx',
  'src/app/(dashboard)/[division]/yearly-production/YearlyTable.tsx',
  'src/app/api/upload/route.ts',
  'src/app/api/upload/yearly/route.ts',
  'src/components/dashboard/Charts.tsx'
];

function processFile(filePath) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace targetTable logic
  content = content.replace(
    /const targetTable = division === 'water' \? 'water_daily_production' : 'electricity_daily_production';/g,
    "const targetTable = division === 'water' ? 'water_daily_production' : division === 'electricity-ecs1100' ? 'electricity_ecs1100_daily_production' : 'electricity_daily_production';"
  );

  // Replace `division === 'electricity'` with `(division === 'electricity' || division === 'electricity-ecs1100')`
  // Actually, mostly the code uses `if (division === 'water') { ... } else { ... }` or `else if (division === 'electricity')`.
  // Let's replace `else if (division === 'electricity')` with `else if (division === 'electricity' || division === 'electricity-ecs1100')`
  content = content.replace(
    /else if \(division === 'electricity'\)/g,
    "else if (division === 'electricity' || division === 'electricity-ecs1100')"
  );

  content = content.replace(
    /if \(division === 'electricity'\)/g,
    "if (division === 'electricity' || division === 'electricity-ecs1100')"
  );

  content = content.replace(
    /division === 'water' \? 'المياه' : 'الكهرباء'/g,
    "division === 'water' ? 'المياه' : division === 'electricity-ecs1100' ? 'الكهرباء ECS1100' : 'الكهرباء M212'"
  );

  fs.writeFileSync(fullPath, content);
  console.log('Updated', filePath);
}

filesToUpdate.forEach(processFile);
