// UnieInfra Domain component for web-server page, based on web-domain.tsx
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { GlobeIcon } from "lucide-react";
import { useTranslation } from "next-i18next";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const addUnieInfraDomain = z.object({
    enabled: z.boolean(),
    domain: z.string().min(1, "Domain is required"),
    serviceUrl: z.string().min(1, "Service URL is required"),
    https: z.boolean().optional(),
    certificateType: z.enum(["letsencrypt", "none", "custom"]).optional(),
});

type AddUnieInfraDomain = z.infer<typeof addUnieInfraDomain>;

export const UwsDomain = () => {
    const { t } = useTranslation("settings");
    const { data, isLoading } = api.settings.getUnieInfraTraefikConfig.useQuery();
    const { mutateAsync, isLoading: isMutating } = api.settings.updateUnieInfraTraefikConfig.useMutation();

    console.log("UwsDomain:",data);

    const form = useForm<AddUnieInfraDomain>({
        defaultValues: {
            enabled: true,
            domain: "",
            serviceUrl: "",
            https: false,
            certificateType: "none",
        },
        resolver: zodResolver(addUnieInfraDomain),
    });
    const enabled = form.watch("enabled");
    const https = form.watch("https");

    useEffect(() => {
        if (data) {
            form.reset({
                enabled: data.enabled,
                domain: data.domain,
                serviceUrl: data.serviceUrl,
                https: data.https,
                certificateType: data.certificateType,
            });
        }
    }, [data]);

    const onSubmit = async (formData: AddUnieInfraDomain) => {
        try {
            await mutateAsync({
                enabled: formData.enabled,
                domain: formData.domain,
                serviceUrl: formData.serviceUrl,
                https: formData.https,
                certificateType: formData.certificateType,
            });
            toast.success(t("settings.unieinfra.domain.success", "UnieInfra Traefik config updated"));
        } catch {
            toast.error(t("settings.unieinfra.domain.error", "Error updating UnieInfra Traefik config"));
        }
    };

    return (
        <div className="w-full">
            <Card className="h-full bg-sidebar p-2.5 rounded-xl max-w-5xl mx-auto">
                <div className="rounded-xl bg-background shadow-md ">
                    <CardHeader className="flex flex-row gap-2 flex-wrap justify-between items-center">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="text-xl flex flex-row gap-2">
                                <GlobeIcon className="size-6 text-muted-foreground self-center" />
                                UnieInfra Domain
                            </CardTitle>
                            <CardDescription>
                                Configure the domain for your UnieInfra web service. This will update Traefik so your UnieInfra service is accessible via the specified domain.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 py-6 border-t">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="grid w-full gap-4 md:grid-cols-2"
                            >
                                <FormField
                                    control={form.control}
                                    name="enabled"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2 flex flex-row items-center justify-between p-3 border rounded-lg shadow-sm">
                                            <FormLabel>
                                                {t("settings.unieinfra.domain.form.enabled", "Enable UnieInfra Domain")}
                                            </FormLabel>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="domain"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("settings.unieinfra.domain.form.domain", "UnieInfra Domain")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="w-full"
                                                    placeholder={t("settings.unieinfra.domain.form.domainPlaceholder", "unieinfra.example.com")}
                                                    {...field}
                                                    disabled={!enabled}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="serviceUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("settings.unieinfra.domain.form.serviceUrl", "Service URL")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="w-full"
                                                    placeholder={t("settings.unieinfra.domain.form.serviceUrlPlaceholder", "http://localhost:8080")}
                                                    {...field}
                                                    disabled={!enabled}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="https"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between p-3 mt-4 border rounded-lg shadow-sm w-full col-span-2">
                                            <div className="space-y-0.5">
                                                <FormLabel>{t("settings.unieinfra.domain.form.https", "HTTPS")}</FormLabel>
                                                <FormDescription>
                                                    {t("settings.unieinfra.domain.form.httpsDescription", "Automatically provision SSL Certificate.")}
                                                </FormDescription>
                                                <FormMessage />
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!enabled} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                {https && (
                                    <FormField
                                        control={form.control}
                                        name="certificateType"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>{t("settings.unieinfra.domain.form.certificate.label", "Certificate Type")}</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={!enabled}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t("settings.unieinfra.domain.form.certificate.placeholder", "Select certificate type")} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value={"none"}>{t("settings.unieinfra.domain.form.certificateOptions.none", "None")}</SelectItem>
                                                        <SelectItem value={"letsencrypt"}>{t("settings.unieinfra.domain.form.certificateOptions.letsencrypt", "LetsEncrypt")}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                <div className="flex w-full justify-end col-span-2">
                                    <Button type="submit" isLoading={isLoading || isMutating}>
                                        {t("settings.common.save", "Save")}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
};
