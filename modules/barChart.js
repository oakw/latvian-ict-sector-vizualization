import { getTranslatedText } from './translations.js';
import { ensureProperTitleDisplay } from './chartHelper.js';
import { getCategoryColor } from './colorUtils.js';

// Function to fetch profits data
export async function fetchProfitsData() {
    try {
        const response = await fetch('dataset/profits.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching profits data:', error);
        return null;
    }
}

// Function to process profits data for the bar chart
export function processProfitsData(rawData, selectedYear = '2023', language = 'en') {
    if (!rawData || !rawData.data) {
        return {
            labels: [],
            datasets: [{
                label: getTranslatedText(language, 'profitLabel'),
                data: [],
                backgroundColor: [],
                borderColor: [],
                borderWidth: 1
            }]
        };
    }

    // Define category codes
    const categoryCodes = [
        'ICT_S_M',
        'ICT_S_WS',
        'ICT_S_S_S1',
        'ICT_S_S_S2',
        'ICT_S_S_S3',
        'ICT_S_S_S4',
        'ICT_S_S_S5'
    ];

    // Filter data to exclude group categories and get only profits for the selected year
    const filteredData = rawData.data.filter(item =>
        item.key[3] === selectedYear &&
        item.key[2] === 'ICT_S_P' &&
        item.key[0] === 'EMP_TOTAL' &&
        categoryCodes.includes(item.key[1])
    );

    // Sort data by profit value (descending)
    filteredData.sort((a, b) => parseInt(b.values[0], 10) - parseInt(a.values[0], 10));

    // Prepare data for Chart.js bar chart
    const labels = [];
    const data = [];
    const backgroundColors = [];
    const borderColors = [];

    filteredData.forEach(item => {
        const categoryCode = item.key[1];

        // Get translated name
        const categoryName = getTranslatedText(language, {
            'ICT_S_M': 'ictManufacturing',
            'ICT_S_WS': 'ictWholesale',
            'ICT_S_S_S1': 'softwarePublishing',
            'ICT_S_S_S2': 'telecommunications',
            'ICT_S_S_S3': 'computerProgramming',
            'ICT_S_S_S4': 'informationServices',
            'ICT_S_S_S5': 'repairOfComputers'
        }[categoryCode]);

        // Use our color utility
        const color = getCategoryColor(categoryCode);

        labels.push(categoryName);
        data.push(parseInt(item.values[0], 10));
        backgroundColors.push(color.fill);
        borderColors.push(color.border);
    });

    return {
        labels: labels,
        datasets: [{
            label: getTranslatedText(language, 'profitLabel'),
            data: data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
        }]
    };
}

// Function to create and configure the bar chart
export function createBarChart(canvasElement, chartData, year, language = 'en') {
    // Get existing chart instance if any
    const existingChart = Chart.getChart(canvasElement);

    // If we don't have valid data, show placeholder
    if (!chartData || !chartData.labels || chartData.labels.length === 0) {
        if (existingChart) {
            existingChart.destroy();
        }
        canvasElement.parentNode.classList.add('no-data');
        return null;
    }

    // Get translated title and tooltips
    const chartTitle = getTranslatedText(language, 'profitsLabel', { year });

    // Create proper title display
    ensureProperTitleDisplay(canvasElement, chartTitle);

    // If a chart already exists, update it instead of recreating
    if (existingChart) {
        // Update chart data
        existingChart.data.labels = chartData.labels;
        existingChart.data.datasets[0].data = chartData.datasets[0].data;
        existingChart.data.datasets[0].backgroundColor = chartData.datasets[0].backgroundColor;
        existingChart.data.datasets[0].borderColor = chartData.datasets[0].borderColor;
        existingChart.data.datasets[0].label = chartData.datasets[0].label;

        // Update title
        existingChart.options.plugins.title.text = chartTitle;

        // Update tooltip callback
        existingChart.options.plugins.tooltip.callbacks.label = function (context) {
            return getTranslatedText(language, 'profitValue', { value: context.parsed.x });
        };

        // Update axis titles with proper translations
        existingChart.options.scales.x.title.text = getTranslatedText(language, 'profitAxisLabel');
        existingChart.options.scales.y.title.text = getTranslatedText(language, 'profitAxisTitle');

        // Also update the services category legend with the new language
        addServicesCategoryLegend(canvasElement, language);

        // Trigger update with animation
        existingChart.update('default');
        return existingChart;
    }

    // If no chart exists, create a new one
    // Create new bar chart instance
    const chart = new Chart(canvasElement, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bar chart for better readability with many categories
            plugins: {
                title: {
                    display: false, // Disable built-in title
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function (tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function (context) {
                            return getTranslatedText(language, 'profitValue', { value: context.parsed.x });
                        }
                    }
                }
            },
            layout: {
                padding: {
                    top: 25, // Add padding for custom title
                    left: 15  // Add left padding for y-axis labels
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 250, // Set a fixed maximum scale of 250 million euros
                    title: {
                        display: true,
                        text: getTranslatedText(language, 'profitAxisLabel'),
                        padding: {
                            top: 10 // Add padding to separate from the chart
                        }
                    },
                    ticks: {
                        callback: function (value) {
                            return value + ' €';
                        }
                    }
                },
                y: {
                    title: {
                        display: false, // Disable Y axis title to avoid overlap
                        text: getTranslatedText(language, 'profitAxisTitle')
                    },
                    ticks: {
                        // Add more space around the labels
                        padding: 8,
                        // Limit label length
                        callback: function (value) {
                            const label = this.getLabelForValue(value);
                            // Truncate long labels
                            if (label && label.length > 20) {
                                return label.substring(0, 17) + '...';
                            }
                            return label;
                        }
                    }
                }
            },
            // Animation configuration for smooth transitions
            animation: {
                duration: 800, // Animation duration in milliseconds
                easing: 'easeOutQuad' // Use a smoother easing function
            },
            // Transitions configuration for value changes and bar repositioning
            transitions: {
                active: {
                    animation: {
                        duration: 800
                    }
                }
            }
        }
    });

    // Add a legend showing ICT Services categories with a common color theme
    addServicesCategoryLegend(canvasElement, language);

    return chart;
}

// Add a custom legend to explain the ICT Services color grouping
function addServicesCategoryLegend(canvasElement, language) {
    const container = canvasElement.parentNode;

    // Remove existing legend if any
    const existingLegend = container.querySelector('.services-category-legend');
    if (existingLegend) {
        container.removeChild(existingLegend);
    }

    // Get the translated text using the provided language parameter
    const translatedText = getTranslatedText(language, 'ictServicesSubcategories');

    // Create new legend with translated text
    const legend = document.createElement('div');
    legend.className = 'services-category-legend';

    // Use our color utilities
    const serviceColor = getCategoryColor('ICT_S_S_TOTAL');

    legend.innerHTML = `<span class="legend-box"></span> ${translatedText}`;

    // Store the language for debugging
    legend.dataset.language = language;

    // Style the legend
    legend.style.position = 'absolute';
    legend.style.bottom = '10px';
    legend.style.right = '15px';
    legend.style.display = 'flex';
    legend.style.alignItems = 'center';
    legend.style.fontSize = '12px';
    legend.style.color = '#666';

    // Style the color box using our consistent color
    const box = legend.querySelector('.legend-box');
    box.style.width = '12px';
    box.style.height = '12px';
    box.style.backgroundColor = serviceColor.fill;
    box.style.marginRight = '5px';
    box.style.display = 'inline-block';
    box.style.borderRadius = '2px'; // Make rounded for better accessibility

    // Add to container
    container.appendChild(legend);

    // For debugging - add a log to verify the language being used
}