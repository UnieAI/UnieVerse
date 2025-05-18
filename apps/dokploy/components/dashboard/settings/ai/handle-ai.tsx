"use client";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { PenBoxIcon, PlusIcon, Sparkles, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { z } from "zod";

import { UNIEINFRA_OPENAI_API_URL } from "@/utils/unieai/unieinfra/key";
import { useUnieInfra } from "@/utils/unieai/unieinfra/provider/UnieInfraProvider";
import { UnieInfraTokenPayload } from "@/utils/unieai/unieinfra/token/UnieInfraTokenFunctions";
import { AI_MODEL_SOURCE_VALUE, AI_MODEL_SOURCE_KEYS } from "@/utils/unieai/unieinfra/key";

const Schema = z.object({
	name: z.string().min(1, { message: "Name is required" }),
	apiUrl: z.string().url({ message: "Please enter a valid URL" }),
	apiKey: z.string().min(1, { message: "API Key is required" }),
	model: z.string().min(1, { message: "Model is required" }),
	isEnabled: z.boolean(),
});

type Schema = z.infer<typeof Schema>;

interface HandleAiProps {
	aiId?: string;
}

export const HandleAi = ({ aiId }: HandleAiProps) => {
	const router = useRouter();
	const {
		accessToken,
		tokens, getTokens, isLoadingTokens,
	} = useUnieInfra();

	const utils = api.useUtils();
	const { data: aiThirdPartyConfigs, refetch: refetchAiThirdParty, isLoading: isLoadingAiThirdParty } = api.aiThirdParty.getAll.useQuery();
	const [open, setOpen] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const [modelSource, setModelSource] = useState<string>(AI_MODEL_SOURCE_VALUE.UNIEINFRA);

	const { data, refetch } = api.ai.one.useQuery(
		{
			aiId: aiId || "",
		},
		{
			enabled: !!aiId,
		},
	);
	const { mutateAsync, isLoading } = aiId
		? api.ai.update.useMutation()
		: api.ai.create.useMutation();

	const form = useForm<Schema>({
		resolver: zodResolver(Schema),
		defaultValues: {
			name: "",
			apiUrl: "",
			apiKey: "",
			model: "gpt-3.5-turbo",
			isEnabled: true,
		},
	});

	const GenToken = () => {
		// 切換至 UnieInfra Token
		console.log(`Create UnieInfra Token`);
		router.push(`/dashboard/settings/ai-api`);
	};

	useEffect(() => {
		form.reset({
			name: data?.name ?? "",
			apiUrl: data?.apiUrl ?? "https://api.openai.com/v1",
			apiKey: data?.apiKey ?? "",
			model: data?.model ?? "gpt-3.5-turbo",
			isEnabled: data?.isEnabled ?? true,
		});
	}, [aiId, form, data]);

	const apiUrl = form.watch("apiUrl");
	const apiKey = form.watch("apiKey");

	const { data: models, isLoading: isLoadingServerModels } =
		api.ai.getModels.useQuery(
			{
				apiUrl: apiUrl ?? "",
				apiKey: apiKey ?? "",
			},
			{
				enabled: !!apiUrl && !!apiKey,
				onSuccess: () => {
					setError(null);
				},
				onError: (error) => {
					setError(`Failed to fetch models: ${error.message}`);
				},
			},
		);

	useEffect(() => {
		const _apiUrl = form.watch("apiUrl");
		const _apiKey = form.watch("apiKey");

		if (_apiUrl && _apiKey) {
			form.setValue("model", "");
		}
	}, [form.watch("apiUrl"), form.watch("apiKey")]);

	useEffect(() => {
		if (!aiId) {
			if (open) setModelSource(AI_MODEL_SOURCE_VALUE.UNIEINFRA);
		}
	}, [open]);

	useEffect(() => {
		if (!aiId) {
			if (modelSource === AI_MODEL_SOURCE_VALUE.UNIEINFRA) {
				async () => {
					form.setValue("apiUrl", UNIEINFRA_OPENAI_API_URL);
					if (!tokens.some(token => token.key === apiKey)) form.setValue("apiKey", "");
					if (accessToken !== null) await getTokens(accessToken);
				};
			} else if (modelSource === AI_MODEL_SOURCE_VALUE.THIRD_PARTY) {
				form.setValue("apiUrl", "");
				form.setValue("apiKey", "");
			} else if (modelSource === AI_MODEL_SOURCE_VALUE.OTHER_API) {
				form.setValue("apiUrl", "");
				form.setValue("apiKey", "");
			}
		}
	}, [open, modelSource]);

	const onSubmit = async (data: Schema) => {
		try {
			await mutateAsync({
				...data,
				aiId: aiId || "",
			});

			utils.ai.getAll.invalidate();
			toast.success("AI settings saved successfully");
			setOpen(false);
			refetch();
		} catch (error) {
			toast.error("Failed to save AI settings", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger className="" asChild>
				{aiId ? (
					<Button
						variant="ghost"
						size="icon"
						className="group hover:bg-blue-500/10"
					>
						<PenBoxIcon className="size-4  text-primary group-hover:text-blue-500" />
					</Button>
				) : (
					<Button className="cursor-pointer space-x-3">
						<PlusIcon className="h-4 w-4" />
						Add AI API
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{aiId ? "Edit AI" : "Add AI"}</DialogTitle>
					<DialogDescription>
						Configure your AI provider settings
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>

					<div className="h-px bg-zinc-400  dark:bg-zinc-600" />

					{(!aiId) && (
						<>
							{/* 選擇模型來源 */}
							<div className="space-y-2">
								<label className="text-sm">Select AI Model Source</label>
								<Select
									value={modelSource}
									onValueChange={setModelSource}
								>
									<FormControl>
										<SelectTrigger className="w-[240px] space-y-2">
											<SelectValue placeholder="Follow user groups" />
										</SelectTrigger>
									</FormControl>

									<SelectContent>
										{AI_MODEL_SOURCE_KEYS.map((key: string, index: number) => (
											<SelectItem
												key={index}
												value={key}
											>
												{(key === AI_MODEL_SOURCE_VALUE.UNIEINFRA) ?
													"UNIEINFRA" : (key === AI_MODEL_SOURCE_VALUE.THIRD_PARTY) ?
														"Third-Party" : (key === AI_MODEL_SOURCE_VALUE.OTHER_API) ?
															"other api" :
															"Unknown"
												}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="h-px my-1 bg-zinc-200  dark:bg-zinc-800" />
						</>
					)}

					{error && (
						<>
							<AlertBlock type="error">{error}</AlertBlock>
							<div className="h-px my-1 bg-zinc-200  dark:bg-zinc-800" />
						</>
					)}

					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">

						{/* 名稱 */}
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="My OpenAI Config" {...field} />
									</FormControl>
									<FormDescription>
										A name to identify this configuration
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{(!aiId) ? (
							<>
								{(modelSource === AI_MODEL_SOURCE_VALUE.UNIEINFRA) ? (
									<>
										{/* UnieInfra token */}
										<FormField
											control={form.control}
											name="apiKey"
											render={({ field }) => (
												<FormItem>
													<FormLabel>API Token</FormLabel>
													<FormControl>
														<div className={`flex flex-row gap-2 ${tokens.length !== 0 ? "justify-between" : "justify-end"}`}>
															{tokens.length === 0 ? (
																<>
																	<span className="text-red-500">Please Gen UnieInfra token first</span>
																	<Button
																		type="button"
																		variant="ghost"
																		size="sm"
																		disabled={isLoadingTokens}
																		onClick={GenToken}
																	>
																		<Sparkles className="w-3 h-3" />
																		Gen Token
																	</Button>
																</>
															) : (
																<Select
																	value={field.value}
																	onValueChange={field.onChange}
																>
																	<FormControl>
																		<SelectTrigger className="w-[240px]">
																			<SelectValue placeholder="Select a token" />
																		</SelectTrigger>
																	</FormControl>
																	<SelectContent>
																		{tokens.map((token: UnieInfraTokenPayload) => (
																			<SelectItem
																				key={token.id}
																				value={`sk-${token.key!}`}
																			>
																				{token.name}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
															)}
															<Button
																type="button"
																variant="ghost"
																size="sm"
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
																<RefreshCw className="w-3 h-3" />
																Refresh
															</Button>
														</div>
													</FormControl>
													<FormDescription>Your UnieInfra API token for authentication</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									</>
								) : (modelSource === AI_MODEL_SOURCE_VALUE.THIRD_PARTY) ? (
									<>
										{/* Third-Party url & token */}
										<FormItem>
											<FormLabel>API Token</FormLabel>
											<FormControl>
												<div className={`flex flex-row gap-2 ${aiThirdPartyConfigs?.length !== 0 ? "justify-between" : "justify-end"}`}>
													{aiThirdPartyConfigs?.length === 0 ? (
														<>
															<span className="text-red-500">Please Gen Third-Party token first</span>
															<Button
																type="button"
																variant="ghost"
																size="sm"
																disabled={isLoadingAiThirdParty}
																onClick={GenToken}
															>
																<Sparkles className="w-3 h-3" />
																Gen Token
															</Button>
														</>
													) : (
														<Select
															onValueChange={(value) => {
																const config = JSON.parse(value);
																form.setValue("apiUrl", config.apiUrl);
																form.setValue("apiKey", config.apiKey);
																console.log(`apiUrl: ${config.apiUrl}\r\napiKey: ${config.apiKey}`);
															}}
														>
															<FormControl>
																<SelectTrigger className="w-[240px]">
																	<SelectValue placeholder="Select a token" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{aiThirdPartyConfigs?.map((config) => (
																	<SelectItem
																		key={config.apiId}
																		value={JSON.stringify(config)}
																	>
																		{config.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													)}
													<Button
														type="button"
														variant="ghost"
														size="sm"
														disabled={isLoadingAiThirdParty}
														onClick={async () => {
															await refetchAiThirdParty();
														}}
													>
														<RefreshCw className="w-3 h-3" />
														Refresh
													</Button>
												</div>
											</FormControl>
											<FormDescription>Your Third-Party API token for authentication</FormDescription>
											<FormMessage />
										</FormItem>
									</>
								) : (modelSource === AI_MODEL_SOURCE_VALUE.OTHER_API) ? (
									<>
										{/* API URL */}
										<FormField
											control={form.control}
											name="apiUrl"
											render={({ field }) => (
												<FormItem>
													<FormLabel> API URL </FormLabel>
													<FormControl>
														<Input placeholder={"https://api.openai.com/v1"} {...field} />
													</FormControl>
													<FormDescription>
														The base URL for your AI provider's API
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										{/* API KEY */}
										<FormField
											control={form.control}
											name="apiKey"
											render={({ field }) => (
												<FormItem>
													<FormLabel>API Key</FormLabel>
													<FormControl>
														<Input type="password" placeholder="sk-..." {...field} />
													</FormControl>
													<FormDescription>Your API key for authentication</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									</>
								) : (
									<></>
								)}
							</>
						) : (
							<>
								{/* API URL */}
								<FormField
									control={form.control}
									name="apiUrl"
									render={({ field }) => (
										<FormItem>
											<FormLabel> API URL </FormLabel>
											<FormControl>
												<Input placeholder={"https://api.openai.com/v1"} {...field} />
											</FormControl>
											<FormDescription>
												The base URL for your AI provider's API
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* API KEY */}
								<FormField
									control={form.control}
									name="apiKey"
									render={({ field }) => (
										<FormItem>
											<FormLabel>API Key</FormLabel>
											<FormControl>
												<Input type="password" placeholder="sk-..." {...field} />
											</FormControl>
											<FormDescription>Your API key for authentication</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</>
						)}

						{isLoadingServerModels && (
							<span className="text-sm text-muted-foreground">
								Loading models...
							</span>
						)}

						{/* 模型選項 */}
						{!isLoadingServerModels && models && (
							<>
								{models.length > 0 ? (
									<FormField
										control={form.control}
										name="model"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Model</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value || ""}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select a model" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{models.map((model) => (
															<SelectItem key={model.id} value={model.id}>
																{model.id}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormDescription>Select an AI model to use</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								) : (
									<span className="text-red-500">This token doesn't have any available models.</span>
								)}
							</>
						)}

						{/* AI Features */}
						<FormField
							control={form.control}
							name="isEnabled"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">
											Enable AI Features
										</FormLabel>
										<FormDescription>
											Turn on/off AI functionality
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<div className="flex justify-end  gap-2 pt-4">
							<Button type="submit" isLoading={isLoading}>
								{aiId ? "Update" : "Create"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog >
	);
};
