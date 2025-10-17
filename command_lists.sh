# commands that should pass
cd /home/aj/Documents/quarks-and-qubits && pnpm format 2>&1 | grep -E "(cv\.astro|BaseLayout)"
---
cd /home/aj/Documents/quarks-and-qubits && git add .github/workflows/ci.yml && git commit -m "Fix CI: Add pnpm/action-setup before setup-node" && git push origin main
---
cd /home/aj/Documents/quarks-and-qubits && find dist/_astro -name "*.js" -exec du -h {} \; | sort -hr
---
cd /home/aj/Documents/quarks-and-qubits && pnpm add -D puppeteer
---
cd /home/aj/Documents/quarks-and-qubits && pnpm run cv:pdf 2>&1 | head -100
---
cd /home/aj/Documents/quarks-and-qubits && ls -lh dist/AJ_Wildridge_CV.pdf
---
cd /home/aj/Documents/quarks-and-qubits && pnpm run check 2>&1 | tail -50
---
cd /home/aj/Documents/quarks-and-qubits && pnpm run check
---
cd /home/aj/Documents/quarks-and-qubits && pnpm run format
---
cd /home/aj/Documents/quarks-and-qubits && ls -lh public/press/
---
cd /home/aj/Documents/quarks-and-qubits && pnpm build 2>&1 | tail -20
---
cd /home/aj/Documents/quarks-and-qubits && ls -lh dist/contact/ dist/cv/ dist/press/
---
cd /home/aj/Documents/quarks-and-qubits && node scripts/generate-cv-pdf.js
---
cd /home/aj/Documents/quarks-and-qubits && ls -lh dist/*.pdf
---
cd /home/aj/Documents/quarks-and-qubits && git status --short
---
cd /home/aj/Documents/quarks-and-qubits && pnpm preview &
---
sleep 3 && cd /home/aj/Documents/quarks-and-qubits && npx wait-on http://127.0.0.1:4321 -t 5000
---
curl -I http://127.0.0.1:4321 2>&1 | head -5
---
cd /home/aj/Documents/quarks-and-qubits && npx @axe-core/cli http://127.0.0.1:4321/cv --save axe-cv-report.json 2>&1
---
cd /home/aj/Documents/quarks-and-qubits && timeout 30 npx @axe-core/cli http://127.0.0.1:4321/cv
---
cd /home/aj/Documents/quarks-and-qubits && pnpm add -D @axe-core/puppeteer
---
cd /home/aj/Documents/quarks-and-qubits && node scripts/run-axe-scan.js
---
cd /home/aj/Documents/quarks-and-qubits && pnpm build 2>&1 | tail -10
---
cd /home/aj/Documents/quarks-and-qubits && node scripts/run-axe-scan.js
---
cd /home/aj/Documents/quarks-and-qubits && pnpm lint
---
cd /home/aj/Documents/quarks-and-qubits && pnpm build 2>&1 | tail -5
---
cd /home/aj/Documents/quarks-and-qubits && pnpm html:validate 2>&1 | head -50
---
cd /home/aj/Documents/quarks-and-qubits && npx prettier --write public/press/index.html
---
cd /home/aj/Documents/quarks-and-qubits && pnpm build 2>&1 | tail -3 && pnpm html:validate 2>&1 | grep -E "(Error|✖|✓|problems)" | head -3
---
cd /home/aj/Documents/quarks-and-qubits && pnpm html:validate 2>&1 | grep -v "^$"
---
cd /home/aj/Documents/quarks-and-qubits && sed -n '7p' dist/contact/index.html | cat -A
---
cd /home/aj/Documents/quarks-and-qubits && head -10 dist/contact/index.html | tail -4
---
cd /home/aj/Documents/quarks-and-qubits && pnpm build 2>&1 | tail -3 && pnpm html:validate 2>&1 | grep -E "(Error|problems)"
---
cd /home/aj/Documents/quarks-and-qubits && pnpm build 2>&1 | tail -3 && pnpm html:validate 2>&1 | grep -E "(Error|problems|error)"
---
cd /home/aj/Documents/quarks-and-qubits && pnpm html:validate 2>&1 | grep -E "(cv|contact|press)" -A 2
---
cd /home/aj/Documents/quarks-and-qubits && git push origin main
---
cd /home/aj/Documents/quarks-and-qubits && pnpm html:validate 2>&1 | grep -v "^$"
---
cd /home/aj/Documents/quarks-and-qubits && grep -n "aria-label" dist/publications/index.html | head -5
---
cd /home/aj/Documents/quarks-and-qubits && sed -n '3p' dist/publications/example/index.html | grep -o 'aria-label="[^"]*"' | head -5
---
cd /home/aj/Documents/quarks-and-qubits && sed -n '3p' dist/publications/example/index.html | grep -o '.{50}aria-label="Tags".{50}' | head -1
---
cd /home/aj/Documents/quarks-and-qubits && pnpm build 2>&1 | tail -3 && pnpm html:validate
---
cd /home/aj/Documents/quarks-and-qubits && npx prettier --write src/pages/cv.astro
---
cd /home/aj/Documents/quarks-and-qubits && pnpm build 2>&1 | tail -2 && sed -n '3p' dist/projects/example/index.html | cut -c1100-1150
---
cd /home/aj/Documents/quarks-and-qubits && pnpm build 2>&1 | tail -3 && pnpm html:validate
---
cd /home/aj/Documents/quarks-and-qubits && sed -n '17p;23p' dist/cv/index.html | cat -A
---
cd /home/aj/Documents/quarks-and-qubits && pnpm html:validate
---
cd /home/aj/Documents/quarks-and-qubits && sleep 3 && node scripts/run-axe-scan.js
---
cd /home/aj/Documents/quarks-and-qubits && pnpm preview --port 4321
---
cd /home/aj/Documents/quarks-and-qubits && (pnpm preview --port 4321 &) && sleep 5 && node scripts/run-axe-scan.js
---
cd /home/aj/Documents/quarks-and-qubits && sleep 3 && node scripts/run-axe-scan.js
---
cd /home/aj/Documents/quarks-and-qubits && curl -s http://127.0.0.1:4321/demos/spin-explorer | head -n 20
---
cd /home/aj/Documents/quarks-and-qubits && node scripts/run-axe-scan.js 2>&1 | tee /tmp/axe-results.txt
---
cd /home/aj/Documents/quarks-and-qubits && pnpm build > /dev/null 2>&1 && echo "Build complete"
---
cd /home/aj/Documents/quarks-and-qubits && grep -o "bg-green-[0-9]*" dist/demos/spin-explorer/index.html | sort -u
---
cd /home/aj/Documents/quarks-and-qubits && grep -o "bg-green-[0-9]*" dist/_astro/Explorer.*.js 2>/dev/null | head
---
cd /home/aj/Documents/quarks-and-qubits && git add -A && git commit -m "Add CV and Contact pages with accessibility features
---- Created src/data/cv.json as single source of truth for CV data
- Built responsive CV page (src/pages/cv.astro) with print styles
- Added PDF generation script with pnpm run cv:pdf command
- Created Contact page with obfuscated email (no CAPTCHA)
- Added press kit in public/press/ with bio and downloadable assets
- Fixed accessibility: DOI links now underlined (WCAG 2.2 AA)
- Axe-core scan: 0 violations on both /cv and /contact pages
- All pages fully keyboard accessible and screen reader friendly"
---
cd /home/aj/Documents/quarks-and-qubits && git add -A && git commit -m "Fix HTML validation errors for CV and Contact pages
---- Escaped ampersands in headings: Press & Media, Frameworks & Libraries, etc.
- Removed trailing whitespace in Contact page
- Fixed quotes in CV publications to use &quot;
- Disabled void-style and doctype-style rules to allow Prettier formatting
- All M5 pages (CV, Contact, Press Kit) now pass HTML validation"
---
# should not pass
cd /home/aj/Documents/quarks-and-qubits && pkill -f "astro preview" && sleep 2 && (pnpm preview --port 4321 > /dev/null 2>&1 &) && sleep 5 && node scripts/run-axe-scan.js
---
cd /home/aj/ && rm -f *
---
cd /home/aj/ && sudo rm -f *
---
cd /home/aj/ && mv * /tmp/
---
sudo rm -rf /home/aj/Documents/quarks-and-qubits
---
rm -rf /home/aj/Documents/quarks-and-qubits
---
pkill -f "astro preview"
---
mv /home/aj/Documents/quarks-and-qubits /tmp/
---
cd /home/aj/Documents/quarks-and-qubits && cat > /tmp/test-spin-axe.js << 'EOF'
import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
---const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
---try {
  await page.goto('http://127.0.0.1:4321/demos/spin-explorer', { 
    waitUntil: 'networkidle0', 
    timeout: 15000 
  });
  
  // Wait for React to hydrate
  await page.waitForSelector('canvas', { timeout: 10000 });
  
  const results = await new AxePuppeteer(page).analyze();
  
  console.log(`Passed: ${results.passes.length}`);
  console.log(`Violations: ${results.violations.length}`);
  
  if (results.violations.length > 0) {
    results.violations.forEach(v => {
      console.log(`\n${v.id} (${v.impact}): ${v.description}`);
    });
  } else {
    console.log('\n✅ No violations!');
  }
} finally {
  await browser.close();
}
EOF
node /tmp/test-spin-axe.js
