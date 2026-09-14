# MarketPilot Production Schema Synchronization

## Status

This directory contains a controlled production synchronization artifact. It is not part of Laravel's historical migration chain.

Artifact:

```text
database/production/marketpilot_production_schema_sync_v1.sql
```

The SQL file has been prepared only. It has not been executed against production.

## Why Normal Laravel Migrations Are Not Used Yet

The production Supabase database does not contain `public.migrations`. Laravel therefore has no authoritative record of which historical migrations were applied.

The production schema is partially aligned with the repository, so running:

```bash
php artisan migrate --force
```

would be unsafe. Laravel could attempt to replay historical table creation, column additions, indexes, or other operations against objects that already exist.

The synchronization artifact applies only the reviewed drift corrections required by the current deployed application. It does not claim that historical Laravel migrations were executed.

## What This Synchronization Does

The artifact:

- Verifies required existing tables and columns before changing anything.
- Aborts on unexpected required-column types.
- Aborts if `public.migrations` unexpectedly exists, requiring a separate migration-ledger decision.
- Adds the missing nullable personal-information columns to `users`.
- Adds the missing nullable `username` column to `users`.
- Adds the missing nullable registration/address/contact/document columns to `businesses`.
- Counts users requiring a username.
- Backfills usernames deterministically in `users.id` order.
- Prefers the email local-part, then legacy name, then `user`.
- Lowercases and removes unsupported username characters.
- Resolves collisions with `_1`, `_2`, `_3`, and later suffixes.
- Never overwrites a non-empty username.
- Preserves email, name, password, provider data, and personal-information values.
- Verifies no duplicate or blank usernames remain.
- Adds a username uniqueness index only after successful backfill verification.
- Adds the `(provider_name, provider_id)` lookup index only when an equivalent valid index is absent.
- Reports aggregate postflight results.
- Verifies that users-table RLS state and policies remain present.

## What It Intentionally Does Not Do

The artifact does not:

- Create `public.migrations`.
- Replay historical Laravel migrations.
- Modify existing historical migration files.
- Change `businesses.content_style`.
- Change `campaigns.target_audience`.
- Set the `events.country` default.
- Change RLS or RLS policies.
- Grant or revoke database privileges.
- Change OAuth behavior.
- Change application code.
- Write passwords, tokens, emails, names, provider IDs, or personal data to logs.
- Create tables outside the reviewed synchronization scope.

The three known type/default differences are intentionally deferred because they require separate data-compatibility decisions.

## Prerequisites

Before execution, an authorized database operator must:

1. Confirm the target database is the MarketPilot production Supabase PostgreSQL database.
2. Confirm the connection uses the intended server-side application role.
3. Confirm a recoverable backup or Supabase point-in-time recovery window.
4. Review the SQL file in full.
5. Confirm no concurrent deployment or schema change is running.
6. Confirm the operator can obtain a database lock and perform the reviewed DDL.
7. Run the read-only preflight queries in the SQL comments or the existing schema audit.
8. Review the expected username candidate count and collision conditions.
9. Confirm the maintenance window and rollback owner.

The production connection currently uses separate server-side values named `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD`. Their values must be supplied through an approved operator-controlled secret-injection mechanism or secure interactive password handling.

Credentials must not be:

- committed to the repository;
- printed or echoed in terminal output or logs;
- placed in frontend code or `VITE_*` variables;
- placed in this SQL artifact;
- placed in this README;
- written into a project `.env` file for this operation.

## Proposed Execution Procedure

Do not execute this from the local MySQL Laravel environment.

Use an approved environment with a PostgreSQL client and access to the production connection. The exact operator command should keep all five production values out of command output and use the organization's approved secret provider or secure interactive password prompt.

The following is only a conceptual placeholder pattern. It does not claim that `PRODUCTION_DATABASE_URL` exists and must not be copied with real credentials:

```bash
PGHOST="<secret-injected-DB_HOST>" \
PGPORT="<secret-injected-DB_PORT>" \
PGDATABASE="<secret-injected-DB_DATABASE>" \
PGUSER="<secret-injected-DB_USERNAME>" \
psql --set=ON_ERROR_STOP=1 \
   --file=database/production/marketpilot_production_schema_sync_v1.sql
```

The password must be supplied by the approved secret mechanism or secure interactive prompt supported by the operator's PostgreSQL client. Do not put the password in this command, this repository, a project `.env`, or frontend variables.

The script itself opens a transaction and ends with `COMMIT` only if every preflight, schema change, backfill, constraint/index operation, and verification statement succeeds. With `ON_ERROR_STOP=1`, an error stops execution before the final `COMMIT`; the one-shot client process must close the failed transaction so PostgreSQL rolls it back.

If the operator's execution environment does not guarantee rollback on failure, do not run this artifact until the execution wrapper is changed to explicitly issue `ROLLBACK` on failure.

## Verification Procedure

After a successful run, review the output and require:

```text
users_with_blank_username = 0
 duplicate_username_groups = 0
required_users_columns_missing = 0
required_business_columns_missing = 0
```

Also verify:

- The username uniqueness index exists.
- The `(provider_name, provider_id)` index exists or an equivalent index was already present.
- Users RLS remains enabled.
- `relforcerowsecurity` is unchanged.
- The existing `marketpilot_app_full_access` policy remains unchanged.
- `public.migrations` was not created by this artifact.

Then test, in order:

1. Email/password login.
2. Existing Google-linked account login.
3. New Google account creation.
4. Personal Information completion.
5. Business onboarding.
6. Philippine address persistence.
7. Business profile and document flows.
8. Product, event, campaign, and design operations.

## Rollback and Recovery

Preferred recovery is database restore or point-in-time recovery, not an improvised reverse migration.

Before execution, capture:

- A recoverable backup or confirmed point-in-time recovery position.
- Schema metadata.
- User and business row counts.
- Existing indexes and constraints.
- The aggregate username backfill count.
- A protected operator-only mapping of affected user IDs to generated usernames if the organization's data-handling policy permits it.

If the script fails before commit:

- Stop immediately.
- Close the failed transaction so PostgreSQL rolls it back.
- Preserve the error and aggregate preflight output.
- Do not retry until the cause has been reviewed.

If a committed synchronization later needs recovery:

- Prefer point-in-time recovery or a reviewed database restore.
- Do not casually run the historical username migration's `down()` method; it drops the username column and destroys generated username values.
- Do not drop personal-information or business columns after application traffic uses them.
- Remove only an isolated defective index/constraint after backup and impact review.

## Migration Baseline Follow-up

After synchronization and application verification:

1. Treat the synchronized schema as the actual production baseline.
2. Do not insert fabricated historical rows into `public.migrations` claiming all old migrations ran.
3. Compare a faithful production-schema clone with the repository migration result.
4. Choose one reviewed baseline strategy:
   - create a new baseline representation for future environments;
   - maintain a separate deployment schema ledger with artifact version and checksum;
   - or reconcile a faithful clone and production before introducing a new Laravel migration baseline.
5. Document which repository migrations are represented by the external production schema.
6. Require all future schema changes to use an auditable migration or synchronization artifact.

The long-term target is a truthful baseline followed by normal forward-only Laravel migrations for future changes.

## Human Approval Still Required

Human approval is required for:

- The production backup/recovery point.
- The exact database connection and role.
- Username candidate and collision results.
- The maintenance window.
- The synchronization execution wrapper and rollback behavior.
- Whether `events.country` should receive its default.
- Whether `businesses.content_style` should be converted after data review.
- Whether `campaigns.target_audience` should be narrowed after length review.
- The post-sync migration-baseline strategy.
