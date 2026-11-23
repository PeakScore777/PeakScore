alter table public.community_member_profiles
  alter column display_name_fuzzy_settings
  set default '{
    "preset":"static",
    "color":"#FFFFFF",
    "colorSplit":0,
    "trigger":"hover",
    "direction":"horizontal",
    "baseIntensity":0.08,
    "hoverIntensity":0.24,
    "fuzzRange":12,
    "sliceSize":2,
    "fps":30,
    "transitionDuration":0,
    "intro":false,
    "introDuration":1400,
    "enableHover":true,
    "clickEffect":false,
    "glitchMode":false,
    "glitchInterval":2000,
    "glitchDuration":200,
    "letterSpacing":0
  }'::jsonb;

update public.community_member_profiles
set display_name_fuzzy_settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          coalesce(display_name_fuzzy_settings, '{}'::jsonb),
          '{baseIntensity}', '0.08'::jsonb, true
        ),
        '{hoverIntensity}', '0.24'::jsonb, true
      ),
      '{fuzzRange}', '12'::jsonb, true
    ),
    '{sliceSize}', '2'::jsonb, true
  ),
  '{fps}', '30'::jsonb, true
)
where display_name_animation = 'fuzzy-text';

update public.community_member_profiles
set display_name_fuzzy_settings = jsonb_set(display_name_fuzzy_settings, '{intro}', 'false'::jsonb, true)
where display_name_animation = 'fuzzy-text';
