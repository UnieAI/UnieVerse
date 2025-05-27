import type http from "node:http";
import Docker from "dockerode";
import {
	docker,
	execAsync,
	getLastAdvancedStatsFile,
	recordAdvancedStats,
	validateRequest,
} from "@dokploy/server";
import { execSync } from 'child_process';
import { WebSocketServer } from "ws";

async function getDockerPids(container: string): Promise<{ [pid: string]: string }> {
	// const { stdout } = await execAsync(`docker top ${container}`, { encoding: "utf-8" });
	const dockerTopOutput = await execAsync('cat fake_docker_top.txt');
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

// 取得container對GPU的使用率
const getContainerGpuUtilization = async (docker: Docker) => {
	// 1. 各 GPU 使用率
	const gpuUtilOutput = await execAsync(
		"nvidia-smi --query-gpu=gpu_uuid,utilization.gpu --format=csv,noheader,nounits"
	);
	// 2. 各 process 使用 GPU 記憶體狀況
	const gpuAppOutput = await execAsync(
		"nvidia-smi --query-compute-apps=pid,gpu_uuid,used_gpu_memory --format=csv,noheader,nounits"
	);
	// 3. 取得 pmon 以判斷哪些 process 實際使用 GPU (SM or MEM > 0)
	// const pmonOutput = await execAsync("nvidia-smi pmon -c 1");
	const pmonOutput = await execAsync('cat fake_pmon.txt');

	// STEP 1: Parse GPU utilization
	const gpuUtilMap: { [uuid: string]: number } = {};
	gpuUtilOutput.stdout.trim().split("\n").forEach(line => {
		const [uuid, usageStr] = line.split(",").map(s => s.trim());
		if (uuid && usageStr) {
			gpuUtilMap[uuid] = Number(usageStr);
		}
	});

	// STEP 2: Parse per-process GPU memory usage (pid ↔ uuid)
	type ProcGpuEntry = { pid: string; uuid: string };
	const procGpuMap: ProcGpuEntry[] = [];
	for (const line of gpuAppOutput.stdout.trim().split("\n")) {
		const [pid, uuid] = line.split(",").map(s => s.trim());
		if (pid && uuid) {
			procGpuMap.push({ pid, uuid });
		}
	}

	// STEP 3: 解析 pmon，找出有使用 GPU 的 pid，並記錄 sm/mem
	const activePids = new Set<string>();
	const pidSmMem: { [pid: string]: { sm: number; mem: number } } = {};
	const pmonLines = pmonOutput.stdout.trim().split("\n").filter(l => !l.startsWith("#"));
	for (const line of pmonLines) {
		const cols = line.trim().split(/\s+/);
		// 格式: gpu, pid, type, sm, mem, enc, dec, jpg, ofa, command
		if (cols.length < 10) continue;
		const pid = cols[1];
		const sm = Number(cols[3]);
		const mem = Number(cols[4]);
		if (pid && pid !== "-" && (sm > 0 || mem > 0)) {
			activePids.add(pid);
			pidSmMem[pid] = { sm, mem };
		}
	}

	// STEP 4:  pid → container name 映射
	const containers = await docker.listContainers({ filters: JSON.stringify({ status: ["running"] }) });
	const pidToContainer: { [pid: string]: string } = {};
	for (const container of containers) {
		const containerName = container.Names?.[0]?.replace(/^\//, "") || container.Id;
		const pidCmdMap = await getDockerPids(container.Id);
		for (const pid of Object.keys(pidCmdMap)) {
			pidToContainer[pid] = containerName;
		}
	}
	// const containers = await docker.listContainers({ filters: JSON.stringify({ status: ["running"] }) });
	// const pidToContainer: { [pid: string]: string } = {};
	// for (const container of containers) {
	// 	const containerName = container.Names?.[0]?.replace(/^\//, "") || container.Id;
	// 	const topInfo = await docker.getContainer(container.Id).top(); // 抓 container 內部所有 process
	// 	const pidIndex = topInfo.Titles.indexOf("PID");
	// 	if (pidIndex === -1) continue;

	// 	for (const proc of topInfo.Processes) {
	// 		const pid = proc[pidIndex];
	// 		if (pid) pidToContainer[pid] = containerName;
	// 	}
	// }

	// STEP 5: container → GPU UUID 映射 (containerId → [uuid1, uuid2, ...])
	const containerGpuMap: { [container: string]: Set<string> } = {};
	const containerSmMem: { [container: string]: { sm: number; mem: number } } = {};
	for (const { pid, uuid } of procGpuMap) {
		if (!activePids.has(pid)) continue; // 過濾掉沒在用 GPU 的 pid
		const container = pidToContainer[pid];
		if (typeof container !== "string") continue;
		if (!containerGpuMap[container]) {
			containerGpuMap[container] = new Set<string>();
		}
		containerGpuMap[container].add(uuid);

		if (!containerSmMem[container]) {
			containerSmMem[container] = { sm: 0, mem: 0 };
		}
		const { sm, mem } = pidSmMem[pid] || { sm: 0, mem: 0 };
		containerSmMem[container].sm += sm;
		containerSmMem[container].mem += mem;
	}

	// STEP 6: 計算每個 container 的 GPU 使用率總和
	const result: {
		[container: string]: {
			totalSm: number;
			totalMem: number;
			gpuUtil: number;
			gpuCount: number;
		};
	} = {};
	for (const [container, uuidSet] of Object.entries(containerGpuMap)) {
		let totalUtil = 0;
		for (const uuid of uuidSet) {
			totalUtil += gpuUtilMap[uuid] || 0;
		}
		const gpuCount = uuidSet.size;
		result[container] = {
			totalSm: containerSmMem[container]?.sm || 0,
			totalMem: containerSmMem[container]?.mem || 0,
			gpuUtil: totalUtil,
			gpuCount,
		};
	}
	for (const [container, stats] of Object.entries(result)) {
		console.log(`Container: ${container}, GPU Utilization Sum: ${stats.gpuUtil}, GPU Count: ${stats.gpuCount}`);
	}

	return result;
};

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
			wssTerm.handleUpgrade(req, socket, head, function done(ws) {
				wssTerm.emit("connection", ws, req);
			});
		}
	});

	wssTerm.on("connection", async (ws, req) => {
		const url = new URL(req.url || "", `http://${req.headers.host}`);
		const appName = url.searchParams.get("appName");
		const appType = (url.searchParams.get("appType") || "application") as
			| "application"
			| "stack"
			| "docker-compose";
		const { user, session } = await validateRequest(req);

		if (!appName) {
			ws.close(4000, "appName no provided");
			return;
		}

		if (!user || !session) {
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

				const containers = await docker.listContainers({
					filters: JSON.stringify(filter),
				});

				const container = containers[0];
				if (!container || container?.State !== "running") {
					ws.close(4000, "Container not running");
					return;
				}
				const { stdout, stderr } = await execAsync(
					`docker stats ${container.Id} --no-stream --format \'{"BlockIO":"{{.BlockIO}}","CPUPerc":"{{.CPUPerc}}","Container":"{{.Container}}","ID":"{{.ID}}","MemPerc":"{{.MemPerc}}","MemUsage":"{{.MemUsage}}","Name":"{{.Name}}","NetIO":"{{.NetIO}}"}\'`,
				);
				// 取出每張 GPU 的詳細狀態
				const gpu_stats = await execAsync(
					"nvidia-smi --query-gpu=timestamp,utilization.gpu,utilization.memory,memory.total,memory.used,memory.free,temperature.gpu,fan.speed,power.draw,power.limit,clocks.gr,clocks.sm,clocks.mem,clocks.video,name,driver_version,pstate --format=csv,noheader",
				)
				console.log("多GPU原始nvidia-smi輸出:\n", gpu_stats.stdout);

				const gpu_keys = [
					'timestamp',          'utilization.gpu',
					'utilization.memory', 'memory.total',
					'memory.used',        'memory.free',
					'temperature.gpu',    'fan.speed',
					'power.draw',         'power.limit',
					'clocks.gr',          'clocks.sm',
					'clocks.mem',         'clocks.video',
					'name',               'driver_version',
					'pstate'
				]

				if (stderr) {
					console.error("Docker stats error:", stderr);
					return;
				}
				const stat = JSON.parse(stdout);

				// container GPU 使用率
				const containerGpuUtilDetail = await getContainerGpuUtilization(docker);
				stat.GPUsUtilizationDetail = containerGpuUtilDetail;
				console.log("containerGpuUtilDetail (每container的GPU利用率合計):", containerGpuUtilDetail);

				if(!gpu_stats.stderr && gpu_stats.stdout){
					const gpus_status = gpu_stats.stdout
						.trim()
						.split("\n")
						.filter(line => line.trim() !== "")
						.map(line => {
							// 1) isolate the timestamp (everything up to the first comma)
							const firstComma = line.indexOf(",");
							const timestamp = line.slice(0, firstComma).trim();
							// 2) split and trim the remaining fields
							const restValues = line
							.slice(firstComma + 1)
							.split(",")
							.map(s => s.trim());
							// 3) reassemble values array with timestamp in position 0
							const values = [timestamp, ...restValues];

							// 4) build the stat object
							const stat = {};
							gpu_keys.forEach((key, idx) => {
								const parts = key.split(".");
								let entry = stat;
								// drill down for nested keys
								for (let i = 0; i < parts.length - 1; i++) {
									// @ts-ignore
									entry = entry[parts[i]] = entry[parts[i]] || {};
								}
								// @ts-ignore
								entry[parts[parts.length - 1]] = values[idx] || null;
							});
							return stat;
						});
					stat.GPUs = gpus_status;
				}

				await recordAdvancedStats(stat, appName);
				const data = await getLastAdvancedStatsFile(appName);

				ws.send(
					JSON.stringify({
						data,
					}),
				);
			} catch (error) {
				// @ts-ignore
				ws.close(4000, `Error: ${error.message}`);
			}
		}, 1300);

		ws.on("close", () => {
			clearInterval(intervalId);
		});
	});
};
