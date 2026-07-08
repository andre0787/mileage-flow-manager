update public.origem_types
set description = case
  when coalesce(nullif(trim(description), ''), '') = '' then '{"hasRecurrence":false}'
  when (description::jsonb ? 'hasRecurrence') then description
  when (description::jsonb ? 'recurrenceInterval') then (description::jsonb || jsonb_build_object('hasRecurrence', true))::text
  else (description::jsonb || jsonb_build_object('hasRecurrence', false))::text
end;
