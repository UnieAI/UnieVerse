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
import { toast } from "sonner";
import { z } from "zod";

import { UNIEINFRA_OPENAI_API_URL } from "@/utils/unieai/unieinfra/key/key";
import { useUnieInfra } from "@/utils/unieai/unieinfra/provider/UnieInfraProvider";

const Schema = z.object({
	name: z.string().min(1, { message: "Name is required" }),
	apiUrl: z.string().url({ message: "Please enter a valid URL" }),
	apiKey: z.string().min(1, { message: "API Key is required" }),
	model: z.string().min(1, { message: "Model is required" }),
	isEnabled: z.boolean(),
});

type Schema = z.infer<typeof Schema>;

interface HandleAiProps {
	GenToken: () => void;
	aiId?: string;
}

export const HandleAi = ({ GenToken, aiId }: HandleAiProps) => {

	const {
		accessToken,
		tokens, getTokens, isLoadingTokens,
	} = useUnieInfra();

	const utils = api.useUtils();
	const [open, setOpen] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const [useUnieInfraApi, setUseUnieInfraApi] = useState<boolean>(false);

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
				onError: (error) => {
					setError(`Failed to fetch models: ${error.message}`);
				},
			},
		);

	useEffect(() => {
		const apiUrl = form.watch("apiUrl");
		const apiKey = form.watch("apiKey");

		if (apiUrl && apiKey) {
			form.setValue("model", "");
		}
	}, [form.watch("apiUrl"), form.watch("apiKey")]);

	useEffect(() => {
		const fetchUnieInfra = async () => {
			form.setValue("apiUrl", UNIEINFRA_OPENAI_API_URL);
			if (accessToken !== null) await getTokens(accessToken);
		};

		if (useUnieInfraApi) fetchUnieInfra();
		else form.setValue("apiKey", "");
	}, [open, useUnieInfraApi]);

	const onSubmit = async (data: Schema) => {
		try {
			// 檢查api key
			await mutateAsync({
				...data,
				aiId: aiId || "",
			});

			utils.ai.getAll.invalidate();
			toast.success("AI settings saved successfully");
			refetch();
			setOpen(false);
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
					{error && <AlertBlock type="error">{error}</AlertBlock>}
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
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

						<FormField
							control={form.control}
							name="apiUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										<div className="flex flex-row justify-between gap-2">
											<span>API URL</span>
											<div className="flex items-center gap-1">
												<Switch
													checked={useUnieInfraApi}
													onCheckedChange={(checked) => setUseUnieInfraApi(checked)}
												/>
												Use UnieInfra API
											</div>
										</div>
									</FormLabel>
									<FormControl>
										{!useUnieInfraApi && (
											<Input
												{...field}
												disabled={useUnieInfraApi}
												placeholder={"https://api.openai.com/v1"}
											/>
										)}
									</FormControl>
									<FormDescription>
										{useUnieInfraApi ? (
											"API URL is base UnieInfra"
										) : (
											"The base URL for your AI provider's API"
										)}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="apiKey"
							render={({ field }) => (
								<FormItem>
									<FormLabel>API Key</FormLabel>
									<FormControl>
										{useUnieInfraApi ? (
											<div className={`flex flex-row gap-2 ${tokens.length !== 0 ? "justify-between" : "justify-end"}`}>
												{tokens.length === 0 ? (
													<Button
														type="button"
														variant="ghost"
														size="sm"
														disabled={isLoadingTokens}
														onClick={() => {
															if (accessToken) {
																GenToken();
															} else {
																toast.error("No access token available");
															}
														}}
													>
														Gen Token
														<Sparkles />
													</Button>
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
															{tokens.map((token: any) => (
																<SelectItem
																	key={token.id}
																	value={`sk-${token.key}`}
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
													Refresh tokens
													<RefreshCw />
												</Button>
											</div>
										) : (
											<Input type="password" placeholder="sk-..." {...field} />
										)}
									</FormControl>
									<FormDescription>
										{useUnieInfraApi ? (
											"Your UnieInfra API token for authentication"
										) : (
											"Your API key for authentication"
										)}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{isLoadingServerModels && (
							<span className="text-sm text-muted-foreground">
								Loading models...
							</span>
						)}

						{!isLoadingServerModels && models && models.length > 0 && (
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
						)}

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
