# GEMINI.md - Project Context & Learnings

## Project Overview
**Name:** MED_STAT
**Purpose:** Real-time ophthalmic surgery queue management and display system.
**Stack:** Next.js 15.5.5 (App Router), React, Tailwind CSS.
**Type:** Full-stack web application with real-time capabilities.

## Architecture & Database Strategy
The project employs a **Hybrid Firebase Architecture** to balance real-time performance with data persistence:
1.  **Realtime Database (RTDB):**
    -   **Purpose:** Live, low-latency display of "today's surgeries".
    -   **Usage:** Client-side components (`SurgeryRoomDisplay.tsx`) subscribe to RTDB listeners to reflect changes instantly across all connected screens.
2.  **Cloud Firestore:**
    -   **Purpose:** Long-term archival, complex queries, and data integrity.
    -   **Usage:** Serves as the source of truth. Used for duplicate checks (preventing double-booking via National ID) and historical data retrieval (`/api/archive`).
3.  **Data Consistency:**
    -   All mutation endpoints (`POST`, `PUT`, `DELETE` in `/api/surgeries/`) perform a **dual-write**: updates are sent to both RTDB and Firestore simultaneously.

## Authentication
-   **Library:** `jose` (Stateless JWT).
-   **Mechanism:** Password-based login (Environment variables: `ADMIN_PASSWORD`, `VIEWER_PASSWORD`) grants a signed JWT stored in an HTTP-only cookie.
-   **Roles:** `admin` (Read/Write/Move) and `viewer` (Read-only).
-   **Protection:** `middleware.ts` intercepts requests to `/admin` and `/viewer`, verifying the token and ensuring role authorization.

## Key Components & Files
-   **`app/components/SurgeryRoomDisplay.tsx`**: The monolithic UI component handling the drag-and-drop interface, surgery rendering, and client-side state. Contains hardcoded lists of surgeons and surgery types.
-   **`lib/firebase-admin.ts`**: Initializes the server-side Firebase Admin SDK, exporting both `db` (RTDB) and `firestore` instances.
-   **`app/api/surgeries/route.ts`**: Handles creation of surgeries. Implements the logic to check Firestore for existing surgeries (by National ID + Date) before writing to both databases.
-   **`Collections.md`**: Reference document listing all standardized surgery types (Cataract, Retina, Glaucoma, etc.) used in the application.

## Business Logic Highlights
-   **Deduplication:** Surgeries are uniquely identified/checked by the combination of `National ID` and `Date`.
-   **Patient Data:** Parsed from Egyptian National IDs (14 digits) to extract birth date and governorate (though primarily used for ID).
-   **Room Management:** Surgeries are assigned to specific "Rooms". The Admin interface allows moving patients between rooms via drag-and-drop, which triggers an API call to update the `roomId` in both databases.

## Development Notes
-   **Drag-and-Drop:** Powered by `react-beautiful-dnd`.
-   **Styling:** Global styles in `app/globals.css`, utilizing Tailwind utility classes.
-   **Environment:** Requires `.env` with Firebase credentials (`FIREBASE_SERVICE_ACCOUNT_KEY`) and auth passwords.
