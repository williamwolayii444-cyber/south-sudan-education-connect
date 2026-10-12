-- Schema fixes, admin role management and database-level audit trail.
--
-- 1. Columns the UI already captures but the schema was missing.
-- 2. set_user_role(): lets administrators change access rights directly from the
--    browser. Replaces the old /api/admin/* server endpoints, which no longer exist
--    now that the app is a client-side SPA.
-- 3. Self-registered accounts start as 'viewer' (read-only) until an administrator
--    grants 'officer' or 'admin'. The very first account is still made admin.
-- 4. Every create/update/delete on a register table is written to audit_log by a
--    trigger, so the trail cannot be skipped by the client.

-- 1. MISSING COLUMNS -------------------------------------------------------------
ALTER TABLE public.curriculum_items
  ADD COLUMN IF NOT EXISTS copies_printed INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.field_reports
  ADD COLUMN IF NOT EXISTS county TEXT;

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS details JSONB;

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles (user_id);

-- Record the author of each register entry without trusting the client.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'schools', 'teachers', 'students', 'exam_registrations', 'staff_actions',
    'budget_lines', 'documents', 'inspections', 'curriculum_items', 'lessons',
    'field_reports', 'partners', 'partner_reports', 'partner_report_replies'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN created_by SET DEFAULT auth.uid()', t);
  END LOOP;
END;
$$;

-- 2. ROLE MANAGEMENT -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_user_role(_user_id UUID, _role public.app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller UUID := (SELECT auth.uid());
  previous public.app_role[];
BEGIN
  IF caller IS NULL OR NOT public.has_role(caller, 'admin') THEN
    RAISE EXCEPTION 'Only administrators may change access rights' USING ERRCODE = '42501';
  END IF;
  IF caller = _user_id THEN
    RAISE EXCEPTION 'Administrators cannot change their own access level' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN
    RAISE EXCEPTION 'Unknown officer account' USING ERRCODE = 'P0002';
  END IF;

  SELECT array_agg(role) INTO previous FROM public.user_roles WHERE user_id = _user_id;

  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);

  INSERT INTO public.audit_log (actor_id, actor_email, action, entity, entity_id, details)
  VALUES (
    caller,
    (SELECT auth.jwt()) ->> 'email',
    'role_change',
    'user_roles',
    _user_id::TEXT,
    jsonb_build_object('from', to_jsonb(previous), 'to', _role)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, public.app_role) TO authenticated;

-- 3. SAFER DEFAULT ROLE FOR NEW ACCOUNTS ----------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE first_user BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.email);

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO first_user;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN first_user THEN 'admin'::public.app_role ELSE 'viewer'::public.app_role END);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 4. AUDIT TRAIL -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_register_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  rec_id TEXT := CASE WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT ELSE NEW.id::TEXT END;
BEGIN
  INSERT INTO public.audit_log (actor_id, actor_email, action, entity, entity_id)
  VALUES (
    (SELECT auth.uid()),
    (SELECT auth.jwt()) ->> 'email',
    lower(TG_OP),
    TG_TABLE_NAME,
    rec_id
  );
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.log_register_change() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'schools', 'teachers', 'students', 'exam_registrations', 'staff_actions',
    'budget_lines', 'documents', 'inspections', 'curriculum_items', 'lessons',
    'field_reports', 'partners', 'partner_reports'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_audit', t);
    EXECUTE format(
      'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.log_register_change()',
      t || '_audit', t
    );
  END LOOP;
END;
$$;
