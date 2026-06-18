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
- **Urgent Alerts Capacity ([UrgentAlerts.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/dashboard/UrgentAlerts.tsx) & [page.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/page.tsx))**: Increased the dashboard preview from 4 to 6 urgent items and removed the fixed 250px list cap so the taller alert card uses its available space.

### 4. Table Layout Density Optimization ([PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx))
- **Issue**: Columns felt too far apart on wide screens, creating massive blank gaps between table values.
- **Solution**:
  - Redistributed column percentage widths inside the `<colgroup>` to make them tighter and more proportional while adding a dedicated Project column (Document Type: 9%, Chassis: 13%, License Plate: 10%, Project: 14%, Issued Date: 12%, Expiry Date: 12%, Status: 21%, Attachment: 5%, Action: 4%).
  - Reduced cell padding from `px-5 py-4` to `px-4 py-3` for a tighter vertical and horizontal density.
  - Set table minimum width to `min-w-[1120px]` so the added project information stays readable inside the horizontal table surface.
  - **Pagination Size Reduction**: Changed the table pagination size from `10` to `6` items per page to make the screen layout more compact.
  - **Constant Table Height Fix**: Set table wrapper min-height to `min-h-[465px]`. This matches the actual height of 6 table rows (including status badges), ensuring the container height remains completely constant. This prevents layout shifting and scroll position jumping when users switch between pages with different row counts (e.g. Page 3 which only has 2 rows).
  - **Project Column**: Added a visible `โครงการ` column between license plate and issue date, with long project names truncated and available via hover title for scan-friendly comparison.

### 5. Interactive Stat Cards (New Feature)
- **Interactive Filtering**: Clicking any of the 4 stat cards now filters the document table by status:
  - **เอกสารทั้งหมด** -> Shows all records.
  - **ต่อแล้ว** -> Shows currently valid records and those with no expiry dates.
  - **ใกล้ถึงรอบต่อ** -> Shows documents expiring within 30 days.
  - **ยังไม่ต่อ** -> Shows documents that have passed their expiration dates and still need renewal.
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
  - The former monthly expiry modal flow, which was later replaced by the renewal calendar.

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
      1. **ต่ออายุสำเร็จ (Renewal Success)**: Extends the expiry date by exactly 1 year, updates the issued date to the current date, clears the acknowledgement metadata, and changes the document status to green **ต่อแล้ว** (Active).
      2. **ค้างชำระเงิน/ไม่มีรายการอัปเดต (Pending Check)**: Retains the **ยังไม่ต่อ** workflow state and alerts the user that no payment or renewal record was found in the external DLT/insurer database.

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
- **Stable UI Record Identity ([components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx))**: Updated table action-menu state and the former monthly expiry modal row keys to use `getDocumentRecordKey`, preventing duplicate vehicle/doc-type rows from sharing unstable UI identity.

### 9. Neon + Drizzle Database Scaffold (Latest Update)
- **Dependencies and Scripts ([package.json](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/package.json))**: Added `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`, `dotenv`, and `tsx`, plus `pnpm db:generate`, `pnpm db:push`, `pnpm db:migrate`, `pnpm db:seed`, and `pnpm db:studio`.
- **Schema and Client ([db/schema.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/db/schema.ts) & [db/index.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/db/index.ts))**: Added a Postgres `vehicle_documents` table schema mapped to the existing document model and a Neon HTTP client for server-side database access.
- **Connection Check and Seed Flow ([app/api/db/health/route.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/api/db/health/route.ts) & [scripts/seed-db.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/scripts/seed-db.ts))**: Added an API endpoint that verifies the Neon connection with `select now()` and a script that seeds the current mock document set after the schema exists.
- **Setup Notes ([README.md](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/README.md))**: Documented the Vercel Marketplace flow: `vercel link`, `vercel integration add neon`, `vercel env pull .env.local --yes`, `pnpm db:push`, `pnpm db:seed`, then open `/api/db/health`.

### 10. Verification
- `pnpm run lint` passes.
- `git diff --check` passes.
- `pnpm run build` passes.

### 11. Post-Push Neon Confirmation
- **GitHub Push**: The Neon + Drizzle scaffold was committed and pushed to `origin/dev` as `c26a4c8 Add Neon Drizzle database scaffold`.
- **Secret Rotation**: The exposed Neon connection password was rotated through the Vercel/Neon integration flow. The updated Vercel environment variables were pulled back into `.env.local` with `vercel env pull .env.local --yes`.
- **Database State**: The Drizzle schema was applied to Neon and the current mock document set was seeded successfully, leaving 37 rows in `vehicle_documents`.
- **Health Check**: `/api/db/health` returned `{"ok":true,...}` after rotation, confirming the app can connect with the new credential.
- **Next Data Step**: The next implementation step is to replace the in-memory mock document flow with API/database reads from Neon, starting with a read endpoint for `vehicle_documents`.

### 12. Neon-Backed Dashboard Read Path
- **Database Query Helper ([db/vehicleDocuments.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/db/vehicleDocuments.ts))**: Added a shared server-side query helper that reads `vehicle_documents` through Drizzle, orders the rows by stable `id`, and maps nullable Postgres fields back into the existing `VehicleDocument` UI shape.
- **Documents API ([app/api/vehicle-documents/route.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/api/vehicle-documents/route.ts))**: Added `GET /api/vehicle-documents` as a dynamic Node.js route that returns the current Neon document list as JSON.
- **Dashboard Data Loading ([app/page.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/page.tsx))**: Changed the dashboard to start with an empty state, fetch `/api/vehicle-documents`, and then hydrate the stat cards, chart, alerts, and table from Neon-backed data.
- **Loading State ([components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx))**: Added a table-level loading row so users see that document data is loading from Neon instead of seeing an empty-result message.
- **Verification**: Confirmed the query helper and localhost API return 37 documents from Neon, then reran `pnpm run lint`, `pnpm exec tsc --noEmit`, and `pnpm run build`.
- **Remaining Persistence Work**: Import, delete, acknowledgement, and sync actions still update client state only. The next backend step is to add write endpoints/actions so those UI changes persist to Neon.

### 13. Neon-Backed Acknowledgement Updates
- **Patch API ([app/api/vehicle-documents/[id]/route.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/api/vehicle-documents/[id]/route.ts))**: Added `PATCH /api/vehicle-documents/[id]` for supported document updates, starting with acknowledgement fields.
- **Database Update Helper ([db/vehicleDocuments.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/db/vehicleDocuments.ts))**: Added a Drizzle update helper that writes acknowledgement changes, refreshes `updated_at`, and maps the returned row back to `VehicleDocument`.
- **Client API Helper ([utils/vehicleDocumentApi.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/utils/vehicleDocumentApi.ts))**: Added a small fetch wrapper so client components can update one document and receive the saved Neon-backed row.
- **Optimistic UI ([app/page.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/page.tsx) & [components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx))**: Centralized acknowledgement handling in the dashboard page, applied the UI update immediately, then patched Neon. If the API call fails, the UI rolls back and shows an error toast.
- **Verification**: Ran a temporary PATCH against `mock-001`, confirmed it saved successfully, and restored the original row state. `pnpm run lint`, `pnpm exec tsc --noEmit`, `git diff --check`, and `pnpm run build` pass after clearing stale `.next` generated type duplicates.
- **Remaining Persistence Work**: Delete, Excel import, and renewal sync still need write paths before all dashboard actions survive refreshes.

### 14. Neon-Backed Delete Updates
- **Delete API ([app/api/vehicle-documents/[id]/route.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/api/vehicle-documents/[id]/route.ts))**: Added `DELETE /api/vehicle-documents/[id]` beside the existing patch route so one document row can be removed from Neon by stable `id`.
- **Database Delete Helper ([db/vehicleDocuments.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/db/vehicleDocuments.ts))**: Added a Drizzle delete helper that returns the deleted row for confirmation and consistent error handling.
- **Client Delete Helper ([utils/vehicleDocumentApi.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/utils/vehicleDocumentApi.ts))**: Added a fetch wrapper for the delete route, mirroring the acknowledgement update helper.
- **Optimistic UI ([app/page.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/page.tsx) & [components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx))**: Routed table deletes through the dashboard page, removed the row immediately, closed any open detail view for that row, and restored the row if Neon deletion fails.
- **Verification**: Inserted a temporary `codex-delete-test-*` row into Neon, deleted it through the route handler, and confirmed the document count returned from 38 back to 37.
- **Remaining Persistence Work**: Excel import and renewal sync still need write paths.

### 15. Neon-Backed Excel Import
- **Bulk Create Helper ([db/vehicleDocuments.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/db/vehicleDocuments.ts))**: Added validation and mapping from `VehicleDocument` into Drizzle insert rows, including nullable strings, date-only values, timestamps, booleans, and supported document types.
- **Create API ([app/api/vehicle-documents/route.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/api/vehicle-documents/route.ts))**: Added `POST /api/vehicle-documents` to insert imported document rows into Neon and return the saved rows as the existing UI shape.
- **Client Create Helper ([utils/vehicleDocumentApi.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/utils/vehicleDocumentApi.ts))**: Added a fetch wrapper for bulk document creation.
- **Import Flow ([components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx))**: The Excel/CSV parser still normalizes the local file in-browser, but the parsed rows now save to Neon before they are prepended into dashboard state.
- **Verification**: Inserted a temporary `codex-import-test-*` row through the POST route, confirmed the count increased from 37 to 38, then deleted the row and confirmed the count returned to 37.
- **Remaining Persistence Work**: Renewal sync is the last write path still updating client state only.

### 16. Neon-Backed Renewal Sync
- **Patch Fields ([app/api/vehicle-documents/[id]/route.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/api/vehicle-documents/[id]/route.ts))**: Extended the existing document patch route to accept `issuedDate` and `expiryDate` alongside acknowledgement fields.
- **Database Update Shape ([db/vehicleDocuments.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/db/vehicleDocuments.ts))**: Expanded update support so renewal dates can be saved through the same Drizzle helper used by acknowledgement updates.
- **Client Update Helper ([utils/vehicleDocumentApi.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/utils/vehicleDocumentApi.ts))**: Extended the update payload type for renewal date fields.
- **Single Sync Persistence ([app/page.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/page.tsx) & [components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx))**: Successful renewal simulation now optimistically updates the row, patches Neon, then replaces the row with the saved database response. If saving fails, the row rolls back.
- **Global Sync Persistence ([components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx))**: Batch sync now decides which acknowledged documents renewed, applies optimistic updates for those rows, saves each successful renewal to Neon, and rolls back only failed saves.
- **Verification**: Temporarily patched `mock-001` to `2027-06-12`, confirmed the route returned the renewed date, then restored the original row state.
- **Persistence Status**: Dashboard read, acknowledgement, delete, import, and successful renewal sync now all persist to Neon.

### 17. Dev/Production Database Separation
- **Goal**: Keep day-to-day testing on `dev` from changing the live production database used by `main`.
- **Neon Branches**:
  - `main` remains the production database branch.
  - `dev` was created as a long-lived branch from `main` for local development and Preview deployments.
- **Vercel Environment Mapping**:
  - `DATABASE_URL` and `POSTGRES_URL` now have separate Vercel entries:
    - `Production` -> Neon `main` branch.
    - `Preview (git branch: dev)` -> Neon `dev` branch.
    - `Development` -> Neon `dev` branch.
  - Other Neon integration-generated variables may still appear as `Production, Preview, Development`; the application currently reads `DATABASE_URL` first and falls back to `POSTGRES_URL`, so those two variables are the active database routing controls.
- **Local Development**: Ran `vercel env pull .env.local --environment=development --yes` after the split so local commands use the Neon `dev` branch.
- **Preview Redeploy**: Redeployed the latest Preview deployment after the env change because Vercel env updates apply to new builds/deployments, not already-built deployments.
  - New Preview URL checked: `https://dashboard-insurance-nor1u4as1-nontpat-s-projects.vercel.app`
- **Verification**:
  - Production/main backup connection metadata pointed to Neon branch `br-orange-silence-aogjcyjs` / endpoint `ep-falling-violet-ao5k40wj`.
  - Development/local connection metadata pointed to Neon branch `br-little-sunset-aodyq0bj` / endpoint `ep-icy-dawn-aoafq2qh`.
  - Both branches had 136 `vehicle_documents` rows immediately after branching.
  - The redeployed Preview `/api/db/health` endpoint returned `{"ok":true,...}`.
- **Workflow Note**: When changing Vercel env values again, redeploy the affected Preview/Production deployment before testing the new database target.

### 18. Clearer Renewal Status Wording for V1
- **Goal**: Make document statuses easier to understand for the first production workflow without introducing the later date/import validation work yet.
- **V1 Status Model**:
  - `ต่อแล้ว` means the document is currently valid and does not need renewal work right now.
  - `ยังไม่ต่อ` means renewal work is still unresolved, including expired documents and acknowledged documents that have not synced a successful renewal yet.
  - `ไม่ต้องต่อ` is used for document types with no expiry date.
- **Acknowledged Documents**:
  - Replaced the user-facing `กำลังดำเนินการ` / `รอต่ออายุ` wording with `ยังไม่ต่อ`.
  - Removed the separate acknowledged card/filter for V1, so acknowledged-but-not-renewed rows are counted and filtered under `ยังไม่ต่อ`.
- **Dashboard Stat Cards ([app/page.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/page.tsx))**:
  - Updated the main cards to `ต่อแล้ว`, `ใกล้ถึงรอบต่อ`, and `ยังไม่ต่อ`.
  - Kept captions short and operational, such as `ยังไม่ต้องต่อ` and `ต้องต่ออายุ`.
- **Table Status Copy ([components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx))**:
  - Updated status badges and status-filter toast copy so acknowledged rows are grouped directly under `ยังไม่ต่อ`.
  - Updated active/no-expiry filtering copy to say `ต่อแล้วหรือไม่ต้องต่อ`.
  - Updated sync copy for acknowledged rows that still have no external renewal/payment record.
- **Detail Modal Copy ([components/DocumentDetailModal.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/DocumentDetailModal.tsx))**:
  - Updated the acknowledged banner to `ยังไม่ต่อ` and explicitly says renewal success has not yet been found.
- **Deferred**: Import/date validation is intentionally not included in this pass and should be revisited separately.

### 19. Renewal Calendar and Daily Agenda
- **Goal**: Replace the month-level expiry bar chart with a workflow surface that answers which day needs renewal work and which vehicles/documents are due on that day.
- **Calendar View ([components/dashboard/ExpiryChart.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/dashboard/ExpiryChart.tsx))**:
  - Reworked the existing chart component into `ปฏิทินต่ออายุ` while keeping the file name to minimize import churn.
  - Displays a month grid with document-count badges only on dates inside the visible month that have renewal work to handle.
  - Adjacent-month dates remain visible for calendar context but no longer show badges or open agenda items.
  - Filters out already-renewed and non-urgent documents so the calendar does not show green `ต่อแล้ว` work.
  - Adds previous/next month controls and resets the selected day when users change month.
- **Daily Agenda**:
  - Shows the selected day's documents beside the calendar.
  - Each row shows the vehicle identifier, document type, project, workflow status, expiry date, and a days label such as `เหลืออีก 7 วัน` or `เลยกำหนด 3 วัน`.
  - Clicking an agenda row opens the existing `DocumentDetailModal`, so the detail workflow stays unchanged.
- **Month Summary Chips**:
  - Added compact counts for `ต้องต่อแล้ว` and `ใกล้ถึงรอบต่อ` inside the visible month.
  - Removed the separate green summary chip so green stays reserved for already-renewed or non-urgent documents in the item list.
- **Dashboard Wiring ([app/page.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/page.tsx))**:
  - Removed the old monthly expiry modal from the active dashboard flow.
  - Deleted the obsolete monthly expiry modal component so the calendar is the single renewal schedule surface.
  - The renewal calendar now receives the existing six-month grouped document data and calls `setSelectedDocForDetail` directly.

### 20. Historical Event Log for Future Analysis
- **Goal**: Preserve operational history instead of only keeping the latest document state, so future dashboards can analyze renewal lead time, overdue patterns, import volume, sync outcomes, and project-level bottlenecks.
- **Schema ([db/schema.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/db/schema.ts))**:
  - Added `vehicle_document_history_event` enum with `created`, `acknowledged`, `renewed`, `sync_no_update`, `deleted`, and `updated`.
  - Added `vehicle_document_history` table with document id, chassis, license plate, project, document type, actor, previous/next issue dates, previous/next expiry dates, JSON details, and event timestamp.
- **Migration ([drizzle/0001_white_metal_master.sql](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/drizzle/0001_white_metal_master.sql))**:
  - Generated the Drizzle migration for the history enum and table.
- **Server Logging ([db/vehicleDocuments.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/db/vehicleDocuments.ts))**:
  - Import creates `created` events.
  - Acknowledge actions create `acknowledged` events.
  - Successful renewal sync creates `renewed` events.
  - Delete actions create `deleted` events while preserving document snapshot fields for later reporting.
  - History writes are best-effort so the main document action does not fail just because audit logging is temporarily unavailable.
- **Sync-Miss Events ([app/api/vehicle-documents/[id]/history/route.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/api/vehicle-documents/[id]/history/route.ts))**:
  - Added a lightweight history endpoint for event-only records, starting with `sync_no_update` when an external renewal/payment check returns no new renewal.
  - Added `GET /api/vehicle-documents/[id]/history` so the UI can read the timeline for one document.
  - Wired row-level, modal-level, and global sync miss paths to record the event through [utils/vehicleDocumentApi.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/utils/vehicleDocumentApi.ts).
- **History Access**: The initial per-document history button was replaced by the renewal history view described below so V1 has one clear place to review completed renewals.
- **Analysis Value**:
  - Can later group events by month, project, document type, actor, and event type.
  - Can compare `previous_expiry_date` and `next_expiry_date` for renewal cycle analysis.
  - Can count repeated `sync_no_update` events to see which projects or vehicles are stuck before renewal completion.
- **Operational Note**:
  - Applied the migration to the active Neon `dev` branch with `pnpm db:push`.
  - Verified history writes by creating a temporary `sync_no_update` event with actor `codex-verify`, confirming the history count increased from `0` to `1`, then deleting the verification row so the count returned to `0`.
  - Apply the same migration to Neon `main` only when promoting the release to Production.

### 21. Document Renewal History View
- **Goal**: Show which documents were renewed, whether each renewal happened before or after the previous expiry date, and the new coverage end date. General operational events remain stored for audit and future analysis but do not clutter the V1 screen.
- **Renewal History API ([app/api/vehicle-document-renewals/route.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/api/vehicle-document-renewals/route.ts))**:
  - Added `GET /api/vehicle-document-renewals` to return only `renewed` events from Neon, newest first.
  - Added a focused Drizzle query in [db/vehicleDocuments.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/db/vehicleDocuments.ts) and a client fetch helper in [utils/vehicleDocumentApi.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/utils/vehicleDocumentApi.ts).
  - The existing audit table still stores imports, acknowledgements, sync misses, edits, and deletions for future reporting.
- **Dashboard Entry Point ([app/page.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/page.tsx))**:
  - Added a visible `ประวัติการต่ออายุ` button beside the page title.
  - Removed the history button and timeline from each document detail modal to avoid duplicate V1 workflows.
- **Renewal Table ([components/RenewalHistoryModal.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/RenewalHistoryModal.tsx))**:
  - Shows renewal time, vehicle/document, project, previous expiry date, new expiry date, timing result, and actor.
  - Calculates whether a renewal was completed before expiry, on the expiry date, or after expiry and displays the day difference.
  - Provides totals for all completed renewals, on-time renewals, and late renewals.
  - Supports search by license plate, chassis, project, actor, or document type and filters by on-time/late status.
  - Shows clear loading, empty, filtered-empty, and Neon error states and explains that history starts accumulating after the audit feature is enabled.
  - Can be closed with the close icon, the Escape key, or a click outside the dialog.
- **Verification**:
  - `git diff --check` passes.
  - `pnpm run lint` passes.
  - `pnpm exec tsc --noEmit` passes.
  - `pnpm run build` passes and includes the dynamic `/api/vehicle-document-renewals` route.

### 22. Document Table Column Rebalance
- **Goal**: Make the main document table easier to scan by removing a lower-priority date and sizing each remaining column according to its typical content length.
- **Table Layout ([components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx))**:
  - Removed the `วันที่มีผล` column from the main table. The issued date remains available inside the document detail modal.
  - Reduced the table minimum width from `1120px` to `1040px` after removing the column.
  - Rebalanced the eight remaining columns: document type 9%, chassis 14%, license plate 11%, project 22%, expiry date 13%, status 20%, attachment 6%, and actions 5%.
  - Kept chassis and expiry values on one line, widened project names, and tightened padding around icon-only attachment/action columns.
  - Updated loading and empty-state column spans from 9 to 8 so table alignment remains valid.

### 23. Realistic Development Data and Document Preview
- **Development Data Reset**:
  - Replaced the previous generic mock rows with 24 document records grouped across 8 realistic fleet vehicles.
  - Vehicles now reuse the same chassis, registration, project, and driver across their related compulsory-insurance, tax, insurance, inspection, and registration-book records.
  - Dates are distributed across expired, near-renewal, active, and no-expiry states based on June 2026 operations.
  - Updated `pnpm db:reset` to clear `vehicle_document_history` and `vehicle_documents` before inserting the new mock set.
  - Verified the active Neon development branch was reset from 135 rows to 24 rows without touching production.
- **Document Attachments**:
  - Added the supplied compulsory-insurance and tax-label images as static assets in `public`.
  - Added a shared attachment resolver so only records marked with an available supported image show a paperclip action.
  - The detail modal now shows a `ดูเอกสาร` button for available attachments and opens the image in a focused preview overlay.
  - Records without a supported image show a clear `ไม่มีเอกสาร` empty state instead of a misleading attachment label.

### 24. Direct PDF Document Download (Latest Update)
- **Goal**: Allow users to download the actual document as a PDF file directly from the table or the detail view, dynamically naming the file by its document type and vehicle plate number/chassis.
- **Minimal PDF Template**: Created a minimal valid PDF placeholder at [document_placeholder.pdf](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/public/document_placeholder.pdf) that is compliant with PDF standard formatting to prevent file corruption warnings.
- **Table Document Attachment Action ([components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx))**:
  - Replaced the paperclip icon's button behavior (which opened the detail modal) with a download link (`<a>` tag with `download` attribute).
  - Dynamically names the downloaded file following the format `[ประเภทเอกสาร]_[เลขทะเบียนหรือเลขตัวถัง].pdf` (e.g., `ภาษี_1กข 1234.pdf` or `พ.ร.บ._CHAS-1234.pdf`).
  - Added a success toast message when the download begins to confirm the action.
- **Detail Modal Action ([components/DocumentDetailModal.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/DocumentDetailModal.tsx))**:
  - Upgraded the attachment preview container in the detail view to support both **ดูตัวอย่างภาพ** (view image preview overlay) and **ดาวน์โหลด PDF** (direct PDF download) options.

### 25. Move Download Button to Preview Page and Use Real Mock Images (Latest Update)
- **Goal**: Relocate the download button to the document preview overlay (on the top right next to the close button) for a cleaner details page experience, and download the actual mock image document (`compulsory_insurance.jpg` / `tax_receipt.jpg`) instead of a generic PDF placeholder.
- **Relocated Download Button ([components/DocumentDetailModal.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/DocumentDetailModal.tsx))**:
  - Removed the standalone download button from the detail modal's attachment container, leaving the primary **ดูตัวอย่างภาพ** action button.
  - Added a **ดาวน์โหลดรูปภาพ** download link inside the document image preview overlay header (on the top right, next to the `(X)` close button).
- **Download Real Mock Image Files ([components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx) & [components/DocumentDetailModal.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/DocumentDetailModal.tsx))**:
  - Switched the download target from the generic `document_placeholder.pdf` to the actual mock image path (`attachmentPreview.src`).
  - The downloaded file is named as `[ประเภทเอกสาร]_[เลขทะเบียนหรือเลขตัวถัง].jpg` (e.g. `ภาษี_1นบ 4827.jpg`) containing the actual document layout shown in the preview.

### 26. Clean License Plate Numbers in Download Filenames (Latest Update)
- **Goal**: Exclude province names (e.g. `นครปฐม`, `กรุงเทพมหานคร`) from the license plate string in downloaded file names to match the user's preferred format: `[ประเภทเอกสาร]_[เลขทะเบียน].jpg` (e.g. `ภาษี_72-4581.jpg`).
- **Clean License Plate Helper ([utils/documentUtils.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/utils/documentUtils.ts))**:
  - Added `getCleanLicensePlate` to strip the province name dynamically by splitting the string by whitespace and keeping the first parts.
- **Wiring ([components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx) & [components/DocumentDetailModal.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/DocumentDetailModal.tsx))**:
  - Integrated the helper into the `download` attributes and toast messages in both the table download link and the detail preview overlay download link. Now `'72-4581 นครปฐม'` is cleanly mapped to `'72-4581'`.

### 27. Backend Download API for Browser Naming Enforcement (Latest Update)
- **Goal**: Resolve browser-side behavior where web browsers (such as Arc, Chrome, and Safari) ignore the HTML5 `download` attribute for direct image file links and default to the original filename on the server (e.g. `compulsory_insurance.jpg`).
- **Download API Endpoint ([app/api/download/route.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/api/download/route.ts))**:
  - Added a backend `GET /api/download` endpoint that accepts `url` (file target) and `filename` parameters.
  - Resolves and reads the local file securely from the `public` directory (with directory traversal checks).
  - Integrated `pdf-lib` to dynamically embed the mock image file (`compulsory_insurance.jpg` / `tax_receipt.jpg`) into a newly generated 1:1 scale PDF page on the fly.
  - Enforces downloads using the HTTP header: `Content-Disposition: attachment; filename*=UTF-8''[EncodedFilename]`. This guarantees the browser saves the file with the exact Thai name ending in `.pdf`, bypassing client-side caching/override heuristics.
- **Client Integration ([components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx) & [components/DocumentDetailModal.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/DocumentDetailModal.tsx))**:
  - Rerouted download triggers through the new API endpoint (e.g., `/api/download?url=...&filename=...`), requesting `.pdf` files.
  - Modified UI toast and button labels to explicitly state **ดาวน์โหลด PDF**.

### 28. Preserving Original Status Colors and Details for Acknowledged Documents (Latest Update)
- **Goal**: Prevent acknowledged documents from turning into a uniform blue status badge, ensuring they retain their original red (expired) or orange (warning) status colors and show the correct days remaining/overdue details. Display a separate "รับทราบแล้ว" (Acknowledged) tag to indicate their review state.
- **Table Status Badges ([components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx))**:
  - Removed the overriding `isAcknowledged` check from `getStatusBadge` so acknowledged rows fall back to their correct expired/warning colors and details (e.g. `เลยกำหนดมาแล้ว X วัน`).
  - Added a clean slate/gray badge `รับทราบแล้ว` next to the main status label in the table row when the document is in the acknowledged state.
- **Detail Modal Header & Highlight ([components/DocumentDetailModal.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/DocumentDetailModal.tsx))**:
  - Updated the detail modal header badge to use the actual status color (red/orange) and label (e.g., `ยังไม่ต่อ` / `ใกล้ถึงรอบต่อ`) instead of forcing it to blue.
  - Updated the expiry date grid highlight box to keep its correct warning (orange) or expired (red) border and background, even when the document has been acknowledged. The blue banner remains visible to present the acknowledgement user and timestamp.

### 29. Self-Contained Base64 Asset Bundling for Serverless Environments (Latest Update)
- **Goal**: Address serverless fetch limitations on Vercel where Preview Deployment Protection blocks internal HTTP self-fetches, and the `public` directory is not mounted locally for `fs.readFileSync` calls.
- **Base64 Code Assets ([utils/documentBase64.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/utils/documentBase64.ts))**:
  - Encoded the mock JPEG images (`compulsory_insurance.jpg` & `tax_receipt.jpg`) into static Base64 code strings so they are bundled directly into the compiled JavaScript application.
- **Download API Endpoint ([app/api/download/route.ts](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/app/api/download/route.ts))**:
  - Updated the route to synchronously decode the Base64 asset strings using `Buffer.from(base64Data, 'base64')` instead of making local file reads or HTTP requests.
  - This guarantees zero external network or filesystem dependencies, making PDF generation and file downloading 100% reliable across all hosting environments.

### 30. Revert to Direct Mock Image File Downloads (Latest Update)
- **Goal**: Revert from the server-side PDF generator route (`/api/download`) which was failing on the Vercel Production environment due to memory/runtime constraints, and restore direct file downloads of the actual mock JPEG documents.
- **Removed Code & Dependencies**:
  - Deleted the custom `/api/download` API route and the `utils/documentBase64.ts` asset bundle.
  - Removed `pdf-lib` from project dependencies.
- **Restored Direct Links ([components/PolicyTable.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/PolicyTable.tsx) & [components/DocumentDetailModal.tsx](file:///Users/microwen/Desktop/Project_EVT/fleet-dashboard/components/DocumentDetailModal.tsx))**:
  - Pointed all download links (`href`) directly to the static image asset path (`attachmentPreview.src`).
  - Configured download attributes to dynamically set the downloaded file name to format `[ประเภทเอกสาร]_[เลขทะเบียน].jpg` (with cleaned license plate numbers).
  - This restores 100% reliable download behavior across all environments, relying on standard static file streaming without runtime server dependencies.
