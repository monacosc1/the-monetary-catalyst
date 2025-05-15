# Database Management Guide for The Monetary Catalyst

This document outlines the database security configurations applied to the Supabase production instance for The Monetary Catalyst project. It includes Row Level Security (RLS) policies and function security settings to address vulnerabilities identified by the Supabase Security Advisor.

## Overview
- **Database**: Supabase (PostgreSQL)
- **Schema**: `public`
- **Tables**:
  - Strapi-generated: `articles`, `admin_users`, `strapi_migrations`, etc. (38 tables)
  - Custom: `user_profiles`, `subscriptions`, `payments`, `newsletter_users`
- **Issues Addressed**:
  - 38 "RLS Disabled in Public" errors
  - 7 "Function Search Path Mutable" warnings

## Security Configurations

### 1. Enable RLS on Strapi Tables
RLS was enabled on all Strapi-generated tables to prevent unauthorized access.

**SQL Query**:
```sql
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('user_profiles', 'subscriptions', 'payments', 'newsletter_users')
    )
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(table_name) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

## Affected Tables
admin_permissions, admin_permissions_role_lnk, admin_roles, admin_users, admin_users_roles_lnk, articles, files, files_folder_lnk, files_related_mph, i18n_locale, strapi_api_token_permissions, strapi_api_token_permissions_token_lnk, strapi_api_tokens, strapi_audit_logs, strapi_audit_logs_user_lnk, strapi_core_store_settings, strapi_database_schema, strapi_history_versions, strapi_migrations, strapi_migrations_internal, strapi_release_actions, strapi_release_actions_release_lnk, strapi_releases, strapi_transfer_token_permissions, strapi_transfer_token_permissions_token_lnk, strapi_transfer_tokens, strapi_webhooks, strapi_workflows, strapi_workflows_stages, strapi_workflows_stages_permissions_lnk, strapi_workflows_stages_workflow_lnk, up_permissions, up_permissions_role_lnk, up_roles, up_users, up_users_role_lnk, upload_folders, upload_folders_parent_lnk

### 2. RLS Policies for the articles Table
Policies were added to the articles table to control access based on user authentication and subscription status.
SQL Queries:

```sql
-- Policy for public access to sample articles
CREATE POLICY "Allow public read access to sample articles" ON public.articles
FOR SELECT
TO public
USING (is_sample = TRUE);

-- Policy for authenticated users with active subscriptions
CREATE POLICY "Allow subscribed users to read articles" ON public.articles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.subscriptions
        WHERE subscriptions.user_id = auth.uid()
        AND subscriptions.status = 'active'
    )
);

-- Enable RLS on subscriptions table (referenced by the policy)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
```

Access Rules:
Public users can read articles where is_sample = TRUE.

Authenticated users with an active subscription (status = 'active' in the subscriptions table) can read all articles.

### 3. RLS Policies for Other Strapi Tables
Policies were added to deny public access to all Strapi tables except articles, as these tables are used internally by Strapi.
SQL Queries:

```sql
CREATE POLICY "Deny public access to admin_permissions" ON public.admin_permissions FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to admin_permissions_role_lnk" ON public.admin_permissions_role_lnk FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to admin_roles" ON public.admin_roles FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to admin_users" ON public.admin_users FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to admin_users_roles_lnk" ON public.admin_users_roles_lnk FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to files" ON public.files FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to files_folder_lnk" ON public.files_folder_lnk FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to files_related_mph" ON public.files_related_mph FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to i18n_locale" ON public.i18n_locale FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_api_token_permissions" ON public.strapi_api_token_permissions FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_api_token_permissions_token_lnk" ON public.strapi_api_token_permissions_token_lnk FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_api_tokens" ON public.strapi_api_tokens FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_audit_logs" ON public.strapi_audit_logs FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_audit_logs_user_lnk" ON public.strapi_audit_logs_user_lnk FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_core_store_settings" ON public.strapi_core_store_settings FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_database_schema" ON public.strapi_database_schema FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_history_versions" ON public.strapi_history_versions FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_migrations" ON public.strapi_migrations FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_migrations_internal" ON public.strapi_migrations_internal FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_release_actions" ON public.strapi_release_actions FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_release_actions_release_lnk" ON public.strapi_release_actions_release_lnk FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_releases" ON public.strapi_releases FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_transfer_token_permissions" ON public.strapi_transfer_token_permissions FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_transfer_token_permissions_token_lnk" ON public.strapi_transfer_token_permissions_token_lnk FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_transfer_tokens" ON public.strapi_transfer_tokens FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_webhooks" ON public.strapi_webhooks FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_workflows" ON public.strapi_workflows FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_workflows_stages" ON public.strapi_workflows_stages FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_workflows_stages_permissions_lnk" ON public.strapi_workflows_stages_permissions_lnk FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to strapi_workflows_stages_workflow_lnk" ON public.strapi_workflows_stages_workflow_lnk FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to up_permissions" ON public.up_permissions FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to up_permissions_role_lnk" ON public.up_permissions_role_lnk FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to up_roles" ON public.up_roles FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to up_users" ON public.up_users FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to up_users_role_lnk" ON public.up_users_role_lnk FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to upload_folders" ON public.upload_folders FOR ALL TO public USING (false);
CREATE POLICY "Deny public access to upload_folders_parent_lnk" ON public.upload_folders_parent_lnk FOR ALL TO public USING (false);
```

### 4. Fix function search path mutable warnings
The following functions had mutable search paths, which were fixed by setting a fixed search_path.
SQL Query:

```sql
ALTER FUNCTION public.handle_new_user SET search_path = 'pg_catalog, public';
ALTER FUNCTION public.update_last_payment_id SET search_path = 'pg_catalog, public';
ALTER FUNCTION public.link_newsletter_subscriber_on_registration SET search_path = 'pg_catalog, public';
ALTER FUNCTION public.update_user_profile_newsletter_status SET search_path = 'pg_catalog, public';
ALTER FUNCTION public.create_subscription_and_payment SET search_path = 'pg_catalog, public';
```
Affected Functions:
handle_new_user

update_last_payment_id

link_newsletter_subscriber_on_registration

update_user_profile_newsletter_status

create_subscription_and_payment

### 5. Enable RLS on Custom Tables
RLS was enabled on custom tables to enforce existing policies and enhance security.
SQL Query:

```sql
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_users ENABLE ROW LEVEL SECURITY;
```
Affected Tables:
user_profiles

newsletter_users

### 6. Strapi Permissions
Public Role: Currently allows find and findOne for the article plugin. This is safe due to RLS policies on the articles table, so no changes were made.

Authenticated Role: No permissions defined, which is acceptable as RLS handles access control.

Function Behavior:
Register a new user to trigger handle_new_user and link_newsletter_subscriber_on_registration.

Make a payment to trigger update_last_payment_id and create_subscription_and_payment.

Update a newsletter subscription to trigger update_user_profile_newsletter_status.

Expected: All functions should work as before.

