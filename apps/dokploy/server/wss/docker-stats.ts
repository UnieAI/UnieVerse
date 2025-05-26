import type http from "node:http";
import {
	docker,
	execAsync,
	getLastAdvancedStatsFile,
	recordAdvancedStats,
	validateRequest,
} from "@dokploy/server";
import { WebSocketServer } from "ws";

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
				const gpu_stats = await execAsync(
					"nvidia-smi --query-gpu=timestamp,utilization.gpu,utilization.memory,memory.total,memory.used,memory.free,temperature.gpu,fan.speed,power.draw,power.limit,clocks.gr,clocks.sm,clocks.mem,clocks.video,name,driver_version,pstate --format=csv,noheader",
				)

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
