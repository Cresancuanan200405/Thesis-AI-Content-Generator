-- Disposable PostgreSQL Test Fixture for marketpilot_production_schema_sync_v2.sql
-- Runs in a disposable PostgreSQL environment (e.g. CI / test runner).
-- Uses ONLY synthetic test data. NEVER uses production credentials.

\set ON_ERROR_STOP on

\echo '--- STEP A: Asserting initial test state ---'
DO $$
BEGIN
    IF to_regclass('public.users') IS NULL THEN
        RAISE EXCEPTION 'Setup assertion failed: public.users must exist in test harness';
    END IF;
    IF to_regclass('public.businesses') IS NULL THEN
        RAISE EXCEPTION 'Setup assertion failed: public.businesses must exist in test harness';
    END IF;
    IF to_regclass('public.legal_acceptances') IS NOT NULL THEN
        RAISE EXCEPTION 'Setup assertion failed: public.legal_acceptances should not exist prior to sync';
    END IF;
    IF to_regclass('public.pending_onboardings') IS NOT NULL THEN
        RAISE EXCEPTION 'Setup assertion failed: public.pending_onboardings should not exist prior to sync';
    END IF;
END $$;

\echo '--- STEP B: Applying marketpilot_production_schema_sync_v2.sql (First Run) ---'
\i database/production/marketpilot_production_schema_sync_v2.sql

\echo '--- STEP C: Verifying Post-Sync Schema Objects ---'
DO $$
DECLARE
    legal_cols integer;
    pending_cols integer;
    deprecated_cols integer;
    legal_rls boolean;
    pending_rls boolean;
    legal_policy_count integer;
    pending_policy_count integer;
BEGIN
    -- 1. Verify legal_acceptances exists with exact 7 columns
    SELECT count(*) INTO legal_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'legal_acceptances';

    IF legal_cols <> 7 THEN
        RAISE EXCEPTION 'Assertion failed: legal_acceptances should have 7 columns, found %', legal_cols;
    END IF;

    -- 2. Verify pending_onboardings exists with exact 36 columns
    SELECT count(*) INTO pending_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pending_onboardings';

    IF pending_cols <> 36 THEN
        RAISE EXCEPTION 'Assertion failed: pending_onboardings should have 36 columns, found %', pending_cols;
    END IF;

    -- 3. Verify deprecated contact columns are absent from pending_onboardings
    SELECT count(*) INTO deprecated_cols
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pending_onboardings'
      AND column_name IN ('business_contact_number', 'business_email', 'website_social_page');

    IF deprecated_cols > 0 THEN
        RAISE EXCEPTION 'Assertion failed: deprecated contact columns must be absent from pending_onboardings';
    END IF;

    -- 4. Verify primary keys
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE contype = 'p' AND conrelid = 'public.legal_acceptances'::regclass
    ) THEN
        RAISE EXCEPTION 'Assertion failed: legal_acceptances missing primary key';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE contype = 'p' AND conrelid = 'public.pending_onboardings'::regclass
    ) THEN
        RAISE EXCEPTION 'Assertion failed: pending_onboardings missing primary key';
    END IF;

    -- 5. Verify unique constraints
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'legal_acceptances_user_doc_ver_unique'
          AND conrelid = 'public.legal_acceptances'::regclass
    ) THEN
        RAISE EXCEPTION 'Assertion failed: legal_acceptances_user_doc_ver_unique constraint missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pending_onboardings_token_unique'
          AND conrelid = 'public.pending_onboardings'::regclass
    ) THEN
        RAISE EXCEPTION 'Assertion failed: pending_onboardings_token_unique constraint missing';
    END IF;

    -- 6. Verify Foreign Key with ON DELETE CASCADE
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.referential_constraints rc
        JOIN information_schema.table_constraints tc ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'legal_acceptances'
          AND rc.delete_rule = 'CASCADE'
    ) THEN
        RAISE EXCEPTION 'Assertion failed: legal_acceptances FK to users with CASCADE missing';
    END IF;

    -- 7. Verify indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'legal_acceptances'
          AND indexname = 'legal_acceptances_user_id_document_type_index'
    ) THEN
        RAISE EXCEPTION 'Assertion failed: legal_acceptances_user_id_document_type_index missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'pending_onboardings'
          AND indexname = 'pending_onboardings_email_index'
    ) THEN
        RAISE EXCEPTION 'Assertion failed: pending_onboardings_email_index missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'pending_onboardings'
          AND indexname = 'pending_onboardings_username_index'
    ) THEN
        RAISE EXCEPTION 'Assertion failed: pending_onboardings_username_index missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'pending_onboardings'
          AND indexname = 'pending_onboardings_provider_id_index'
    ) THEN
        RAISE EXCEPTION 'Assertion failed: pending_onboardings_provider_id_index missing';
    END IF;

    -- 8. Verify RLS enabled on both tables
    SELECT relrowsecurity INTO legal_rls FROM pg_class WHERE oid = 'public.legal_acceptances'::regclass;
    SELECT relrowsecurity INTO pending_rls FROM pg_class WHERE oid = 'public.pending_onboardings'::regclass;

    IF legal_rls IS DISTINCT FROM true OR pending_rls IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Assertion failed: RLS must be enabled on both legal_acceptances and pending_onboardings';
    END IF;

    -- 9. Verify policies exist and do NOT allow anonymous/public access
    SELECT count(*) INTO legal_policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'legal_acceptances'
      AND policyname = 'marketpilot_app_full_access';

    SELECT count(*) INTO pending_policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pending_onboardings'
      AND policyname = 'marketpilot_app_full_access';

    IF legal_policy_count <> 1 OR pending_policy_count <> 1 THEN
        RAISE EXCEPTION 'Assertion failed: application RLS policies missing or incorrect';
    END IF;

    -- Assert no public/anon role access policy exists
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('legal_acceptances', 'pending_onboardings')
          AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
    ) THEN
        RAISE EXCEPTION 'Assertion failed: anonymous/public role policy detected';
    END IF;
END $$;

\echo '--- STEP D: Testing Foreign Key and CASCADE Deletion ---'
DO $$
DECLARE
    test_user_id bigint;
    acceptance_id bigint;
    remaining_count integer;
BEGIN
    -- Create synthetic user
    INSERT INTO public.users (name, email, password, username, created_at, updated_at)
    VALUES ('Synthetic Cascade User', 'cascade_test@example.invalid', 'hash123', 'cascade_user', now(), now())
    RETURNING id INTO test_user_id;

    -- Create synthetic legal acceptance referencing synthetic user
    INSERT INTO public.legal_acceptances (user_id, document_type, document_version, accepted_at, created_at, updated_at)
    VALUES (test_user_id, 'terms_of_service', 'v1.0', now(), now(), now())
    RETURNING id INTO acceptance_id;

    -- Verify acceptance row exists
    IF NOT EXISTS (SELECT 1 FROM public.legal_acceptances WHERE id = acceptance_id) THEN
        RAISE EXCEPTION 'Cascade test setup failed: legal acceptance row not found';
    END IF;

    -- Delete synthetic user
    DELETE FROM public.users WHERE id = test_user_id;

    -- Assert legal acceptance row was automatically deleted by CASCADE
    SELECT count(*) INTO remaining_count
    FROM public.legal_acceptances
    WHERE id = acceptance_id;

    IF remaining_count <> 0 THEN
        RAISE EXCEPTION 'Assertion failed: ON DELETE CASCADE did not remove legal acceptance record';
    END IF;
END $$;

\echo '--- STEP E: Testing Pending Onboarding Synthetic Data Insertion ---'
DO $$
DECLARE
    pending_row_id bigint;
    dup_error boolean := false;
BEGIN
    -- Insert synthetic pending onboarding record
    INSERT INTO public.pending_onboardings (
        token, registration_type, email, username, password_hash,
        provider_name, provider_id, avatar,
        email_verification_code, email_verification_expires_at, email_verified_at,
        first_name, middle_name, last_name, suffix, mobile_number,
        business_name, industry, category, business_description,
        business_address, barangay, city_municipality, province, region,
        registration_type_field, registration_number, business_permit_number,
        registration_permit_date, business_registration_document_path,
        accepted_legal_documents, current_step, expires_at, created_at, updated_at
    ) VALUES (
        'synth_tok_abc_123', 'normal', 'synth_pending@example.invalid', 'synth_pending_user', 'argon2_fake_hash',
        'google', 'google_id_999', 'https://example.invalid/avatar.png',
        '654321', now() + interval '15 minutes', now(),
        'Juan', 'Protacio', 'Rizal', 'Jr.', '+639171234567',
        'La Liga Filipina', 'Publishing & Media', 'Digital Printing', 'Artisanal printing press and cultural publications.',
        'Calle Ilaya', 'Tondo', 'Manila', 'Metro Manila', 'NCR',
        'DTI', 'DTI-12345678', 'BP-87654321',
        '2026-01-15', 'private/business_documents/synthetic_doc.pdf',
        '["terms_of_service", "privacy_notice", "content_ip_responsibility", "ai_content_responsibility"]'::jsonb,
        3, now() + interval '24 hours', now(), now()
    ) RETURNING id INTO pending_row_id;

    IF pending_row_id IS NULL THEN
        RAISE EXCEPTION 'Synthetic pending insertion failed';
    END IF;

    -- Assert token uniqueness
    BEGIN
        INSERT INTO public.pending_onboardings (token, email)
        VALUES ('synth_tok_abc_123', 'duplicate@example.invalid');
    EXCEPTION WHEN unique_violation THEN
        dup_error := true;
    END;

    IF NOT dup_error THEN
        RAISE EXCEPTION 'Assertion failed: duplicate pending onboarding token was allowed';
    END IF;

    -- Clean up synthetic test row
    DELETE FROM public.pending_onboardings WHERE id = pending_row_id;
END $$;

\echo '--- STEP F: Testing Idempotency (Second Execution of v2) ---'
\i database/production/marketpilot_production_schema_sync_v2.sql

\echo '--- STEP G: Post-Idempotency Assertions ---'
DO $$
DECLARE
    legal_cols integer;
    pending_cols integer;
BEGIN
    SELECT count(*) INTO legal_cols FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_acceptances';
    SELECT count(*) INTO pending_cols FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pending_onboardings';

    IF legal_cols <> 7 THEN
        RAISE EXCEPTION 'Idempotency failure: legal_acceptances columns altered during second run';
    END IF;

    IF pending_cols <> 36 THEN
        RAISE EXCEPTION 'Idempotency failure: pending_onboardings columns altered during second run';
    END IF;
END $$;

\echo '--- ALL DISPOSABLE POSTGRESQL V2 ASSERTIONS PASSED SUCCESSFULLY ---'
