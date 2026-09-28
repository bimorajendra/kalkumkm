CREATE TABLE "margin_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"recipe_id" text NOT NULL,
	"margin_bp" integer NOT NULL,
	"recorded_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "margin_snapshots" ADD CONSTRAINT "margin_snapshots_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "margin_snapshots_user_idx" ON "margin_snapshots" USING btree ("user_id");