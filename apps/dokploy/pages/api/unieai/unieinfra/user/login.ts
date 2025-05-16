// pages/api/unieai/unieInfra/user/login.ts

import type { NextApiRequest, NextApiResponse } from "next";

import { UNIEINFRA_SYSTEM_API_URL } from "@/utils/unieai/unieinfra/key";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { username, password } = req.body;

    try {
        // Step 1: 嘗試登入
        console.log(`[UnieInfra] Attempting login for user: ${username}`);
        const loginRes = await fetch(`${UNIEINFRA_SYSTEM_API_URL}/user/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const loginData = await loginRes.json();
        console.log(`[UnieInfra] Login response:`, loginData);

        if (loginRes.ok && loginData.success && loginData.access_token) {
            // 登入成功
            console.log(`[UnieInfra] Login successful for user: ${username}`);
            return res.status(200).json({
                accessToken: loginData.access_token,
            });
        }

        // ErrorCode:
        // ErrCodeEmptyFields      = 1 # missing fields
        // ErrCodeUserNotFound     = 2 # user not found
        // ErrCodeUserDoesNotExist = 3 # user does not exist
        // ErrCodeInvalidPassword  = 4 # Login failed

        // 若錯誤碼為 3（使用者不存在），改為註冊
        if (loginData.error_code === 3) {
            console.log(`[UnieInfra] User not found. Attempting to register: ${username}`);
            const registerRes = await fetch(`${UNIEINFRA_SYSTEM_API_URL}/user/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const registerData = await registerRes.json();
            console.log(`[UnieInfra] Register response:`, registerData);

            if (registerRes.ok && registerData.success && registerData.access_token) {
                console.log(`[UnieInfra] Registration successful for user: ${username}`);
                return res.status(200).json({
                    accessToken: registerData.access_token,
                });
            } else {
                console.error(`[UnieInfra] Registration failed for user: ${username}`, registerData);
                throw new Error(registerData.message || "UnieInfra Register failed");
            }
        }

        // 其他登入錯誤（如密碼錯）
        console.warn(`[UnieInfra] Login failed for user: ${username}, code: ${loginData.error_code}`);
        return res.status(400).json({
            message: loginData.message || "UnieInfra Login failed",
            error_code: loginData.error_code,
        });
    } catch (error: any) {
        console.error(`[UnieInfra] Unexpected error for user: ${username}`, error.message);
        return res.status(500).json({ message: "UnieInfra Login failed", error: error.message });
    }
}
