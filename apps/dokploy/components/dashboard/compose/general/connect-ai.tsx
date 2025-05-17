// connect-ai.tsx
"use client";
import {
	Dialog, DialogTrigger, DialogContent,
	DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from "@/components/ui/form";
import {
	Select, SelectContent, SelectItem,
	SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useUnieInfra } from "@/utils/unieai/unieinfra/provider/UnieInfraProvider";


const schema = z.object({
	name: z.string().min(1),
	base_url: z.string().url(),
	api_key: z.string().min(1),
	model: z.string().min(1),
});

interface ConnectAIFormProps {
	appurl?: string;
}

export default function ConnectAIForm({ appurl }: ConnectAIFormProps) {

	const { accessToken } = useUnieInfra();

	const [models, setModels] = useState<string[]>([]);
	const formatted_appurl = appurl!.endsWith('/') ? appurl!.slice(0, -1) : appurl;
	const ai_appurl = `${formatted_appurl}/v1`;
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: {
			name: "",
			base_url: ai_appurl || "",
			api_key: "",
			model: "",
		},
	});

	useEffect(() => {
		if (ai_appurl) form.setValue("base_url", ai_appurl);
	}, [ai_appurl, form]);


	const fetchModels = async () => {
		const { base_url, api_key } = form.getValues();
		try {
			const res = await fetch("/api/unieai/unieinfra/providers/openai/models", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ base_url, api_key }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.message);
			setModels(json.models);
			toast.success("Models fetched");
		} catch (err: any) {
			toast.error("Model fetch failed: " + err.message);
		}
	};

	const onSubmit = async (values: z.infer<typeof schema>) => {
		const res = await fetch("/api/unieai/unieinfra/channels/create", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				name: values.name,
				base_url: values.base_url,
				key: values.api_key,
				models: values.model,
			}),
		});
		const json = await res.json();
		if (res.ok) {
			toast.success("LLM added. Access Token: " + json.accessToken);
		} else {
			toast.error("Failed: " + json.message);
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button>＋ Add LLM to UnieInfra</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Connect LLM</DialogTitle>
					<DialogDescription>Enter info and fetch models</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField name="name" control={form.control} render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl><Input placeholder="Channel name" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField name="base_url" control={form.control} render={({ field }) => (
							<FormItem>
								<FormLabel>Base URL</FormLabel>
								<FormControl><Input placeholder="https://api.example.com" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField name="api_key" control={form.control} render={({ field }) => (
							<FormItem>
								<FormLabel>API Key (Optional)</FormLabel>
								<FormControl><Input type="password" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<Button type="button" variant="secondary" onClick={fetchModels}>
							Fetch Models
						</Button>
						<FormField name="model" control={form.control} render={({ field }) => (
							<FormItem>
								<FormLabel>Model</FormLabel>
								<Select value={field.value} onValueChange={field.onChange}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a model" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{models.map((model) => (
											<SelectItem key={model} value={model}>{model}</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)} />
						<div className="text-right pt-4">
							<Button type="submit">Connect</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
