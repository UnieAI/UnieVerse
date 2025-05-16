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
import { BotIcon, Loader2, Trash2, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";

import { HandleUnieInfra } from "@/components/dashboard/settings/ai-api/handle-unieinfra";
import { HandleAiThirdParty } from "@/components/dashboard/settings/ai-api/handle-ai-third-party";

import { useUnieInfra } from "@/utils/unieai/unieinfra/provider/UnieInfraProvider";

import { toDatetimeLocalString } from "@/utils/time";
import { AI_API_TAB_VALUE, AI_API_TAB_KEYS } from "@/utils/unieai/unieinfra/key";
import { UnieInfraTokenPayload, UnieInfraTokenStatusPayload } from "@/utils/unieai/unieinfra/token/UnieInfraTokenFunctions";

export const AiApiForm = () => {

	const { data: aiThirdPartyConfigs, refetch: refetchAiThirdParty, isLoading: isLoadingAiThirdParty } = api.aiThirdParty.getAll.useQuery();
	const { mutateAsync, isLoading: isRemoving } = api.ai.delete.useMutation();

	// tokens 可以 list 出現有的 unieinfra tokens
	const {
		accessToken,
		tokens, getTokens, putTokenStatus, deleteToken,
		isLoadingTokens,
	} = useUnieInfra();

	const [openHandleUnieInfra, setOpenHandleUnieInfra] = useState<boolean>(false);

	const [currentTab, setCurrentTab] = useState<string>(AI_API_TAB_VALUE.UNIEINFRA);

	useEffect(() => {
		const fetchUnieInfra = async () => {
			if (accessToken !== null) {
				await getTokens(accessToken);
			}
		};

		if (currentTab === AI_API_TAB_VALUE.UNIEINFRA) fetchUnieInfra();
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
									{(currentTab === AI_API_TAB_VALUE.UNIEINFRA) ?
										"UnieInfra Token Settings"
										: (currentTab === AI_API_TAB_VALUE.THIRD_PARTY) ?
											"Third Party Api Settings"
											: "Unknown Settings"
									}
								</CardTitle>
								{(currentTab === AI_API_TAB_VALUE.UNIEINFRA) ? (
									<CardDescription>Manage your UnieInfra Token configurations</CardDescription>
								) : (currentTab === AI_API_TAB_VALUE.THIRD_PARTY) ? (
									<CardDescription>Manage your Third Party Api configurations</CardDescription>
								) : (
									<CardDescription>Unknown configurations</CardDescription>
								)}
							</div>

							<Tabs value={currentTab} defaultValue={AI_API_TAB_VALUE.UNIEINFRA} className="flex gap-3" onValueChange={setCurrentTab}>
								<TabsList className="w-full justify-start h-12 rounded-none bg-transparent border-b border-zinc-200 dark:border-zinc-800">
									{AI_API_TAB_KEYS.map((tabValue: string, index) => (
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
							{(currentTab === AI_API_TAB_VALUE.UNIEINFRA) ? (
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
							) : (currentTab === AI_API_TAB_VALUE.THIRD_PARTY) ? (
								<>
									{aiThirdPartyConfigs && aiThirdPartyConfigs?.length > 0 && (
										<div className="flex gap-3">
											<HandleAiThirdParty />
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
						{(isLoadingAiThirdParty) ? (
							<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground min-h-[25vh]">
								<span>Loading...</span>
								<Loader2 className="animate-spin size-4" />
							</div>
						) : (
							<>
								{(currentTab === AI_API_TAB_VALUE.UNIEINFRA) ? (
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
																	disabled={isLoadingTokens}
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
																<Button
																	variant="ghost"
																	size="icon"
																	className="group hover:bg-blue-500/10"
																	disabled={isLoadingTokens}
																	onClick={() => {
																		navigator.clipboard.writeText(`sk-${token.key!}`)
																			.then(() => {
																				alert("UnieInfra token has been copied to the clipboard!");
																			})
																			.catch((err) => {
																				console.error("UnieInfra token copy failed!", err);
																			});
																	}}
																>
																	<Copy className="size-4  text-primary group-hover:text-blue-500" />
																</Button>
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
																		disabled={isLoadingTokens}
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
								) : (currentTab === AI_API_TAB_VALUE.THIRD_PARTY) ? (
									<>
										{aiThirdPartyConfigs?.length === 0 ? (
											<div className="flex flex-col items-center gap-3  min-h-[25vh] justify-center">
												<BotIcon className="size-8 self-center text-muted-foreground" />
												<span className="text-base text-muted-foreground text-center">
													You don't have any third-party AI configurations
												</span>
												<div className="flex gap-3">
													<HandleAiThirdParty />
												</div>
											</div>
										) : (
											<div className="flex flex-col gap-4 rounded-lg min-h-[25vh]">
												{aiThirdPartyConfigs?.map((config) => (
													<div
														key={config.apiId}
														className="flex items-center justify-between bg-sidebar p-1 w-full rounded-lg"
													>
														<div className="flex items-center justify-between p-3.5 rounded-lg bg-background border  w-full">
															<div>
																<span className="text-sm font-medium">
																	{config.name}
																</span>
																<CardDescription>{config.description}</CardDescription>
															</div>
															<div className="flex justify-between items-center">
																<HandleAiThirdParty apiId={config.apiId} />
																<DialogAction
																	title="Delete AI"
																	description="Are you sure you want to delete this AI?"
																	type="destructive"
																	onClick={async () => {
																		await mutateAsync({
																			aiId: config.apiId,
																		})
																			.then(() => {
																				toast.success("AI deleted successfully");
																				refetchAiThirdParty();
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
