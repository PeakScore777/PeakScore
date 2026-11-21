alter table public.institution_verification_requests
          add column if not exists reviewer_message text
          check (reviewer_message is null or char_length(reviewer_message) between 10 and 1000);
