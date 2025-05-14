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

import { useUnieInfraAccessToken } from "@/utils/unieai/unieinfra/user/use-unieInfraAccessToken";
import { useUnieInfraGroups } from "@/utils/unieai/unieinfra/group/use-unieInfraGroups";

import { CreateUnieInfraToken, CreateUnieInfraTokenPayload, CreateUnieInfraTokenSuccess } from "@/utils/unieai/unieinfra/token/CreateUnieInfraToken";

const Schema = z.object({
	expired_time: z.number(),
	group: z.string(),
	is_edit: z.boolean(),
	name: z.string().min(1, { message: "Name is required" }),
	remain_quota: z.number(),
	unlimited_quota: z.boolean(),
});

type Schema = z.infer<typeof Schema>;

export const HandleUnieInfra = () => {

	const { data } = api.user.get.useQuery();
	const { data: isCloud } = api.settings.isCloud.useQuery();

	const { accessToken } = useUnieInfraAccessToken();
	const { groups, setGroupsByAccessToken, isLoadingGroups } = useUnieInfraGroups();

	const [error, setError] = useState<string | null>(null);
	const [open, setOpen] = useState<boolean>(false);

	const [neverExpires, setNeverExpires] = useState<boolean>(true);
	const [unlimitedQuota, setUnlimitedQuota] = useState<boolean>(false);

	const setExpires = (state: boolean) => {
		setNeverExpires(state);

		if (state) {
			form.setValue("expired_time", -1);
		} else {
			const now = new Date();
			const timestamp = Math.floor(now.getTime() / 1000);
			form.setValue("expired_time", timestamp);
		}
	}

	const setQuotaLimit = (state: boolean) => {
		setUnlimitedQuota(state);
		form.setValue("unlimited_quota", state);
		if (state) {
			// form.setValue("remain_quota", 0);	
		} else {
			// form.setValue("remain_quota", 0);
		}
	}

	function toDatetimeLocalString(date: Date) {
		const pad = (n: number) => n.toString().padStart(2, "0");

		const yyyy = date.getFullYear();
		const MM = pad(date.getMonth() + 1); // 月份從 0 開始
		const dd = pad(date.getDate());
		const hh = pad(date.getHours());
		const mm = pad(date.getMinutes());

		return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
	}

	const form = useForm<Schema>({
		resolver: zodResolver(Schema),
		defaultValues: {
			expired_time: -1,
			group: "",
			is_edit: false,
			name: "",
			remain_quota: 0,
			unlimited_quota: false,
		},
	});

	useEffect(() => {
		const fetchUnieInfra = async () => {
			if (groups.length === 0 && accessToken !== null) {
				await setGroupsByAccessToken(accessToken);
			}
		};

		fetchUnieInfra();
	}, [groups, accessToken]);

	const onSubmit = async (data: Schema) => {
		try {
			if (!accessToken) {
				toast.error("Access token is missing.");
				return;
			}

			const payload: CreateUnieInfraTokenPayload = { ...data };

			const result = await CreateUnieInfraToken(accessToken, payload);

			if (result === CreateUnieInfraTokenSuccess) {
				form.reset();
				setNeverExpires(true);
				setUnlimitedQuota(false);
				setOpen(false);
			}
		} catch (error) {
			toast.error("Failed to create UnieInfra token", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger className="" asChild>
				{accessToken !== null && (
					<Button className="cursor-pointer space-x-3">
						<PlusIcon className="h-4 w-4" />
						Add UnieInfra Token
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Add UnieInfra Token</DialogTitle>
					<DialogDescription>
						Configure your UnieInfra token settings
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
										<Input placeholder="My UnieInfra Token" {...field} />
									</FormControl>
									<FormDescription>
										A name to identify this token
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="expired_time"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										<div className="flex flex-row justify-between gap-2">
											<span>Expiry Time</span>
											<div className="flex items-center gap-1">
												<Switch
													checked={neverExpires}
													onCheckedChange={(checked) => setExpires(checked)}
												/>
												Never Expires
											</div>
										</div>
									</FormLabel>
									<FormControl>
										{neverExpires ? (
											<></>
										) : (
											<Input
												type="datetime-local"
												value={
													field.value > 0
														? toDatetimeLocalString(new Date(field.value * 1000))
														: ""
												}
												onChange={(e) => {
													const timestamp = Math.floor(new Date(e.target.value).getTime() / 1000);
													field.onChange(timestamp);
												}}
												disabled={neverExpires}
											/>

										)}
									</FormControl>
									<FormDescription>
										The expires for your UnieInfra token
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="remain_quota"
							render={({ field }) => (
								<FormItem>
									<FormLabel><div className="flex flex-row justify-between gap-2">
										<span>Quota</span>
										<div className="flex items-center gap-1">
											<Switch
												checked={unlimitedQuota}
												onCheckedChange={(checked) => setQuotaLimit(checked)}
											/>
											Unlimited Quota
										</div>
									</div>
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={0}
											value={field.value}
											onChange={(e) => field.onChange(Number(e.target.value))}
											disabled={unlimitedQuota}
										/>
									</FormControl>
									<FormDescription>
										The limit quota of your UnieInfra token
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="group"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Group</FormLabel>
									<FormControl>
										<Select
											value={field.value}
											onValueChange={field.onChange}
										>
											<FormControl>
												<SelectTrigger className="w-[240px]">
													<SelectValue placeholder="Follow user groups" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{groups.map((group: any) => (
													<SelectItem
														key={group.id}
														value={group.symbol}
													>
														{`${group.name} (倍率：${group.ratio})`}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									<FormDescription>
										The group of this token
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end  gap-2 pt-4">
							<Button type="submit">
								Create
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog >
	);
};
