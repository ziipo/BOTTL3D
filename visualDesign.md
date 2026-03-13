# Visual Design System: Axiom 3D

This document outlines the visual design elements, aesthetics, and user interface standards applied to the FRAM3D project. The design is inspired by technical blueprints and engineering drafts, emphasizing precision, clarity, and a "built-for-builders" aesthetic.

## 1. Aesthetic Concept: "The Digital Draft"
The interface mimics a high-tech blueprint or architectural drafting board. Key characteristics include:
- **Sharp Corners:** Zero border-radii throughout the application to maintain a mechanical, precision-machined look.
- **Grid Background:** A subtle 40px x 40px coordinate grid that reinforces the 3D space and measurement-focused nature of the tool.
- **Technical Typography:** Clear distinction between instructional labels (Sans) and data/values (Mono).

---

## 2. Color Palettes (Theming)
The project supports two primary themes: **Vellum (Light)** and **Deep Draft (Dark)**.

### **Vellum (Light Mode)**
*Optimized for high-visibility drafting in bright environments.*
- **Primary:** `#003366` (Deep Navy)
- **Background:** `#EBF3FF` (Pale Blueprint Blue)
- **Surface/Sidebar:** `#D1E3FF` (Soft Sky Blue)
- **Text Main:** `#002D5C` (Dark Indigo)
- **Text Muted:** `#335A85` (Steel Blue)
- **Borders:** `#004A99` (Cobalt Outline)
- **Grid:** `rgba(0, 80, 158, 0.1)`

### **Deep Draft (Dark Mode)**
*Inspired by CAD software and modern developer environments.*
- **Primary:** `#64FFDA` (Cyan/Teal)
- **Background:** `#0A192F` (Deep Space Blue)
- **Surface/Sidebar:** `#112240` (Midnight Blue)
- **Text Main:** `#E6F1FF` (Frost White)
- **Text Muted:** `#A0ACC0` (Cool Gray)
- **Borders:** `#CCD6F6` (Light Steel)
- **Grid:** `rgba(100, 255, 218, 0.05)`

---

## 3. Typography
The system uses a dual-font approach to separate UI navigation from technical data.

- **Sans-Serif (Primary):** `Inter`
  - Used for headers, labels, and general UI text.
  - **Styles:** Regular (400), Medium (500), Semi-bold (600).
- **Monospace (Technical):** `JetBrains Mono`
  - Used for numerical inputs, dimensions, units (mm/in), and code-like data.
  - **Styles:** Regular (400), Bold (700).

---

## 4. UI Components & Layout
### **Borders & Radii**
- **Border Radius:** `0px` (Strictly enforced on all buttons, inputs, and panels).
- **Border Width:** `1px` standard, `2px` for active/focus states.

### **Structure**
- **Sidebar:** Fixed-width (320px) on desktop, containing all parametric controls. Collapsible sections keep the UI organized.
- **3D Preview:** Takes up the remaining viewport space. On mobile, the preview moves to the top for immediate visual feedback.
- **Header:** Slim, high-contrast bar containing the application title and theme toggle.

### **Interactive Elements**
- **Custom Scrollbar:** Styled to match the blueprint aesthetic (thin, sharp, colored to match the theme).
- **Collapsible Sections:** Animated transitions (`animate-in`, `fade-in`, `slide-in-from-top-1`) for a smooth but snappy feel.
- **Switches:** Blocky, rectangular toggles that reinforce the "sharp corner" design language.

---

## 5. Accessibility & UX
- **Semantic HTML:** Uses `<aside>`, `<main>`, `<header>`, and appropriate heading levels (`<h1>`-`<h4>`).
- **Contrast:** High-contrast text colors selected for both themes to ensure readability.
- **Focus States:** High-visibility focus rings and border changes for keyboard navigation.
- **ARIA Labels:** Applied to controls like the theme toggle and split-parts switch for screen reader support.
- **Responsive Layout:** Automatically adjusts from side-by-side (Desktop) to stacked (Mobile) to ensure usability on tablets and phones.

---

## 6. Motion & Transitions
- **Theme Switching:** 0.2s color ease transition for a smooth shift between Light and Dark modes.
- **Micro-interactions:** Subtle hover effects on buttons and icons using the `--color-primary` variable.
- **Entry Animations:** Standardized 200ms duration for panel expansions and content loading.
