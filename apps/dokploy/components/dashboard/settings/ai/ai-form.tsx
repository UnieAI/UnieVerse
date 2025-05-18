"use client";

import { useEffect, useState } from "react";
import { DialogAction } from "@/components/shared/dialog-action";
import { Button } from "@/components/ui/button";
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

import { HandleAi } from "@/components/dashboard/settings/ai/handle-ai";
import { HandleLocalAi } from "@/components/dashboard/settings/ai/handle-local-ai";

import { useUnieInfra } from "@/utils/unieai/unieinfra/provider/UnieInfraProvider";

import { toDatetimeLocalString } from "@/utils/time";
import { AI_MODEL_SOURCE_VALUE, AI_MODEL_SOURCE_KEYS } from "@/utils/unieai/unieinfra/key";
import { UnieInfraTokenPayload, UnieInfraTokenStatusPayload } from "@/utils/unieai/unieinfra/token/UnieInfraTokenFunctions";

export const AiForm = () => {
	// aiConfigs 可以 list 出現有的 ai
	const { data: aiConfigs, refetch: refetchAi, isLoading: isLoadingAi } = api.ai.getAll.useQuery();
	const { mutateAsync, isLoading: isRemoving } = api.ai.delete.useMutation();

	// tokens 可以 list 出現有的 unieinfra tokens
	const {
		accessToken,
		tokens, getTokens, putTokenStatus, deleteToken,
		isLoadingTokens,
	} = useUnieInfra();

	return (
		<div className="w-full">
			<Card className="h-full bg-sidebar  p-2.5 rounded-xl  max-w-5xl mx-auto">
				<div className="rounded-xl bg-background shadow-md ">
					<CardHeader className="w-full flex flex-row gap-2 justify-between">
						<div className="w-full flex flex-col">
							<CardTitle className="text-xl flex flex-row gap-2">
								<BotIcon className="size-6 text-muted-foreground self-center" />
								AI Settings
							</CardTitle>
							<CardDescription>Manage your AI configurations</CardDescription>
						</div>

						<div className="flex w-full justify-end">
							<div className="flex gap-3">
								<HandleAi />
								{/* <HandleLocalAi /> */}
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-2 py-8 border-t">
						{(isLoadingAi) ? (
							<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground min-h-[25vh]">
								<span>Loading...</span>
								<Loader2 className="animate-spin size-4" />
							</div>
						) : (
							<>
								{aiConfigs?.length === 0 ? (
									<div className="flex flex-col items-center gap-3  min-h-[25vh] justify-center">
										<BotIcon className="size-8 self-center text-muted-foreground" />
										<span className="text-base text-muted-foreground text-center">
											You don't have any AI configurations
										</span>
										<div className="flex gap-3">
											<HandleAi />
											{/* <HandleLocalAi /> */}
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
														<HandleAi aiId={config.aiId} />
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
																		refetchAi();
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
						)}
					</CardContent>
				</div>
			</Card >
		</div >
	);
};
