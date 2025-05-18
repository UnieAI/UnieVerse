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

import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { PenBoxIcon, PlusIcon, Sparkles, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const Schema = z.object({
	name: z.string().min(1, { message: "Name is required" }),
	description: z.string().min(1, { message: "Description is required" }),
	apiUrl: z.string().url({ message: "Valid URL required" }),
	apiKey: z.string().min(1, { message: "API Key is required" }),
	status: z.boolean(),
});

type Schema = z.infer<typeof Schema>;

interface Props {
	apiId?: string;
}

export const HandleAiThirdParty = ({ apiId }: Props) => {

	const [open, setOpen] = useState(false);
	const utils = api.useUtils();

	const { data, refetch } = api.aiThirdParty.get.useQuery(
		{ apiId: apiId || "" },
		{ enabled: !!apiId }
	);

	const { mutateAsync, isLoading } = apiId
		? api.aiThirdParty.update.useMutation()
		: api.aiThirdParty.create.useMutation();

	const form = useForm<Schema>({
		resolver: zodResolver(Schema),
		defaultValues: {
			name: "",
			description: "",
			apiUrl: "",
			apiKey: "",
			status: true,
		},
	});

	useEffect(() => {
		if (data) {
			form.reset({
				name: data.name ?? "",
				description: data.description ?? "",
				apiUrl: data.apiUrl ?? "",
				apiKey: data.apiKey ?? "",
				status: data.status ?? true,
			});
		}
	}, [apiId, data, form]);

	const apiUrl = form.watch("apiUrl");
	const apiKey = form.watch("apiKey");

	const onSubmit = async (data: Schema) => {
		try {
			await mutateAsync({
				...data,
				apiId: apiId || "",
			});

			utils.aiThirdParty.getAll.invalidate();
			toast.success("Third-party AI saved successfully");
			setOpen(false);
			refetch();
		} catch (err) {
			toast.error("Failed to save", {
				description: err instanceof Error ? err.message : "Unknown error",
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{apiId ? (
					<Button
						variant="ghost"
						size="icon"
						className="group hover:bg-yellow-500/10"
					>
						<PenBoxIcon className="size-4 text-yellow-600 group-hover:text-yellow-500" />
					</Button>
				) : (
					<Button>
						<PlusIcon className="w-4 h-4 mr-2" />
						Add Third-Party AI
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{apiId ? "Edit Third-Party AI" : "Add Third-Party AI"}
					</DialogTitle>
					<DialogDescription>
						Configure external AI service credentials
					</DialogDescription>
				</DialogHeader>

				<Form {...form} >
					<form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off" className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="e.g., Claude API" {...field} />
									</FormControl>
									<FormDescription>A name to identify this API config</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="apiUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>API URL</FormLabel>
									<FormControl>
										<Input placeholder="https://api.openai.com/v1" {...field} />
									</FormControl>
									<FormDescription>
										Base URL of the external AI API
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
										<Input
											type="password"
											placeholder="sk-..."
											{...field} />
									</FormControl>
									<FormDescription>The secret key for this API</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Input placeholder="Optional description" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="status"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between border p-4 rounded-md">
									<div>
										<FormLabel>Status</FormLabel>
										<FormDescription>
											Enable or disable this AI config
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

						<div className="flex justify-end">
							<Button type="submit" isLoading={isLoading}>
								{apiId ? "Update" : "Create"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
