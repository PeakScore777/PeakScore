alter table public.institution_verification_requests
      add column if not exists representative_email text;

    alter table public.institution_verification_requests
      add constraint institution_verification_requests_representative_email_check
      check (
        representative_email is null
        or (
          char_length(representative_email) between 3 and 254
          and representative_email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'
        )
      );
