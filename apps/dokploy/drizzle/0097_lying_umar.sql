CREATE TABLE "allocation" (
	"deviceId" text PRIMARY KEY NOT NULL,
	"nodeId" text NOT NULL,
	"usedBy" text,
	"type" text NOT NULL,
	"enabled" boolean NOT NULL,
	"createdAt" text NOT NULL,
	"updatedAt" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "nodeIdx" ON "allocation" USING btree ("nodeId");--> statement-breakpoint
CREATE INDEX "usedByIdx" ON "allocation" USING btree ("usedBy");