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

import { zodResolver } from "@hookform/resolvers/zod";
import { PenBoxIcon, PlusIcon, Sparkles, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useUnieInfra } from "@/utils/unieai/unieinfra/provider/UnieInfraProvider";

import { toDatetimeLocalString } from "@/utils/time";
import { UnieInfraTokenPayload, Success } from "@/utils/unieai/unieinfra/token/UnieInfraTokenFunctions";

const Schema = z.object({
	expired_time: z.number(),
	group: z.string(),
	is_edit: z.boolean(),
	name: z.string().min(1, { message: "Name is required" }),
	remain_quota: z.number(),
	unlimited_quota: z.boolean(),
});

type Schema = z.infer<typeof Schema>;

interface HandleUnieInfraProps {
	open?: boolean;
	setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
	tokenData?: UnieInfraTokenPayload;
}
export const HandleUnieInfra = ({ open: propOpen, setOpen: propSetOpen, tokenData }: HandleUnieInfraProps) => {
	const {
		accessToken,
		getTokens, postToken, putToken, isLoadingTokens,
		groups, getGroups, isLoadingGroups,
	} = useUnieInfra();

	const [internalOpen, internalSetOpen] = useState<boolean>(false);
	// 優先使用 props 傳入的 open/setOpen，否則使用本地 state
	const open = propOpen !== undefined ? propOpen : internalOpen;
	const setOpen = propSetOpen !== undefined ? propSetOpen : internalSetOpen;
	const [error, setError] = useState<string | null>(null);

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

	const resetForm = () => {
		console.log(tokenData !== undefined);
		console.log(tokenData?.unlimited_quota ?? false);
		if (!tokenData) {
			form.reset();
		} else {
			form.reset({
				expired_time: tokenData?.expired_time ?? -1,
				group: tokenData?.group ?? "",
				is_edit: tokenData ? true : false,
				name: tokenData?.name ?? "",
				remain_quota: tokenData?.remain_quota ?? 0,
				unlimited_quota: tokenData?.unlimited_quota ?? false,
			});
		}

		setNeverExpires(tokenData ? (tokenData?.expired_time === -1) ? true : false : true);
		setUnlimitedQuota(tokenData?.unlimited_quota ?? false);
	}

	useEffect(() => {
		if (open) {
			resetForm();
		}
	}, [tokenData, open]);


	useEffect(() => {
		const fetchUnieInfra = async () => {
			if (accessToken !== null) {
				await getGroups(accessToken);
			}
		};

		fetchUnieInfra();
	}, [accessToken]);

	const onSubmit = async (data: Schema) => {
		try {
			if (!accessToken) {
				toast.error("Access token is missing.");
				return;
			}

			const payload: UnieInfraTokenPayload = { ...(tokenData && { ...tokenData }), ...data };

			const result = tokenData ? await putToken(accessToken, payload) : await postToken(accessToken, payload);

			if (result === Success) {
				// await getTokens(accessToken);
				resetForm();
				setOpen(false);
			}
		} catch (error) {
			toast.error(`Failed to ${tokenData ? "update" : "create"} UnieInfra token`, {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger className="" asChild>
				{tokenData ? (
					<Button
						variant="ghost"
						size="icon"
						className="group hover:bg-blue-500/10"
						disabled={accessToken === null}
					>
						<PenBoxIcon className="size-3.5  text-primary group-hover:text-blue-500" />
					</Button>
				) : (
					<Button
						className="cursor-pointer space-x-3"
						disabled={accessToken === null}
					>
						<PlusIcon className="h-4 w-4" />
						Add UnieInfra Token
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{tokenData ? "Edit UnieInfra Token" : "Add UnieInfra Token"}</DialogTitle>
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
								{tokenData ? "Update" : "Create"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog >
	);
};
