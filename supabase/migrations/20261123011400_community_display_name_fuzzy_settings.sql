alter table public.community_member_profiles
  add column if not exists display_name_fuzzy_settings jsonb
  not null default '{
    "preset":"static",
    "color":"#FFFFFF",
    "colorSplit":0,
    "trigger":"hover",
    "direction":"horizontal",
    "baseIntensity":0.2,
    "hoverIntensity":0.5,
    "fuzzRange":30,
    "sliceSize":1,
    "fps":60,
    "transitionDuration":0,
    "intro":true,
    "introDuration":1400,
    "enableHover":true,
    "clickEffect":false,
    "glitchMode":false,
    "glitchInterval":2000,
    "glitchDuration":200,
    "letterSpacing":0
  }'::jsonb;

comment on column public.community_member_profiles.display_name_fuzzy_settings
  is 'Owner-controlled React Bits FuzzyText display-name rendering settings.';
