# Settings and install — 18 September 2026

Local implementation record. Fourth slice of the second batch. One small
migration, `20260918160000_settings.sql`: a `prefs` column on the desk row,
and the column grant that lets a person write it.

## Settings

An eighth app, deliberately small. An operating system's settings are where
its ambitions go to sprawl; this one has six sections:

- **Wallpaper.** Lamp, the desk as it shipped; Ember; Sea; Plain, which is
  the token background with no canvas at all. The choice is the colour of
  the lamp in the shader, and the CSS glow underneath follows it so the two
  agree when the canvas is not painting.
- **Accent.** Periwinkle, Amber, Mint, Rose. Tokens only: the rest of the
  stylesheet never learns which was chosen.
- **The desk.** One button that puts every window back where it started. It
  forgets the layout rather than rewriting it — an empty layout is what a
  person who never touched the desk has — and then arrives again.
- **On your Mac.** Install. Chrome offers to install a page through an event
  and no other way, so the button appears only where pressing it can do
  something; elsewhere the instructions do. A page already running in its
  own window says so instead of offering what the person has.
- **Language.** Plain links: a language is a different address for the same
  desk, and the address bar should say so.
- **Account.** Who is signed in, and Sign out.

A choice is applied the moment it is pressed — Settings tells the shell over
a window event, the route everything on the desk uses to reach it — and the
shell remembers it a moment later, the way it remembers where a window came
to rest. Nothing waits for a server to say yes: a wallpaper is not a
decision. What is stored is one of a few words, rebuilt from an allowlist
(`sanitizePrefs`), so a colour typed by hand never reaches the column.

## Installable

`public/maydaos.webmanifest`, linked from the OS layout and not from the
site's, so nothing public points at the desk; the file itself is fetchable,
like robots.txt, and says no more than the sign-in redirect already does.
Icons drawn as SVG — the co-founder's two rings on the desk's ground with
its lamp in the corner — and rasterised with sharp at 192, 512 and a
maskable 512. Standalone display, the desk's own theme colour, and the
Apple web-app tags for the phone.

## Proof

Three unit tests for the sanitiser, one integration test that a person can
write their preferences and still cannot write when they last looked. 268
tests, lint, tsc and build clean. In the browser: Ember and Amber applied
under the hand and were still there after a reload; the reset put the one
default window back at 44% and 53% of the surface; the manifest served as
`application/manifest+json` and the icon at 200.

## Not done

- No preference for motion beyond the system's own setting.
- The reset does not touch preferences, on purpose; there is no "reset
  everything".
- Install on iOS is instructions only; Safari has no install event.
