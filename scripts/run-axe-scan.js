#!/usr/bin/env node

/**
 * Run axe-core accessibility scans on specified pages
 */

import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';

const BASE_URL = 'http://127.0.0.1:4321';
const PAGES = ['/cv', '/contact', '/demos/spin-explorer'];

async function scanPage(browser, url) {
  console.log(`\n🔍 Scanning: ${url}`);
  console.log('='.repeat(60));

  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

    // For demo pages, wait for React to hydrate
    if (url.includes('/demos/')) {
      try {
        await page.waitForSelector('canvas', { timeout: 10000 });
      } catch {
        console.log('⚠️  No canvas found, continuing scan...');
      }
    }

    const results = await new AxePuppeteer(page).analyze();

    // Summary
    console.log(`\n✅ Passed: ${results.passes.length} rules`);
    console.log(`⚠️  Incomplete: ${results.incomplete.length} rules`);
    console.log(`❌ Violations: ${results.violations.length} rules`);

    // Show violations
    if (results.violations.length > 0) {
      console.log('\n🚨 VIOLATIONS:');
      results.violations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${violation.id} (${violation.impact})`);
        console.log(`   ${violation.description}`);
        console.log(`   Help: ${violation.helpUrl}`);
        console.log(`   Affected nodes: ${violation.nodes.length}`);

        violation.nodes.slice(0, 3).forEach((node) => {
          console.log(`     - ${node.html.substring(0, 100)}...`);
          console.log(`       ${node.failureSummary.split('\n').slice(0, 2).join(' ')}`);
        });
      });
    }

    // Show incomplete (needs manual review)
    if (results.incomplete.length > 0) {
      console.log('\n⚠️  INCOMPLETE (Manual Review Needed):');
      results.incomplete.slice(0, 5).forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.id} (${item.impact || 'unknown'})`);
        console.log(`   ${item.description}`);
        console.log(`   Affected nodes: ${item.nodes.length}`);
      });
    }

    return results;
  } catch (error) {
    console.error(`❌ Error scanning ${url}:`, error.message);
    return null;
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🚀 Starting Axe-core accessibility scans...\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const allResults = {};
    let totalViolations = 0;
    let criticalViolations = 0;

    for (const path of PAGES) {
      const url = `${BASE_URL}${path}`;
      const results = await scanPage(browser, url);

      if (results) {
        allResults[path] = results;
        totalViolations += results.violations.length;
        criticalViolations += results.violations.filter((v) => v.impact === 'critical').length;
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Pages scanned: ${PAGES.length}`);
    console.log(`Total violations: ${totalViolations}`);
    console.log(`Critical violations: ${criticalViolations}`);

    if (criticalViolations > 0) {
      console.log('\n❌ FAIL: Critical accessibility violations found!');
      process.exit(1);
    } else if (totalViolations > 0) {
      console.log('\n⚠️  WARNING: Non-critical violations found. Please review.');
      process.exit(0);
    } else {
      console.log('\n✅ SUCCESS: No accessibility violations found!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main();
