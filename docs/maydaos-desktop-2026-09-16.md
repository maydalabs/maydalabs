# The desktop — 16 September 2026

Local implementation record. Slice one of the OS arc, decided after Mehmet
said what existed was "far from where I wanna be": an operating system like
macOS's, with its own features, and the co-founder inside it.

## Why the shell came before the conversation

I had argued that chrome around one list is a costume. That was true when
there was one list. There are now three things worth opening — the queue, what
is running, and what MaydaOS knows about your company — so a desktop with
three real apps is a reorganisation rather than a skin.

The stronger reason is architectural: **the app contract has to exist before
the co-founder conversation is written.** Built as a page now and moved into a
shell later, the conversation would be retrofitted into a container it was not
designed for. Defining what an app is first means every later app is born in
the right shape.

## The structural change

`app/[lang]` was one tree wearing the marketing site's header and footer.
It is now two:

```
app/[lang]/layout.tsx      html, body, fonts, analytics — and nothing visual
app/[lang]/(site)/         the marketing site and the account pages, with chrome
app/[lang]/(os)/os/        MaydaOS, which owns the viewport
```

Route groups change no URLs — the route table is identical before and after,
and the smoke suite passes unchanged — but they change what a page *is*. A
desktop with a navigation bar above it is a web page with ambitions.

## What the shell does

`components/os/OsShell.tsx`, ~350 lines, no dependency. Windows drag, resize,
stack and focus; a dock opens, raises or puts away depending on what the
window is already doing; the menu bar carries the company, what is waiting,
and a way out, because a desktop you cannot leave is a kiosk.

**Apps are server components.** Each is rendered on the server with its own
data access and handed to the shell as a node. The shell arranges and never
fetches, which is what keeps adding the co-founder conversation from being a
change to the shell at all.

**The layout lives in the database**, not the browser, so a desk follows a
person between machines and into the desktop app later. It is saved on a
trailing delay: dragging emits a state change per frame and none of them are
worth a round trip — where it comes to rest is.

**On a phone it stops pretending.** Below 768px the windows become one app at
a time with the dock as the way between them. A draggable window on a 390px
screen is a toy.

## Three fixes worth keeping

**Copy could not cross the boundary.** `waiting: (count) => string` is a
function, and functions cannot be passed to a client component. The shell's
copy type is now plain strings only, resolved on the server — which is also
why the shell never has to know what locale it is in.

**Windows are clamped in CSS, not by measuring.** The first attempt measured
the surface in an effect and corrected anything hanging off the edge. It
tripped `react-hooks/set-state-in-effect`, and it was the worse answer anyway:
`clamp(8px, Xpx, max(8px, 100% - Wpx - 8px))` keeps a window reachable while
the browser window itself is being resized, not only once on arrival.

**The bar and the dock were 532px inside a 390px phone.** A grid child is as
wide as its content unless told otherwise, and the whole desktop was sliding
sideways. `min-width: 0`, the email hidden, and a dock that scrolls rather
than wraps.

## Proof

Driven in a browser against a production build. A founder signs in and lands
on a desk: two windows open, `Northwind Logistics` and `2 waiting on you` in
the bar. Dragging *Running* moves it; opening *Company* from the dock raises
it above both and shows what MaydaOS actually knows — the name, "We move
freight for small manufacturers in Izmir", one owner. A full reload brings the
desk back exactly as it was left, and the stored row confirms it.

At 390px: zero horizontal overflow, one app, dock across the bottom.

209 tests, lint clean, tsc clean, build clean, smoke passing — including a
rewritten guard. `/os` used to be asserted gone; it now has to turn a
signed-out visitor away and show them no desktop, while every app-shaped path
the retired version had stays 404.

## Not done

- No command bar, no notifications, no files. Slice four.
- Three apps, and none of them is a conversation. That is slice two and it is
  the one that makes this a co-founder rather than a dashboard.
- The account page still carries older MaydaOS panels that now duplicate the
  desk. They should go once the desk is where people actually work.
- Windows cannot be maximised, tiled or snapped, and there is no keyboard way
  between them.
