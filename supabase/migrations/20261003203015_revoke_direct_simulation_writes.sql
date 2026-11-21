revoke insert, update, delete
    on table public.simulations
    from authenticated;

    revoke insert, update, delete
    on table public.simulation_questions
    from authenticated;

    revoke insert, update, delete
    on table public.simulation_attempts
    from authenticated;

    revoke insert, update, delete
    on table public.simulation_answers
    from authenticated;
