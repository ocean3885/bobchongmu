# Next.js + SQLite3 Migration Guide for "BobMng"

This guide outlines how to replicate the "BobMng" (Meal Management) Expo application as a Next.js web service using SQLite3.

## 1. Project Initialization

Initialize a new Next.js project with Tailwind CSS.

```bash
npx create-next-app@latest bobmng-web
# Options:
# - TypeScript: Yes (Recommended) or No
# - ESLint: Yes
# - Tailwind CSS: Yes
# - App Router: Yes
# - Import Alias: @/*
```

## 2. Dependencies

Install necessary packages for database management and UI.

```bash
npm install better-sqlite3 lucide-react clsx tailwind-merge
npm install -D @types/better-sqlite3 # if using TypeScript
```

## 3. Database Schema (SQLite3)

Create a `db.js` or `lib/db.ts` file to manage the connection. Use `better-sqlite3` for synchronous, efficient queries.

### Schema Design

You will need the following tables to replicate `useStore.js` data:

#### `groups`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `name` (TEXT)
- `overhead_balance` (INTEGER DEFAULT 0) - *To store the accumulated "100-won rounding" differences.*
- `created_at` (DATETIME)

#### `members`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `group_id` (INTEGER, Foreign Key)
- `name` (TEXT)
- `balance` (INTEGER DEFAULT 0) - *Current deposit balance.*
- `is_active` (BOOLEAN DEFAULT 1)
- `joined_at` (DATETIME)
- `withdrawn_at` (DATETIME NULL)

#### `meals`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `group_id` (INTEGER, Foreign Key)
- `restaurant_name` (TEXT)
- `date` (TEXT) - *ISO Date string (YYYY-MM-DD)*
- `total_amount` (INTEGER)
- `amount_per_person` (INTEGER) - *Calculated rounded amount.*
- `created_at` (DATETIME)

#### `meal_participants`
- `meal_id` (INTEGER, Foreign Key)
- `member_id` (INTEGER, Foreign Key)

#### `transactions`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `member_id` (INTEGER, Foreign Key)
- `type` (TEXT) - *'deposit', 'withdraw', 'meal'*
- `amount` (INTEGER) - *Positive for deposit, negative for usage.*
- `note` (TEXT)
- `related_meal_id` (INTEGER NULL)
- `created_at` (DATETIME)

## 4. Key Logic Implementation (API Routes)

Logic previously in `useStore` actions should move to API endpoints (e.g., `app/api/meals/route.ts`).

### Core Feature: Adding a Meal (Rounding Logic)

**Endpoint**: `POST /api/meals`

1.  **Receive**: `groupId`, `totalAmount`, `memberIds`, `restaurantName`, `date`.
2.  **Calculate**:
    ```javascript
    const count = memberIds.length;
    const rawPerPerson = totalAmount / count;
    // Round up to nearest 100 KRW
    const amountPerPerson = Math.ceil(rawPerPerson / 100) * 100;
    
    // Calculate Overhead
    const totalCollected = amountPerPerson * count;
    const overhead = totalCollected - totalAmount;
    ```
3.  **Transaction (DB)**:
    -   `BEGIN TRANSACTION`
    -   Insert into `meals`.
    -   Insert into `meal_participants`.
    -   Update `groups` -> `overhead_balance += overhead`.
    -   Update `members` -> `balance -= amountPerPerson` for each participant.
    -   Insert `transactions` record for each participant (`type: 'meal'`, `amount: -amountPerPerson`).
    -   `COMMIT`

## 5. Frontend & UI Structure (App Router)

Replicate the screens using responsive web design (Mobile-first).

-   `app/page.tsx`: **MainScreen** (Dashboard)
    -   Show current group status, total overhead, member list summary.
-   `app/groups/page.tsx`: **GroupListScreen**
-   `app/groups/[id]/add-meal/page.tsx`: **AddMealScreen**
    -   Use HTML `<input type="date">` for the date picker (native web support is good).
    -   Use a multi-select UI for member selection.
-   `app/groups/[id]/members/page.tsx`: **MemberManageScreen**
    -   List members, "Add Member" form at the top (as requested).
-   `app/groups/[id]/overhead/page.tsx`: **UseOverheadScreen**
    -   Form to spend accumulated overhead funds.

## 6. Migration Checklist

1.  [ ] **Initialize DB**: Write a script (`scripts/init-db.js`) to create tables.
2.  [ ] **Port Logic**: Translate `useStore.js` actions into SQL queries.
3.  [ ] **UI Components**: Convert React Native `View`/`Text` to HTML `div`/`span` with Tailwind classes.
    -   `View` -> `div`
    -   `Text` -> `p` or `span`
    -   `TouchableOpacity` -> `button`
    -   `FlatList` -> `ul` / `li` or `map()` logic.
4.  [ ] **State Management**: Use `SWR` or `React Query` for data fetching instead of global Zustand store (let the DB be the source of truth).

## 7. Special Considerations for Web

-   **Responsive Design**: The current app is mobile-only. Ensure containers have `max-w-md mx-auto` to look like a mobile app on desktop monitors if desired.
-   **Navigation**: Use Next.js `<Link>` component instead of `navigation.navigate`.
-   **Popups**: Replace `Alert.alert` with `window.confirm` or a custom Dialog component (e.g., standard HTML `<dialog>`).
