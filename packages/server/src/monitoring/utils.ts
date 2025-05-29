import { promises } from "node:fs";
import osUtils from "node-os-utils";
import { paths } from "../constants";

export interface SingleGpuStat {
	gpu: number;
	utilization: number;
	memory: number;
}
export interface GpuStats {
	gpus: SingleGpuStat[];
	total: {
		utilization: number;
		memory: number;
	};
}
export interface Container {
	BlockIO: string;
	CPUPerc: string;
	Container: string;
	ID: string;
	MemPerc: string;
	MemUsage: string;
	Name: string;
	NetIO: string;
	GPUs: Record<string, GpuStats>;
}
export const recordAdvancedStats = async (
	stats: Container,
	appName: string,
) => {
	const { MONITORING_PATH } = paths();
	const path = `${MONITORING_PATH}/${appName}`;
	console.log(path, MONITORING_PATH)

	await promises.mkdir(path, { recursive: true });

	await updateStatsFile(appName, "cpu", stats.CPUPerc);
	await updateStatsFile(appName, "memory", {
		used: stats.MemUsage.split(" ")[0],
		total: stats.MemUsage.split(" ")[2],
	});

	await updateStatsFile(appName, "block", {
		readMb: stats.BlockIO.split(" ")[0],
		writeMb: stats.BlockIO.split(" ")[2],
	});

	await updateStatsFile(appName, "network", {
		inputMb: stats.NetIO.split(" ")[0],
		outputMb: stats.NetIO.split(" ")[2],
	});

	// TODO: Supports multiple GPUs
	const gpuStatsForApp = stats?.GPUs?.[appName];
	const gpuStats = {
		utilization: gpuStatsForApp?.total?.utilization ?? 0,
		memory: gpuStatsForApp?.total?.memory ?? 0,
		gpunum: gpuStatsForApp?.gpus?.length ?? 0,
	};
	// console.log(`[${appName}] GPU Stats:`, JSON.stringify(gpuStats, null, 2));
	await updateStatsFile(appName, "gpu", gpuStats);

	if (appName === "dokploy") { // TODO: Update this to be more generic
		const disk = await osUtils.drive.info("/");

		const diskUsage = disk.usedGb;
		const diskTotal = disk.totalGb;
		const diskUsedPercentage = disk.usedPercentage;
		const diskFree = disk.freeGb;

		await updateStatsFile(appName, "disk", {
			diskTotal: +diskTotal,
			diskUsedPercentage: +diskUsedPercentage,
			diskUsage: +diskUsage,
			diskFree: +diskFree,
		});
	}
};

export const getAdvancedStats = async (appName: string) => {
	return {
		cpu: await readStatsFile(appName, "cpu"),
		memory: await readStatsFile(appName, "memory"),
		disk: await readStatsFile(appName, "disk"),
		network: await readStatsFile(appName, "network"),
		block: await readStatsFile(appName, "block"),
		gpu: await readStatsFile(appName, "gpu"),
	};
};

export const readStatsFile = async (
	appName: string,
	statType: "cpu" | "memory" | "disk" | "network" | "block" | "gpu",
) => {
	try {
		const { MONITORING_PATH } = paths();
		const filePath = `${MONITORING_PATH}/${appName}/${statType}.json`;
		const data = await promises.readFile(filePath, "utf-8");
		return JSON.parse(data);
	} catch (_error) {
		return [];
	}
};

export const updateStatsFile = async (
	appName: string,
	statType: "cpu" | "memory" | "disk" | "network" | "block" | "gpu",
	value: number | string | unknown,
) => {
	const { MONITORING_PATH } = paths();
	const stats = await readStatsFile(appName, statType);
	stats.push({ value, time: new Date() });

	if (stats.length > 288) {
		stats.shift();
	}

	const content = JSON.stringify(stats);
	await promises.writeFile(
		`${MONITORING_PATH}/${appName}/${statType}.json`,
		content,
	);
};

export const readLastValueStatsFile = async (
	appName: string,
	statType: "cpu" | "memory" | "disk" | "network" | "block" | "gpu",
) => {
	try {
		const { MONITORING_PATH } = paths();
		const filePath = `${MONITORING_PATH}/${appName}/${statType}.json`;
		const data = await promises.readFile(filePath, "utf-8");
		const stats = JSON.parse(data);
		return stats[stats.length - 1] || null;
	} catch (_error) {
		return null;
	}
};

export const getLastAdvancedStatsFile = async (appName: string) => {
	return {
		cpu: await readLastValueStatsFile(appName, "cpu"),
		memory: await readLastValueStatsFile(appName, "memory"),
		disk: await readLastValueStatsFile(appName, "disk"),
		network: await readLastValueStatsFile(appName, "network"),
		block: await readLastValueStatsFile(appName, "block"),
		gpu: await readLastValueStatsFile(appName, "gpu"),
	};
};
