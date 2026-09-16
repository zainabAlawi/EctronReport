const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/components/dashboard/Charts.tsx');
let content = fs.readFileSync(filePath, 'utf8');

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
console.log('Updated Charts.tsx');
