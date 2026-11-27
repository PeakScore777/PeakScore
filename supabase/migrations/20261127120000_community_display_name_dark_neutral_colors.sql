-- Add dark, neutral and navy display-name ink choices.
alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_color_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_color_check
  check (display_name_color in (
    'default','pink','coral','salmon','red','crimson','orange','peach','amber','gold',
    'yellow','lime','green','emerald','mint','teal','cyan','ice','sky','blue','indigo',
    'periwinkle','violet','purple','lavender','orchid','plum','magenta','fuchsia',
    'silver','white','gray','brown','black','charcoal','graphite','slate','navy','midnight',
    'cream','custom-gradient'
  ));
