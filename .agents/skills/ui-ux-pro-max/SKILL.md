---
name: ui-ux-pro-max
description: Detailed UX and Design System guidelines. Instructs the agent on structuring layouts, form validation, spacing, and avoiding typical AI-generated UI slop.
---

# UI-UX Pro Max: Playbook for Modern Design Systems

Create robust, polished, and highly usable design systems for web applications.

## Design System & Tokens
*   **Visual Direction:** Avoid generic AI aesthetics (default card grids, random purple gradients, Inter default). Create a calm, professional, and trustworthy aesthetic.
*   **Colors:** Use a cohesive, semantic palette. For Meal CRM: Use green/emerald for active status, amber/orange for paused, red/rose for debt/critical alerts, and neutral slates/grays for borders and metadata.
*   **Typography:** Set clean hierarchical typography. Set headings to `text-wrap: balance` and tables to tabular numerals.

## UX Best Practices for CRM / Dashboards
*   **Non-Technical Copy:** Translate all database concepts to human business language. Prefer:
    *   `Client` -> `Клиент`
    *   `Package` -> `Пакет`
    *   `Payment` -> `Оплата`
    *   `Delivery` -> `Доставка`
    *   `Freeze` -> `Заморозка`
    *   `Extension` -> `Продление`
*   **Actionable Dashboards:** Design the dashboard to be a cockpit for the manager. Show active counts, highlight tasks that need attention (e.g. today's deliveries, clients with unpaid debts).
*   **Clean Component Structures:** Break massive page route files into smaller components. Put dialogs and sub-forms into distinct components under a `components` directory instead of bundling 1000+ lines in a single route.
*   **Progressive Disclosure:** Keep details hidden in expandable cards or tabs. Let the manager see high-level stats immediately, and expand to view histories of payments, deliveries, or freezes.
