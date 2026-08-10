const fs = require('fs');
const path = require('path');

const files = [
  'src/components/Layout.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/ProfitSharingPage.tsx',
  'src/pages/Login.tsx',
  'src/pages/ProductsPage.tsx',
  'src/pages/OrdersPage.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content
    .replace(/bg-orange-50\/50/g, 'bg-amber-50/50')
    .replace(/bg-orange-50\/30/g, 'bg-amber-50/30')
    .replace(/bg-orange-50/g, 'bg-amber-100')
    .replace(/hover:bg-orange-50/g, 'hover:bg-amber-100')
    .replace(/border-orange-100/g, 'border-amber-200')
    .replace(/text-orange-900/g, 'text-sky-900')
    .replace(/text-orange-600\/80/g, 'text-sky-600/80')
    .replace(/bg-orange-100/g, 'bg-sky-100')
    .replace(/hover:bg-sky-100/g, 'hover:bg-sky-100')
    .replace(/text-orange-700/g, 'text-sky-700')
    .replace(/ring-orange-500/g, 'ring-sky-500')
    .replace(/bg-orange-600/g, 'bg-sky-500')
    .replace(/hover:bg-orange-700/g, 'hover:bg-sky-600')
    .replace(/text-orange-600/g, 'text-sky-600')
    .replace(/bg-orange-500/g, 'bg-sky-500')
    
  fs.writeFileSync(file, content);
});
console.log('Colors replaced');
