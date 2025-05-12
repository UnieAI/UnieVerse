// pages/api/unieai/dummy.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await new Promise(r => setTimeout(r, 500)); // 模擬延遲
  res.status(200).json({ status: 'ok' });
}
