CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"primary_muscle_group" text NOT NULL,
	"secondary_muscle_groups" text[] DEFAULT '{}'::text[] NOT NULL,
	"movement_pattern" text NOT NULL,
	"required_equipment" text NOT NULL,
	"contraindicated_injuries" text[] DEFAULT '{}'::text[] NOT NULL,
	"instructions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "exercises_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "gym_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"environment_type" text DEFAULT 'commercial' NOT NULL,
	"max_dumbbell_weight_kg" double precision,
	"has_barbell" boolean DEFAULT false NOT NULL,
	"has_squat_rack" boolean DEFAULT false NOT NULL,
	"has_bench" boolean DEFAULT true NOT NULL,
	"has_cable_stack" boolean DEFAULT false NOT NULL,
	"has_smith_machine" boolean DEFAULT false NOT NULL,
	"has_pullup_bar" boolean DEFAULT false NOT NULL,
	"has_adjustable_bench" boolean DEFAULT false NOT NULL,
	"has_dumbbells" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "routine_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"prescribed_sets" integer DEFAULT 3 NOT NULL,
	"rep_range_min" integer DEFAULT 8 NOT NULL,
	"rep_range_max" integer DEFAULT 10 NOT NULL,
	"target_weight_kg" double precision,
	"target_rpe" double precision,
	"rest_seconds" integer DEFAULT 90,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_constraints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"joint_area" text NOT NULL,
	"restriction_type" text DEFAULT 'pain' NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workout_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"gym_profile_id" uuid,
	"name" text NOT NULL,
	"split_type" text NOT NULL,
	"duration_weeks" integer DEFAULT 4 NOT NULL,
	"current_week" integer DEFAULT 1 NOT NULL,
	"training_days_per_week" integer DEFAULT 4 NOT NULL,
	"target_session_duration_minutes" integer DEFAULT 45 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workout_routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"name" text NOT NULL,
	"day_number" integer NOT NULL,
	"week_number" integer,
	"target_rpe" double precision,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"routine_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"perceived_rpe" double precision,
	"joint_soreness" integer,
	"hit_prescribed_targets" boolean DEFAULT false,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workout_set_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"routine_exercise_id" uuid,
	"set_number" integer NOT NULL,
	"target_weight_kg" double precision,
	"target_reps" integer,
	"actual_weight_kg" double precision NOT NULL,
	"actual_reps" integer NOT NULL,
	"rpe" double precision,
	"target_hit" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gym_profiles" ADD CONSTRAINT "gym_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_routine_id_workout_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."workout_routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_constraints" ADD CONSTRAINT "user_constraints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_programs" ADD CONSTRAINT "workout_programs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_programs" ADD CONSTRAINT "workout_programs_gym_profile_id_gym_profiles_id_fk" FOREIGN KEY ("gym_profile_id") REFERENCES "public"."gym_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_routines" ADD CONSTRAINT "workout_routines_program_id_workout_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."workout_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_routine_id_workout_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."workout_routines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_set_logs" ADD CONSTRAINT "workout_set_logs_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_set_logs" ADD CONSTRAINT "workout_set_logs_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_set_logs" ADD CONSTRAINT "workout_set_logs_routine_exercise_id_routine_exercises_id_fk" FOREIGN KEY ("routine_exercise_id") REFERENCES "public"."routine_exercises"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercises_primary_muscle_idx" ON "exercises" USING btree ("primary_muscle_group");--> statement-breakpoint
CREATE INDEX "exercises_movement_pattern_idx" ON "exercises" USING btree ("movement_pattern");--> statement-breakpoint
CREATE INDEX "exercises_required_equipment_idx" ON "exercises" USING btree ("required_equipment");--> statement-breakpoint
CREATE INDEX "gym_profiles_user_id_idx" ON "gym_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "routine_exercises_routine_id_idx" ON "routine_exercises" USING btree ("routine_id");--> statement-breakpoint
CREATE INDEX "routine_exercises_exercise_id_idx" ON "routine_exercises" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "user_constraints_user_id_idx" ON "user_constraints" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workout_programs_user_id_idx" ON "workout_programs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workout_programs_gym_profile_id_idx" ON "workout_programs" USING btree ("gym_profile_id");--> statement-breakpoint
CREATE INDEX "workout_routines_program_id_idx" ON "workout_routines" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "workout_sessions_user_id_idx" ON "workout_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workout_sessions_routine_id_idx" ON "workout_sessions" USING btree ("routine_id");--> statement-breakpoint
CREATE INDEX "workout_sessions_started_at_idx" ON "workout_sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "workout_set_logs_session_id_idx" ON "workout_set_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "workout_set_logs_exercise_id_idx" ON "workout_set_logs" USING btree ("exercise_id");