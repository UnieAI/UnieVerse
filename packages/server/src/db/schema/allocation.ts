import { boolean, index, pgTable, text } from "drizzle-orm/pg-core";

export const allocations = pgTable("allocation", {
	deviceId: text("deviceId")
		.notNull()
		.primaryKey(),

	nodeId: text("nodeId")
		.notNull(),

	usedBy: text("usedBy"),

	type: text("type")
		.notNull()
		.$default(() => "gpu"),

	enabled: boolean("enabled")
		.notNull()
		.$default(() => true),

	createdAt: text("createdAt")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),

	updatedAt: text("updatedAt")
		.notNull()
		.$defaultFn(() => new Date().toISOString())
		.$onUpdate(() => new Date().toISOString()),
}, (table) => ({
	nodeIdIdx: index("nodeIdx").on(table.nodeId),
	usedByIdx: index("usedByIdx").on(table.usedBy),
}));

export type Allocation = typeof allocations.$inferSelect;
