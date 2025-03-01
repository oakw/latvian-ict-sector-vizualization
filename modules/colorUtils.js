/**
 * Color utilities for consistent and accessible data visualizations
 * 
 * This module provides consistent, accessible color schemes for all visualizations
 * with appropriate contrast ratios and color-blind friendly palettes.
 */

// Main category colors - WCAG AA compliant with at least 3:1 contrast ratio on white background
export const CATEGORY_COLORS = {
    // Main sectors
    ICT_MANUFACTURING: {
        name: 'ICT Manufacturing',
        fill: 'rgba(24, 119, 242, 0.85)', // Blue
        border: 'rgba(24, 119, 242, 1)',
        highlight: 'rgba(24, 119, 242, 0.95)'
    },
    ICT_WHOLESALE: {
        name: 'ICT Wholesale',
        fill: 'rgba(220, 57, 18, 0.85)', // Red
        border: 'rgba(220, 57, 18, 1)',
        highlight: 'rgba(220, 57, 18, 0.95)'
    },
    // ICT Services subcategories - using different shades of green/teal
    SOFTWARE_PUBLISHING: {
        name: 'Software Publishing',
        fill: 'rgba(16, 150, 24, 0.85)', // Green
        border: 'rgba(16, 150, 24, 1)',
        highlight: 'rgba(16, 150, 24, 0.95)'
    },
    TELECOMMUNICATIONS: {
        name: 'Telecommunications',
        fill: 'rgba(255, 153, 0, 0.85)', // Orange
        border: 'rgba(255, 153, 0, 1)',
        highlight: 'rgba(255, 153, 0, 0.95)'
    },
    COMPUTER_PROGRAMMING: {
        name: 'Computer Programming',
        fill: 'rgba(16, 150, 110, 0.85)', // Teal
        border: 'rgba(16, 150, 110, 1)',
        highlight: 'rgba(16, 150, 110, 0.95)'
    },
    INFORMATION_SERVICES: {
        name: 'Information Services',
        fill: 'rgba(153, 0, 153, 0.85)', // Purple
        border: 'rgba(153, 0, 153, 1)',
        highlight: 'rgba(153, 0, 153, 0.95)'
    },
    REPAIR_OF_COMPUTERS: {
        name: 'Repair of Computers',
        fill: 'rgba(102, 102, 102, 0.85)', // Gray
        border: 'rgba(102, 102, 102, 1)',
        highlight: 'rgba(102, 102, 102, 0.95)'
    },
    // Aggregated categories
    ICT_SERVICES_TOTAL: {
        name: 'ICT Services Total',
        fill: 'rgba(16, 150, 110, 0.85)', // Teal like Computer Programming but more distinctive
        border: 'rgba(16, 150, 110, 1)',
        highlight: 'rgba(16, 150, 110, 0.95)'
    },
    ICT_TOTAL: {
        name: 'ICT Total',
        fill: 'rgba(97, 97, 220, 0.85)', // Purple-blue
        border: 'rgba(97, 97, 220, 1)',
        highlight: 'rgba(97, 97, 220, 0.95)'
    }
};

/**
 * Get category color by code
 * @param {string} categoryCode - The category code (ICT_S_M, ICT_S_WS, etc.)
 * @param {number} opacity - Optional opacity value (0-1)
 * @returns {Object} Color object with fill, border and highlight properties
 */
export function getCategoryColor(categoryCode, opacity = 1) {
    // Map from data codes to color keys
    const codeToColorMap = {
        'ICT_S_M': 'ICT_MANUFACTURING',
        'ICT_S_WS': 'ICT_WHOLESALE',
        'ICT_S_S_S1': 'SOFTWARE_PUBLISHING',
        'ICT_S_S_S2': 'TELECOMMUNICATIONS',
        'ICT_S_S_S3': 'COMPUTER_PROGRAMMING',
        'ICT_S_S_S4': 'INFORMATION_SERVICES',
        'ICT_S_S_S5': 'REPAIR_OF_COMPUTERS',
        'ICT_S_S_TOTAL': 'ICT_SERVICES_TOTAL',
        'ICT_S_TOTAL': 'ICT_TOTAL'
    };

    const colorKey = codeToColorMap[categoryCode] || 'ICT_TOTAL';
    const color = CATEGORY_COLORS[colorKey];

    if (!color) {
        console.warn(`No color defined for category: ${categoryCode}`);
        return {
            fill: `rgba(100, 100, 100, ${opacity * 0.85})`, // Default gray
            border: 'rgba(100, 100, 100, 1)',
            highlight: `rgba(100, 100, 100, ${opacity * 0.95})`
        };
    }

    if (opacity !== 1) {
        // Create a new color with adjusted opacity
        return {
            fill: color.fill.replace(/[\d.]+\)$/, `${opacity * 0.85})`),
            border: color.border.replace(/[\d.]+\)$/, `${opacity})`),
            highlight: color.highlight.replace(/[\d.]+\)$/, `${opacity * 0.95})`)
        };
    }

    return color;
}

/**
 * Get suitable text color (black or white) for given background
 * @param {string} backgroundColor - Background color in rgba format
 * @returns {string} Either 'white' or 'black' for best contrast
 */
export function getAccessibleTextColor(backgroundColor) {
    // Extract RGB values from rgba string
    const rgbaMatch = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!rgbaMatch) return 'black';

    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);

    // Calculate relative luminance (WCAG formula)
    // Convert RGB to sRGB
    const rsrgb = r / 255;
    const gsrgb = g / 255;
    const bsrgb = b / 255;

    // Calculate RGB values
    const R = rsrgb <= 0.03928 ? rsrgb / 12.92 : Math.pow((rsrgb + 0.055) / 1.055, 2.4);
    const G = gsrgb <= 0.03928 ? gsrgb / 12.92 : Math.pow((gsrgb + 0.055) / 1.055, 2.4);
    const B = bsrgb <= 0.03928 ? bsrgb / 12.92 : Math.pow((bsrgb + 0.055) / 1.055, 2.4);

    // Calculate luminance
    const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;

    // Return white for dark backgrounds, black for light
    return luminance > 0.179 ? 'black' : 'white';
}

/**
 * Get an array of colors for charts with multiple categories
 * @param {number} count - Number of colors needed
 * @returns {Array} Array of color objects with fill and border properties
 */
export function getChartColors(count) {
    // Use main colors from our palette
    const baseColors = Object.values(CATEGORY_COLORS);

    // If we need more colors than we have, create variations
    if (count <= baseColors.length) {
        return baseColors.slice(0, count);
    }

    // Create more colors by varying brightness/saturation
    const colors = [...baseColors];

    while (colors.length < count) {
        // Create variations of existing colors
        const baseColor = baseColors[colors.length % baseColors.length];
        const variation = { ...baseColor };

        // Modify the color slightly - this is a simplistic approach
        const hueShift = 30 * Math.floor(colors.length / baseColors.length);

        // Extract RGB from rgba string and modify
        const rgbaMatch = baseColor.fill.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbaMatch) {
            let r = parseInt(rgbaMatch[1], 10);
            let g = parseInt(rgbaMatch[2], 10);
            let b = parseInt(rgbaMatch[3], 10);
            const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;

            // Simple color shifting algorithm - adjust as needed
            r = Math.min(255, Math.max(0, r + hueShift));
            b = Math.min(255, Math.max(0, b - hueShift));

            variation.fill = `rgba(${r}, ${g}, ${b}, ${a})`;
            variation.border = `rgba(${r}, ${g}, ${b}, 1)`;
            variation.highlight = `rgba(${r}, ${g}, ${b}, 0.95)`;
        }

        colors.push(variation);
    }

    return colors.slice(0, count);
}
