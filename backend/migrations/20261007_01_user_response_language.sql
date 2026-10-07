-- Migration date: 2026-10-07
-- Response language preference from Settings > Personalisation. 'auto' (the
-- default) adds nothing to the prompt; otherwise the value is a BCP 47 tag
-- such as 'en-GB' or 'zh-Hans'. The application owns the list of offered
-- languages, so the constraint checks the tag's shape rather than its value
-- and a new language needs no migration.
alter table public.user_profiles
  add column if not exists response_language text not null default 'auto';

alter table public.user_profiles
  drop constraint if exists user_profiles_response_language_check;
alter table public.user_profiles
  add constraint user_profiles_response_language_check
  check (
    response_language = 'auto'
    or response_language ~ '^[a-z]{2,3}(-[A-Za-z]{2,4})?$'
  );
