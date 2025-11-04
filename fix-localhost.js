const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'freezefood', 'src', 'app', 'admin', 'admin.component.ts');

console.log('🔧 Fixing localhost:3000 URLs in admin.component.ts...\n');

let content = fs.readFileSync(filePath, 'utf8');
let changeCount = 0;

// 1. Replace 'http://localhost:3000/api/...' with template string
const pattern1 = /'http:\/\/localhost:3000\/api\/([^']+)'/g;
content = content.replace(pattern1, (match, path) => {
  changeCount++;
  return `\`\${this.apiUrl}/${path}\``;
});

// 2. Replace "http://localhost:3000/api/..." with template string
const pattern2 = /"http:\/\/localhost:3000\/api\/([^"]+)"/g;
content = content.replace(pattern2, (match, path) => {
  changeCount++;
  return `\`\${this.apiUrl}/${path}\``;
});

// 3. Replace `http://localhost:3000/api/...` already in template strings
const pattern3 = /`http:\/\/localhost:3000\/api\/([^`]+)`/g;
content = content.replace(pattern3, (match, path) => {
  changeCount++;
  return `\`\${this.apiUrl}/${path}\``;
});

// 4. Replace 'http://localhost:3000/...' (not /api)
const pattern4 = /'http:\/\/localhost:3000\/([^']+)'/g;
content = content.replace(pattern4, (match, path) => {
  changeCount++;
  return `\`\${this.apiUrl.replace('/api', '')}/${path}\``;
});

// 5. Replace "http://localhost:3000/..."
const pattern5 = /"http:\/\/localhost:3000\/([^"]+)"/g;
content = content.replace(pattern5, (match, path) => {
  changeCount++;
  return `\`\${this.apiUrl.replace('/api', '')}/${path}\``;
});

// 6. Replace standalone 'http://localhost:3000'
const pattern6 = /'http:\/\/localhost:3000'/g;
content = content.replace(pattern6, () => {
  changeCount++;
  return "`${this.apiUrl.replace('/api', '')}`";
});

// 7. Replace standalone "http://localhost:3000"
const pattern7 = /"http:\/\/localhost:3000"/g;
content = content.replace(pattern7, () => {
  changeCount++;
  return "`${this.apiUrl.replace('/api', '')}`";
});

// 8. Fix baseUrl line specifically
const pattern8 = /const baseUrl = 'http:\/\/localhost:3000\/image\/';/g;
content = content.replace(pattern8, () => {
  changeCount++;
  return "const baseUrl = `${this.apiUrl.replace('/api', '')}/image/`;";
});

fs.writeFileSync(filePath, content, 'utf8');

console.log(`✅ Fixed ${changeCount} occurrences of localhost:3000`);
console.log('✅ admin.component.ts updated successfully!');
