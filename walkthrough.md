# Walkthrough: Responsive Design Fixes, Desktop Optimization, and Interactive Stat Cards

We have resolved layout issues on mobile, optimized desktop layout density, and added interactive stat cards with auto-scroll and document filtering.

## Changes Made

### 1. Main Layout & Sidebar Behavior ([layout.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/layout.tsx))
- **Issue**: The sidebar had a fixed layout shift of `ml-[280px]` when open, which compressed the content container to a width of ~95px on a mobile screen.
- **Solution**: Changed the layout shift to responsive `lg:ml-[280px] ml-0`. Now, on mobile, the sidebar slides on top of the content as an overlay without shrinking the page.
- **Backdrop**: Added a dark overlay backdrop (`bg-slate-900/40`) when the sidebar is open on mobile. Clicking anywhere on the backdrop automatically closes the sidebar.
- **Padding**: Changed main content padding from a fixed `p-8` to a responsive `p-4 sm:p-6 lg:p-8` to maximize screen space on mobile.
- **Mobile Page Overflow Fix (Critical)**: Added `min-w-0 w-full max-w-full overflow-x-hidden` to the layout wrappers to prevent page stretching.
- **Desktop Page Constraints**: Added `max-w-7xl mx-auto` to the main container tag to prevent dashboard sections and table columns from stretching excessively on ultrawide monitors.

### 2. Header Improvements ([Header.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/Header.tsx))
- **Issue**: The user's name and panel title took too much horizontal space, squishing header elements on small devices.
- **Solution**:
  - Hid the text "testuser" and "admins" on mobile (`hidden sm:block`) so only the avatar dropdown is visible.
  - Made the header padding responsive (`px-4 sm:px-6`).
  - Adjusted logo and branding text size to fit cleanly on narrow screens.

### 3. Stat Cards & Charts
- **Stat Cards ([StatCard.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/dashboard/StatCard.tsx))**: Adjusted card padding (`p-4 sm:p-6`) and reduced icon scales on mobile to prevent cards from looking too bulky. Added pointer cursor, shadow transitions, and active scale animations for user interaction.
- **Expiry Chart ([ExpiryChart.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/dashboard/ExpiryChart.tsx))**:
  - Added `w-full overflow-hidden` classes to the container card.
  - Added `w-full min-w-0 overflow-hidden` to the direct parent of `ResponsiveContainer` to prevent Recharts from breaking the horizontal page boundaries.
- **Urgent Alerts ([UrgentAlerts.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/dashboard/UrgentAlerts.tsx))**: Made container padding responsive.

### 4. Table Layout Density Optimization ([PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx))
- **Issue**: Columns felt too far apart on wide screens, creating massive blank gaps between table values.
- **Solution**:
  - Redistributed column percentage widths inside the `<colgroup>` to make them tighter and more proportional (Document Type: 10%, Chassis: 14%, License Plate: 12%, Issued Date: 14%, Expiry Date: 14%, Status: 24%, Attachment: 7%, Action: 5%).
  - Reduced cell padding from `px-5 py-4` to `px-4 py-3` for a tighter vertical and horizontal density.
  - Reduced table minimum width to `min-w-[1000px]`.
  - **Pagination Size Reduction**: Changed the table pagination size from `10` to `6` items per page to make the screen layout more compact.
  - **Constant Table Height Fix**: Set table wrapper min-height to `min-h-[465px]`. This matches the actual height of 6 table rows (including status badges), ensuring the container height remains completely constant. This prevents layout shifting and scroll position jumping when users switch between pages with different row counts (e.g. Page 3 which only has 2 rows).

### 5. Interactive Stat Cards (New Feature)
- **Interactive Filtering**: Clicking any of the 4 stat cards now filters the document table by status:
  - **เอกสารทั้งหมด** -> Shows all records.
  - **ใช้งานได้** -> Shows active records and those with no expiry dates.
  - **ใกล้หมดอายุ** -> Shows documents expiring within 30 days.
  - **หมดอายุแล้ว** -> Shows documents that have passed their expiration dates.
- **Auto Smooth Scroll**: When a card is clicked, the page smoothly scrolls down to the table. An offset of `90px` is applied to ensure the table header is not covered by the fixed header bar.
- **Active Filter Badge**: Added a green badge next to the table sorting/filtering controls showing the active status filter. Users can clear this filter by clicking the `X` button on the badge.

---

## Verification & Build Results
We compiled the production build using Next.js Turbopack compiler (`pnpm run build`). The project compiles with zero warnings or errors.

---

## 🚀 Latest Updates & Package Manager Migration (pnpm)

We implemented several important fixes, distributed the mock data, integrated analytics, and successfully migrated the package manager from `npm` to `pnpm`.

### 1. Label Fix: License Plate vs Chassis
- **Issue**: Notification alerts and expiry modals hardcoded "รถทะเบียน" even if the vehicle only had a chassis number and no license plate.
- **Solution**: Replaced hardcoded strings with conditional labels (`document.licensePlate ? 'รถทะเบียน' : 'เลขตัวถัง'`) in:
  - Main Alerts Generator ([page.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/page.tsx))
  - Monthly Expiry Modal ([ExpiryMonthModal.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/dashboard/ExpiryMonthModal.tsx))

### 2. Mock Data Optimization
- **Data Distribution**: Updated [mockData.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/utils/mockData.ts) to distribute active documents unevenly across the 6-month chart window (June: 5, July: 4, August: 3, Sept: 1, Oct: 7, Nov: 2) to look like a realistic fleet operation.
- **Project/Contract Names**: Renamed mock projects from internal company departments (which were misleading) to realistic client leasing contracts (e.g., `รถเวียน จุฬาฯ`, `รถรับส่ง MEA`, `รถเช่า AOT`, `รถเช่าผู้บริหาร`).
- **CSV Generation**: Created a mock database file [mock_vehicles.csv](file:///Users/microwen/Desktop/Project_EVT/mock_vehicles.csv) containing 100 realistic records with UTF-8 BOM encoding for proper Thai character display in Excel.

### 3. Vercel Integration
- **Speed Insights**: Installed `@vercel/speed-insights` and integrated it into the root layout ([layout.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/layout.tsx)) to measure web page load speeds.
- **Analytics**: Resolved out-of-sync `pnpm-lock.yaml` issues on Vercel deployment by running a clean install and committing the updated lockfile.

### 4. 🛠️ How to run commands with pnpm
Since we deleted `package-lock.json` and stuck to `pnpm` to avoid conflicts:
- **Run project locally**: `pnpm dev`
- **Install all dependencies**: `pnpm install` (or `pnpm i`)
- **Add new dependencies**: `pnpm add <package-name>`
- **Add dev dependencies**: `pnpm add -D <package-name>`
- **Run linting**: `pnpm run lint`
- **Build production**: `pnpm run build`

---

## ⚠️ Workflow Rules & Guidelines (กฎระเบียบและแนวทางการทำงาน)
เพื่อความเป็นระเบียบและลดการเกิด Conflict ในการทำงานร่วมกัน:
1. **ต้องเริ่มทำงานและเขียนโค้ดในกิ่ง \`dev\` เสมอ!** ห้ามเขียนโค้ดหรือทำการบันทึก (Commit) ลงบนกิ่งหลัก \`main\` โดยตรง (เมื่อเสร็จสิ้นการเขียนบน \`dev\` แล้วจึงค่อยทำ Pull Request เพื่อ Merge เข้าสู่ \`main\`)
2. **ต้องบันทึกประวัติการทำงานและงานที่ทำเสร็จลงในไฟล์เอกสารทั้งสองไฟล์เสมอเมื่อเสร็จสิ้นงานย่อย:**
   - [task.md](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/task.md) (สำหรับบันทึก/อัปเดต Checklist งานที่ทำ)
   - [walkthrough.md](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/walkthrough.md) (สำหรับอัปเดตอธิบายสิ่งที่ปรับปรุงเพิ่มเติม)
3. **ก่อนเริ่มงานใหม่ทุกครั้ง:** **ต้องเปิดอ่าน** ไฟล์ [task.md](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/task.md) และ [walkthrough.md](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/walkthrough.md) ก่อนเสมอเพื่อรับรู้สถานะโครงการล่าสุดก่อนลงมือทำต่อ

---

## Review Fixes After Antigravity Changes

We reviewed and fixed the issues found after the Antigravity update.

### 1. Preserve User Data During Global Sync
- **Issue**: The table-level `ซิงค์ข้อมูลล่าสุด` button reset the whole document list back to mock data via `setDocuments(initialDocs)`, which could discard imported Excel rows, deleted rows, and acknowledged states.
- **Solution**: Changed the button to preserve the current document list and only clear `isAcknowledged` flags across existing rows.

### 2. Stable Document Identity
- **Issue**: Several actions matched rows using only `chassis + docType`, so duplicate documents for the same vehicle and document type could be acknowledged, synced, or deleted together.
- **Solution**:
  - Added optional `id` to `VehicleDocument`.
  - Added stable IDs for mock data and imported rows.
  - Added shared identity helpers in `documentUtils.ts`.
  - Updated table actions and detail modal callbacks to use the shared identity helper.

### 3. Search Count Consistency
- **Issue**: Search toast counts ignored the status-card filter, so the toast could report records that were hidden by the active status filter.
- **Solution**: Consolidated filtering logic in `PolicyTable.tsx` and reused it for both search toast counts and actual table filtering.

### 4. Cleanup Duplicate Files
- Removed stale duplicate files created outside the main source path:
  - `task 2.md`
  - `walkthrough 2.md`
  - `utils/mockData 2.ts`

### 5. Expand Document Acknowledgement Metadata (Latest Update)
- **Goal**: Make the simulated acknowledgement flow more realistic and credible by expanding the `isAcknowledged` boolean status to capture detailed information (`acknowledgedAt` and `acknowledgedBy`).
- **Solution**:
  - **Type Definition ([types/index.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/types/index.ts))**: Expanded the `VehicleDocument` interface to support optional fields `acknowledgedAt?: string` and `acknowledgedBy?: string`.
  - **Date Helper ([utils/documentUtils.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/utils/documentUtils.ts))**: Added `formatThaiDateTime` to format timestamp strings into Thai date and time strings (e.g. `4 มิ.ย. 2569 เวลา 10:30 น.`).
  - **State Action Handlers ([app/page.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/page.tsx) & [components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx))**: Updated the acknowledge handlers to capture `acknowledgedAt` with the current time in ISO format and `acknowledgedBy` as `'testuser'`, and updated the reset handlers to clean them up (set to `undefined`).
  - **Mock Data Seeding ([utils/mockData.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/utils/mockData.ts))**: Added mock `acknowledgedAt` and `acknowledgedBy` fields to already acknowledged documents (`CHAS-ACK-001` to `CHAS-ACK-003`) for initial load realism.
  - **Modal Details Display ([components/DocumentDetailModal.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/DocumentDetailModal.tsx))**:
    - Updated the status banner description dynamically to display the user and formatted timestamp when a document is in the acknowledged state.
    - Added a sleek slate-colored information card inside the details grid displaying the acknowledgement user and timestamp.
    - **Row Detail Modal Bug Fix**: Fixed an issue where clicking "รับทราบการแจ้งเตือน" inside the `DocumentDetailModal` that was opened directly from a table row (rendered in `PolicyTable.tsx`) did not update the acknowledgement metadata due to outdated handler callbacks. Synchronized the `onAcknowledge` and `onSync` handlers in the duplicate `DocumentDetailModal` component inside `PolicyTable.tsx`.
    - **Randomized DLT Sync Simulation (Idea 3)**: Modified the "ซิงค์ข้อมูลล่าสุด" (Sync Latest) action to simulate a real API integration check. When clicked (globally or per document), it displays a loading toast ("กำลังตรวจสอบข้อมูลกับระบบภายนอก...") for 1.5 seconds, then randomly (50% chance) decides to either:
      1. **ต่ออายุสำเร็จ (Renewal Success)**: Extends the expiry date by exactly 1 year, updates the issued date to the current date, clears the acknowledgement metadata, and changes the document status to green **ใช้งานได้ปกติ** (Active).
      2. **ค้างชำระเงิน/ไม่มีรายการอัปเดต (Pending Check)**: Retains the processing status and alerts the user that no payment or renewal record was found in the external DLT/insurer database.

### 6. Dashboard UI Beautification & Aesthetic Polish (Latest Update)
- **Header Upgrade ([Header.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/Header.tsx))**:
  - Implemented glassmorphic styling with a blurred background (`bg-white/80 backdrop-blur-md`).
  - Redesigned the EVT brand badge into a modern high-contrast green gradient box (`bg-gradient-to-r from-emerald-800 to-[#1a4d2e]`) with a subtle drop shadow.
  - Replaced the simple round chevron-dropdown profile placeholder with a modern circular gradient avatar containing bold `'TU'` (Test User) initials.
- **Sidebar Upgrade ([Sidebar.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/Sidebar.tsx))**:
  - Replaced the uniform dark green font color with a clean modern slate gray typography (`text-slate-700 font-semibold`) for secondary items, so the active page link pops out.
  - Upgraded the hover styling to a light emerald background (`hover:bg-emerald-50/30 hover:text-[#1a4d2e]`).
  - Added a clean green left-border indicator on expanded submenus and upgraded the active page link ("เอกสารยานพาหนะ") to a rich forest green gradient (`bg-gradient-to-r from-emerald-800 to-[#1a4d2e]`) with shadow and scale transition effects.
- **Stat Cards Upgrade ([StatCard.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/dashboard/StatCard.tsx))**:
  - Added support for active states linked to the table's `statusFilter`. When a stat card is selected, it shows a rich glowing ring, colored border, and matching soft background depending on its type:
    - *All*: slate border, ring, and background.
    - *Active*: green border, ring, and background.
    - *Warning*: orange border, ring, and background.
    - *Expired*: red border, ring, and background.
    - *Processing*: blue border, ring, and background.
  - Replaced standard round circular icon wrappers with modern rounded-square (`rounded-2xl`) boxes with subtle drop shadows and borders.
- **Expiry Chart Upgrade ([ExpiryChart.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/dashboard/ExpiryChart.tsx))**:
  - Replaced flat single-color bars with a bright emerald-to-forest-green gradient (`linearGradient` from `#34d399` to `#1a4d2e`).
  - Increased bar corner roundness (`radius={[6, 6, 0, 0]}`) and stylized the tooltip container with a cleaner shadow, borderless design, and hover overlay cursor styles.

### 7. Search Usability Improvements (Latest Update)
- **Search Query Extension**: Expanded the search query logic to check against `doc.project`, allowing users to quickly find documents by typing a project or contract name keyword (e.g. "MEA", "AOT", "จุฬาฯ") in the search input without altering the visual design of the table.

### 8. Date Handling and Stable UI Identity Fixes (Latest Update)
- **Timezone-Safe Document Dates ([utils/documentUtils.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/utils/documentUtils.ts))**: Added local date-only parsing helpers so `YYYY-MM-DD` expiry values are not parsed as UTC dates. This prevents yesterday's expiry date from being treated as still within the warning window in the Asia/Bangkok timezone.
- **Shared Renewal Date Helper ([utils/documentUtils.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/utils/documentUtils.ts))**: Added a reusable renewal helper and wired both row-level sync and global sync to it in [app/page.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/page.tsx) and [components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx).
- **Import Date Validation ([utils/importVehicleDocuments.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/utils/importVehicleDocuments.ts))**: Tightened Excel date normalization so impossible dates such as `31/02/2026` remain visible as raw input instead of silently rolling over into another month or year.
- **Stable UI Record Identity ([components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx) & [ExpiryMonthModal.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/dashboard/ExpiryMonthModal.tsx))**: Updated table action-menu state and monthly expiry modal row keys to use `getDocumentRecordKey`, preventing duplicate vehicle/doc-type rows from sharing unstable UI identity.

### 9. Neon + Drizzle Database Scaffold (Latest Update)
- **Dependencies and Scripts ([package.json](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/package.json))**: Added `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`, `dotenv`, and `tsx`, plus `pnpm db:generate`, `pnpm db:push`, `pnpm db:migrate`, `pnpm db:seed`, and `pnpm db:studio`.
- **Schema and Client ([db/schema.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/db/schema.ts) & [db/index.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/db/index.ts))**: Added a Postgres `vehicle_documents` table schema mapped to the existing document model and a Neon HTTP client for server-side database access.
- **Connection Check and Seed Flow ([app/api/db/health/route.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/api/db/health/route.ts) & [scripts/seed-db.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/scripts/seed-db.ts))**: Added an API endpoint that verifies the Neon connection with `select now()` and a script that seeds the current mock document set after the schema exists.
- **Setup Notes ([README.md](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/README.md))**: Documented the Vercel Marketplace flow: `vercel link`, `vercel integration add neon`, `vercel env pull .env.local --yes`, `pnpm db:push`, `pnpm db:seed`, then open `/api/db/health`.

### 10. Verification
- `pnpm run lint` passes.
- `git diff --check` passes.
- `pnpm run build` passes.
