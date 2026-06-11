CREATE TYPE "public"."vehicle_doc_type" AS ENUM('act', 'tax', 'insurance', 'inspection', 'registration_book');--> statement-breakpoint
CREATE TABLE "vehicle_documents" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"chassis" varchar(128) NOT NULL,
	"license_plate" varchar(64),
	"project" text,
	"doc_type" "vehicle_doc_type" NOT NULL,
	"issuer" text,
	"doc_number" varchar(128),
	"issued_date" date,
	"expiry_date" date,
	"note" text,
	"driver_name" text,
	"has_attachment" boolean DEFAULT false NOT NULL,
	"is_acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"acknowledged_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
