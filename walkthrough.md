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

### 5. Verification
- `pnpm run lint` passes.
- `git diff --check` passes.
- `pnpm run build` passes.
