const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/app/(dashboard)/[division]/reports/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /<div className="hidden print:block mb-8 border-b border-black pb-4 text-black">/g,
  `<div className="hidden print:block mb-8 border-b print:border-black pb-4 print:text-black">`
);

content = content.replace(
  /<p><span className="text-gray-500">/g,
  `<p><span className="print:text-gray-500">`
);

content = content.replace(
  /<span className="text-gray-500">Period:<\/span>/g,
  `<span className="print:text-gray-500">Period:</span>`
);

content = content.replace(
  /<span className="text-gray-500">Generated Date:<\/span>/g,
  `<span className="print:text-gray-500">Generated Date:</span>`
);

fs.writeFileSync(filePath, content);
console.log('Fixed print header colors');
