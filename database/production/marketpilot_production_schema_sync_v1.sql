-- ONE-TIME PRODUCTION SCHEMA SYNCHRONIZATION
-- MarketPilot production schema sync v1
--
-- NOT a Laravel historical migration.
-- Do not place this file in database/migrations/.
-- Do not run this through php artisan migrate.
--
-- Purpose:
-- Production has a partially synchronized PostgreSQL schema and no public.migrations
-- table. This artifact applies only the reviewed drift corrections required by the
-- current deployed application. It does not replay historical Laravel migrations.
--
-- Safety:
-- - Run only after reviewing database/production/README.md.
-- - Run with psql ON_ERROR_STOP enabled.
-- - Run from a controlled maintenance process with a recoverable backup.
-- - No passwords, tokens, emails, names, or row data are emitted by this script.
-- - The script intentionally does not change RLS, privileges, OAuth, or environment data.

\set ON_ERROR_STOP on
\echo 'MarketPilot production schema sync v1: PREPARE/EXECUTE ONLY AFTER HUMAN APPROVAL'

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '10min';

-- RLS PREFLIGHT: assert the reviewed users-table security state without mutating it.
DO $$
DECLARE
    users_rls boolean;
    users_force_rls boolean;
    expected_policy_count integer;
BEGIN
    SELECT relrowsecurity, relforcerowsecurity
    INTO users_rls, users_force_rls
    FROM pg_class
    WHERE oid = 'public.users'::regclass;

    IF users_rls IS DISTINCT FROM true OR users_force_rls IS DISTINCT FROM false THEN
        RAISE EXCEPTION 'Unexpected RLS state for public.users';
    END IF;

    SELECT COUNT(*)
    INTO expected_policy_count
    FROM pg_policy AS pol
    WHERE pol.polrelid = 'public.users'::regclass
      AND pol.polname = 'marketpilot_app_full_access'
    AND pol.polpermissive = true
      AND pol.polcmd = '*'
      AND pg_get_expr(pol.polqual, pol.polrelid) = 'true'
      AND pg_get_expr(pol.polwithcheck, pol.polrelid) = 'true'
      AND pol.polroles @> ARRAY[
          (SELECT oid FROM pg_roles WHERE rolname = 'marketpilot_app'),
          (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
      ]::oid[];

    IF expected_policy_count <> 1 THEN
        RAISE EXCEPTION 'Expected marketpilot_app_full_access policy state is missing or materially different';
    END IF;
END
$$;

-- PREflight: fail on an unexpected database shape instead of replaying history.
DO $$
DECLARE
    expected RECORD;
    actual_udt text;
    actual_nullable text;
    username_exists boolean;
BEGIN
    IF to_regclass('public.users') IS NULL THEN
        RAISE EXCEPTION 'Expected table public.users does not exist';
    END IF;

    IF to_regclass('public.businesses') IS NULL THEN
        RAISE EXCEPTION 'Expected table public.businesses does not exist';
    END IF;

    IF to_regclass('public.migrations') IS NOT NULL THEN
        RAISE EXCEPTION 'public.migrations exists; stop and use a separately approved migration-ledger plan';
    END IF;

    FOR expected IN
        SELECT * FROM (VALUES
            ('users', 'name', 'varchar'),
            ('users', 'email', 'varchar'),
            ('users', 'password', 'varchar'),
            ('businesses', 'name', 'varchar'),
            ('businesses', 'industry', 'varchar'),
            ('businesses', 'category', 'varchar')
        ) AS required(table_name, column_name, udt_name)
    LOOP
        SELECT c.udt_name, c.is_nullable
        INTO actual_udt, actual_nullable
        FROM information_schema.columns AS c
        WHERE c.table_schema = 'public'
          AND c.table_name = expected.table_name
          AND c.column_name = expected.column_name;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Required existing column public.%.% is missing', expected.table_name, expected.column_name;
        END IF;

        IF actual_udt <> expected.udt_name THEN
            RAISE EXCEPTION 'Unexpected type for public.%.%: expected %, found %', expected.table_name, expected.column_name, expected.udt_name, actual_udt;
        END IF;
    END LOOP;

    FOR expected IN
        SELECT * FROM (VALUES
            ('users', 'first_name', 'varchar'),
            ('users', 'middle_name', 'varchar'),
            ('users', 'last_name', 'varchar'),
            ('users', 'suffix', 'varchar'),
            ('users', 'mobile_number', 'varchar'),
            ('users', 'username', 'varchar'),
            ('businesses', 'main_business_activity', 'varchar'),
            ('businesses', 'business_address', 'varchar'),
            ('businesses', 'barangay', 'varchar'),
            ('businesses', 'city_municipality', 'varchar'),
            ('businesses', 'province', 'varchar'),
            ('businesses', 'region', 'varchar'),
            ('businesses', 'business_contact_number', 'varchar'),
            ('businesses', 'business_email', 'varchar'),
            ('businesses', 'website_social_page', 'varchar'),
            ('businesses', 'registration_type', 'varchar'),
            ('businesses', 'registration_number', 'varchar'),
            ('businesses', 'business_permit_number', 'varchar'),
            ('businesses', 'registration_permit_date', 'date'),
            ('businesses', 'business_registration_document_path', 'varchar')
        ) AS target(table_name, column_name, udt_name)
    LOOP
        SELECT c.udt_name, c.is_nullable
        INTO actual_udt, actual_nullable
        FROM information_schema.columns AS c
        WHERE c.table_schema = 'public'
          AND c.table_name = expected.table_name
          AND c.column_name = expected.column_name;

        IF FOUND AND (actual_udt <> expected.udt_name OR actual_nullable <> 'YES') THEN
            RAISE EXCEPTION 'Existing target column public.%.% has an unexpected type or nullability', expected.table_name, expected.column_name;
        END IF;
    END LOOP;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'username'
    ) INTO username_exists;

    IF username_exists THEN
        SELECT c.udt_name, c.is_nullable
        INTO actual_udt, actual_nullable
        FROM information_schema.columns AS c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'users'
          AND c.column_name = 'username';

        IF actual_udt <> 'varchar' OR actual_nullable <> 'YES' THEN
            RAISE EXCEPTION 'Existing public.users.username has an unexpected type or nullability';
        END IF;
    END IF;
END
$$;

CREATE TEMP TABLE _marketpilot_sync_audit (
    metric text PRIMARY KEY,
    value bigint NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE _marketpilot_generated_usernames (
    username varchar(255) PRIMARY KEY
) ON COMMIT DROP;

-- Record the number of business column definitions that are missing before adding them.
INSERT INTO _marketpilot_sync_audit (metric, value)
SELECT 'business_column_definitions_missing_before_sync', COUNT(*)
FROM (
    VALUES
        ('main_business_activity'),
        ('business_address'),
        ('barangay'),
        ('city_municipality'),
        ('province'),
        ('region'),
        ('business_contact_number'),
        ('business_email'),
        ('website_social_page'),
        ('registration_type'),
        ('registration_number'),
        ('business_permit_number'),
        ('registration_permit_date'),
        ('business_registration_document_path')
) AS expected(column_name)
LEFT JOIN information_schema.columns AS actual
    ON actual.table_schema = 'public'
   AND actual.table_name = 'businesses'
   AND actual.column_name = expected.column_name
WHERE actual.column_name IS NULL;

-- SCHEMA CHANGES: add only the confirmed missing nullable columns.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS first_name varchar(255),
    ADD COLUMN IF NOT EXISTS middle_name varchar(255),
    ADD COLUMN IF NOT EXISTS last_name varchar(255),
    ADD COLUMN IF NOT EXISTS suffix varchar(255),
    ADD COLUMN IF NOT EXISTS mobile_number varchar(255),
    ADD COLUMN IF NOT EXISTS username varchar(255);

ALTER TABLE public.businesses
    ADD COLUMN IF NOT EXISTS main_business_activity varchar(255),
    ADD COLUMN IF NOT EXISTS business_address varchar(255),
    ADD COLUMN IF NOT EXISTS barangay varchar(255),
    ADD COLUMN IF NOT EXISTS city_municipality varchar(255),
    ADD COLUMN IF NOT EXISTS province varchar(255),
    ADD COLUMN IF NOT EXISTS region varchar(255),
    ADD COLUMN IF NOT EXISTS business_contact_number varchar(255),
    ADD COLUMN IF NOT EXISTS business_email varchar(255),
    ADD COLUMN IF NOT EXISTS website_social_page varchar(255),
    ADD COLUMN IF NOT EXISTS registration_type varchar(255),
    ADD COLUMN IF NOT EXISTS registration_number varchar(255),
    ADD COLUMN IF NOT EXISTS business_permit_number varchar(255),
    ADD COLUMN IF NOT EXISTS registration_permit_date date,
    ADD COLUMN IF NOT EXISTS business_registration_document_path varchar(255);

SELECT value AS business_column_definitions_added
FROM _marketpilot_sync_audit
WHERE metric = 'business_column_definitions_missing_before_sync';

-- USERNAME PREFLIGHT: reject existing invalid or duplicate values before uniqueness.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.users
        WHERE username IS NOT NULL
          AND username <> ''
          AND username !~ '^[A-Za-z0-9._-]+$'
    ) THEN
        RAISE EXCEPTION 'Existing non-empty usernames contain unsupported characters; aborting';
    END IF;

    IF EXISTS (
        SELECT username
        FROM public.users
        WHERE username IS NOT NULL AND btrim(username) <> ''
        GROUP BY lower(username)
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Existing usernames collide case-insensitively; aborting';
    END IF;
END
$$;

INSERT INTO _marketpilot_sync_audit (metric, value)
SELECT 'users_needing_username', COUNT(*)
FROM public.users
WHERE username IS NULL OR btrim(username) = '';

SELECT value AS users_needing_username
FROM _marketpilot_sync_audit
WHERE metric = 'users_needing_username';

-- USERNAME BACKFILL:
-- Process users by id. Never overwrite a non-empty username. The base is capped at
-- 240 characters so a collision suffix remains within varchar(255).
DO $$
DECLARE
    user_row RECORD;
    base_username varchar(255);
    candidate_username varchar(255);
    suffix integer;
    generated_count bigint := 0;
BEGIN
    FOR user_row IN
        SELECT id, email, name
        FROM public.users
        WHERE username IS NULL OR btrim(username) = ''
        ORDER BY id
        FOR UPDATE
    LOOP
        base_username := lower(
            regexp_replace(
                coalesce(
                    nullif(split_part(coalesce(user_row.email, ''), '@', 1), ''),
                    nullif(user_row.name, ''),
                    'user'
                ),
                '[^A-Za-z0-9._-]+',
                '',
                'g'
            )
        );

        IF base_username IS NULL OR base_username = '' THEN
            base_username := 'user';
        END IF;

        base_username := left(base_username, 240);
        candidate_username := base_username;
        suffix := 1;

        WHILE EXISTS (
            SELECT 1
            FROM public.users
                        WHERE username IS NOT NULL
                            AND btrim(username) <> ''
                            AND lower(username) = candidate_username
        ) OR EXISTS (
            SELECT 1
            FROM _marketpilot_generated_usernames
            WHERE username = candidate_username
        )
        LOOP
            candidate_username := left(base_username, 240 - length(suffix::text) - 1)
                || '_' || suffix::text;
            suffix := suffix + 1;
        END LOOP;

        INSERT INTO _marketpilot_generated_usernames (username)
        VALUES (candidate_username);

        UPDATE public.users
        SET username = candidate_username
        WHERE id = user_row.id
                    AND (username IS NULL OR btrim(username) = '');

        generated_count := generated_count + 1;
    END LOOP;

    INSERT INTO _marketpilot_sync_audit (metric, value)
    VALUES ('usernames_generated', generated_count);
END
$$;

SELECT value AS usernames_generated
FROM _marketpilot_sync_audit
WHERE metric = 'usernames_generated';

-- Backfill verification before adding uniqueness.
DO $$
BEGIN
    IF EXISTS (
        SELECT username
        FROM public.users
        WHERE username IS NULL OR btrim(username) = ''
    ) THEN
        RAISE EXCEPTION 'Blank or NULL usernames remain after backfill; aborting';
    END IF;

    IF EXISTS (
        SELECT lower(username)
        FROM public.users
        GROUP BY lower(username)
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Case-insensitive duplicate usernames remain after backfill; aborting';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.users
        WHERE username !~ '^[A-Za-z0-9._-]+$'
    ) THEN
        RAISE EXCEPTION 'Invalid usernames remain after backfill; aborting';
    END IF;
END
$$;

-- CONSTRAINT/INDEX CHANGES.
-- Do not blindly use IF NOT EXISTS for constraints. Inspect exact catalog state first.
DO $$
DECLARE
    username_attnum smallint;
    provider_attnum smallint;
    provider_id_attnum smallint;
    has_username_unique_constraint boolean;
    has_username_unique_index boolean;
    has_provider_index boolean;
    expected_index_name text := 'users_provider_name_provider_id_index';
BEGIN
    SELECT attnum INTO username_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.users'::regclass
      AND attname = 'username'
      AND NOT attisdropped;

    SELECT attnum INTO provider_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.users'::regclass
      AND attname = 'provider_name'
      AND NOT attisdropped;

    SELECT attnum INTO provider_id_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.users'::regclass
      AND attname = 'provider_id'
      AND NOT attisdropped;

    SELECT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.users'::regclass
          AND contype = 'u'
          AND conkey = ARRAY[username_attnum]::smallint[]
    ) INTO has_username_unique_constraint;

    SELECT EXISTS (
        SELECT 1
        FROM pg_index
        WHERE indrelid = 'public.users'::regclass
          AND indisunique
          AND indisvalid
          AND indpred IS NULL
          AND indexprs IS NULL
          AND indnkeyatts = 1
          AND indkey = ARRAY[username_attnum]::int2vector
    ) INTO has_username_unique_index;

    IF NOT has_username_unique_constraint AND NOT has_username_unique_index THEN
        IF to_regclass('public.users_username_unique_index') IS NOT NULL THEN
            RAISE EXCEPTION 'Index name users_username_unique_index already exists but is not an equivalent unique username index';
        END IF;

        EXECUTE 'CREATE UNIQUE INDEX users_username_unique_index ON public.users (username)';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM pg_index
        WHERE indrelid = 'public.users'::regclass
          AND indisvalid
          AND indpred IS NULL
          AND indexprs IS NULL
          AND indnkeyatts = 2
          AND indkey = ARRAY[provider_attnum, provider_id_attnum]::int2vector
    ) INTO has_provider_index;

    IF NOT has_provider_index THEN
        IF to_regclass(format('public.%I', expected_index_name)) IS NOT NULL THEN
            RAISE EXCEPTION 'Index name % already exists but is not the expected provider index', expected_index_name;
        END IF;

        EXECUTE 'CREATE INDEX users_provider_name_provider_id_index ON public.users (provider_name, provider_id)';
    END IF;
END
$$;

-- Known type/default drift is intentionally reported, not corrected here.
\echo 'Known deferred drift intentionally unchanged: businesses.content_style, campaigns.target_audience, events.country default'

-- POSTFLIGHT VERIFICATION: aggregate results only; no personal data is emitted.
SELECT COUNT(*) AS users_with_blank_username
FROM public.users
WHERE username IS NULL OR btrim(username) = '';

SELECT COUNT(*) AS duplicate_username_groups
FROM (
    SELECT username
    FROM public.users
    GROUP BY username
    HAVING COUNT(*) > 1
) AS duplicate_groups;

SELECT COUNT(*) AS required_users_columns_missing
FROM (
    VALUES
        ('first_name'),
        ('middle_name'),
        ('last_name'),
        ('suffix'),
        ('mobile_number'),
        ('username')
) AS required(column_name)
LEFT JOIN information_schema.columns actual
    ON actual.table_schema = 'public'
   AND actual.table_name = 'users'
   AND actual.column_name = required.column_name
WHERE actual.column_name IS NULL;

SELECT COUNT(*) AS required_business_columns_missing
FROM (
    VALUES
        ('main_business_activity'),
        ('business_address'),
        ('barangay'),
        ('city_municipality'),
        ('province'),
        ('region'),
        ('business_contact_number'),
        ('business_email'),
        ('website_social_page'),
        ('registration_type'),
        ('registration_number'),
        ('business_permit_number'),
        ('registration_permit_date'),
        ('business_registration_document_path')
) AS required(column_name)
LEFT JOIN information_schema.columns actual
    ON actual.table_schema = 'public'
   AND actual.table_name = 'businesses'
   AND actual.column_name = required.column_name
WHERE actual.column_name IS NULL;

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY indexname;

SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE oid = 'public.users'::regclass;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users';

DO $$
DECLARE
    users_rls boolean;
    users_force_rls boolean;
    expected_policy_count integer;
BEGIN
    SELECT relrowsecurity, relforcerowsecurity
    INTO users_rls, users_force_rls
    FROM pg_class
    WHERE oid = 'public.users'::regclass;

    IF users_rls IS DISTINCT FROM true OR users_force_rls IS DISTINCT FROM false THEN
        RAISE EXCEPTION 'Unexpected postflight RLS state for public.users';
    END IF;

    SELECT COUNT(*)
    INTO expected_policy_count
    FROM pg_policy AS pol
    WHERE pol.polrelid = 'public.users'::regclass
      AND pol.polname = 'marketpilot_app_full_access'
      AND pol.polpermissive = true
      AND pol.polcmd = '*'
      AND pg_get_expr(pol.polqual, pol.polrelid) = 'true'
      AND pg_get_expr(pol.polwithcheck, pol.polrelid) = 'true'
      AND pol.polroles @> ARRAY[
          (SELECT oid FROM pg_roles WHERE rolname = 'marketpilot_app'),
          (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
      ]::oid[];

    IF expected_policy_count <> 1 THEN
        RAISE EXCEPTION 'Expected postflight marketpilot_app_full_access policy state is missing or materially different';
    END IF;
END
$$;

COMMIT;

\echo 'MarketPilot production schema sync v1 completed. Review all postflight results before enabling normal traffic.'
