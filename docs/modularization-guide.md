# BrainDB Modularization Guide

This guide provides instructions for converting existing BrainDB menu pages to use the new modular component system.

## Directory Structure

The new modular architecture uses the following structure:

```
public/
  css/
    main.css              # Main CSS file that imports all modular CSS files
    base/                 # Base styles like theme variables
      theme.css
    components/           # Reusable component styles
      cards.css
      charts.css
      forms.css
      tables.css
      tabs.css
    layouts/              # Page-specific layout styles
      analytics-layout.css
      students-layout.css
      # etc.
  templates/              # HTML templates for reusable components
    stat-card.html
    chart.html
    data-table.html
    # etc.
  utils/
    component-system.js   # JavaScript for the component system
```

## Converting a Page to the Component System

Follow these steps to convert an existing page to use the component system:

### 1. Remove Embedded CSS

Extract any page-specific CSS from your HTML file and move it to the appropriate files in the `css/` directory:

- Move component styles to their respective files in `components/`
- Move layout styles to a new file in `layouts/`
- Add imports to `main.css` if necessary

### 2. Update HTML Structure

Update your page's HTML to use the modular structure:

- Create placeholder containers for components
- Remove hardcoded component HTML

Example:

```html
<!-- Before -->
<div class="stats-overview">
    <div class="stat-card">
        <div class="stat-label">Total Students</div>
        <div class="stat-value">450</div>
        <!-- ... -->
    </div>
    <!-- ... more stat cards ... -->
</div>

<!-- After -->
<div class="stats-overview">
    <!-- Empty containers for components -->
    <div id="total-students-container"></div>
    <div id="attendance-rate-container"></div>
    <!-- ... more containers ... -->
</div>
```

### 3. Update JavaScript

Update your page's JavaScript to use the component system:

```javascript
// Example: Rendering components
async function renderStatCards() {
    // Total Students Card
    await ComponentSystem.insertComponent(
        '#total-students-container',
        'stat-card',
        {
            label: 'Total Students',
            value: 450,
            valueId: 'total-students-stat',
            changeClass: '',
            svgPath: 'M8 4L12 8L8 12M4 8L12 8',
            changeText: '432 active'
        }
    );
    
    // More components...
}
```

## Testing Your Changes

After converting a page, make sure to test:

1. The page loads without errors
2. All components render correctly
3. All interactive features work
4. The styling is consistent with the original page

## Benefits of the Component System

- **Reusability**: Components can be shared across multiple pages
- **Maintainability**: Changes to a component are reflected everywhere it's used
- **Consistency**: Design patterns and styles are consistent throughout the application
- **Performance**: CSS and JS files are organized for better caching
