const fetch = require('node-fetch');

async function dumpFullItem() {
  const url = "https://docs.google.com/forms/d/e/1FAIpQLSc-n8g7QXy7DSxQQejQRd_pTNLBXWn_TP-xZ3bRZ5E8t1c3OA/viewform?authuser=0";
  const res = await fetch(url);
  const html = await res.text();
  const startPrefix = 'var FB_PUBLIC_LOAD_DATA_ = ';
  const startIdx = html.indexOf(startPrefix);
  const dataStart = startIdx + startPrefix.length;
  let bracketCount = 0;
  let endIdx = -1;
  for (let j = dataStart; j < html.length; j++) {
    if (html[j] === '[') bracketCount++;
    else if (html[j] === ']') {
      bracketCount--;
      if (bracketCount === 0) { endIdx = j; break; }
    }
  }
  const parsed = JSON.parse(html.substring(dataStart, endIdx + 1));
  const items = parsed[1][1];
  for (const item of items) {
    if (item[3] === 2) {
      console.log("Full Item Dump:\n", JSON.stringify(item, null, 2));
      break;
    }
  }
}

dumpFullItem().catch(console.error);
