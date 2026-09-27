# Planner interface refinement

## Build
- Create one shared signed-in header used by Plans, Expenses, and Savings.
- Keep the brand and primary tabs together on the left; place a globe language dropdown and avatar menu on the right.
- Move Requests, How to use, Sign out, and a new password-update dialog into the avatar menu while preserving the automatic request popup.
- Restyle planner statistics with status-specific tints and left accents, larger values, rounded corners, and consistent spacing.
- Show a localized, friendly single-day label such as “Today — Sunday, Sep 27”; retain readable range wording.
- Make planner filters more compact and keep Add plan vertically aligned with the title.
- Replace the empty table row with a centered icon, title, subtitle, and Create First Plan action that opens the existing plan form.
- Add English, Georgian, and Polish labels for all new text.

## Technical details
- Reuse the existing menu, dialog, button, input, navigation, sharing, and help patterns.
- Update passwords through the current authenticated account session and provide validation and success/error feedback.
- Keep all colors in semantic design tokens and retain existing plan behavior, filtering, sharing, and calendar interactions.
- Verify the current build logs and exercise the signed-in planner when a test session is available.
