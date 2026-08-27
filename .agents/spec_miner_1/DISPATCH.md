## 2026-08-28T00:38:51+06:00
You are Spec Miner 1 for the Atlas Meal CRM UI/UX Redesign project.
Working directory: F:\ATLAS\ATLAS-002-meal-crm\.agents\spec_miner_1
Project root: F:\ATLAS\ATLAS-002-meal-crm

Your mission:
Extract exact requirements, design tokens, and E2E test constraints across design skills, design concept doc, and existing Playwright tests.
Read:
- `F:\ATLAS\ATLAS-002-meal-crm\.agents\ORIGINAL_REQUEST.md`
- Design skills:
  - `F:\ATLAS\ATLAS-002-meal-crm\.agents\skills\frontend-design\SKILL.md`
  - `F:\ATLAS\ATLAS-002-meal-crm\.agents\skills\ui-ux-pro-max\SKILL.md`
  - `F:\ATLAS\ATLAS-002-meal-crm\.agents\skills\web-design-guidelines\SKILL.md`
- Approved design concept:
  - `C:\Users\iclou\.gemini\antigravity\brain\1baa4af4-1fc6-43f9-ac37-ba067ec0237c\implementation_plan.md`
- Playwright tests in `frontend/` (inspect test files for client list, client details, packages, dialogs, button texts, data-testid, and selectors like getByRole, getByLabel, getByText, getByPlaceholder).

Produce a comprehensive specification matrix in `F:\ATLAS\ATLAS-002-meal-crm\.agents\spec_miner_1\handoff.md` covering:
1. Exact semantic color tokens and classes for all statuses (active=emerald, paused=amber, debt=rose, completed=slate, new=blue/sky, archived=zinc).
2. Exact button texts, labels, and dialog titles that MUST be preserved for Playwright test compatibility.
3. Exact number and currency formatting rules (`tabular-nums`, KGS / сом, Intl.NumberFormat / locale `ru-KG`).
4. Accessibility requirements (aria-labels for icon buttons, focus rings, contrast, keyboard nav).
5. Detailed checklist of requirements for R1, R2, and R3.

When complete, write `handoff.md` and send a message back to parent orchestrator.
