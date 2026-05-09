#!/usr/bin/env node

/**
 * Generate PDF from the CV HTML page
 * Uses puppeteer to render the CV page and export as PDF
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_DIR = join(__dirname, '..', 'dist');
const CV_HTML_PATH = join(DIST_DIR, 'cv', 'index.html');
const PDF_OUTPUT_PATH = join(DIST_DIR, 'AJ_Wildridge_CV.pdf');

async function generatePDF() {
  console.log('🚀 Starting PDF generation...');

  // Check if dist/cv/index.html exists
  if (!existsSync(CV_HTML_PATH)) {
    console.error('❌ Error: CV HTML file not found at', CV_HTML_PATH);
    console.error('   Please run `pnpm build` first to generate the HTML.');
    process.exit(1);
  }

  let browser;
  try {
    console.log('📖 Opening browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-crash-reporter',
        '--disable-crashpad',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await browser.newPage();

    console.log('📄 Loading CV page...');
    await page.goto(`file://${CV_HTML_PATH}`, {
      waitUntil: 'networkidle0',
    });

    console.log('🖨️  Generating PDF...');
    await page.pdf({
      path: PDF_OUTPUT_PATH,
      format: 'Letter',
      printBackground: false,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    });

    console.log('✅ PDF generated successfully:', PDF_OUTPUT_PATH);
  } catch (error) {
    console.error('❌ Error generating PDF:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

generatePDF();
