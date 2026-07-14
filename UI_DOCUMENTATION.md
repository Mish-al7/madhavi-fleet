# UI & Theming Documentation - ActivFleet (Fleet Ledger)

This document explains the user interface architecture, color palette system, and the theme switching mechanism implemented in ActivFleet.

---

## 🎨 Theme Architecture: The Slate Inversion System

Unlike traditional Next.js Tailwind applications that rely on verbose inline utility variations like `bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100` on every single element, this project utilizes an elegant **Slate Inversion System** built on **Tailwind CSS v4**'s CSS variables.

The codebase is written **as if it were dark mode first**. Standard classes like `bg-slate-950` (dark background) and `text-slate-100` (light text) are applied directly. When the application switches to light mode, it swaps the underlying Slate color definitions in CSS rather than swapping the utility classes on the HTML elements.

### How it works (Variables Mapping)

In [src/app/globals.css](file:///Ubuntu/home/mish/madhavi-fleet/src/app/globals.css), when the HTML document contains the class `.light`, the standard Tailwind CSS slate palette variables are mapped to their opposite values:

| Slate Variable | Dark Mode (Default) | Light Mode (`.light` overrides) |
| :--- | :--- | :--- |
| `--color-slate-50` | `#f8fafc` (Very light) | `#0f172a` (Very dark) |
| `--color-slate-100` | `#f1f5f9` | `#0f172a` |
| `--color-slate-200` | `#e2e8f0` | `#1e293b` |
| `--color-slate-300` | `#cbd5e1` | `#334155` |
| `--color-slate-400` | `#94a3b8` | `#475569` |
| `--color-slate-500` | `#64748b` | `#64748b` (Middle gray) |
| `--color-slate-600` | `#475569` | `#cbd5e1` |
| `--color-slate-700` | `#334155` | `#e2e8f0` |
| `--color-slate-800` | `#1e293b` | `#f1f5f9` |
| `--color-slate-900` | `#0f172a` | `#ffffff` |
| `--color-slate-950` | `#020617` (Deep dark) | `#f8fafc` (Off-white) |

### Visual Results of Inversion
* **Backgrounds**: A container styled with `bg-slate-950` renders deep blue-black `#020617` in Dark Mode, but automatically renders off-white `#f8fafc` in Light Mode.
* **Text**: Text styled with `text-slate-100` renders light grey in Dark Mode, but automatically renders dark slate `#0f172a` in Light Mode.
* **Borders**: Divider lines styled with `border-slate-800` render dark borders in Dark Mode, but automatically render light grey borders `#f1f5f9` in Light Mode.

---

## 🛠️ Editing and Modifying Styles

### 1. Adding Colors/Themes
If you want to edit the colors used in either theme, modify the corresponding CSS variables under the `.light` block in [src/app/globals.css](file:///Ubuntu/home/mish/madhavi-fleet/src/app/globals.css):

```css
.light {
  --color-slate-950: #f8fafc; /* Change the base background of light mode */
  --color-slate-900: #ffffff; /* Change the card/panel background of light mode */
  --color-slate-100: #0f172a; /* Change the primary text color of light mode */
  /* ... */
}
```

### 2. Safeguarding Solid Color Elements (Text White Overrides)
Because text like `text-white` would normally get inverted to dark slate in light mode, the system contains rules in [src/app/globals.css](file:///Ubuntu/home/mish/madhavi-fleet/src/app/globals.css) to ensure buttons, badges, and alerts with solid background colors keep their white text contrast:

```css
/* Dynamic text-white override for light mode (excluding buttons/badges with solid colored backgrounds) */
.light :not([class*="bg-blue-"]):not([class*="bg-emerald-"]):not([class*="bg-red-"]):not([class*="bg-purple-"]):not([class*="bg-indigo-"]):not([class*="bg-rose-"]):not([class*="bg-amber-"]):not([class*="bg-green-"]):not([class*="bg-yellow-"]):not([class*="bg-teal-"]):not([class*="bg-sky-"]):not([class*="bg-violet-"]).text-white {
  color: var(--color-slate-100) !important;
}
```
* **To ensure white text stays white** in Light Mode, make sure the element includes a background utility prefix matching one of the negated lists above (e.g. `bg-blue-600`, `bg-emerald-500`).
* **If you introduce a new background color series** (e.g., `bg-orange-500` or `bg-cyan-500`) and want its text to remain white in light mode, you must append `:not([class*="bg-orange-"]):not([class*="bg-cyan-"])` to both of the `.light ... text-white` overrides in [src/app/globals.css](file:///Ubuntu/home/mish/madhavi-fleet/src/app/globals.css).

---

## 🔄 The Theme Switching Mechanism

The theme toggle flows through three layers: the Root Layout, the Theme Toggle UI Component, and Global CSS overrides.

### 1. Prevent Screen Flashing (Hydration Block)
To prevent a brief white or dark flash during server-side rendering (SSR), [src/app/layout.js](file:///Ubuntu/home/mish/madhavi-fleet/src/app/layout.js) runs a small inline blocking script before the DOM renders:

```javascript
<html lang="en" suppressHydrationWarning>
  <head>
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme');
              if (theme === 'dark') {
                document.documentElement.classList.remove('light');
              } else {
                document.documentElement.classList.add('light');
              }
            } catch (e) {}
          })();
        `
      }}
    />
  </head>
  ...
</html>
```
* **Default Theme**: If no preference is saved in local storage, it defaults to **Light Mode** by calling `document.documentElement.classList.add('light')`.
* **Suppress Hydration**: `suppressHydrationWarning` is added to the HTML tag to prevent React from throwing errors due to discrepancy between the server HTML and client HTML attributes updated by the inline script.

### 2. Theme Toggle Component
The theme selection is handled by the `ThemeToggle` component in [src/components/ui/ThemeToggle.js](file:///Ubuntu/home/mish/madhavi-fleet/src/components/ui/ThemeToggle.js). It toggles the class name on the root document element and persists the choice in `localStorage`:

* **When Theme is Dark**:
  Adds class `.light` to `<html>` and updates `localStorage.setItem('theme', 'light')`.
* **When Theme is Light**:
  Removes class `.light` from `<html>` and updates `localStorage.setItem('theme', 'dark')`.

---

## 💡 Best Practices for UI Development in ActivFleet

1. **Keep HTML markup clean**: Always write Tailwind styles for dark mode as the base.
   * *Do*: `<div className="bg-slate-900 border border-slate-800 text-slate-100">`
   * *Avoid*: `<div className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">`
2. **Icons**: Use lucide icon colors carefully. Lucide icons generally use standard text color values (e.g. `text-slate-400` or `text-slate-100`), which automatically invert.
3. **Date/Time/Month inputs**: Date picker icons are inverted in dark mode to keep them visible (`filter: invert(1)`). In light mode, this filter is reset to normal (`filter: invert(0)`). Feel free to use standard html inputs as this is handled globally.
