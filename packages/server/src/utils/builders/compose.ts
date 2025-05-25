import { paths } from "@dokploy/server/constants";
import type { InferResultType } from "@dokploy/server/types/with";
import boxen from "boxen";
import { dump } from "js-yaml";
import {
	createWriteStream,
	existsSync,
	mkdirSync,
	writeFileSync,
} from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Compose, ComposeSpecification, getNodeInfo, getSwarmNodes } from "../..";
import {
	getComposePath,
	loadDockerCompose,
	loadDockerComposeRemote,
	writeDomainsToCompose,
	writeDomainsToComposeRemote,
} from "../docker/domain";
import {
	encodeBase64,
	getEnviromentVariablesObject,
	prepareEnvironmentVariables,
} from "../docker/utils";
import { execAsync, execAsyncRemote } from "../process/execAsync";
import { spawnAsync } from "../process/spawnAsync";

export type ComposeNested = InferResultType<
	"compose",
	{ project: true; mounts: true; domains: true }
>;

const writeBackToCompose = async (
	compose: Compose,
	composeConverted: ComposeSpecification | null,
) => {
	const path = getComposePath(compose); // from domain utils
	const composeString = dump(composeConverted, { lineWidth: 1000 });
	try {
		await writeFile(path, composeString, "utf8");
	} catch (error) {
		throw error;
	}
};

const collectGpuTypeSet = (labels: Object) => {
	const resMap: { [key: string]: Set<string> } = {};
	for (const [label, lbJValue] of Object.entries(labels)) {
		if (label === "uvs-gpu" || label.startsWith("uvs-gpu-")) {
			const lbName = label;
			const lbValue: string[] = JSON.parse(lbJValue);
			console.log("COUNT_GPU_RESOURCES:", "[lbName, lbValue]:", [lbName, lbValue]);
			if (!(lbName in resMap)) {
				resMap[lbName] = new Set();
			}
			lbValue.forEach(gpuName => resMap[lbName]!.add(gpuName));
		}
	}
	return resMap;
}

const parseGpuInfo = (labels: Object) => {
	const resMap: { [key: string]: string[] } = {};
	for (const [label, lbJValue] of Object.entries(labels)) {
		if (label.startsWith("uvs-gpuinfo-")) {
			const lbName = label.slice("uvs-gpuinfo-".length).toLowerCase();
			const lbValue: string[] = JSON.parse(lbJValue);
			resMap[lbName] = lbValue;
		}
	}
	return resMap;
}

const allocateAutoGPU = async (
	compose: Compose,
	nodes: any[],
) => {
	// load docker compose (domain.ts:addDomainToCompose)
	let result: ComposeSpecification | null;
	if (compose.serverId) {
		result = await loadDockerComposeRemote(compose);
	} else {
		result = await loadDockerCompose(compose);
	}

	if (!result) {
		return null;
	}

	const privResources: { [key: string]: number } = {};
	for (const [svcName, svc] of Object.entries(result?.services ?? {})) {
		console.log("ALLOCATE AUTO GPU: svcName: ", svcName);
		console.log("ALLOCATE AUTO GPU: svc:", svc);

		// console.log("ALLOCATE AUTO GPU: DEVICES:", svc.deploy?.resources?.reservations?.devices);

		const resResv: any | null = svc.deploy?.resources?.reservations;
		console.log("ALLOCATE AUTO GPU: RESERVATION:", resResv);

		const privResv: any[] | null = resResv?.unieai;
		if (privResv) {
			console.log("ALLOCATE AUTO GPU: privResv:", privResv);
			for (const req of privResv) {
				const lbName = req.kind;
				const lbValue = req.value;

				privResources[lbName] = (privResources[lbName] || 0) + lbValue;
			}
			delete resResv.unieai;
		}
	}
	console.log("ALLOCATE AUTO GPU: ", "privResources:", privResources);

	// The GPU names are designed to be categorized by prefix
	//   i.e. "gpu-nvidia-h200" would be one of "gpu-nvidia".
	const privKeys = Object.keys(privResources).sort(
		(a: string, b: string) => {
			// For the topology to be right, we need to sort them.
			// TLDR; sort by longer length, then by dictionary order.
			if (a.length !== b.length) {
				return -(a.length - b.length);
			}
			return Number(a > b) - Number(a < b);
		}
	);

	// Simluate. Find first available node.
	let foundNode = null;
	let foundDevices = null;
	for (const node of nodes) {
		let okay = true;

		const gpuInfos = parseGpuInfo(node.Spec.Labels);
		const selectorGpus = collectGpuTypeSet(node.Spec.Labels);
		console.log("ALLOCATE AUTO GPU:", "gpuInfos:", gpuInfos);
		console.log("ALLOCATE AUTO GPU:", "selectorGpus:", selectorGpus);

		const gpuAllocated = [];
		for (const lbName of privKeys) {
			const lbValue = privResources[lbName]!;
			const gpuDevices = selectorGpus[lbName];
			if ((gpuDevices?.size || 0) < lbValue) {
				okay = false;
				break;
			}

			for (let lbValCount = 0, gpuDeviceIter = gpuDevices!.values();
				lbValCount < lbValue;
				lbValCount++
			) {
				const gpuDevice = gpuDeviceIter.next().value!;
				gpuDevices!.delete(gpuDevice);
				gpuAllocated.push(gpuDevice);
			}
		}

		if (okay) {
			foundNode = node;
			foundDevices = gpuAllocated;
			break;
		}
	}

	console.log("ALLOCATE AUTO GPU: Found node: ", foundNode);
	console.log("ALLOCATE AUTO GPU: gpuAllocated: ", foundDevices);
	return result;
}

export const buildCompose = async (compose: ComposeNested, logPath: string) => {
	const writeStream = createWriteStream(logPath, { flags: "a" });
	const { sourceType, appName, mounts, composeType, domains } = compose;
	try {
		const { COMPOSE_PATH } = paths();
		const command = createCommand(compose);
		await writeDomainsToCompose(compose, domains);
		createEnvFile(compose);

		if (compose.isolatedDeployment) {
			await execAsync(
				`docker network inspect ${compose.appName} >/dev/null 2>&1 || docker network create --attachable ${compose.appName}`,
			);
		}

		const nodes = await getSwarmNodes(compose.serverId).then(
			nodes => Promise.all(
				(nodes ?? []).map(({ ID: nodeId }) => getNodeInfo(nodeId, compose.serverId))
			)
		);

		// console.log("BUILD COMPOSE: Swarm Nodes: ", nodes);
		const allocateRes = await allocateAutoGPU(compose, nodes);
		await writeBackToCompose(compose, allocateRes);

		const logContent = `
    App Name: ${appName}
    Build Compose 🐳
    Detected: ${mounts.length} mounts 📂
    Command: docker ${command}
    Source Type: docker ${sourceType} ✅
    Compose Type: ${composeType} ✅`;
		const logBox = boxen(logContent, {
			padding: {
				left: 1,
				right: 1,
				bottom: 1,
			},
			width: 80,
			borderStyle: "double",
		});
		writeStream.write(`\n${logBox}\n`);
		const projectPath = join(COMPOSE_PATH, compose.appName, "code");

		await spawnAsync(
			"docker",
			[...command.split(" ")],
			(data) => {
				if (writeStream.writable) {
					writeStream.write(data.toString());
				}
			},
			{
				cwd: projectPath,
				env: {
					NODE_ENV: process.env.NODE_ENV,
					PATH: process.env.PATH,
					...(composeType === "stack" && {
						...getEnviromentVariablesObject(compose.env, compose.project.env),
					}),
				},
			},
		);

		if (compose.isolatedDeployment) {
			await execAsync(
				`docker network connect ${compose.appName} $(docker ps --filter "name=dokploy-traefik" -q) >/dev/null 2>&1`,
			).catch(() => {});
		}

		writeStream.write("Docker Compose Deployed: ✅");
	} catch (error) {
		writeStream.write(`Error ❌ ${(error as Error).message}`);
		throw error;
	} finally {
		writeStream.end();
	}
};

export const getBuildComposeCommand = async (
	compose: ComposeNested,
	logPath: string,
) => {
	const { COMPOSE_PATH } = paths(true);
	const { sourceType, appName, mounts, composeType, domains } = compose;
	const command = createCommand(compose);
	const envCommand = getCreateEnvFileCommand(compose);
	const projectPath = join(COMPOSE_PATH, compose.appName, "code");
	const exportEnvCommand = getExportEnvCommand(compose);

	const newCompose = await writeDomainsToComposeRemote(
		compose,
		domains,
		logPath,
	);
	const logContent = `
App Name: ${appName}
Build Compose 🐳
Detected: ${mounts.length} mounts 📂
Command: docker ${command}
Source Type: docker ${sourceType} ✅
Compose Type: ${composeType} ✅`;

	const logBox = boxen(logContent, {
		padding: {
			left: 1,
			right: 1,
			bottom: 1,
		},
		width: 80,
		borderStyle: "double",
	});

	const bashCommand = `
	set -e
	{
		echo "${logBox}" >> "${logPath}"
	
		${newCompose}
	
		${envCommand}
	
		cd "${projectPath}";

        ${exportEnvCommand}
		${compose.isolatedDeployment ? `docker network inspect ${compose.appName} >/dev/null 2>&1 || docker network create --attachable ${compose.appName}` : ""}
		docker ${command.split(" ").join(" ")} >> "${logPath}" 2>&1 || { echo "Error: ❌ Docker command failed" >> "${logPath}"; exit 1; }
		${compose.isolatedDeployment ? `docker network connect ${compose.appName} $(docker ps --filter "name=dokploy-traefik" -q) >/dev/null 2>&1` : ""}
	
		echo "Docker Compose Deployed: ✅" >> "${logPath}"
	} || {
		echo "Error: ❌ Script execution failed" >> "${logPath}"
		exit 1
	}
	`;

	return await execAsyncRemote(compose.serverId, bashCommand);
};

const sanitizeCommand = (command: string) => {
	const sanitizedCommand = command.trim();

	const parts = sanitizedCommand.split(/\s+/);

	const restCommand = parts.map((arg) => arg.replace(/^"(.*)"$/, "$1"));

	return restCommand.join(" ");
};

export const createCommand = (compose: ComposeNested) => {
	const { composeType, appName, sourceType } = compose;
	if (compose.command) {
		return `${sanitizeCommand(compose.command)}`;
	}

	const path =
		sourceType === "raw" ? "docker-compose.yml" : compose.composePath;
	let command = "";

	if (composeType === "docker-compose") {
		command = `compose -p ${appName} -f ${path} up -d --build --remove-orphans`;
	} else if (composeType === "stack") {
		command = `stack deploy -c ${path} ${appName} --prune`;
	}

	return command;
};

const createEnvFile = (compose: ComposeNested) => {
	const { COMPOSE_PATH } = paths();
	const { env, composePath, appName } = compose;
	const composeFilePath =
		join(COMPOSE_PATH, appName, "code", composePath) ||
		join(COMPOSE_PATH, appName, "code", "docker-compose.yml");

	const envFilePath = join(dirname(composeFilePath), ".env");
	let envContent = env || "";
	if (!envContent.includes("DOCKER_CONFIG")) {
		envContent += "\nDOCKER_CONFIG=/root/.docker/config.json";
	}

	if (compose.randomize) {
		envContent += `\nCOMPOSE_PREFIX=${compose.suffix}`;
	}

	const envFileContent = prepareEnvironmentVariables(
		envContent,
		compose.project.env,
	).join("\n");

	if (!existsSync(dirname(envFilePath))) {
		mkdirSync(dirname(envFilePath), { recursive: true });
	}
	writeFileSync(envFilePath, envFileContent);
};

export const getCreateEnvFileCommand = (compose: ComposeNested) => {
	const { COMPOSE_PATH } = paths(true);
	const { env, composePath, appName } = compose;
	const composeFilePath =
		join(COMPOSE_PATH, appName, "code", composePath) ||
		join(COMPOSE_PATH, appName, "code", "docker-compose.yml");

	const envFilePath = join(dirname(composeFilePath), ".env");

	let envContent = env || "";
	if (!envContent.includes("DOCKER_CONFIG")) {
		envContent += "\nDOCKER_CONFIG=/root/.docker/config.json";
	}

	if (compose.randomize) {
		envContent += `\nCOMPOSE_PREFIX=${compose.suffix}`;
	}

	const envFileContent = prepareEnvironmentVariables(
		envContent,
		compose.project.env,
	).join("\n");

	const encodedContent = encodeBase64(envFileContent);
	return `
touch ${envFilePath};
echo "${encodedContent}" | base64 -d > "${envFilePath}";
	`;
};

const getExportEnvCommand = (compose: ComposeNested) => {
	if (compose.composeType !== "stack") return "";

	const envVars = getEnviromentVariablesObject(
		compose.env,
		compose.project.env,
	);
	const exports = Object.entries(envVars)
		.map(([key, value]) => `export ${key}=${JSON.stringify(value)}`)
		.join("\n");

	return exports ? `\n# Export environment variables\n${exports}\n` : "";
};
