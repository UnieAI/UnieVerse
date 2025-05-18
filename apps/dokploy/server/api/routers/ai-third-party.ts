// D:\UnieAI\Projects\UnieVerse\apps\dokploy\server\api\routers\ai-third-party.ts

import {
	apiCreateAiThirdParty,
	apiUpdateAiThirdParty,
} from "@dokploy/server/db/schema/ai-third-party";
import {
	createAiThirdParty,
	deleteAiThirdParty,
	getAiThirdPartyById,
	getAiThirdPartyByOrganizationId,
	updateAiThirdParty,
} from "@dokploy/server/services/ai-third-party";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const aiThirdPartyRouter = createTRPCRouter({
	getAll: adminProcedure.query(async ({ ctx }) => {
		return await getAiThirdPartyByOrganizationId(
			ctx.session.activeOrganizationId,
		);
	}),

	get: protectedProcedure
		.input(z.object({ apiId: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const data = await getAiThirdPartyById(input.apiId);
			if (data.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You don't have access to this third-party AI configuration",
				});
			}
			return data;
		}),

	create: adminProcedure
		.input(apiCreateAiThirdParty)
		.mutation(async ({ ctx, input }) => {
			return await createAiThirdParty(ctx.session.activeOrganizationId, input);
		}),

	update: protectedProcedure
		.input(apiUpdateAiThirdParty)
		.mutation(async ({ ctx, input }) => {
			return await updateAiThirdParty(ctx.session.activeOrganizationId, input);
		}),

	delete: protectedProcedure
		.input(z.object({ apiId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const data = await getAiThirdPartyById(input.apiId);
			if (data.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You don't have permission to delete this resource",
				});
			}
			return await deleteAiThirdParty(input.apiId);
		}),
});
