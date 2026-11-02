-- The rolling automatic budget was raised to 100 cycles per seven hours,
-- but the original table CHECK still capped ai_cycles_used at 10.
-- Align the persisted invariant with the current claim function and UI.

alter table public.orby_knowledge_automation_settings
  drop constraint if exists orby_knowledge_automation_ai_cycles_check;

alter table public.orby_knowledge_automation_settings
  add constraint orby_knowledge_automation_ai_cycles_check
  check (ai_cycles_used >= 0 and ai_cycles_used <= 100);

comment on constraint orby_knowledge_automation_ai_cycles_check
  on public.orby_knowledge_automation_settings
  is 'Automatic worker cycles are limited to 100 per rolling seven-hour window.';
