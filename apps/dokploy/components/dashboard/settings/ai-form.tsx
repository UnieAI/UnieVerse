"use client";

import { useEffect, useState } from "react";
import { DialogAction } from "@/components/shared/dialog-action";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { api } from "@/utils/api";
import { BotIcon, Loader2, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { HandleAi } from "./handle-ai";
import { HandleLocalAi } from "./handle-local-ai";
import { HandleUnieInfra } from "./handle-unieinfra";

import { useUnieInfra } from "@/utils/unieai/unieinfra/provider/UnieInfraProvider";

import { toDatetimeLocalString } from "@/utils/time";
import { UnieInfraTokenPayload, UnieInfraTokenStatusPayload } from "@/utils/unieai/unieinfra/token/UnieInfraTokenFunctions";

export const AiForm = () => {
	// aiConfigs 可以 list 出現有的 ai
	const { data: aiConfigs, refetch, isLoading } = api.ai.getAll.useQuery();
	const { mutateAsync, isLoading: isRemoving } = api.ai.delete.useMutation();

	// tokens 可以 list 出現有的 unieinfra tokens
	const {
		accessToken,
		tokens, getTokens, putTokenStatus, deleteToken,
		isLoadingTokens,
	} = useUnieInfra();

	const [openHandleUnieInfra, setOpenHandleUnieInfra] = useState<boolean>(false);

	const tabValues: string[] = ["AI", "UnieInfra Token"];
	const [currentTab, setCurrentTab] = useState<string>(tabValues[0]!);
	const handleTabChange = (value: string) => {
		setCurrentTab(value);
	};

	const GenToken = () => {
		// 切換至 "UnieInfra Token"
		console.log(`open GenToken`);
		setCurrentTab(tabValues[1]!);
		setOpenHandleUnieInfra(true);
	}

	useEffect(() => {
		const fetchUnieInfra = async () => {
			if (accessToken !== null) {
				await getTokens(accessToken);
			}
		};

		if (currentTab === tabValues[1]!) fetchUnieInfra();
	}, [currentTab]);

	return (
		<div className="w-full">
			<Card className="h-full bg-sidebar  p-2.5 rounded-xl  max-w-5xl mx-auto">
				<div className="rounded-xl bg-background shadow-md ">
					<CardHeader className="w-full">
						<div className="flex flex-row gap-2 justify-between">
							<div>
								<CardTitle className="text-xl flex flex-row gap-2">
									<BotIcon className="size-6 text-muted-foreground self-center" />
									AI Settings
								</CardTitle>
								<CardDescription>Manage your AI configurations</CardDescription>
							</div>

							<Tabs value={currentTab} defaultValue={tabValues[0]!} className="flex gap-3" onValueChange={handleTabChange}>
								<TabsList className="w-full justify-start h-12 rounded-none bg-transparent border-b border-zinc-200 dark:border-zinc-800">
									{tabValues.map((tabValue: string, index) => (
										<TabsTrigger
											key={index}
											value={tabValue}
											className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-zinc-900 dark:data-[state=active]:border-white"
										>
											{tabValue}
										</TabsTrigger>
									))}
								</TabsList>
							</Tabs>
						</div>

						<div className="flex w-full justify-end">
							{(currentTab === tabValues[0]!) ? (
								<>
									{aiConfigs && aiConfigs?.length > 0 && (
										<div className="flex gap-3">
											<HandleAi GenToken={GenToken} />
											<HandleLocalAi />
										</div>
									)}
								</>
							) : (currentTab === tabValues[1]!) ? (
								<>
									{tokens && tokens?.length > 0 && (
										<div className="flex gap-3">
											<HandleUnieInfra open={openHandleUnieInfra} setOpen={setOpenHandleUnieInfra} />
											<Button
												className="cursor-pointer space-x-3"
												disabled={isLoadingTokens}
												onClick={async () => {
													if (accessToken) {
														await getTokens(accessToken);
														toast.success("Tokens refreshed");
													} else {
														toast.error("No access token available");
													}
												}}
											>
												<RefreshCw className="h-4 w-4" />
												Refresh tokens
											</Button>
										</div>
									)}
								</>
							) : (
								<>

								</>
							)}
						</div>

					</CardHeader>
					<CardContent className="space-y-2 py-8 border-t">
						{(isLoading || isLoadingTokens) ? (
							<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground min-h-[25vh]">
								<span>Loading...</span>
								<Loader2 className="animate-spin size-4" />
							</div>
						) : (
							<>
								{(currentTab === tabValues[0]!) ? (
									<>
										{aiConfigs?.length === 0 ? (
											<div className="flex flex-col items-center gap-3  min-h-[25vh] justify-center">
												<BotIcon className="size-8 self-center text-muted-foreground" />
												<span className="text-base text-muted-foreground text-center">
													You don't have any AI configurations
												</span>
												<div className="flex gap-3">
													<HandleAi GenToken={GenToken} />
													<HandleLocalAi />
												</div>
											</div>
										) : (
											<div className="flex flex-col gap-4 rounded-lg min-h-[25vh]">
												{aiConfigs?.map((config) => (
													<div
														key={config.aiId}
														className="flex items-center justify-between bg-sidebar p-1 w-full rounded-lg"
													>
														<div className="flex items-center justify-between p-3.5 rounded-lg bg-background border  w-full">
															<div>
																<span className="text-sm font-medium">
																	{config.name}
																</span>
																<CardDescription>{config.model}</CardDescription>
															</div>
															<div className="flex justify-between items-center">
																<HandleAi GenToken={GenToken} aiId={config.aiId} />
																<DialogAction
																	title="Delete AI"
																	description="Are you sure you want to delete this AI?"
																	type="destructive"
																	onClick={async () => {
																		await mutateAsync({
																			aiId: config.aiId,
																		})
																			.then(() => {
																				toast.success("AI deleted successfully");
																				refetch();
																			})
																			.catch(() => {
																				toast.error("Error deleting AI");
																			});
																	}}
																>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="group hover:bg-red-500/10 "
																		isLoading={isRemoving}
																	>
																		<Trash2 className="size-4 text-primary group-hover:text-red-500" />
																	</Button>
																</DialogAction>
															</div>
														</div>
													</div>
												))}
											</div>
										)}
									</>
								) : (currentTab === tabValues[1]!) ? (
									<>
										{tokens?.length === 0 ? (
											<div className="flex flex-col items-center gap-3  min-h-[25vh] justify-center">
												<BotIcon className="size-8 self-center text-muted-foreground" />
												<span className="text-base text-muted-foreground text-center">
													You don't have any UnieInfra tokens
												</span>
												<div className="flex gap-3">
													<HandleUnieInfra open={openHandleUnieInfra} setOpen={setOpenHandleUnieInfra} />
													<Button
														className="cursor-pointer space-x-3"
														disabled={isLoadingTokens}
														onClick={async () => {
															if (accessToken) {
																await getTokens(accessToken);
																toast.success("Tokens refreshed");
															} else {
																toast.error("No access token available");
															}
														}}
													>
														<RefreshCw className="h-4 w-4" />
														Refresh tokens
													</Button>
												</div>
											</div>
										) : (
											<div className="flex flex-col gap-4 rounded-lg min-h-[25vh]">
												{tokens?.map((token: UnieInfraTokenPayload) => (
													<div
														key={token.id}
														className="flex items-center justify-between bg-sidebar p-1 w-full rounded-lg"
													>
														<div className="flex items-center justify-between p-3.5 rounded-lg bg-background border  w-full">
															<div>
																<span className="text-sm font-medium">
																	{token.name}
																</span>
																<CardDescription>
																	{token.unlimited_quota ? `Unlimited` : `Used Quota: ${token.used_quota}/${token.remain_quota}`}
																</CardDescription>
																<CardDescription>
																	{token.expired_time === -1 ? `Never Expires` : `Expiry Time: ${toDatetimeLocalString(new Date(token.expired_time * 1000))}`}
																</CardDescription>
															</div>
															<div className="flex justify-between items-center">
																<Switch
																className="mr-2"
																	checked={token.status === 1}
																	onCheckedChange={async (checked) => {
																		if (accessToken) {
																			const payload: UnieInfraTokenStatusPayload = {
																				id: token.id!,
																				status: checked ? 1 : 2, // active = 1; close = 2;
																			}
																			await putTokenStatus(accessToken, payload);
																		} else {
																			toast.error("No access token available");
																		}
																	}}
																/>
																<HandleUnieInfra tokenData={token} />
																<DialogAction
																	title="Delete AI"
																	description="Are you sure you want to delete this AI?"
																	type="destructive"
																	onClick={async () => {
																		if (accessToken) {
																			await deleteToken(accessToken, token.id!);
																		} else {
																			toast.error("No access token available");
																		}
																	}}
																>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="group hover:bg-red-500/10 "
																		isLoading={isLoadingTokens}
																	>
																		<Trash2 className="size-4 text-primary group-hover:text-red-500" />
																	</Button>
																</DialogAction>
															</div>
														</div>
													</div>
												))}
											</div>
										)}
									</>
								) : (
									<>

									</>
								)}
							</>
						)}
					</CardContent>
				</div>
			</Card >
		</div >
	);
};
