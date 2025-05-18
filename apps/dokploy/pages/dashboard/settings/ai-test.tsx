
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { appRouter } from "@/server/api/root";
import { getLocale, serverSideTranslations } from "@/utils/i18n";
import { validateRequest } from "@dokploy/server";
import { createServerSideHelpers } from "@trpc/react-query/server";
import type { GetServerSidePropsContext } from "next";
import type { ReactElement } from "react";
import superjson from "superjson";

import { Button } from "@/components/ui/button";
import { BotMessageSquare } from "lucide-react";

import { AI_PLAYGROUND_SEARCH_PARAMS } from "@/components/dashboard/settings/ai-playground";
import { AI_PLAYGROUND_TAB_VALUE } from "@/utils/unieai/unieinfra/key";

const Page = () => {
    const _model: string = "aqua-mini";
    const _tab: string = AI_PLAYGROUND_TAB_VALUE.TEST_API;
    const _api:string="https://api2.unieai.com/v1"
    const _token: string = "sk-ZpMqU0NAXCmiwYF_krHGFjN5kmmlhc1BBcYuYZO2NKcBh-l1l4NZb6MGusI";
    const url: string = `/dashboard/settings/ai-playground?${AI_PLAYGROUND_SEARCH_PARAMS.model}=${_model}&${AI_PLAYGROUND_SEARCH_PARAMS.tab}=${_tab}&${AI_PLAYGROUND_SEARCH_PARAMS.token}=${_token}&${AI_PLAYGROUND_SEARCH_PARAMS.api}=${_api}`;
    return (
        <div className="relative flex h-[90vh] gap-4 w-full">
            <div className="w-full  flex items-center justify-center">
                <a href={url}>
                    <Button className="">Try it on <span className="text-blue-600 font-bold flex gap-1 items-center"><BotMessageSquare className="size-4" /> AI Playground ~</span></Button>
                </a>
            </div>
        </div>
    )
}

export default Page;

Page.getLayout = (page: ReactElement) => {
    return <DashboardLayout>{page}</DashboardLayout>;
};
export async function getServerSideProps(
    ctx: GetServerSidePropsContext<{ serviceId: string }>,
) {
    const { req, res } = ctx;
    const { user, session } = await validateRequest(req);
    const locale = getLocale(req.cookies);

    const helpers = createServerSideHelpers({
        router: appRouter,
        ctx: {
            req: req as any,
            res: res as any,
            db: null as any,
            session: session as any,
            user: user as any,
        },
        transformer: superjson,
    });

    await helpers.settings.isCloud.prefetch();

    await helpers.user.get.prefetch();

    if (!user || user.role === "member") {
        return {
            redirect: {
                permanent: true,
                destination: "/",
            },
        };
    }
    return {
        props: {
            trpcState: helpers.dehydrate(),
            ...(await serverSideTranslations(locale, ["settings"])),
        },
    };
}
