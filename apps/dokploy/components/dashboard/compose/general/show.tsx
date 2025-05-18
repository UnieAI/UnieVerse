import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { api } from "@/utils/api";
import { ComposeActions } from "./actions";
import { ShowProviderFormCompose } from "./generic/show";
import AddAI from "./add-ai";
import DomainsList from "./domain-list";
// import ConnectAI from "./connect-ai";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ConsoleLogWriter } from "drizzle-orm";
import { toast } from "sonner";
interface Props {
	composeId: string;
}

function formatTimeAgo(createdAt: string | Date): string {
	const now = new Date();
	const date = new Date(createdAt);
	const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // 秒差

	if (diff < 30) return "just now";
	if (diff < 120) return "few seconds ago";

	const d = Math.floor(diff / (60 * 60 * 24));
	const h = Math.floor((diff % (60 * 60 * 24)) / (60 * 60));
	const m = Math.floor((diff % (60 * 60)) / 60);

	const parts = [];
	if (d > 0) parts.push(`${d}d`);
	if (h > 0) parts.push(`${h}h`);
	if (m > 0) parts.push(`${m}m`);

	return parts.join(" ") + " ago";
}

const convertImageToBase64 = (url: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext("2d");
			if (!ctx) return reject("Canvas context is null");
			ctx.drawImage(img, 0, 0);
			resolve(canvas.toDataURL("image/png"));
		};
		img.onerror = reject;
		img.src = url;
	});
};

const statusMap = {
	idle: { label: "Idle", color: "bg-gray-400" },
	running: { label: "Deploying", color: "bg-yellow-500" },
	done: { label: "Ready", color: "bg-green-500" },
	error: { label: "Error", color: "bg-red-500" },
};

export const ShowGeneralCompose = ({ composeId }: Props) => {
	const { data } = api.compose.one.useQuery(
		{ composeId },
		{
			enabled: !!composeId,
		},
	);
	const utils = api.useUtils();
	const { mutateAsync, error, isError, isLoading } =
		api.compose.update.useMutation();

	const [isLoaded, setIsLoaded] = useState(false);
	const [base64Image, setBase64Image] = useState<string | null>(null);


	// console.log(data, data?.domains[0]?.host, data?.deployments?.[data.deployments.length - 1]?.deploymentId)

	const site = `http${data?.domains[0]?.https && 's'}://${data?.domains[0]?.host}`
	// const site = "http://test-n8n-0508fd-18-183-32-128.traefik.me/"
	const screenshotUrl = `/api/screenshot?url=${encodeURIComponent(site)}`;

	useEffect(() => {
		if (isLoaded) {
			console.log("save img", screenshotUrl)
		}
	}, [isLoaded])

	useEffect(() => {
		if (data?.composeStatus === 'done' && data?.currentID !== data?.deployments?.[data.deployments.length - 1]?.deploymentId) {
			const updateDeployment = async () => {
				try {
					await mutateAsync({
						currentID: data?.deployments?.[data.deployments.length - 1]?.deploymentId,
						composeId: composeId,
					});
					toast.success("New version deploy successfully");
					utils.compose.one.invalidate({ composeId });
				} catch (error) {
					toast.error("Error deploy the new version");
				}
			};

			console.log("find new deployment");
			updateDeployment();
		}
	}, [data?.composeStatus]);

	return (
		<>
			<Card className="bg-background">
				<CardHeader>
					<div className="flex flex-row gap-2 justify-between flex-wrap">
						<CardTitle className="text-xl flex items-start gap-5 w-full">
							<div className="flex justify-between w-full">
								<div className="flex gap-5">
									{data?.composeStatus === "done" ? (
										`Service Overview`
									) : (
										`Deploy Settings`
									)}
									<Badge className="h-fit mt-1">
										{data?.composeType === "docker-compose" ? "Compose" : "Stack"}
									</Badge>
								</div>
								<div>
									{/* <AddAI />	 */}
								</div>
							</div>
						</CardTitle>

					</div>

					<CardDescription>
						{/* Create a compose file to deploy your compose */}
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 flex-wrap ">
					{data?.composeStatus !== "done" ? (
						<ComposeActions composeId={composeId} />
					) : (
						<div className="w-full flex lg:flex-row flex-col gap-8">
							<div className="mt-3 relative lg:w-3/5 w-full h-full aspect-[16/9] overflow-hidden rounded-md">
								{/* Loading Skeleton */}
								{!isLoaded && (
									<div role="status" className="w-full h-full aspect-[16/9] animate-pulse md:space-y-0 md:space-x-8 rtl:space-x-reverse md:flex md:items-center">
										<div className="flex items-center justify-center w-full h-full bg-gray-300 rounded-sm  dark:bg-gray-700">
											<svg className="w-10 h-10 text-gray-200 dark:text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
												<path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z"/>
											</svg>
										</div>
										<span className="sr-only">Loading...</span>
									</div>
								)}

								{/* 實際圖片 */}
								<Image
									src={screenshotUrl}
									alt="網站截圖"
									fill
									unoptimized
									className={`shadow-sm border rounded-md object-cover transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"
										}`}
									onLoad={() => setIsLoaded(true)}
								/>
								
							</div>
							<div className=" mt-5 lg:w-2/5 w-full">
								<div className="grid grid-cols-2 lg:grid-cols-4 ">
									<div className="flex flex-col ">
										<h1 className="opacity-50 mb-3 ">Create time</h1>
										<p>{formatTimeAgo(data?.createdAt)}</p>
									</div>
									<div className="flex flex-col ml-3">
										<h1 className="opacity-50 mb-3">Status</h1>
										<div className="flex items-center gap-2 text-sm">
											<span className={`w-2.5 h-2.5 rounded-full ${data?.composeStatus ? statusMap[data?.composeStatus].color : null}`} />
											<span>{data?.composeStatus ? statusMap[data?.composeStatus].label : null}</span>
										</div>
									</div>
									<div className="flex flex-col lg:col-span-2">
										<h1 className="opacity-50 mb-3">Deployment</h1>
										<div className="flex items-center gap-2 text-sm">
											<span className="line-clamp-1 break-all">
												{data?.deployments?.[data.deployments.length - 1]?.deploymentId}
											</span>
										</div>
									</div>

								</div>
								<DomainsList data={data} />
								{/* <div className="flex flex-col mt-10">
									<div className="flex gap-3">
										<h1 className="opacity-50 mb-3 ">Domain</h1>
									</div>
									<div className="flex flex-col-reverse gap-3 ">
										{data?.domains.map((item) => (
											<Link
												className="flex items-center gap-2 text-base font-medium hover:underline user-domain"
												target="_blank"
												href={`${item.https ? "https" : "http"}://${item.host}${item.path}`}
											>
												{item.host}
												<ExternalLink className="size-4" />
											</Link>
											<ConnectAI data-url={`${item.https ? "https" : "http"}://${item.host}${item.path}`}/>
										))}
									</div>
								</div> */}
							</div>
						</div>
					)}
					{data?.composeStatus === "done" && (
						<div className="flex gap-3 w-fill mt-7">
							<ComposeActions composeId={composeId} />
						</div>
					)}
				</CardContent>
			</Card>

			<ShowProviderFormCompose composeId={composeId} />
		</>
	);
};