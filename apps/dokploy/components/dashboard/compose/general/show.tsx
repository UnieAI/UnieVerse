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
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
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

	const [isLoaded, setIsLoaded] = useState(false);

	console.log(data, data?.domains[0]?.host)

	const site = `http${data?.domains[0]?.https && 's'}://${data?.domains[0]?.host}`
	// const site = "https://www.accton.com.tw/"
	const screenshotUrl = `/api/screenshot?url=${encodeURIComponent(site)}`;

	return (
		<>
			<Card className="bg-background">
				<CardHeader>
					<div className="flex flex-row gap-2 justify-between flex-wrap">
						<CardTitle className="text-xl flex items-start gap-5">
							{data?.composeStatus === "done" ? (
								`Service Overview`
							) : (
								`Deploy Settings`
							)}
							<Badge className="h-fit mt-1">
								{data?.composeType === "docker-compose" ? "Compose" : "Stack"}
							</Badge>
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
							<div className="mt-3 relative lg:w-3/5 w-full aspect-[16/9] overflow-hidden rounded-md">
								{/* Loading Skeleton */}
								{!isLoaded && (
									<div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center text-muted-foreground text-sm">
										Loading preview...
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
								<div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
									<div className="flex flex-col">
										<h1 className="opacity-50 mb-3">Time to Ready</h1>
										<p>{formatTimeAgo(data?.createdAt)}</p>
									</div>
									<div className="flex flex-col">
										<h1 className="opacity-50 mb-3">Status</h1>
										<div className="flex items-center gap-2 text-sm">
											<span className={`w-2.5 h-2.5 rounded-full ${data?.composeStatus ? statusMap[data?.composeStatus].color : null}`} />
											<span>{data?.composeStatus ? statusMap[data?.composeStatus].label : null}</span>
										</div>
									</div>
								</div>
								<div className="flex flex-col mt-10">
									<div className="flex gap-3">
									<h1 className="opacity-50 mb-3 ">Domain</h1>
									</div>
									<div className="flex flex-col-reverse gap-3 ">
									{data?.domains.map((item) => (
										<Link
											className="flex items-center gap-2 text-base font-medium hover:underline"
											target="_blank"
											href={`${item.https ? "https" : "http"}://${item.host}${item.path}`}
										>
											{item.host}
											<ExternalLink className="size-4" />
										</Link>
									))}
									</div>
								</div>
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