import { recycleResource } from "@dokploy/server/utils/builders/compose";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const {
        Type: type,
        Action: action,
        Actor: actor,
    } = req.body;

    if (type === "container") {
        if (action === "die") {
            // Heads up: this assumes finishing normally, `oom`, or `kill`
            //   will always hits a `die`.
            const nodeId = actor!["Attributes"]!["com.docker.swarm.node.id"]!;
            const attributes = actor!["Attributes"]!;
            await recycleResource(nodeId, attributes);
        }
    }

    res.status(200).json({ status: "ok" });
}
