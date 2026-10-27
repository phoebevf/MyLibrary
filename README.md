# MyLibrary — Modern Library & Physical Loan Management Platform

![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)
![Zustand](https://img.shields.io/badge/Zustand-5.0-orange?style=flat-square)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?style=flat-square&logo=tailwindcss)

A production-ready Single Page Application (SPA) designed for full-lifecycle physical book cataloging, reservation, and loan administration. Built with **Next.js (App Router)**, **Supabase**, and the **Open Library API**, focusing on editorial elegance, magazine-like typography, and enterprise security via PostgreSQL Row-Level Security (RLS) and atomic RPC transactions.

---

## System Architecture & Interconnection

The platform integrates a reactive client layer, public metadata providers, transactional messaging, and an enterprise PostgreSQL database:

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Client Layer (Next.js 16 + Zustand)"]
        UI["UI Views & Components<br/>(Catalog, Book Detail, Admin, Loans)"]
        Stores["Zustand Global State Stores<br/>(Auth, Loans, Wishlist, Favorites, Theme)"]
        UI <--> Stores
    end

    subgraph ExternalAPIs["External API Services"]
        OL["Open Library REST API<br/>(Works, Authors, Cover CDN)"]
        Resend["Resend Transactional API<br/>(Loan Confirmations, Alerts)"]
    end

    subgraph BackendSupabase["Supabase Cloud Infrastructure"]
        Auth["Supabase Auth (JWT)<br/>(User Session & Tokens)"]
        DB[("PostgreSQL Database")]
        
        subgraph SecurityEngine["Database Security & Automation"]
            RLS["Row Level Security (RLS)<br/>(Declarative RBAC Engine)"]
            RPC["Stored Procedures (RPCs)<br/>(Atomic Stock Operations)"]
            Triggers["PostgreSQL Triggers<br/>(Auto Profile Provisioning)"]
        end
        
        DB --- RLS
        DB --- RPC
        DB --- Triggers
    end

    %% Client to Services
    UI -->|"1. User Auth / JWT Handshake"| Auth
    UI -->|"2. Query Public Metadata & Covers"| OL
    UI -->|"3. Trigger Transactional Emails"| Resend
    UI -->|"4. Execute Atomic Actions (Approve/Return)"| RPC
    UI -->|"5. Scoped CRUD (Loans, Lists, Profiles)"| RLS
    
    %% Internal Relations
    Auth -->|"On Signup: Fire Trigger"| Triggers
    Triggers -->|"Insert Profile Record"| DB
    RPC -->|"Atomic Stock Mutex"| DB
    RLS -->|"Enforce Row Authorization"| DB
```

---

## How It Works: Technical Workflows

### 1. Composite Data Fetching & Concurrent Author Resolution

To avoid storing millions of public bibliographic records locally while maintaining sub-second query performance, MyLibrary uses a **Composite Synchronization Pattern**. Supabase stores volatile inventory data (`available_copies`, `popularity`, loan status) alongside foreign Open Library keys, while public metadata is fetched and merged concurrently in the client:

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant App as Next.js Client Layer
    participant Supa as Supabase PostgreSQL
    participant OL as Open Library REST API
    participant CDN as Open Library Cover CDN

    User->>App: Opens Catalog or Book Detail View
    App->>Supa: Query Inventory & Popularity for work ID
    Supa-->>App: Returns available_copies, popularity, and OL Work Key (/works/OL...)
    
    par Concurrent Public Metadata Resolution
        App->>OL: GET /works/{key}.json
        OL-->>App: Returns Work Title, Description, and Author Keys ([/authors/OL...])
    and Cover Fetch
        App->>CDN: GET /b/id/{cover_i}-L.jpg
        CDN-->>App: Returns High-Resolution Cover Asset
    end

    loop Concurrent Author Resolution (Promise.all)
        App->>OL: GET /authors/{author_key}.json
        OL-->>App: Returns Author Display Name
    end

    App->>App: Hydrates unified 'Book' entity into Zustand Store
    App-->>User: Renders Book Detail with real-time stock & rich metadata
```

---

### 2. Physical Loan State Machine & Atomic Concurrency

Physical library copies are finite resources susceptible to race conditions. The loan request flow is controlled via a deterministic state machine executed through atomic PostgreSQL RPC stored procedures:

```mermaid
stateDiagram-v2
    [*] --> Pending: User submits Request (Generates unique 6-digit request_code)
    
    Pending --> Active: Admin verifies code & approves<br/>(Sets due_date, executes decrement_copies_and_increment_popularity RPC)
    Pending --> Rejected: Admin rejects<br/>(Optionally adds to user Wishlist + sends email notification)
    
    Active --> Returned: Physical copy checked in<br/>(Executes increment_book_copies RPC)
    Active --> Overdue: Calendar due_date exceeded
    
    Overdue --> Returned: Book physically returned<br/>(Replenishes stock via RPC)
    
    Rejected --> [*]
    Returned --> [*]
```

---

### 3. Database Security & Role-Based Access Control (RBAC)

Authorization is enforced at the database kernel level via PostgreSQL Row-Level Security (RLS), preventing client spoofing or unauthorized API manipulation:

```mermaid
flowchart LR
    ClientReq["Client Query with JWT"] --> Gateway["Supabase PostgREST Gateway"]
    Gateway --> RLS{"PostgreSQL RLS Engine<br/>Evaluates auth.uid() & Role"}
    
    RLS -->|"Role = 'admin'"| AdminAccess["Full Access<br/>• Approve / Reject Loans<br/>• Update Due Dates<br/>• Audit All Profiles & History"]
    RLS -->|"Role = 'user'"| UserAccess["Restricted Access<br/>• Read / Update Own Profile<br/>• View Own Loans & Wishlist<br/>• Insert Loans with status='pending'"]
    RLS -->|"Anonymous"| PublicAccess["Public Read-Only<br/>• Browse Book Inventory"]
```

---

## Technical Decisions: Why This Stack?

### 1. Why Next.js 16 (App Router) + Turbopack?
- **Hybrid Architecture (SSR/SSG + Client Islands)**: Critical for a public book platform. Initial catalog shells and metadata render on the server for instant First Contentful Paint (FCP) and rich OpenGraph/SEO indexing, while interactive components (search filters, confirmation modals, theme toggling) hydrate seamlessly.
- **Turbopack Compiler**: Sub-second Hot Module Replacement (HMR) and ultra-fast production builds, handling modern TypeScript and PostCSS natively.
- **Next Image Optimization**: Automatic AVIF/WebP transcoding, responsive `srcSet` generation, and layout-shift prevention for external covers served from Open Library.

### 2. Why Supabase (PostgreSQL + RLS + RPCs)?
- **Enterprise Security at the Database Layer**: Instead of maintaining fragile middleware or duplicate validation layers in Node/Express, Supabase allows defining declarative **Row-Level Security (RLS)** policies directly in PostgreSQL. Even if a client inspects network requests or attempts manual API calls, unauthorized rows are filtered by the PostgreSQL engine itself.
- **Atomic Concurrency with Stored Procedures (RPCs)**: Physical inventory cannot afford race conditions (e.g., two users borrowing the last remaining copy simultaneously). By offloading stock mutations to PostgreSQL RPC functions (`decrement_copies_and_increment_popularity`), updates execute inside an atomic database transaction with strict mutex guarantees (`check (available_copies >= 0)`).
- **PostgreSQL Triggers**: Automatic profile provisioning (`handle_new_user`) ensures user metadata, roles (`user` vs `admin`), and timestamps are in sync whenever a new account signs up via Supabase Auth.

### 3. Why Open Library API + Composite Data Fetching?
- **Zero Scraping & Massive Bibliographic Scope**: Direct programmatic access to over 30 million public domain and published works, authors, and cover scans without incurring gigabytes of static storage or ongoing maintenance costs.
- **Decoupled Architecture**: By storing only lightweight references (Open Library Work Keys) locally, Supabase remains lean, fast, and focused on operational data (physical loan history, user lists, real-time stock), while static public metadata is fetched on demand.

### 4. Why Zustand over Redux Toolkit or React Context?
- **Zero Boilerplate & Ultra-Small Footprint**: At less than 1.5 KB, Zustand avoids the complex actions, reducers, and thunk overhead of Redux while providing identical predictability.
- **Eliminating Re-render Cascades**: Unlike the standard React Context API—which triggers re-renders across the entire component subtree whenever any context value changes—Zustand uses atomic selector subscriptions (`useAuthStore(state => state.user)`), ensuring only components consuming the changed slice re-render.
- **Instant Client-Side Cache**: Wishlist, Favorites, and Loan items reflect immediately in the UI with zero latency.

### 5. Why Resend for Transactional Email?
- **High Deliverability & Modern Developer Experience**: Unlike legacy SMTP servers or complex AWS SES configurations, Resend offers first-class TypeScript support and modern REST endpoints.
- **Automated Lifecycle Notifications**: Seamlessly sends security login alerts, loan request confirmations, due-date reminders, and restock notifications when wishlist items become available.

### 6. Why CSS Modules with Custom Design Tokens?
- **Scoped Elegance without Class Collisions**: Provides complete CSS expressiveness (custom CSS variables, `color-mix()`, complex typography, keyframe animations) while guaranteeing zero namespace collisions across components.
- **Persistent Theming**: CSS variables defined in `:root` and `[data-theme="dark"]` enable smooth, flicker-free light and dark mode switching with instant persistence.

---

## Key Features

| Domain | Highlights | Status |
| :--- | :--- | :--- |
| **Catalog & Discovery** | Multi-threaded composite search across Open Library catalog, concurrent author resolution, popularity indexing, and availability filtering. | Production |
| **Physical Loan Lifecycle** | Controlled loan requests with unique verification codes, admin review queue, due-date calculation, and returns via atomic PostgreSQL RPCs. | Production |
| **User Curations** | Instant client-side state via **Zustand** for user **Wishlist** (with auto-notifications upon stock replenish) and **Favorites**. | Production |
| **Administration** | Dedicated Admin portal with actionable loan approvals, return processing, historical metrics, and date-range auditing. | Production |
| **Enterprise Security** | Granular Row-Level Security (RLS) policies on all tables, secure role verification, and countdown confirmation modals for sensitive actions. | Production |
| **Notifications** | Automated transactional emails via **Resend** (Welcome, Loan Approval, Rejection with wishlist fallback, and Due Date reminders). | Production |
| **UX & Theming** | Editorial aesthetic with custom typography (*Playfair Display*, *Plus Jakarta Sans*), fluid dark/light theme switching with persistence. | Production |

---

## Tech Stack Summary

- **Framework**: Next.js 16.0.7 (App Router with Turbopack)
- **Language**: TypeScript 5.x (Strict mode)
- **Database & Auth**: Supabase (PostgreSQL with RLS, Triggers, and Stored Procedures)
- **State Management**: Zustand 5.x
- **Styling**: CSS Modules, Custom Design Tokens, Tailwind CSS 4
- **Typography**: Playfair Display (Serif Headings), Plus Jakarta Sans (UI & Body)
- **Email Service**: Resend SDK
- **Icons**: Lucide React

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18 or higher (v20+ recommended)
- **pnpm**: v9 or v10

### 2. Installation
```bash
git clone https://github.com/<your-username>/mylibrary.git
cd mylibrary
pnpm install
```

### 3. Environment Setup
Copy the template environment file:
```bash
cp .env.example .env.local
```
Fill in your configuration keys:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Open Library API
NEXT_PUBLIC_OPENL_API_URL=https://openlibrary.org

# Resend Transactional Email
RESEND_API_KEY=re_YOUR_KEY

# Application Base URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Database Setup
Execute the complete database DDL included in `supabase/schema.sql` inside your Supabase SQL Editor:
- Creates `profiles`, `books`, `loans`, `wishlist`, and `favorites` tables.
- Applies ENUM `loan_status` and performance indexes.
- Deploys atomic stored procedures (`decrement_copies_and_increment_popularity`, `increment_book_copies`).
- Configures comprehensive Row-Level Security (RLS) policies.

### 5. Run Development Server
```bash
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Verification Scripts
```bash
# Verify TypeScript strict types
pnpm run typecheck

# Build for production with Turbopack
pnpm run build
```

---

## Database Security Summary (RLS Policies)

| Table | Operations | Enforced Policy |
| :--- | :--- | :--- |
| **`profiles`** | `SELECT`, `UPDATE` | Users can only access and edit their own profile (`auth.uid() = id`). Admins have global read/update access. |
| **`books`** | `SELECT` | Publicly queryable for catalog browsing. |
| **`books`** | `INSERT`, `UPDATE`, `DELETE` | Restricted exclusively to `role = 'admin'` users. |
| **`loans`** | `INSERT` | Authenticated users can only create loans for themselves with `status = 'pending'`. |
| **`loans`** | `SELECT` | Users see only their own loan history; Admins see all loans across the platform. |
| **`loans`** | `UPDATE` | Status updates (Approvals, Rejections, Due Dates) restricted to Admins. |
| **`wishlist`, `favorites`** | `ALL` | Strictly scoped to the authenticated owner (`auth.uid() = user_id`). |

---

© 2026 MyLibrary. Todos los derechos reservados. (All rights reserved).
