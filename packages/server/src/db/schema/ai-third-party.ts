import { relations } from "drizzle-orm";
import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import { organization } from "./account";

export const aiThirdParty = pgTable("ai_third_party", {
	apiId: text("apiId")
		.notNull()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text("name").notNull(),
	description: text("description").notNull(),
	apiUrl: text("apiUrl").notNull(),
	apiKey: text("apiKey").notNull(),
	status: boolean("status").notNull().default(true),
	organizationId: text("organizationId")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }), // Admin ID who created the AI settings
	createdAt: text("createdAt")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
});

export const aiThirdPartyRelations = relations(aiThirdParty, ({ one }) => ({
	organization: one(organization, {
		fields: [aiThirdParty.organizationId],
		references: [organization.id],
	}),
}));

const createSchema = createInsertSchema(aiThirdParty, {
	name: z.string().min(1, { message: "Name is required" }),
	description: z.string().min(1, { message: "Description is required" }),
	apiUrl: z.string().url({ message: "Please enter a valid URL" }),
	apiKey: z.string().min(1, { message: "API Key is required" }),
	status: z.boolean().optional(),
});

export const apiCreateAiThirdParty = createSchema
	.pick({
		name: true,
		description: true,
		apiUrl: true,
		apiKey: true,
		status: true,
	})
	.required();

export const apiUpdateAiThirdParty = createSchema
	.partial()
	.extend({
		apiId: z.string().min(1),
	})
	.omit({ organizationId: true });
