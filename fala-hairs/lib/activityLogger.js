const fs   = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '../data/activity.json');
function logActivity(admin, action, product) {
  try {
    const logs = JSON.parse(fs.readFileSync(FILE,'utf8'));
    logs.unshift({ admin, action, product, time: new Date().toISOString() });
    fs.writeFileSync(FILE, JSON.stringify(logs.slice(0,300), null, 2));
  } catch {}
}
module.exports = { logActivity };
