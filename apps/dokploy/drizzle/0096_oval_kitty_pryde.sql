CREATE TABLE "ai_third_party" (
	"apiId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"apiUrl" text NOT NULL,
	"apiKey" text NOT NULL,
	"status" boolean DEFAULT true NOT NULL,
	"organizationId" text NOT NULL,
	"createdAt" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_third_party" ADD CONSTRAINT "ai_third_party_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;