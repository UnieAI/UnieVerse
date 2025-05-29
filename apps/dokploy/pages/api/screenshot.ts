import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer-core';
import path from 'path';
import { promises as fs } from 'fs';

async function serveFallbackImage(res: NextApiResponse) {
  try {
    const fallbackPath = path.join(process.cwd(), 'public', 'placeholder.png');
    const fallbackBuffer = await fs.readFile(fallbackPath);
    res.setHeader('Content-Type', 'image/png');
    res.status(200).end(fallbackBuffer);
  } catch (fallbackError) {
    const error = fallbackError as Error;
    console.error('[Failed to read default image / 預設圖片讀取失敗]', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ 
      error: 'Failed to capture screenshot and read default image / 截圖與預設圖片皆失敗' 
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = req.query.url as string;
  const isProd = process.env.NODE_ENV === 'production';

  if (!url || !/^https?:\/\//.test(url)) {
    console.warn('[Invalid URL, serving default image / 無效網址，回傳預設圖片]', { url });
    return await serveFallbackImage(res);
  }

  try {
    const browser = await puppeteer.launch({
      args: isProd ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] : ['--disable-gpu'],
      executablePath: isProd ? process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/lib/chromium/chromium' : '/usr/lib/chromium/chromium',
      headless: true,
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 1280,
        height: 720,
      },
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const screenshot = await page.screenshot({ type: 'png', fullPage: true });
    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.status(200).end(screenshot);
  } catch (error) {
    const err = error as Error;
    console.error('[Screenshot failed, serving default image / 截圖失敗，改用預設圖]', {
      error: err.message,
      stack: err.stack,
      url,
    });
    return await serveFallbackImage(res);
  }
}
