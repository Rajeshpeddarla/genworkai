ALTER TABLE "knowledge_bases" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "mcp_servers" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "workspace_chats" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "knowledge_bases" ADD CONSTRAINT "knowledge_bases_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_servers" ADD CONSTRAINT "mcp_servers_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_chats" ADD CONSTRAINT "workspace_chats_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;