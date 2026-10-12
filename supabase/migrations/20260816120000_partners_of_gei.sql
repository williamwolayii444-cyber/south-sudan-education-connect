-- Partners of General Education and Instruction
-- Replaces the integrations / API Gateway registry with a partner workspace:
-- partner organisations, shared reports, and threaded replies.
-- Safe to re-run: every object is created only if missing.

-- The legacy public.integrations table is intentionally left in place so no existing
-- records are lost. The app no longer reads it; drop it manually once it is archived.

CREATE TABLE IF NOT EXISTS public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  partner_type TEXT NOT NULL DEFAULT 'Development partner',
  contact_name TEXT,
  contact_email TEXT,
  focus_areas TEXT,
  states_covered TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS partners_read ON public.partners;
CREATE POLICY partners_read ON public.partners
  FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS partners_write ON public.partners;
CREATE POLICY partners_write ON public.partners
  FOR ALL TO authenticated
  USING (public.can_write((SELECT auth.uid())))
  WITH CHECK (public.can_write((SELECT auth.uid())));
DROP TRIGGER IF EXISTS partners_touch ON public.partners;
CREATE TRIGGER partners_touch
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS partners_status_idx ON public.partners (status);
CREATE INDEX IF NOT EXISTS partners_type_idx ON public.partners (partner_type);

CREATE TABLE IF NOT EXISTS public.partner_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'Statistical return',
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  period_label TEXT,
  state TEXT,
  summary TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  published_on DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_reports TO authenticated;
GRANT ALL ON public.partner_reports TO service_role;
ALTER TABLE public.partner_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS partner_reports_read ON public.partner_reports;
CREATE POLICY partner_reports_read ON public.partner_reports
  FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS partner_reports_write ON public.partner_reports;
CREATE POLICY partner_reports_write ON public.partner_reports
  FOR ALL TO authenticated
  USING (public.can_write((SELECT auth.uid())))
  WITH CHECK (public.can_write((SELECT auth.uid())));
DROP TRIGGER IF EXISTS partner_reports_touch ON public.partner_reports;
CREATE TRIGGER partner_reports_touch
  BEFORE UPDATE ON public.partner_reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS partner_reports_partner_id_idx ON public.partner_reports (partner_id);
CREATE INDEX IF NOT EXISTS partner_reports_status_idx ON public.partner_reports (status);
CREATE INDEX IF NOT EXISTS partner_reports_published_on_idx ON public.partner_reports (published_on DESC);

CREATE TABLE IF NOT EXISTS public.partner_report_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.partner_reports(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_side TEXT NOT NULL DEFAULT 'Partner',
  body TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_report_replies TO authenticated;
GRANT ALL ON public.partner_report_replies TO service_role;
ALTER TABLE public.partner_report_replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS partner_replies_read ON public.partner_report_replies;
CREATE POLICY partner_replies_read ON public.partner_report_replies
  FOR SELECT TO authenticated
  USING (true);
-- Ministry officers manage replies; any authenticated user (including partner viewers) may post a reply.
DROP POLICY IF EXISTS partner_replies_insert ON public.partner_report_replies;
CREATE POLICY partner_replies_insert ON public.partner_report_replies
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
DROP POLICY IF EXISTS partner_replies_manage ON public.partner_report_replies;
CREATE POLICY partner_replies_manage ON public.partner_report_replies
  FOR UPDATE TO authenticated
  USING (public.can_write((SELECT auth.uid())))
  WITH CHECK (public.can_write((SELECT auth.uid())));
DROP POLICY IF EXISTS partner_replies_delete ON public.partner_report_replies;
CREATE POLICY partner_replies_delete ON public.partner_report_replies
  FOR DELETE TO authenticated
  USING (
    public.can_write((SELECT auth.uid()))
    OR created_by = (SELECT auth.uid())
  );

CREATE INDEX IF NOT EXISTS partner_report_replies_report_id_idx
  ON public.partner_report_replies (report_id, created_at);

-- When a partner posts a reply, mark the report as Replied (viewers cannot UPDATE reports via RLS).
CREATE OR REPLACE FUNCTION public.mark_partner_report_replied()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.author_side = 'Partner' THEN
    UPDATE public.partner_reports
    SET status = 'Replied', updated_at = now()
    WHERE id = NEW.report_id
      AND status IS DISTINCT FROM 'Closed';
  ELSIF NEW.author_side = 'Ministry' THEN
    UPDATE public.partner_reports
    SET status = 'Awaiting reply', updated_at = now()
    WHERE id = NEW.report_id
      AND status IN ('Shared', 'Draft', 'Replied');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS partner_reply_status ON public.partner_report_replies;
CREATE TRIGGER partner_reply_status
AFTER INSERT ON public.partner_report_replies
FOR EACH ROW EXECUTE FUNCTION public.mark_partner_report_replied();

REVOKE ALL ON FUNCTION public.mark_partner_report_replied() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_partner_report_replied() FROM anon, authenticated;
