import type http from "node:http";
import Docker from "dockerode";
import {
	docker,
	execAsync,
	getLastAdvancedStatsFile,
	recordAdvancedStats,
	validateRequest,
} from "@dokploy/server";
import { WebSocketServer } from "ws";

async function getDockerPids(container: string): Promise<{ [pid: string]: string }> {
	// const dockerTopOutput = await execAsync(`docker top ${container}`, { encoding: "utf-8" });
	const dockerTopOutput = await execAsync('cat /home/ubuntu/service/UnieVerse/apps/dokploy/server/wss/fake_docker_top.txt');
	const lines = dockerTopOutput.stdout?.trim().split("\n") ?? [];
	if (lines.length < 2) return {};

	const headerLine = lines[0]?.trim();
	if (!headerLine) return {};

	const headers = headerLine.split(/\s+/);
	const pidIndex = headers.indexOf("PID");
	const cmdIndex = headers.indexOf("CMD");
	if (pidIndex === -1 || cmdIndex === -1) return {};

	const pidCmdMap: { [pid: string]: string } = {};

	for (const line of lines.slice(1)) {
		const parts = line.trim().split(/\s+/, headers.length);
		if (parts.length <= Math.max(pidIndex, cmdIndex)) continue;

		const pid = parts[pidIndex];
		const cmd = parts.slice(cmdIndex).join(" ");

		if (pid !== undefined) {
			pidCmdMap[pid] = cmd;
		}
	}

	return pidCmdMap;
}

async function getGpuUsingContainers(containers: Docker.ContainerInfo[]) {
	// Step 0: 查詢 GPU 總記憶體 (MiB)
	const getGpuTotalMemory = async (): Promise<number[]> => {
		// const { stdout } = await execAsync(
		// 	'nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits'
		// );
		const { stdout } = await execAsync('bash /home/ubuntu/service/UnieVerse/apps/dokploy/server/wss/fake_multi_gpu.sh');
		return stdout.trim().split('\n').map(val => parseInt(val.trim(), 10));
	};
	const totalMemoryList = await getGpuTotalMemory();
	// Step 1: 查詢 GPU 使用率
	// const pmonOutput = await execAsync('nvidia-smi pmon -c 1');
	const pmonOutput = await execAsync('cat /home/ubuntu/service/UnieVerse/apps/dokploy/server/wss/fake_pmon.txt');
	const pmonLines = pmonOutput.stdout.trim().split('\n').filter(line => !line.startsWith('#'));

	// 解析出 PID + SM/MEM 使用量
	type GpuPidStats = Record<string, { gpu: number; sm: number; mem: number }>;
	const gpuPidStats: GpuPidStats = {};
	for (const line of pmonLines) {
		const cols = line.trim().split(/\s+/);
		if (cols.length < 10) continue;		// Skip lines that don't have all 10 columns (incomplete or invalid format)
		if (cols[0] !== undefined && cols[3] !== undefined && cols[4] !== undefined) {
			const gpuId = parseInt(cols[0], 10);
			const pid = cols[1];
			const sm = parseInt(cols[3], 10);
			const mem = parseInt(cols[4], 10);
			if (
				!isNaN(gpuId) &&
				typeof pid === "string" &&
				pid !== "-" &&
				!isNaN(sm) &&
				!isNaN(mem) &&
				(sm > 0 || mem > 0)
			) {
				gpuPidStats[pid] = { gpu: gpuId, sm, mem };
			}
		}
	}

	// Step 2: 比對每個 container 的 PID
	const result: Record<string, {
		gpus: { gpu: number; utilization: number; memoryPercent: number; memoryUsedMiB: number; memoryTotalMiB: number }[];
		total: { utilization: number; memoryUsedMiB: number; memoryTotalMiB: number};
	}> = {};

	for (const container of containers) {
		const containerId: string = container.Id;
		const name: string = container.Names?.[0]?.replace(/^\//, '') || containerId;
		const pidCmdMap = await getDockerPids(containerId);
		const pids: string[] = Object.keys(pidCmdMap);

		const gpuMap: Record<number, { utilization: number; memoryPercent: number }> = {};

		for (const pid of pids) {
			const stat = gpuPidStats[pid];
			if (!stat) continue;

			const { gpu, sm, mem } = stat;
			if (!(gpu in gpuMap)) {
				gpuMap[gpu] = { utilization: 0, memoryPercent: 0 };
			}
			gpuMap[gpu] ??= { utilization: 0, memoryPercent: 0 };
			gpuMap[gpu].utilization += sm;
			gpuMap[gpu].memoryPercent += mem;
		}

		const gpuArray = Object.entries(gpuMap).map(([gpuStr, val]) => {
			const gpu = Number(gpuStr);
			const memoryTotalMiB = totalMemoryList[gpu] ?? 0;
			const memoryUsedMiB = (val.memoryPercent / 100) * memoryTotalMiB;

			return {
				gpu,
				utilization: val.utilization,
				memoryPercent: val.memoryPercent,
				memoryUsedMiB,
				memoryTotalMiB,
			};
		});

		const total = gpuArray.reduce((acc, g) => {
			acc.utilization += g.utilization;
			acc.memoryUsedMiB += g.memoryUsedMiB;
			acc.memoryTotalMiB += g.memoryTotalMiB;
			return acc;
		}, { utilization: 0, memoryUsedMiB: 0, memoryTotalMiB: 0 });

		result[name] = { gpus: gpuArray, total };
	}
	return result;
}

// 將 WebSocket server 掛載到 HTTP server 上
export const setupDockerStatsMonitoringSocketServer = (
	server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
) => {
	const wssTerm = new WebSocketServer({
		noServer: true,
		path: "/listen-docker-stats-monitoring",
	});

	server.on("upgrade", (req, socket, head) => {
		const { pathname } = new URL(req.url || "", `http://${req.headers.host}`);

		if (pathname === "/_next/webpack-hmr") {
			return;
		}
		if (pathname === "/listen-docker-stats-monitoring") {
			console.log("處理 WebSocket 升級...");
			wssTerm.handleUpgrade(req, socket, head, function done(ws) {
				console.log("WebSocket 連線完成，觸發 connection");
				wssTerm.emit("connection", ws, req);
			});
		}
	});

	wssTerm.on("connection", async (ws, req) => {
		console.log("WebSocket 連線完成，觸發 connection");
		const url = new URL(req.url || "", `http://${req.headers.host}`);
		const appName = url.searchParams.get("appName");
		const appType = (url.searchParams.get("appType") || "application") as
			| "application"
			| "stack"
			| "docker-compose";
		const { user, session } = await validateRequest(req);

		if (!appName) {
			console.log("未提供 appName，關閉連線");
			ws.close(4000, "appName no provided");
			return;
		}

		if (!user || !session) {
			console.log("驗證失敗，關閉連線");
			ws.close();
			return;
		}
		const intervalId = setInterval(async () => {
			try {
				const filter = {
					status: ["running"],
					...(appType === "application" && {
						label: [`com.docker.swarm.service.name=${appName}`],
					}),
					...(appType === "stack" && {
						label: [`com.docker.swarm.task.name=${appName}`],
					}),
					...(appType === "docker-compose" && {
						name: [appName],
					}),
				};
				// console.log("列出 container filter 條件:", JSON.stringify(filter));
				// const containers = await docker.listContainers({
				// 	filters: JSON.stringify(filter),
				// });
				const containers = await docker.listContainers();

				const container = containers[0];

				if (!container) {
					console.log("未找到 container，關閉連線");
					ws.close(4000, "Container not found");
					return;
				}

				if (container?.State !== "running") {
					console.log("container 非 running 狀態，state:", container?.State);
					ws.close(4000, "Container not running");
					return;
				}

				const { stdout, stderr } = await execAsync(
					`docker stats ${container.Id} --no-stream --format \'{"BlockIO":"{{.BlockIO}}","CPUPerc":"{{.CPUPerc}}","Container":"{{.Container}}","ID":"{{.ID}}","MemPerc":"{{.MemPerc}}","MemUsage":"{{.MemUsage}}","Name":"{{.Name}}","NetIO":"{{.NetIO}}"}\'`,
				);

				if (stderr) {
					console.error("Docker stats error:", stderr);
					return;
				}
				const stat = JSON.parse(stdout);

				// container GPU 使用率
				const containerGpuUtilDetail = await getGpuUsingContainers(containers);
				// TODO: We may need to remove some useless stuff
				stat.GPUs = containerGpuUtilDetail
				await recordAdvancedStats(stat, appName);
				const data = await getLastAdvancedStatsFile(appName);

				ws.send(
					JSON.stringify({
						data,
					}),
				);
			} catch (error: any) {
				// @ts-ignore
				console.error("WebSocket 任務錯誤:", error);
  				ws.close(4000, "Internal Error");
				// ws.close(4000, `Error: ${error.message}`);
			}
		}, 1300);

		ws.on("close", () => {
			console.log("WebSocket 關閉，清除 interval");
			clearInterval(intervalId);
		});
	});
};
