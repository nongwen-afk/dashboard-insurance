CREATE TYPE "public"."vehicle_document_history_event" AS ENUM('created', 'acknowledged', 'renewed', 'sync_no_update', 'deleted', 'updated');--> statement-breakpoint
CREATE TABLE "vehicle_document_history" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"document_id" varchar(128),
	"chassis" varchar(128) NOT NULL,
	"license_plate" varchar(64),
	"project" text,
	"doc_type" "vehicle_doc_type" NOT NULL,
	"event_type" "vehicle_document_history_event" NOT NULL,
	"actor" text DEFAULT 'system' NOT NULL,
	"previous_issued_date" date,
	"next_issued_date" date,
	"previous_expiry_date" date,
	"next_expiry_date" date,
	"details" jsonb,
	"event_at" timestamp with time zone DEFAULT now() NOT NULL
);
