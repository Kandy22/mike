-- Migration date: 2026-10-06
-- Response style preferences from Settings > Personalisation: verbosity,
-- headers and lists (response_formatting), and tone. Each tunes how assistant
-- answers are written; 'balanced' adds nothing to the prompt.
alter table public.user_profiles
  add column if not exists response_verbosity text not null default 'balanced';
alter table public.user_profiles
  add column if not exists response_formatting text not null default 'balanced';
alter table public.user_profiles
  add column if not exists response_tone text not null default 'balanced';

alter table public.user_profiles
  drop constraint if exists user_profiles_response_verbosity_check;
alter table public.user_profiles
  add constraint user_profiles_response_verbosity_check
  check (response_verbosity in ('concise', 'balanced', 'detailed'));

alter table public.user_profiles
  drop constraint if exists user_profiles_response_formatting_check;
alter table public.user_profiles
  add constraint user_profiles_response_formatting_check
  check (response_formatting in ('balanced', 'less', 'more'));

alter table public.user_profiles
  drop constraint if exists user_profiles_response_tone_check;
alter table public.user_profiles
  add constraint user_profiles_response_tone_check
  check (response_tone in ('formal', 'balanced', 'plain'));
