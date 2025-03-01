// Import translations helper
import { getTranslatedText } from './translations.js';
import { ensureProperTitleDisplay } from './chartHelper.js';

// Function to create or update the treemap
export function createTreemap(canvasElement, data, year, language = 'en') {
  // Get existing chart instance if any
  const existingChart = Chart.getChart(canvasElement);

  // Make sure we have data to display
  if (!data || data.length === 0) {
    console.error('No data available for treemap');
    return null;
  }

  // Updated colors for different groups to match the unified color scheme
  const defaultColors = {
    'ICT Services': 'rgba(16, 150, 110, 0.85)',  // Teal blue for ICT services
    'ICT Manufacturing': 'rgba(24, 119, 242, 0.85)', // Blue for manufacturing
    'ICT Wholesale': 'rgba(220, 57, 18, 0.85)',   // Red for wholesale
    // Add Latvian translations as well
    'IKT pakalpojumi kopā': 'rgba(16, 150, 110, 0.85)',  // Teal blue for ICT services
    'IKT ražošana': 'rgba(24, 119, 242, 0.85)', // Blue for manufacturing
    'IKT vairumtirdzniecība': 'rgba(220, 57, 18, 0.85)'   // Red for wholesale
  };

  // Get translated group names for color mapping
  const servicesGroup = getTranslatedText(language, 'ictServicesTotal');
  const manufacturingGroup = getTranslatedText(language, 'ictManufacturing');
  const wholesaleGroup = getTranslatedText(language, 'ictWholesale');

  // Background color function that uses the correct translated category names
  const getBackgroundColor = (ctx) => {
    if (!ctx.raw || !ctx.raw._data) return defaultColors['ICT Services'];
    
    const data = ctx.raw._data;
    const groupName = data.group;
    
    // Match translated group names for proper color assignment
    // First check if the group name exists directly in the defaultColors
    if (defaultColors[groupName]) {
      return defaultColors[groupName];
    }
    // As a fallback, check against known translations
    else if (groupName === servicesGroup) {
      return defaultColors['ICT Services'];
    } 
    else if (groupName === manufacturingGroup) {
      return defaultColors['ICT Manufacturing'];
    }
    else if (groupName === wholesaleGroup) {
      return defaultColors['ICT Wholesale'];
    }
    
    // Default color if none of the above
    console.log('No color match for:', groupName);
    return defaultColors['ICT Services'];
  };

  // Label formatter function
  const formatLabels = (ctx) => {
    // Check if we have valid raw data
    if (!ctx.raw || !ctx.raw._data) return '';

    // For ICT Services subcategories, show shorter name and value
    if (ctx.raw._data.category && ctx.raw._data.category.includes(`${servicesGroup}: `)) {
      const shortName = ctx.raw._data.category.split(': ')[1];
      return [shortName, ctx.raw.v];
    }

    // For main categories (Manufacturing, Wholesale)
    return ctx.raw._data.category ? [ctx.raw._data.category, ctx.raw.v] : [ctx.raw.v];
  };

  // Tooltip callbacks
  const tooltipCallbacks = {
    title: (items) => {
      if (!items.length || !items[0].raw._data) return 'Unknown';
      const data = items[items.length - 1].raw._data;

      if (data.category && data.category.includes(`${servicesGroup}: `)) {
        return data.category.split(': ')[1]; // Extract just the subcategory name
      } else if (data.category) {
        return data.category;
      } else if (data.label) {
        return data.label;
      } else {
        return 'Unknown';
      }
    },
    label: (item) => {
      const data = item.raw._data;
      const groupName = data.group;
      const categoryName = data.category;

      // Only treat as subcategory if it's in ICT Services group
      if (groupName === servicesGroup && categoryName && categoryName !== groupName) {
        return getTranslatedText(language, 'subcategoryValue', { value: item.raw.v || 0 });
      } else {
        return getTranslatedText(language, 'categoryValue', { value: item.raw.v || 0 });
      }
    },
    afterLabel: (item) => {
      const data = item.raw._data;
      if (data.group === servicesGroup && data.category && data.category.includes(`${servicesGroup}: `)) {
        return getTranslatedText(language, 'partOfICTServices');
      }
      return '';
    }
  };

  // Chart configuration
  const config = {
    type: 'treemap',
    data: {
      datasets: [{
        tree: data,
        key: 'value',
        groups: ['group', 'category'], // Keep group and category separation
        spacing: 3,
        borderWidth: 1.5,
        borderColor: '#fff',
        backgroundColor: getBackgroundColor,
        labels: {
          display: true,
          align: 'center',
          position: 'middle',
          font: {
            weight: 'bold'
          },
          color: '#fff',
          formatter: formatLabels
        },
        captions: {
          display: true,
          align: 'center',
          color: '#333'
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      },
      plugins: {
        title: {
          display: true,
          text: `${getTranslatedText(language, 'valueAddedTitle')} (${year}), mln €`,
          font: {
            size: 18
          }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: tooltipCallbacks
        }
      }
    }
  };

  // If we have an existing chart, properly destroy it first
  if (existingChart) {
    existingChart.data.datasets[0].tree = data;
    existingChart.options.plugins.title.text = `${getTranslatedText(language, 'valueAddedTitle')} (${year}), mln €`;
    existingChart.update(); // Smooth update without full redraw
    return existingChart; // Return the updated chart instance
  }

  // Create new chart instance
  return new Chart(canvasElement, config);
}
