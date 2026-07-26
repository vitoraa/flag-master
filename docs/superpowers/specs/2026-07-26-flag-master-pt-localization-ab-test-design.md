# Flag Master: Portuguese Localization A/B Test

## Problem

Portugal (114 games) and Brazil (26 games) are Flag Master's largest non-English
markets this month, but the game's UI and country names are English-only. We
don't know whether localizing to Portuguese would reduce drop-off or increase
engagement for these players, so we're testing it rather than assuming.

## Goal

Measure whether a Portuguese-localized UI changes `game_over` completion rate
(and secondarily, games-per-player and `share_clicked` rate) for
Portuguese-browser visitors, using a PostHog feature flag experiment.

## Non-goals

- No manual language toggle in this first run (may be added later).
- No localization of the cross-promo card to Capital Master.
- No localization of settings/footer text or any string that isn't part of
  the core play loop.
- No changes to Capital Master or any other game.

## Targeting

- On page load, check `navigator.language.startsWith('pt')`.
- Only for visitors matching that check, call
  `posthog.getFeatureFlag('flag-master-pt-localization')`.
- PostHog runs a 50/50 split within this group only. Non-Portuguese-browser
  visitors never enter the experiment and are unaffected.
- If the flag resolves to the test variant, call `applyLocale('pt')` before
  the first question renders.
- If the flag hasn't resolved yet (feature flags load asynchronously) or
  resolves to control, the game renders in English as it does today — no
  render blocking, no loading state for this.

## What gets translated

- **Country display names**: a `COUNTRY_NAMES_PT` map keyed by the existing
  country code (`us`, `br`, `fr`, ...) already used in the `COUNTRIES` array.
  Gameplay matching compares `dataset.code === answer[0]` (codes, not
  display names — see `index.html:1051`), so swapping display text is purely
  cosmetic and cannot affect scoring or correctness logic.
- **Key UI strings** (~20), all part of the core play loop:
  - `LEVELS` labels ("Warming up", "Getting tricky", "Flag nerd zone", "Very hard")
  - Correct/incorrect feedback text
  - Game-over screen title and result messages
  - Share button text
  - Leaderboard prompt/button labels visible during a normal play session
- Missing translation key falls back to the English string (never renders
  blank/undefined).

## Measurement

- No manual event-property changes needed. `posthog-js` auto-tags every
  captured event with `$feature/flag-master-pt-localization` once flags are
  loaded (via `posthog.onFeatureFlags`), so existing `game_started`,
  `game_over`, and `share_clicked` events become filterable by variant
  automatically.
- **Primary metric**: `game_over` / `game_started` completion rate, by variant.
- **Secondary metrics**: games-per-player, `share_clicked` rate, by variant.
- Analysis is intent-to-treat (standard for A/B tests): once a person is
  assigned a variant, their events count toward that variant regardless of
  any later behavior. No toggle exists yet to complicate this in v1.

## Error handling

- `posthog.getFeatureFlag` unresolved or errors → fall back to English
  (matches current behavior, no regression risk).
- Any translation lookup miss → fall back to the English string.

## Testing

- Manual browser check with `navigator.language` spoofed to `pt-PT` and
  `pt-BR`:
  - Confirm control variant renders unchanged English UI.
  - Confirm test variant renders Portuguese country names and UI strings
    with no console errors.
  - Confirm gameplay (answer matching, scoring, streaks) is unaffected in
    both variants.
- Confirm non-Portuguese browser languages never trigger a flag evaluation
  (no `$feature/flag-master-pt-localization` property on their events).

## Rollout expectation

At ~114 games/month from Portugal (Brazil not targeted by browser-language
alone reliably, since many Brazilian browsers may report `pt-BR` and would
be included, but volume from Brazil is smaller), a 50/50 split yields
roughly 50-70 games/month per arm. Reaching a statistically significant read
on a moderate completion-rate lift will likely take 4-8 weeks. This is
noted so results aren't called early.
