# Task Tracking - Fleet Management Dashboard

- `[x]` Fix responsive layout bugs on mobile devices
  - `[x]` Prevent content from being compressed (squished) when sidebar is open by using responsive margin (`lg:ml-[280px]`)
  - `[x]` Add dark backdrop overlay on mobile when sidebar is open and close it when clicked
  - `[x]` Hide username and details in header on mobile to conserve screen space
  - `[x]` Make stat cards padding, font sizes, and icon sizes responsive
  - `[x]` Add w-full and overflow-hidden to ExpiryChart container to prevent horizontal scroll breaking page
  - `[x]` Constrain flex layout and block wrapper width using `min-w-0` and `overflow-x-hidden` on main wrapper to completely prevent page stretching (horizontal scroll of the entire viewport) on mobile.
  - `[x]` Test and compile project successfully with Next.js Turbopack build
- `[x]` Optimize desktop layout density
  - `[x]` Limit content container width to `max-w-7xl mx-auto` on large monitors to prevent elements from stretching too far apart.
  - `[x]` Tighter column percentage distributions in `PolicyTable.tsx` (giving more space to Status and mono-spaced columns, tightening document type and action columns).
  - `[x]` Reduced padding in table headers and body cells from `px-5 py-4` to `px-4 py-3` to make layout look clean and compact.
- `[ ]` Support custom document additions (Add Document Form)
- `[ ]` Implement real backend API / localstorage integration for persistence
- `[ ]` Add more chart visualizations (e.g. status breakdown pie chart)
