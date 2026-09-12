-- ============================================================
-- Durham, part 1 of 2: widen the university enum.
--
-- ALTER TYPE ... ADD VALUE cannot be used by statements in the same
-- transaction that adds it, so seeding the colleges has to wait for a
-- second migration. This file does nothing else.
-- ============================================================

alter type public.university_type add value if not exists 'Durham';
