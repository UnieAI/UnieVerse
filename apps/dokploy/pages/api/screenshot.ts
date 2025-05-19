import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';

function getLocalChromeExecutablePath(): string {
  const platform = os.platform();
  if (platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }
  if (platform === 'win32') {
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }
  return '/usr/bin/google-chrome'; // Linux default
}

async function serveFallbackImage(res: NextApiResponse) {
  try {
    // const fallbackPath = path.join(process.cwd(), 'public', 'default-web-screen-shot.gif');
    const fallbackPath = path.join(process.cwd(), 'public', 'green-screen.jpg');
    const fallbackBuffer = await fs.readFile(fallbackPath);
    res.setHeader('Content-Type', 'image/png');
    res.status(200).end(fallbackBuffer);
  } catch (fallbackError) {
    console.error('[預設圖片讀取失敗]', fallbackError);
    res.status(500).json({ error: '截圖與預設圖片皆失敗' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = req.query.url as string;
  const isProd = process.env.NODE_ENV === 'production';

  if (!url || !/^https?:\/\//.test(url)) {
    console.warn('[無效網址] 回傳預設圖片');
    return await serveFallbackImage(res);
  }

  try {
    const browser = await puppeteer.launch({
      args: isProd ? chromium.args : [],
      executablePath: isProd
        ? await chromium.executablePath()
        : getLocalChromeExecutablePath(),
      headless: true,
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 1280,
        height: 720,
      },
    });

    const page = await browser.newPage();
    // await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const buffer = await page.screenshot({ type: 'png' });
    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.status(200).end(buffer);
  } catch (error) {
    console.error('[截圖失敗，改用預設圖]', error);
    return await serveFallbackImage(res);
  }
}
