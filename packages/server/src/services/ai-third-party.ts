// D:\UnieAI\Projects\UnieVerse\packages\server\src\services\ai-third-party.ts

import { db } from "@dokploy/server/db";
import { aiThirdParty } from "@dokploy/server/db/schema/ai-third-party";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const getAiThirdPartyByOrganizationId = async (organizationId: string) => {
	return await db.query.aiThirdParty.findMany({
		where: eq(aiThirdParty.organizationId, organizationId),
		orderBy: desc(aiThirdParty.createdAt),
	});
};

export const getAiThirdPartyById = async (apiId: string) => {
	const data = await db.query.aiThirdParty.findFirst({
		where: eq(aiThirdParty.apiId, apiId),
	});
	if (!data) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "AI Third Party configuration not found",
		});
	}
	return data;
};

export const createAiThirdParty = async (
	organizationId: string,
	data: Omit<typeof aiThirdParty.$inferInsert, "organizationId" | "apiId">,
) => {
	return await db.insert(aiThirdParty).values({
		...data,
		organizationId,
	});
};

export const updateAiThirdParty = async (
	organizationId: string,
	data: Partial<typeof aiThirdParty.$inferInsert> & { apiId: string },
) => {
	const { apiId, ...updateFields } = data;

	// Ensure resource exists and belongs to org
	const existing = await getAiThirdPartyById(apiId);
	if (existing.organizationId !== organizationId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Access denied to update this AI configuration",
		});
	}

	return await db
		.update(aiThirdParty)
		.set(updateFields)
		.where(eq(aiThirdParty.apiId, apiId));
};

export const deleteAiThirdParty = async (apiId: string) => {
	return await db.delete(aiThirdParty).where(eq(aiThirdParty.apiId, apiId));
};
