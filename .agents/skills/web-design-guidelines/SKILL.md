---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
---

# Web Interface Guidelines

Review UI code against these accessibility, focus, form, and performance rules.

## Rules

### Accessibility
*   **Icon-only buttons:** Need `aria-label`.
*   **Form controls:** Need `<label>` or `aria-label`.
*   **Interactive elements:** Need keyboard handlers (`onKeyDown`/`onKeyUp`).
*   **Navigation vs Action:** Use `<button>` for actions, `<a>`/`<Link>` for navigation (never `<div onClick>`).
*   **Images:** Need `alt` (or `alt=""` if decorative).
*   **Decorative icons:** Need `aria-hidden="true"`.
*   **Async updates:** Toasts, alerts, and validations need `aria-live="polite"`.
*   **Semantic HTML:** Prefer `<button>`, `<a>`, `<label>`, `<table>` over generic divs with ARIA.

### Focus States
*   **Visible focus:** All interactive elements need visible focus: `focus-visible:ring-*` or equivalent.
*   **Never hide focus:** Never use `outline-none` or `outline: none` without a focus ring replacement.
*   **Focus-visible:** Use `:focus-visible` over `:focus` to avoid focus rings on click.

### Forms
*   **Autocomplete:** Inputs need `autocomplete` and meaningful `name` attributes.
*   **Inputs:** Use correct `type` (`email`, `tel`, `url`, `number`) and `inputmode`.
*   **No blocked paste:** Never prevent pasting into forms (`onPaste` + `preventDefault`).
*   **Labels:** Make labels clickable (`htmlFor` or wrapping the input).
*   **Spellcheck:** Disable spellcheck on email, usernames, or unique codes (`spellCheck={false}`).
*   **Buttons:** Keep submit buttons enabled until requests start; show spinners during async operations.
*   **Errors:** Display errors inline next to fields and focus the first invalid field on submit.

### Typography & Content
*   **Ellipses:** Use `…` instead of `...`.
*   **Typography:** Tabular numbers `font-variant-numeric: tabular-nums` for columns. Text wrapping `text-wrap: balance` or `text-pretty` for headings.
*   **Empty states:** Always handle empty states gracefully (render fallback copy instead of blank spaces).
