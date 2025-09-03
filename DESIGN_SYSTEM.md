# Asha.News Design System

## Overview

This design system provides a comprehensive guide for maintaining visual consistency across the Asha.News application. It defines colors, typography, spacing, components, and interaction patterns to ensure a cohesive user experience.

## Color Palette

### Surface Colors

```css
/* Light Mode */
--background-light: #fefefe;           /* Main background */
--surface-light: #ffffff;             /* Card backgrounds, modals */
--surface-elevated-light: #f8f9fa;    /* Elevated cards, buttons */

/* Dark Mode */
--background-dark: #0f0f0f;           /* Main background */
--surface-dark: #1a1a1a;             /* Card backgrounds, modals */
--surface-elevated-dark: #2a2a2a;     /* Elevated cards, buttons */
```

### Text Colors

```css
/* Light Mode */
--text-primary-light: #1a1a1a;        /* Headlines, primary text */
--text-secondary-light: #666666;      /* Supporting text, metadata */

/* Dark Mode */
--text-primary-dark: #ffffff;         /* Headlines, primary text */
--text-secondary-dark: #a0a0a0;       /* Supporting text, metadata */
```

### Primary Colors (Gold/Ember Accent) - UNIFIED CTA COLORS

```css
/* Used for CTAs, buttons, links, active states - CONSISTENT ACROSS ALL COMPONENTS */
--primary-50: #fffbeb;    /* Lightest gold tint */
--primary-100: #fef3c7;   /* Light gold */
--primary-200: #fde68a;   /* Soft gold */
--primary-300: #fcd34d;   /* Medium gold */
--primary-400: #fbbf24;   /* Bright gold */
--primary-500: #f59e0b;   /* Base gold/amber */
--primary-600: #d97706;   /* Primary CTA color */
--primary-700: #b45309;   /* Darker gold */
--primary-800: #92400e;   /* Deep amber */
--primary-900: #78350f;   /* Darkest ember */
```

### Semantic Colors

```css
/* Bias Indicators - CONSISTENT ACROSS ALL BIAS DISPLAYS */
--bias-left: #3b82f6;      /* Blue for left-leaning */
--bias-center: #6b7280;    /* Gray for center */
--bias-right: #ef4444;     /* Red for right-leaning */

/* Status Colors */
--success: #10b981;        /* Green for success states */
--warning: #f59e0b;        /* Amber for warnings (matches primary) */
--error: #ef4444;          /* Red for errors */
--info: #3b82f6;           /* Blue for information */
```

### Neutral Grays - CONSISTENT ACROSS ALL NEUTRAL ELEMENTS

```css
--gray-50: #f9fafb;        /* Lightest backgrounds */
--gray-100: #f3f4f6;       /* Light backgrounds */
--gray-200: #e5e7eb;       /* Borders, dividers */
--gray-300: #d1d5db;       /* Disabled states */
--gray-400: #9ca3af;       /* Placeholder text */
--gray-500: #6b7280;       /* Secondary text */
--gray-600: #4b5563;       /* Primary gray text */
--gray-700: #374151;       /* Dark gray */
--gray-800: #1f2937;       /* Very dark gray */
--gray-900: #111827;       /* Darkest gray */
```

## Typography

### Font Families

```css
--font-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: "SF Mono", Monaco, "Cascadia Code", monospace;
```

### Font Sizes & Weights

```css
/* Headlines */
--text-4xl: 2.25rem;    /* 36px - Page titles */
--text-3xl: 1.875rem;   /* 30px - Section headers */
--text-2xl: 1.5rem;     /* 24px - Card titles */
--text-xl: 1.25rem;     /* 20px - Large text */
--text-lg: 1.125rem;    /* 18px - Body large */

/* Body Text */
--text-base: 1rem;      /* 16px - Default body */
--text-sm: 0.875rem;    /* 14px - Small text */
--text-xs: 0.75rem;     /* 12px - Captions, metadata */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing System

### Base Unit: 4px (0.25rem)

```css
--space-1: 0.25rem;     /* 4px */
--space-2: 0.5rem;      /* 8px */
--space-3: 0.75rem;     /* 12px */
--space-4: 1rem;        /* 16px */
--space-5: 1.25rem;     /* 20px */
--space-6: 1.5rem;      /* 24px */
--space-8: 2rem;        /* 32px */
--space-10: 2.5rem;     /* 40px */
--space-12: 3rem;       /* 48px */
--space-16: 4rem;       /* 64px */
--space-20: 5rem;       /* 80px */
```

## Border Radius

```css
--radius-sm: 0.25rem;   /* 4px - Small elements */
--radius-md: 0.5rem;    /* 8px - Default */
--radius-lg: 0.75rem;   /* 12px - Cards */
--radius-xl: 1rem;      /* 16px - Large cards */
--radius-full: 9999px;  /* Pills, buttons */
```

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-mobile: 0 2px 4px -1px rgb(0 0 0 / 0.1);
```

## Component Patterns

### Article Cards

```css
/* Base Article Card */
.article-card {
  background: var(--surface-elevated-light);
  border: 1px solid rgb(var(--primary-200) / 0.2);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-mobile);
  padding: var(--space-4);
}

.dark .article-card {
  background: var(--surface-elevated-dark);
  border-color: rgb(var(--primary-700) / 0.2);
}
```

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--primary-600);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--primary-700);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  border: 1px solid var(--text-secondary-light);
  color: var(--text-secondary-light);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--primary-50);
  border-color: var(--primary-600);
  color: var(--primary-600);
}

.dark .btn-secondary:hover {
  background: var(--primary-900);
  border-color: var(--primary-400);
  color: var(--primary-400);
}
```

### Navigation

```css
/* Header Navigation */
.nav-header {
  background: var(--surface-light);
  border-bottom: 1px solid var(--gray-200);
  padding: var(--space-4) 0;
}

.dark .nav-header {
  background: var(--surface-dark);
  border-bottom-color: var(--gray-700);
}

/* Trending Topics Bar */
.trending-topics {
  background: var(--surface-light);
  padding: var(--space-2) 0;
  overflow: hidden;
}

.dark .trending-topics {
  background: var(--surface-dark);
}

.topic-button {
  background: var(--surface-elevated-light);
  color: var(--text-primary-light);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all 0.2s;
}

.topic-button:hover {
  background: var(--primary-50);
}

.dark .topic-button {
  background: var(--surface-elevated-dark);
  color: var(--text-primary-dark);
}

.dark .topic-button:hover {
  background: var(--primary-900);
}
```

### Bias Indicators

```css
.bias-left {
  background: rgb(var(--bias-left) / 0.1);
  color: var(--bias-left);
  border: 1px solid rgb(var(--bias-left) / 0.2);
}

.bias-center {
  background: rgb(var(--bias-center) / 0.1);
  color: var(--bias-center);
  border: 1px solid rgb(var(--bias-center) / 0.2);
}

.bias-right {
  background: rgb(var(--bias-right) / 0.1);
  color: var(--bias-right);
  border: 1px solid rgb(var(--bias-right) / 0.2);
}
```

## Layout Patterns

### Container Widths

```css
.container-sm: max-width: 640px;   /* Small content */
.container-md: max-width: 768px;   /* Medium content */
.container-lg: max-width: 1024px;  /* Large content */
.container-xl: max-width: 1280px;  /* Extra large */
.container-2xl: max-width: 1536px; /* Maximum width */
```

### Grid Systems

```css
/* Article Grid */
.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-6);
}

/* Two Column Layout */
.two-column {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: var(--space-8);
}

@media (max-width: 1024px) {
  .two-column {
    grid-template-columns: 1fr;
  }
}
```

## Interactive States

### Hover States

```css
/* Card Hover */
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Button Hover */
.button:hover {
  transform: translateY(-1px);
}

/* Link Hover */
.link:hover {
  color: var(--primary-600);
  text-decoration: underline;
}
```

### Focus States

```css
.focusable:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

## Animations

```css
/* Smooth Transitions */
.transition-colors {
  transition: color 0.2s ease-in-out;
}

.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Loading States */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Scroll Animation */
@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-scroll {
  animation: scroll 60s linear infinite;
}
```

## Responsive Breakpoints

```css
/* Mobile First Approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

## Usage Guidelines

### Do's

- Use surface-elevated for interactive elements (cards, buttons)
- Maintain consistent spacing using the 4px base unit
- Use primary colors sparingly for emphasis
- Follow the established typography hierarchy
- Ensure proper contrast ratios for accessibility

### Don'ts

- Don't use primary colors for large background areas
- Don't mix different spacing scales
- Don't use more than 3 font weights in a single component
- Don't create custom colors outside the defined palette
- Don't ignore dark mode considerations

## Component Library Reference

### Tailwind CSS Classes

```css
/* Backgrounds */
bg-background-light dark:bg-background-dark
bg-surface-light dark:bg-surface-dark
bg-surface-elevated-light dark:bg-surface-elevated-dark

/* Text */
text-text-primary-light dark:text-text-primary-dark
text-text-secondary-light dark:text-text-secondary-dark

/* Borders */
border-primary-200 dark:border-primary-700
border-primary-200/20 dark:border-primary-700/20

/* Hover States */
hover:bg-primary-50 dark:hover:bg-primary-900
hover:text-primary-600 dark:hover:text-primary-400
```

## Implementation Notes

1. **Consistency**: Always use defined color variables instead of hardcoded values
2. **Accessibility**: Ensure minimum 4.5:1 contrast ratio for text
3. **Performance**: Use CSS custom properties for theme switching
4. **Maintainability**: Update this document when adding new patterns
5. **Testing**: Test all components in both light and dark modes

---

*Last updated: September 2025*
*Version: 1.0*
