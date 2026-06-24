CREATE TABLE IF NOT EXISTS "calendar_notes" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"note_date" date NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
