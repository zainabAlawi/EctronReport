const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/app/(dashboard)/[division]/reports/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const printHeader = `
      {/* Print-only Header */}
      <div className="hidden print:block mb-8 border-b border-black pb-4 text-black">
        <h1 className="text-3xl font-bold mb-4">Ectron Reporting System</h1>
        <div className="grid grid-cols-2 gap-4 text-sm font-medium">
          <div>
            <p><span className="text-gray-500">Report Type:</span> {activeTab}</p>
            <p><span className="text-gray-500">Department:</span> {division === 'water' ? 'Water Siconia' : division === 'electricity-ecs1100' ? 'Electricity ECS1100' : 'Electricity M212'}</p>
          </div>
          <div>
            <p>
              <span className="text-gray-500">Period:</span>{' '}
              {activeTab === 'Daily' ? (startDate === endDate ? startDate : \`\${startDate} to \${endDate}\`) :
               activeTab === 'Weekly' ? \`\${months[parseInt(selectedMonth)]} \${selectedYear}\` :
               activeTab === 'Monthly' ? \`Year \${selectedYear}\` :
               '5-Year Overview'}
            </p>
            <p><span className="text-gray-500">Generated Date:</span> {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB')}</p>
          </div>
        </div>
      </div>
`;

content = content.replace(
  /<div className="flex flex-col gap-6">/g,
  `<div className="flex flex-col gap-6">\n${printHeader}`
);

// We need to make sure the main title is hidden in print so it doesn't duplicate the info
content = content.replace(
  /<div className="flex items-center justify-between">/g,
  `<div className="flex items-center justify-between print:hidden">`
);

fs.writeFileSync(filePath, content);
console.log('Added print header to reports page!');
