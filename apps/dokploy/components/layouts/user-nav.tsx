import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { Languages } from "@/lib/languages";
import { api } from "@/utils/api";
import useLocale from "@/utils/hooks/use-locale";
import { useMemo, useState, useEffect } from "react";
import { ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/router";
import { ModeToggle } from "../ui/modeToggle";
import { SidebarMenuButton } from "../ui/sidebar";
import { UnieInfraConnectionHintPoint } from "@/components/unieai/unieinfra/UnieInfraConnectionHintPoint";

import { ACCESS_TOKEN_KEY } from "@/utils/unieai/unieinfra/key";

import { useUnieInfra } from "@/utils/unieai/unieinfra/provider/UnieInfraProvider";

const _AUTO_CHECK_UPDATES_INTERVAL_MINUTES = 7;

export const UserNav = () => {
	const router = useRouter();
	const { data } = api.user.get.useQuery();
	const { data: isCloud } = api.settings.isCloud.useQuery();

	const { locale, setLocale } = useLocale();
	const { accessToken, LinkUnieInfra, isConnecting } = useUnieInfra();
	// const { mutateAsync } = api.auth.logout.useMutation();

	const fetchUnieInfra = async () => {
		if (accessToken !== null) return;
		await LinkUnieInfra(data?.user!);
	};

	useEffect(() => {
		fetchUnieInfra();
	}, []);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton
					size="lg"
					className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
				>
					<Avatar className="h-8 w-8 rounded-lg">
						<AvatarImage
							src={data?.user?.image || ""}
							alt={data?.user?.image || ""}
						/>
						<AvatarFallback className="rounded-lg">CN</AvatarFallback>
					</Avatar>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-semibold">Account</span>
						<span className="truncate text-xs">{data?.user?.email}</span>
					</div>
					<ChevronsUpDown className="ml-auto size-4" />
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
				side="bottom"
				align="end"
				sideOffset={4}
			>
				<div className="flex items-center justify-between px-2 py-1.5">
					<DropdownMenuLabel className="flex flex-col">
						My Account
						<span className="text-xs font-normal text-muted-foreground">
							{data?.user?.email}
						</span>
					</DropdownMenuLabel>
					<ModeToggle />
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						className="cursor-pointer flex flex-row justify-between"
						onClick={() => fetchUnieInfra()}
						disabled={isConnecting}
					>
						UnieInfra
						<div className="flex flex-col items-start ml-2">
							<UnieInfraConnectionHintPoint showState={true} />
						</div>
					</DropdownMenuItem>
					<div className="h-px my-1 bg-zinc-100  dark:bg-zinc-900" />
					<DropdownMenuItem
						className="cursor-pointer"
						onClick={() => {
							router.push("/dashboard/settings/profile");
						}}
					>
						Profile
					</DropdownMenuItem>
					<DropdownMenuItem
						className="cursor-pointer"
						onClick={() => {
							router.push("/dashboard/projects");
						}}
					>
						Projects
					</DropdownMenuItem>
					{!isCloud ? (
						<>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => {
									router.push("/dashboard/monitoring");
								}}
							>
								Monitoring
							</DropdownMenuItem>
							{(data?.role === "owner" || data?.canAccessToTraefikFiles) && (
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={() => {
										router.push("/dashboard/traefik");
									}}
								>
									Traefik
								</DropdownMenuItem>
							)}
							{(data?.role === "owner" || data?.canAccessToDocker) && (
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={() => {
										router.push("/dashboard/docker", undefined, {
											shallow: true,
										});
									}}
								>
									Docker
								</DropdownMenuItem>
							)}
						</>
					) : (
						<>
							{data?.role === "owner" && (
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={() => {
										router.push("/dashboard/settings/servers");
									}}
								>
									Servers
								</DropdownMenuItem>
							)}
						</>
					)}
				</DropdownMenuGroup>
				{isCloud && data?.role === "owner" && (
					<DropdownMenuItem
						className="cursor-pointer"
						onClick={() => {
							router.push("/dashboard/settings/billing");
						}}
					>
						Billing
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<div className="flex items-center justify-between px-2 py-1.5">
					<DropdownMenuItem
						className="cursor-pointer"
						onClick={async () => {
							await authClient.signOut().then(() => {
								localStorage.removeItem(ACCESS_TOKEN_KEY);
								router.push("/");
							});
							// await mutateAsync().then(() => {
							// 	router.push("/");
							// });
						}}
					>
						Log out
					</DropdownMenuItem>
					<div className="w-32">
						<Select
							onValueChange={setLocale}
							defaultValue={locale}
							value={locale}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select Language" />
							</SelectTrigger>
							<SelectContent>
								{Object.values(Languages).map((language) => (
									<SelectItem key={language.code} value={language.code}>
										{language.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
