# Hotel Food Ordering Platform — Complete Project Plan

## 1. Project Overview

Build a production-grade, mobile-first Hotel Food Ordering Platform using:

- Next.js with App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Supabase PostgreSQL
- Supabase Realtime
- Supabase Storage
- Supabase Edge Functions where appropriate
- Firebase Authentication for Google Sign-In
- Supabase Row Level Security (RLS)
- Role-Based Access Control (RBAC)
- Server Actions / Route Handlers
- Zod validation
- React Hook Form
- TanStack Query where server-state caching is useful
- Zustand only for appropriate client-side state
- Playwright for end-to-end testing

The system must feel simple for customers and hotel staff while the backend provides strong transactional integrity, security, realtime updates, inventory protection, crowd management, notifications, RBAC, auditing, and operational dashboards.

Core principle:

> Advanced capabilities behind simple workflows.

---

# 2. Primary Goals

## Customer Goals

- Fast mobile ordering
- Minimal checkout friction
- Clear menu browsing
- Reliable stock availability
- Easy room/location selection
- Payment Cash on Delivery Only 
- Realtime order tracking
- Notifications
- Order history and reorder
- Clear errors and confirmations

## Staff Goals

- Extremely fast order handling
- Mobile/tablet-friendly KOT
- Clear preparation timers
- Priority order visibility
- Delivery batching
- COD collection tracking
- Low-stock visibility
- Realtime updates

## Admin Goals

- Operational control
- Menu management
- Quantity management
- Orders
- Payments
- Delivery
- Customers
- Staff
- Notifications
- Reports
- Crowd management
- Business hours
- Audit logs

## Super Admin Goals

- Global platform management
- Hotels and branches
- Users
- Roles
- Permissions
- Global settings
- Audit logs
- System health
- Platform-level analytics

---

# 3. Architecture Principles

The implementation must follow these rules:

1. Server-first architecture.
2. Use Server Components by default.
3. Use Client Components only where interactivity is required.
4. Never trust the client for prices, inventory, permissions, or order state.
5. Business-critical operations must execute server-side.
6. Use PostgreSQL transactions for order creation and inventory reservation.
7. Use RLS as a security boundary.
8. Use RBAC for application authorization.
9. Keep authentication and authorization separate.
10. Firebase answers "Who is the user?"
11. Supabase/PostgreSQL answers "What can the user access or do?"
12. Keep business logic out of presentation components.
13. Centralize order state transitions.
14. Centralize permission checking.
15. Centralize notification creation.
16. Use idempotency for order creation and payment callbacks.
17. Use realtime events instead of excessive polling.
18. Design mobile-first.
19. Build accessible touch-friendly interfaces.
20. Every feature must have loading, empty, success, and error states.
21. Never expose service-role or private credentials to the browser.
22. Never use frontend-only route protection as the sole security mechanism.
23. Never hardcode role names throughout the application.
24. Never trust a client-submitted product price.
25. Never allow inventory to become negative.

---

# 4. High-Level System Architecture

```text
Customer / Staff / Admin / Super Admin
                |
                v
            Next.js
         App Router
                |
       +--------+---------+
       |                  |
 Firebase Auth       Server Actions
 Google Sign-In      Route Handlers
       |                  |
       +--------+---------+
                |
                v
        Authorization
        + Validation
        + Business Logic
                |
                v
            Supabase
        +---------------+
        | PostgreSQL    |
        | RLS           |
        | Storage       |
        | Realtime      |
        | Edge Functions|
        +---------------+
                |
       +--------+---------+
       |        |         |
     Orders   Kitchen   Delivery
       |        |         |
       +--------+---------+
                |
        Notification Layer
                |
       +--------+---------+
       |        |         |
      UI      Push      Email/SMS
```

---

# 5. Authentication Architecture

Use Firebase Authentication for identity.

Initial authentication:

- Google Sign-In
- Email/password if required later
- Firebase user UID

Flow:

```text
Firebase Authentication
        |
        v
Firebase UID
        |
        v
Application profile
        |
        v
Supabase authorization
        |
        v
RLS + RBAC
```

Do not create a second independent password/authentication system in Supabase if Firebase is the chosen identity provider.

The Firebase identity must map to an application profile.

---

# 6. User and RBAC Architecture

Use database-driven RBAC.

Do not scatter logic such as:

```text
if role === "admin"
```

throughout the UI.

Use:

```text
profiles
roles
permissions
user_roles
role_permissions
```

Recommended roles:

- CUSTOMER
- STAFF
- KITCHEN
- DELIVERY
- CASHIER
- MANAGER
- ADMIN
- SUPER_ADMIN

Recommended permissions:

```text
dashboard.view

orders.view
orders.create
orders.update
orders.cancel
orders.assign
orders.refund

menu.view
menu.create
menu.update
menu.delete
menu.publish

inventory.view
inventory.update
inventory.adjust
inventory.reserve

kitchen.view
kitchen.manage
kitchen.priority
kitchen.capacity

delivery.view
delivery.manage
delivery.assign
delivery.complete


customers.view
customers.manage

staff.view
staff.manage

reports.view
reports.export

notifications.view
notifications.manage

settings.view
settings.manage

users.view
users.manage

roles.view
roles.manage
permissions.manage

hotels.view
hotels.manage

branches.view
branches.manage

audit.view
```

---

# 7. RBAC Matrix

| Capability | Customer | Kitchen | Delivery | Cashier | Manager | Admin | Super Admin |
|---|---:|---:|---:|---:|---:|---:|---:|
| Own Orders | Yes | No | Assigned | Yes | Yes | Yes | Yes |
| All Orders | No | Kitchen | Assigned | Yes | Yes | Yes | Yes |
| Menu View | Yes | Yes | Limited | Yes | Yes | Yes | Yes |
| Menu Manage | No | Limited | No | No | Yes | Yes | Yes |
| Inventory | No | Limited | No | No | Yes | Yes | Yes |
| KOT | No | Yes | No | No | Yes | Yes | Yes |
| Delivery | No | No | Yes | Limited | Yes | Yes | Yes |
| Payments | Own | No | COD | Yes | Yes | Yes | Yes |
| Reports | Own history | Limited | Limited | Limited | Yes | Yes | Yes |
| Users | Own | No | No | No | Limited | Yes | Yes |
| Roles | No | No | No | No | No | Limited | Yes |
| Hotels/Branches | No | No | No | No | No | Limited | Yes |
| Audit Logs | No | No | No | No | Limited | Yes | Yes |
| Global Settings | No | No | No | No | No | Limited | Yes |

The actual permission checks must be database-backed and enforced by RLS/server-side authorization.

---

# 8. Database Domain Structure

## Identity

```text
profiles
roles
permissions
user_roles
role_permissions
```

## Hotel

```text
hotels
branches
rooms
hotel_locations
business_hours
```

## Menu

```text
categories
menu_items
menu_item_images
menu_item_variants
modifier_groups
modifiers
menu_item_modifiers
```

## Inventory

```text
inventory_items
inventory_transactions
stock_reservations
```

## Orders

```text
orders
order_items
order_item_modifiers
order_status_history
order_notes
order_events
```

## Kitchen

```text
kitchen_stations
kitchen_orders
kitchen_order_items
kitchen_events
```

## Delivery

```text
deliveries
delivery_batches
delivery_batch_orders
delivery_assignments
delivery_events
```

## Payments

```text
payments
payment_transactions
refunds
```

## Notifications

```text
notifications
notification_preferences
notification_templates
notification_events
```

## Crowd Management

```text
kitchen_capacity
capacity_rules
order_queue
```

## System

```text
audit_logs
system_settings
feature_flags
idempotency_keys
```

---

# 9. Multi-Hotel / Multi-Branch Readiness

Even if the first deployment is for one hotel, include:

```text
hotel_id
branch_id
```

where appropriate.

Architecture:

```text
Platform
  |
  +-- Hotel A
  |     |
  |     +-- Branch 1
  |     +-- Branch 2
  |
  +-- Hotel B
        |
        +-- Branch 1
```

This allows future expansion without rebuilding the database.

---

# 10. Core Order Lifecycle

The canonical order state machine:

```text
PLACED
   |
   v
CONFIRMED
   |
   v
PREPARING
   |
   v
READY
   |
   v
OUT_FOR_DELIVERY
   |
   v
DELIVERED
```

Cancellation:

```text
PLACED
   |
   v
CANCELLED
```

If cancellation happens after preparation begins:

```text
PREPARING
   |
   v
CANCEL_REQUESTED
   |
   +--> CANCELLED
   |
   +--> PREPARING
```

Only approved transitions may occur.

The backend must reject invalid transitions.

---

# 11. Order Creation Architecture

The Place Order operation must be transactional.

Never perform these operations as unrelated browser calls.

Required flow:

```text
Customer clicks PLACE ORDER
        |
        v
Generate idempotency key
        |
        v
Server validates request
        |
        v
Validate authenticated user
        |
        v
Validate shop status
        |
        v
Validate menu items
        |
        v
Load current server prices
        |
        v
Validate modifiers
        |
        v
Validate stock
        |
        v
Calculate totals server-side
        |
        v
Reserve inventory
        |
        v
Create order
        |
        v
Create order items
        |
        v
Create payment record
        |
        v
Create kitchen order
        |
        v
Create order event
        |
        v
Commit transaction
        |
        v
Realtime event
        |
        v
Notifications
```

If any critical database step fails:

```text
ROLLBACK
```

---

# 12. Inventory Logic

Use simple but safe inventory logic.

Core formula:

```text
available_stock =
current_stock - reserved_stock
```

Example:

```text
Current Stock = 20
Reserved = 7
Available = 13
```

When an order is placed:

```text
Reserve Stock
```

When the order is completed:

```text
Consume Stock
```

When an order is cancelled:

```text
Release Reservation
```

Never allow:

```text
available_stock < 0
```

Use database transactions/locking or equivalent atomic logic to prevent race conditions.

---

# 13. Inventory Status

Every menu item should support:

```text
AVAILABLE
LOW_STOCK
SOLD_OUT
HIDDEN
SCHEDULED
```

Simple rule:

```text
available <= 0
→ SOLD_OUT
```

Low stock:

```text
available <= low_stock_threshold
→ LOW_STOCK
```

Admin may manually override availability when necessary.

---

# 14. Price Security

Never trust client-submitted prices.

Client may send:

```text
product_id
quantity
modifier_ids
```

Backend retrieves:

```text
current product price
current modifier prices
```

Then calculates:

```text
subtotal
discount
service charge
delivery fee
tax
total
```

Old orders must preserve historical prices through order-item price snapshots.

---

# 15. Cart Architecture

Cart supports:

- Add item
- Remove item
- Increase quantity
- Decrease quantity
- Modifiers
- Variants
- Notes
- Quantity validation
- Stock validation

Use local state for fast interactions where appropriate.

Before checkout, always perform authoritative server validation.

---

# 16. Checkout Architecture

Customer checkout:

```text
Cart
 |
 v
Delivery Location
 |
 v
Room / Hotel Location
 |
 v
Customer Note
 |
 v
Payment Method
 |
 v
Order Summary
 |
 v
Confirm
```

Delivery location options:

- Room
- Reception
- Restaurant pickup
- Hotel location
- Custom supported location

---

# 17. Payment Architecture

Separate payment data from order data.

Tables:

```text
payments
payment_transactions
refunds
```

Statuses:

```text
PENDING
AUTHORIZED
PAID
FAILED
REFUNDED
CASH_PENDING
CASH_COLLECTED
```

COD flow:

```text
Order
  |
  v
CASH_PENDING
  |
  v
Delivery
  |
  v
Cash Collected
  |
  v
PAID
```

Payment provider webhooks must be server-to-server and idempotent.

Never rely on the browser redirect as proof of payment.

---

# 18. Idempotency

Critical actions must be idempotent.

At minimum:

- Create order
- Payment webhook
- Refund
- Notification event processing
- Delivery completion

Use:

```text
idempotency_keys
```

Example:

```text
Same request submitted twice
        |
        v
Same idempotency key
        |
        v
Return original result
```

This prevents duplicate orders caused by double taps, retries, poor connections, or browser refreshes.

---

# 19. Kitchen / KOT System

Create a dedicated mobile/tablet-first KOT interface.

Order card:

```text
ORDER #1024

ROOM 204

2 × Chicken Burger
1 × Fries
2 × Coke

Ordered 12:32

[ACCEPT]
```

After accepting:

```text
PREPARING
00:08:32
```

Then:

```text
[MARK READY]
```

KOT states:

```text
NEW
ACCEPTED
PREPARING
READY
CANCELLED
```

---

# 20. Kitchen Stations

Support optional stations:

```text
HOT_KITCHEN
COLD_KITCHEN
BAR
DESSERT
```

An order can create separate tickets per station.

Example:

```text
ORDER #1024

HOT KITCHEN
- Burger
- Fries

BAR
- Coke
```

This is optional in the first release but the architecture should support it.

---

# 21. KOT Timer

Each kitchen order should calculate:

```text
ordered_at
accepted_at
started_at
expected_ready_at
ready_at
```

Display:

```text
Elapsed
Remaining
Overdue
```

Visual states:

```text
NORMAL
WARNING
OVERDUE
```

Do not depend on client timers for business decisions. Store timestamps and calculate authoritative values from the server.

---

# 22. Priority Orders

Priority:

```text
NORMAL
HIGH
VIP
URGENT
```

Kitchen queue sorting:

1. Urgent
2. VIP
3. High
4. Normal
5. Order time
6. Preparation constraints

Do not let arbitrary client input bypass authorization.

---

# 23. Crowd Management

Crowd management must protect kitchen capacity.

Configurable values:

```text
maximum_active_orders
warning_threshold
busy_threshold
pause_threshold
default_preparation_time
```

Example:

```text
Active < 10
→ NORMAL

10–20
→ BUSY

20–30
→ HIGH_LOAD

30+
→ CAPACITY_REACHED
```

The values must be configurable per branch/station.

---

# 24. Dynamic Preparation Time

Example:

```text
Normal:
15 minutes

Busy:
25 minutes

High Load:
40 minutes
```

The customer sees:

```text
Estimated preparation:
25–30 minutes
```

The backend determines the estimate.

Do not allow the customer client to calculate authoritative preparation times.

---

# 25. Queue Management

Create an operational order queue.

Sort by:

1. Priority
2. Order timestamp
3. Preparation requirements
4. Delivery constraints

Show:

```text
#1020 URGENT
#1021 HIGH
#1022 NORMAL
#1023 NORMAL
```

---

# 26. Delivery Batch System

Ready orders can be grouped into delivery batches.

Example:

```text
BATCH #204

Driver:
Staff #12

Orders:
#1024
#1025
#1028

Rooms:
201
204
207
```

Batch lifecycle:

```text
CREATED
READY
ASSIGNED
OUT_FOR_DELIVERY
COMPLETED
CANCELLED
```

Batch creation may be manual or automated.

Initial implementation should support manual creation and configurable automatic batching later.

---

# 27. Delivery Assignment

Delivery staff should only see assigned or authorized orders.

Delivery interface:

```text
Today's Deliveries

Batch #204

Room 201
Room 204
Room 207

[START DELIVERY]

[MARK DELIVERED]
```

For COD:

```text
Payment:
£24.50 COD

[COLLECT CASH]
```

Then:

```text
CASH_COLLECTED
```

---

# 28. Customer Response Workflow

For orders requiring confirmation:

```text
Order Ready
   |
   v
Customer Notification
   |
   v
WAITING_FOR_CONFIRMATION
   |
   +--> CONFIRMED
   |
   +--> NOT_READY
   |
   +--> TIMEOUT
```

Configurable response timeout.

Reminder:

```text
Reminder 1
Reminder 2
Staff Alert
```

Staff can then resolve manually.

---

# 29. Notification Architecture

Use a central notification service.

Tables:

```text
notifications
notification_preferences
notification_templates
notification_events
```

Notification channels:

```text
IN_APP
PUSH
EMAIL
SMS
```

Use the appropriate channel for the importance of the event.

---

# 30. Toast Rules

Toasts are for immediate feedback only.

Examples:

```text
✓ Added to cart
✓ Order placed
✓ Saved successfully
✓ Payment successful
```

Warnings:

```text
⚠ Kitchen is busy
⚠ Item is almost sold out
```

Errors:

```text
✕ Payment failed
✕ Unable to place order
```

Important persistent messages must also exist in the notification center.

---

# 31. Notification Center

Every authenticated user can have:

```text
Unread count
Notification list
Mark as read
Mark all as read
Notification preferences
```

Example:

```text
🔔 3

Order #1024 is preparing.
2 minutes ago

Order #1024 is ready.
8 minutes ago

Payment received.
10 minutes ago
```

---

# 32. Realtime Architecture

Use Supabase Realtime.

Prefer Broadcast-based event channels where suitable.

Examples:

```text
hotel:{hotelId}:orders
branch:{branchId}:orders
branch:{branchId}:kitchen
branch:{branchId}:delivery
user:{userId}:notifications
admin:{branchId}:dashboard
```

Realtime events:

```text
ORDER_CREATED
ORDER_CONFIRMED
ORDER_PREPARING
ORDER_READY
ORDER_DELIVERY_STARTED
ORDER_DELIVERED

KOT_CREATED
KOT_ACCEPTED
KOT_READY

DELIVERY_ASSIGNED
DELIVERY_STARTED
DELIVERY_COMPLETED

STOCK_CHANGED
CAPACITY_CHANGED
NOTIFICATION_CREATED
```

Clients must unsubscribe from channels when leaving screens.

Handle reconnects safely.

---

# 33. Customer Dashboard

Mobile-first home:

```text
Good Evening, John
Room 204

Current Order
--------------------
ORDER #1024
Preparing

Estimated:
12 minutes

[TRACK ORDER]

Quick Actions:
[MENU]
[ORDERS]
[REORDER]
[HELP]
```

Bottom navigation:

```text
Home
Menu
Cart
Orders
Account
```

---

# 34. Customer Menu

Menu must support:

- Categories
- Search
- Filters
- Food images
- Availability
- Price
- Preparation time
- Dietary indicators
- Modifiers
- Variants
- Add-ons

Food card:

```text
IMAGE

Chicken Burger
£8.50

15–20 min

[ADD]
```

Avoid excessive UI complexity.

---

# 35. Customer Order Tracking

Display:

```text
PLACED
  ✓

CONFIRMED
  ✓

PREPARING
  ●

READY
  ○

DELIVERY
  ○

DELIVERED
  ○
```

Show:

- Current status
- Estimated time
- Order number
- Room/location
- Items
- Payment status
- Contact/help

Updates should be realtime.

---

# 36. Customer Order History

Customer can:

- View orders
- View details
- Reorder
- See payment status
- See delivery status

Reorder must revalidate:

- Availability
- Current price
- Modifiers
- Shop status

Never blindly copy old order prices.

---

# 37. Admin Dashboard

Admin dashboard must be operational.

Top metrics:

```text
Orders Today
Revenue Today
Active Orders
Kitchen Load
```

Operational sections:

```text
New Orders
Preparing
Ready
Delivery
```

Alerts:

```text
Kitchen capacity high
Low stock
Sold-out items
Customer confirmations pending
Delayed deliveries
Payment failures
```

Avoid unnecessary dashboard clutter.

---

# 38. Admin Modules

Required modules:

```text
Dashboard
Orders
Menu
Categories
Inventory
KOT
Delivery
Customers
Staff
Payments
Notifications
Reports
Business Hours
Capacity
Settings
Audit Logs
```

---

# 39. Menu Management

Admin can:

- Create item
- Edit item
- Archive item
- Publish item
- Hide item
- Set price
- Upload images
- Set stock
- Set preparation time
- Configure variants
- Configure modifiers
- Configure availability
- Set low-stock threshold

Use archive instead of destructive deletion when historical orders reference an item.

---

# 40. Business Hours

Support:

```text
Breakfast
06:00–10:30

Lunch
12:00–15:00

Dinner
18:00–22:30
```

Business status:

```text
OPEN
CLOSED
SCHEDULED
TEMPORARILY_PAUSED
```

Customers should clearly see:

```text
Ordering closed

Next opening:
18:00
```

---

# 41. Super Admin Dashboard

Super Admin controls the platform.

Modules:

```text
System Overview
Hotels
Branches
Users
Roles
Permissions
Global Settings
Feature Flags
Audit Logs
System Health
Global Analytics
```

System health:

```text
Database
Realtime
Storage
Authentication
Notifications
Payments
```

---

# 42. Audit Logging

Record sensitive administrative actions.

Table:

```text
audit_logs
```

Fields should include as appropriate:

```text
actor_id
action
resource_type
resource_id
before_data
after_data
created_at
metadata
```

Examples:

```text
Admin changed:
Burger stock 20 → 10

Manager changed:
Kitchen capacity 20 → 30

Super Admin changed:
User role Staff → Manager
```

Do not log sensitive secrets.

---

# 43. Next.js Project Structure

```text
src/
├── app/
│   ├── (customer)/
│   │   ├── menu/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   └── account/
│   │
│   ├── (staff)/
│   │   ├── kitchen/
│   │   ├── delivery/
│   │   ├── cashier/
│   │   └── notifications/
│   │
│   ├── (admin)/
│   │   ├── dashboard/
│   │   ├── orders/
│   │   ├── menu/
│   │   ├── inventory/
│   │   ├── deliveries/
│   │   ├── customers/
│   │   ├── staff/
│   │   ├── payments/
│   │   ├── reports/
│   │   └── settings/
│   │
│   └── super-admin/
│       ├── dashboard/
│       ├── hotels/
│       ├── branches/
│       ├── users/
│       ├── roles/
│       ├── permissions/
│       └── audit/
│
├── components/
│   ├── ui/
│   ├── shared/
│   ├── customer/
│   ├── kitchen/
│   ├── delivery/
│   └── admin/
│
├── features/
│   ├── auth/
│   ├── orders/
│   ├── menu/
│   ├── inventory/
│   ├── kitchen/
│   ├── delivery/
│   ├── payments/
│   ├── notifications/
│   └── users/
│
├── actions/
│   ├── orders/
│   ├── menu/
│   ├── inventory/
│   ├── payments/
│   └── users/
│
├── lib/
│   ├── firebase/
│   ├── supabase/
│   ├── auth/
│   ├── permissions/
│   ├── validations/
│   ├── realtime/
│   └── utils/
│
├── hooks/
├── types/
└── config/
```

---

# 44. Supabase Architecture

Use separate browser/server Supabase clients using the supported SSR pattern.

Conceptually:

```text
lib/supabase/
├── browser.ts
├── server.ts
└── admin.ts
```

The admin/service-role client must never be imported into browser code.

Use server-only boundaries for privileged operations.

---

# 45. Server Actions / API Architecture

Group actions by feature.

Example:

```text
actions/orders/create-order.ts
actions/orders/cancel-order.ts
actions/orders/update-status.ts

actions/menu/create-menu-item.ts
actions/menu/update-menu-item.ts

actions/inventory/adjust-stock.ts

actions/delivery/create-batch.ts
```

Each action should follow:

```text
Input
 ↓
Authentication
 ↓
Authorization
 ↓
Zod validation
 ↓
Business rules
 ↓
Database transaction
 ↓
Event creation
 ↓
Return typed result
```

---

# 46. Business Logic Layer

Do not place complex business rules directly inside components.

Recommended conceptual structure:

```text
features/orders/
├── actions/
├── services/
├── validators/
├── queries/
├── mutations/
└── types/
```

Order service responsibilities:

- Validate order
- Calculate totals
- Reserve stock
- Create order
- Transition status
- Cancel order
- Recalculate delivery
- Create events

---

# 47. Validation

Use Zod for all external input.

Validate:

- Authentication context
- Product IDs
- Quantities
- Modifier IDs
- Room
- Delivery location
- Payment method
- Notes
- Order status transitions
- Admin forms

Never trust TypeScript types alone.

---

# 48. Security Requirements

Mandatory:

- RLS enabled on exposed tables
- Least privilege
- Server-only privileged keys
- Input validation
- Authorization checks
- Rate limiting for sensitive endpoints
- Idempotency
- Secure payment webhooks
- Audit logs
- Safe error messages
- No secret leakage
- No client-trusted prices
- No client-trusted inventory
- No client-trusted permissions

---

# 49. RLS Strategy

Customer:

```text
Can SELECT own profile
Can SELECT own orders
Can SELECT own order items
Can SELECT own notifications
```

Kitchen:

```text
Can SELECT authorized kitchen orders
Can update allowed kitchen fields
```

Delivery:

```text
Can SELECT assigned deliveries
Can update delivery lifecycle
```

Admin:

```text
Can access authorized branch/hotel data
```

Super Admin:

```text
Global access according to policy
```

RLS must complement application-level RBAC, not replace it.

---

# 50. Performance Strategy

Use:

- Server Components
- Selective Client Components
- Pagination
- Cursor pagination for large order lists
- Database indexes
- Proper foreign-key indexes
- Debounced search
- Optimized image sizes
- Lazy loading
- Suspense
- Skeletons
- Cached configuration
- Realtime channels only where needed
- Minimal payloads
- Avoid N+1 queries

Admin order tables must not load thousands of rows at once.

---

# 51. Mobile UX Requirements

Minimum touch target:

```text
44px+
```

Design for:

```text
360px
390px
430px
```

Then adapt to:

```text
Tablet
Desktop
Large Desktop
```

Customer:

```text
Bottom Navigation
Sticky Cart
Large Add Buttons
Simple Checkout
```

Kitchen:

```text
Large status buttons
Large timers
High contrast
Minimal text
Fast interactions
```

Delivery:

```text
Large action buttons
Batch cards
Room/location visibility
COD status
```

Admin:

```text
Responsive tables
Mobile cards
Desktop sidebar
Mobile bottom navigation where useful
```

---

# 52. Toast and Feedback System

Use a consistent global toast provider.

Categories:

```text
success
error
warning
info
```

Rules:

- No duplicate toasts for one event.
- Avoid showing toasts for every realtime event.
- Important information must persist in notifications.
- Errors must explain what the user can do next.
- Never expose database errors directly to users.

---

# 53. Loading / Empty / Error States

Every page and important component needs:

```text
Loading
Empty
Success
Error
Offline/Reconnecting where relevant
```

Example:

```text
No current orders.

Start exploring the menu.
[VIEW MENU]
```

Never leave blank screens.

---

# 54. Offline / Reconnection Behavior

At minimum:

- Detect connection state
- Show reconnecting indicator
- Reconnect realtime channels
- Prevent duplicate order submissions
- Preserve safe local cart state
- Refresh authoritative order state after reconnect

Do not claim an order was placed until the server confirms it.

---

# 55. Search and Filtering

Menu:

- Search by name
- Category
- Availability
- Dietary filters if configured

Admin:

- Order ID
- Customer
- Room
- Status
- Payment
- Date
- Delivery
- Priority

Use debounced search and server-side filtering for large datasets.

---

# 56. Reporting

Initial reports:

## Orders

- Total orders
- Completed
- Cancelled
- Average order value

## Revenue

- Gross revenue
- Discounts
- Service charges
- Delivery fees
- Net calculated revenue

## Menu

- Best sellers
- Least sellers
- Quantity sold
- Sold-out frequency

## Operations

- Average preparation time
- Average delivery time
- Delayed orders
- Kitchen load

Reports should be based on server/database queries, not client calculations over incomplete datasets.

---

# 57. Testing Strategy

Use:

- Unit tests
- Integration tests
- E2E tests
- Security/RLS tests
- Concurrency tests

Recommended E2E tool:

```text
Playwright
```

---

# 58. Critical Tests

## Test 1 — Last Item

Two users simultaneously order the final item.

Expected:

```text
Customer A → SUCCESS
Customer B → SOLD OUT
```

Never:

```text
Stock = -1
```

## Test 2 — Double Click

Customer presses Place Order twice.

Expected:

```text
One order
One inventory reservation
```

## Test 3 — Payment Callback

Same webhook arrives twice.

Expected:

```text
One payment transaction
```

## Test 4 — Browser Close

Payment succeeds and customer closes browser.

Expected:

```text
Order remains correctly recorded.
```

## Test 5 — Realtime

Kitchen marks order READY.

Expected:

```text
Customer updates
Admin updates
Delivery queue updates
```

## Test 6 — Capacity

Kitchen reaches capacity.

Expected:

```text
Preparation time increases
```

or:

```text
Ordering pauses
```

according to configuration.

---

# 59. Development Phases

## Phase 0 — Project Foundation

- [ ] Create Next.js project
- [ ] TypeScript
- [ ] Tailwind
- [ ] shadcn/ui
- [ ] ESLint
- [ ] Prettier
- [ ] Environment structure
- [ ] Git strategy
- [ ] CI/CD
- [ ] Error boundary
- [ ] Logging foundation

Gate:

Application starts cleanly and passes lint/typecheck.

---

## Phase 1 — Supabase Foundation

- [ ] Create Supabase project
- [ ] Configure local development if used
- [ ] Database migrations
- [ ] Extensions if required
- [ ] Tables
- [ ] Relationships
- [ ] Constraints
- [ ] Indexes
- [ ] RLS
- [ ] Database functions
- [ ] Seed data

Gate:

Database migration is reproducible from a clean environment.

---

## Phase 2 — Firebase Authentication

- [ ] Firebase project
- [ ] Google provider
- [ ] Firebase client configuration
- [ ] Supabase third-party Firebase authentication
- [ ] User mapping
- [ ] Profile creation
- [ ] Session handling
- [ ] Protected routes

Gate:

A new Google user can authenticate and receive the correct application profile.

---

## Phase 3 — RBAC

- [ ] Roles
- [ ] Permissions
- [ ] User-role mapping
- [ ] Role-permission mapping
- [ ] Authorization helpers
- [ ] Server-side checks
- [ ] RLS policies
- [ ] Route guards

Gate:

Each role can access only its authorized functionality.

---

## Phase 4 — Design System

- [ ] Typography
- [ ] Spacing
- [ ] Buttons
- [ ] Inputs
- [ ] Cards
- [ ] Dialogs
- [ ] Sheets
- [ ] Toasts
- [ ] Alerts
- [ ] Tables
- [ ] Tabs
- [ ] Navigation
- [ ] Skeletons
- [ ] Empty states
- [ ] Error states

Gate:

All interfaces use consistent reusable components.

---

## Phase 5 — Customer Menu

- [ ] Home
- [ ] Categories
- [ ] Search
- [ ] Menu list
- [ ] Food details
- [ ] Variants
- [ ] Modifiers
- [ ] Availability
- [ ] Cart

Gate:

Customer can browse and create a valid cart.

---

## Phase 6 — Order Engine

- [ ] Checkout
- [ ] Server-side price calculation
- [ ] Stock validation
- [ ] Inventory reservation
- [ ] Transactional order creation
- [ ] Idempotency
- [ ] Order state machine
- [ ] Order history

Gate:

No duplicate orders, negative inventory, or client-controlled pricing.

---

## Phase 7 — Payments

- [ ] Payment abstraction
- [ ] Online payment integration
- [ ] COD
- [ ] Payment records
- [ ] Webhooks
- [ ] Idempotent callbacks
- [ ] Refund architecture

Gate:

Payment state remains correct across refreshes, retries, and webhook duplication.

---

## Phase 8 — KOT / Kitchen

- [ ] Kitchen dashboard
- [ ] Live order queue
- [ ] Accept
- [ ] Preparing
- [ ] Ready
- [ ] Timer
- [ ] Priority
- [ ] Stations
- [ ] Capacity

Gate:

Kitchen can process orders without page refresh.

---

## Phase 9 — Crowd Management

- [ ] Capacity configuration
- [ ] Active order count
- [ ] Load levels
- [ ] Dynamic preparation time
- [ ] Queue prioritization
- [ ] Pause ordering
- [ ] Admin override

Gate:

High traffic cannot overwhelm kitchen capacity.

---

## Phase 10 — Delivery

- [ ] Delivery queue
- [ ] Delivery batches
- [ ] Assignment
- [ ] Driver/staff workflow
- [ ] Out for delivery
- [ ] Delivered
- [ ] COD collection

Gate:

A complete order can move from kitchen READY to delivered.

---

## Phase 11 — Notifications

- [ ] Notification database
- [ ] Notification service
- [ ] Templates
- [ ] Preferences
- [ ] In-app notifications
- [ ] Toasts
- [ ] Push architecture
- [ ] Realtime notifications
- [ ] Customer confirmation flow

Gate:

Important events generate the correct notifications exactly once.

---

## Phase 12 — Admin Dashboard

- [ ] Dashboard
- [ ] Orders
- [ ] Menu
- [ ] Inventory
- [ ] Customers
- [ ] Staff
- [ ] Payments
- [ ] Delivery
- [ ] Notifications
- [ ] Reports
- [ ] Business hours
- [ ] Capacity
- [ ] Settings

Gate:

Admin can operate the entire hotel without direct database access.

---

## Phase 13 — Super Admin

- [ ] Global dashboard
- [ ] Hotels
- [ ] Branches
- [ ] Users
- [ ] Roles
- [ ] Permissions
- [ ] Feature flags
- [ ] System settings
- [ ] Audit logs
- [ ] System health

Gate:

Super Admin has controlled global management without bypassing security architecture.

---

## Phase 14 — Realtime Hardening

- [ ] Broadcast channels
- [ ] Subscription lifecycle
- [ ] Reconnect handling
- [ ] Duplicate event prevention
- [ ] Event authorization
- [ ] Notification event handling
- [ ] Connection status UI

Gate:

Realtime works reliably during connection drops and reconnects.

---

## Phase 15 — Security Audit

- [ ] RLS audit
- [ ] RBAC audit
- [ ] Server action authorization
- [ ] Input validation
- [ ] Secret scanning
- [ ] Service-role isolation
- [ ] Payment webhook verification
- [ ] Rate limiting
- [ ] Audit logs
- [ ] Error message review

Gate:

No critical authorization or data-isolation issue remains.

---

## Phase 16 — Performance

- [ ] Query optimization
- [ ] Index review
- [ ] Pagination
- [ ] Image optimization
- [ ] Bundle review
- [ ] Client component review
- [ ] Realtime channel review
- [ ] Database query profiling
- [ ] Lighthouse/Core Web Vitals review

Gate:

Customer and staff workflows remain fast on mobile networks.

---

## Phase 17 — Final QA

- [ ] Customer E2E
- [ ] Kitchen E2E
- [ ] Delivery E2E
- [ ] Admin E2E
- [ ] Super Admin E2E
- [ ] Payment tests
- [ ] Inventory race tests
- [ ] RBAC tests
- [ ] RLS tests
- [ ] Responsive tests
- [ ] Accessibility tests
- [ ] Error recovery tests

Gate:

All critical workflows pass.

---

# 60. Environment Strategy

Use:

```text
development
staging
production
```

Never develop directly against production.

Environment variables should include only appropriate public values in browser code.

Example public variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
payment secret keys
webhook secrets
Firebase Admin private credentials
```

---

# 61. Error Handling

Create a standardized error model.

Categories:

```text
AUTH_ERROR
FORBIDDEN
VALIDATION_ERROR
NOT_FOUND
CONFLICT
OUT_OF_STOCK
SHOP_CLOSED
CAPACITY_REACHED
PAYMENT_ERROR
RATE_LIMITED
INTERNAL_ERROR
```

User-facing messages must be clear.

Do not expose SQL/database internals.

---

# 62. Observability

Production should have:

- Structured server logging
- Error tracking
- Audit logs
- Payment event logs
- Order event history
- Realtime connection diagnostics
- Performance monitoring

Every critical business action should be traceable.

---

# 63. Feature Flags

Create a feature flag mechanism for controlled rollout.

Examples:

```text
enable_online_payment
enable_cod
enable_delivery_batches
enable_customer_confirmation
enable_dynamic_capacity
enable_push_notifications
enable_multi_branch
```

This allows features to be enabled gradually.

---

# 64. Data Integrity Rules

Mandatory database constraints:

- Foreign keys
- Unique constraints where required
- Non-negative quantity constraints
- Valid status constraints
- Required timestamps
- Unique order numbers
- Unique Firebase UID
- Unique idempotency keys per operation scope

Use database constraints as a second line of defense.

---

# 65. Order Number

Use human-friendly order numbers.

Example:

```text
HB-2026-001024
```

Keep the internal primary key separate.

Never use the human-readable order number as the primary database ID.

---

# 66. Auditability

Every important order action should create an event:

```text
ORDER_CREATED
ORDER_CONFIRMED
ORDER_ACCEPTED
ORDER_PREPARING
ORDER_READY
ORDER_DELIVERY_ASSIGNED
ORDER_OUT_FOR_DELIVERY
ORDER_DELIVERED
ORDER_CANCELLED
PAYMENT_RECEIVED
PAYMENT_FAILED
```

This allows a complete order timeline.

---

# 67. Customer Experience Principles

Customer should never wonder:

- Did my order go through?
- Is my payment successful?
- Is the food being prepared?
- When will it arrive?
- Is the shop open?
- Is my food available?

Every critical question should have an immediate UI answer.

---

# 68. Staff Experience Principles

Staff should never need to:

- Refresh the page
- Search through huge order lists
- Remember complicated workflows
- Manually calculate totals
- Manually calculate stock
- Guess order priority
- Guess kitchen capacity

The system should surface the correct action.

---

# 69. AI Coding Agent Rules

If implementing this project with Antigravity or another coding agent:

1. Do not build all screens in one generation.
2. Do not invent database structures after implementation has started.
3. Do not bypass RLS.
4. Do not use service-role credentials in client components.
5. Do not hardcode permissions.
6. Do not hardcode prices.
7. Do not trust client inventory.
8. Do not create duplicate business logic.
9. Do not silently modify schema without a migration.
10. Do not move to the next phase if the current phase fails its gate.
11. Run typecheck after meaningful changes.
12. Run lint after meaningful changes.
13. Run tests after business logic changes.
14. Preserve existing working functionality.
15. Prefer small, reversible changes.
16. Explain migration impact before destructive schema changes.
17. Never delete production data as part of development.
18. Use seed data only in development/staging.
19. Keep secrets out of source control.
20. Keep the project buildable at every phase.

---

# 70. Required Implementation Loop

Every feature must follow:

```text
PLAN
 ↓
SCHEMA
 ↓
MIGRATION
 ↓
RLS
 ↓
TYPES
 ↓
VALIDATION
 ↓
SERVER LOGIC
 ↓
UI
 ↓
REALTIME
 ↓
NOTIFICATIONS
 ↓
TESTS
 ↓
SECURITY CHECK
 ↓
PERFORMANCE CHECK
 ↓
DONE
```

---

# 71. Definition of Done

A feature is NOT complete simply because its UI exists.

A feature is complete only when:

- UI exists
- Mobile responsive
- Loading state exists
- Empty state exists
- Error state exists
- Validation exists
- Authorization exists
- RLS exists
- Server logic exists
- Database constraints exist
- Realtime behavior works if required
- Notifications work if required
- Audit logging exists if required
- Tests pass
- Typecheck passes
- Lint passes
- No secrets exposed
- No console errors
- No critical accessibility issue

---

# 72. Final Build Order

The AI development agent must follow this sequence:

```text
ARCHITECTURE
    ↓
DATABASE
    ↓
MIGRATIONS
    ↓
RLS
    ↓
FIREBASE AUTH
    ↓
RBAC
    ↓
DESIGN SYSTEM
    ↓
CUSTOMER MENU
    ↓
CART
    ↓
ORDER ENGINE
    ↓
INVENTORY
    ↓
PAYMENTS
    ↓
KOT
    ↓
CROWD MANAGEMENT
    ↓
DELIVERY
    ↓
REALTIME
    ↓
NOTIFICATIONS
    ↓
ADMIN
    ↓
SUPER ADMIN
    ↓
REPORTING
    ↓
AUDIT
    ↓
TESTING
    ↓
SECURITY
    ↓
PERFORMANCE
    ↓
PRODUCTION
```

---

# 73. Final Product Architecture

The final product should behave like:

```text
                    HOTEL FOOD PLATFORM
                           |
          +----------------+----------------+
          |                |                |
       CUSTOMER           STAFF          MANAGEMENT
          |                |                |
          |          +-----+-----+          |
          |          |           |          |
       Ordering     Kitchen    Delivery    Admin
          |          |           |          |
          +----------+-----------+----------+
                           |
                    ORDER ENGINE
                           |
          +----------------+----------------+
          |                |                |
       Inventory        Payments       Notifications
          |                |                |
          +----------------+----------------+
                           |
                     SUPABASE
                           |
       +-------------------+-------------------+
       |                   |                   |
   PostgreSQL           Realtime            Storage
       |
      RLS
       |
      RBAC
       |
   Audit Logs
```

---

# 74. Final Success Criteria

The platform should achieve:

### Customer

Fast, simple, mobile-first ordering.

### Kitchen

Fast, realtime KOT processing.

### Delivery

Simple batch-based delivery.

### Admin

Complete operational control.

### Super Admin

Secure global management.

### Backend

Transactional, secure, scalable architecture.

### Business

Accurate inventory, controlled kitchen capacity, reliable payments, realtime status, and complete auditability.

The implementation should prioritize **correctness, security, maintainability, and operational simplicity over unnecessary feature complexity**.
