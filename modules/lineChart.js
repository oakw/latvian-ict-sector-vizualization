// Import translations helper and color utilities
import { getTranslatedText } from './translations.js';
import { ensureProperTitleDisplay } from './chartHelper.js';
import { getCategoryColor } from './colorUtils.js';

// Function to fetch enterprises data
export async function fetchEnterprisesData() {
    try {
        const response = await fetch('dataset/enterprises_count.json');
        if (!response.ok) {
            console.warn(`Failed to fetch enterprises data: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching enterprises data:', error);
        return null;
    }
}

// Function to process enterprises data - updated to use consistent colors
export function processEnterprisesData(rawData, selectedYear = '2023', language = 'en') {
    if (!rawData || !rawData.data) {
        console.warn("No enterprises data or invalid format");
        return { years: [], datasets: [] };
    }

    // Define category codes
    const categoryCodes = [
        'ICT_S_M',
        'ICT_S_WS',
        'ICT_S_S_TOTAL',
        'ICT_S_TOTAL'
    ];

    // Get all available years from the data
    const yearsInData = rawData.data
        .filter(item => item.key[0] === 'ICT_S_TOTAL' && item.key[1] === 'ICT_S_NUMB_ENT')
        .map(item => item.key[2]);

    const years = [...new Set(yearsInData)].sort();

    // Find the index of the selected year in the years array
    const selectedYearIndex = years.indexOf(selectedYear);
    // If selected year is not found, use the last available year
    const effectiveYearIndex = selectedYearIndex !== -1 ? selectedYearIndex : years.length - 1;
    const effectiveYear = selectedYearIndex !== -1 ? selectedYear : years[years.length - 1];

    // Prepare datasets for each category
    const datasets = [];

    for (const categoryCode of categoryCodes) {
        // Get translated name
        const categoryName = getTranslatedText(language, {
            'ICT_S_M': 'ictManufacturing',
            'ICT_S_WS': 'ictWholesale',
            'ICT_S_S_TOTAL': 'ictServicesTotal',
            'ICT_S_TOTAL': 'ictTotal'
        }[categoryCode]);

        // Use our color utility
        const color = getCategoryColor(categoryCode);

        // Find all data points for this category
        const dataPoints = rawData.data.filter(item =>
            item.key[0] === categoryCode &&
            item.key[1] === 'ICT_S_NUMB_ENT'
        );

        // Map data points to years up to the selected year
        const data = years.map((year, index) => {
            // Only include data up to the selected year
            if (index > effectiveYearIndex) {
                return null;
            }
            const point = dataPoints.find(dp => dp.key[2] === year);
            return point ? parseInt(point.values[0], 10) : null;
        });

        // Check if we have any valid data
        if (data.some(val => val !== null)) {
            datasets.push({
                label: categoryName,
                data: data,
                borderColor: color.border,
                backgroundColor: color.fill,
                tension: 0.3,
                spanGaps: true, // Connect the line across null values
                ...(categoryCode === 'ICT_S_TOTAL' ? { borderWidth: 3, borderDash: [5, 5] } : { borderWidth: 2 })
            });
        } else {
            console.warn(`No valid data points for category: ${categoryCode}`);
        }
    }

    return {
        years: years,
        selectedYear: effectiveYear,
        datasets: datasets
    };
}

// Updated function to create a line chart for enterprises data with improved transitions
export function createLineChart(canvasElement, chartData, updateTitle = true, language = 'en') {
    // Get existing chart instance if any
    const existingChart = Chart.getChart(canvasElement);

    // Clear any error or loading messages
    const parentContainer = canvasElement.parentNode;
    const errorElements = parentContainer.querySelectorAll('.error, .loading-text');
    errorElements.forEach(el => el.remove());

    // If no data is provided, show message
    if (!chartData || !chartData.years || chartData.years.length === 0 || !chartData.datasets || chartData.datasets.length === 0) {
        console.warn("No data available for line chart");

        // Create a clean error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = getTranslatedText(language, 'noData');
        parentContainer.appendChild(errorDiv);

        // Remove loading class
        parentContainer.classList.remove('loading');

        if (existingChart) {
            existingChart.destroy();
        }
        return null;
    }

    // Remove any no-data class if it exists
    parentContainer.classList.remove('no-data');
    parentContainer.classList.remove('loading');

    // Define year range for the title
    const startYear = chartData.years[0];
    const selectedYear = chartData.selectedYear || chartData.years[chartData.years.length - 1];

    // Format title text - use simple year if startYear equals selectedYear, otherwise use range
    const titleYearText = startYear === selectedYear ?
        selectedYear :
        `${startYear}-${selectedYear}`;

    // Get the translated title
    const chartTitle = getTranslatedText(language, 'enterprisesLabel', { year: titleYearText });

    // Create proper title display
    ensureProperTitleDisplay(canvasElement, chartTitle);

    // If we already have a chart, update it instead of recreating
    if (existingChart) {
        // Update datasets while preserving the chart instance
        existingChart.data.datasets.forEach((dataset, i) => {
            if (chartData.datasets[i]) {
                dataset.data = chartData.datasets[i].data;
                dataset.label = chartData.datasets[i].label; // Update the translated label
            }
        });

        // Update the title
        existingChart.options.plugins.title.text = chartTitle;

        // Update tooltips with translations
        existingChart.options.plugins.tooltip.callbacks.label = function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y !== null ? context.parsed.y.toLocaleString() : getTranslatedText(language, 'noData');
            return `${label}: ${value} ${getTranslatedText(language, 'enterprises')}`;
        };

        // Update axis titles
        existingChart.options.scales.y.title.text = getTranslatedText(language, 'numberOfEnterprises');
        existingChart.options.scales.x.title.text = getTranslatedText(language, 'year');

        // Update the chart with animation
        existingChart.update({
            duration: 800,
            easing: 'easeOutQuad'
        });

        // If asked to update the section title, do so
        if (updateTitle) {
            const chartSection = canvasElement.closest('.chart-section');
            if (chartSection && chartSection.querySelector('h2')) {
                chartSection.querySelector('h2').textContent = getTranslatedText(language, 'enterprisesTitle');
            }
        }

        return existingChart;
    }

    // Create new line chart instance
    const chart = new Chart(canvasElement, {
        type: 'line',
        data: {
            labels: chartData.years,
            datasets: chartData.datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 800,
                easing: 'easeOutQuad'
            },
            plugins: {
                title: {
                    display: false, // Disable built-in title
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y !== null ? context.parsed.y.toLocaleString() : getTranslatedText(language, 'noData');
                            return `${label}: ${value} ${getTranslatedText(language, 'enterprises')}`;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10
                    }
                }
            },
            layout: {
                padding: {
                    top: 25 // Add padding for custom title
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 8000, // Fixed maximum value for consistent scaling
                    title: {
                        display: true,
                        text: getTranslatedText(language, 'numberOfEnterprises')
                    },
                    ticks: {
                        callback: function (value) {
                            return value.toLocaleString();
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: getTranslatedText(language, 'year')
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            elements: {
                point: {
                    radius: 3,
                    hoverRadius: 5
                },
                line: {
                    borderWidth: 2,
                    tension: 0.3 // Smoother lines
                }
            }
        }
    });

    // If asked to update the section title, do so
    if (updateTitle) {
        const chartSection = canvasElement.closest('.chart-section');
        if (chartSection && chartSection.querySelector('h2')) {
            chartSection.querySelector('h2').textContent = getTranslatedText(language, 'enterprisesTitle');
        }
    }

    return chart;
}

// Fix updateLineChart function to ensure it properly updates the chart
export function updateLineChart(canvasElement, rawData, selectedYear, language = 'en') {
    // Process enterprises data specifically for the selected year
    const chartData = processEnterprisesData(rawData, selectedYear, language);

    // Get existing chart instance
    const existingChart = Chart.getChart(canvasElement);

    if (!existingChart) {
        return createLineChart(canvasElement, chartData, true, language);
    }

    // Define year range for the title
    const startYear = chartData.years[0];
    const endYear = chartData.selectedYear || chartData.years[chartData.years.length - 1];

    // Format title text
    const titleYearText = startYear === endYear ? endYear : `${startYear}-${endYear}`;

    // Get the translated title
    const chartTitle = getTranslatedText(language, 'enterprisesLabel', { year: titleYearText });

    // Update title element if it exists in the chart's parent container
    const container = canvasElement.parentNode;
    const existingTitle = container.querySelector('.chart-title');
    if (existingTitle) {
        existingTitle.textContent = chartTitle;
    }

    // Update datasets while preserving animation
    existingChart.data.datasets.forEach((dataset, i) => {
        if (chartData.datasets[i]) {
            dataset.data = chartData.datasets[i].data;
            dataset.label = chartData.datasets[i].label; // Update the translated label
        }
    });

    // Update tooltips with translations
    existingChart.options.plugins.tooltip.callbacks.label = function (context) {
        const label = context.dataset.label || '';
        const value = context.parsed.y !== null ? context.parsed.y.toLocaleString() : getTranslatedText(language, 'noData');
        return `${label}: ${value} ${getTranslatedText(language, 'enterprises')}`;
    };

    // Update axis titles
    existingChart.options.scales.y.title.text = getTranslatedText(language, 'numberOfEnterprises');
    existingChart.options.scales.x.title.text = getTranslatedText(language, 'year');

    // Update section title
    const chartSection = canvasElement.closest('.chart-section');
    if (chartSection && chartSection.querySelector('h2')) {
        chartSection.querySelector('h2').textContent = getTranslatedText(language, 'enterprisesTitle');
    }

    // Update the chart with animation
    existingChart.update({
        duration: 800,
        easing: 'easeOutQuad'
    });

    return existingChart;
}