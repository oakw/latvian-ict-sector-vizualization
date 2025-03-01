import { getTranslatedText } from './translations.js';
import { ensureProperTitleDisplay } from './chartHelper.js';
import { getCategoryColor } from './colorUtils.js';

// Function to fetch GDP share data
export async function fetchGDPShareData() {
    try {
        const response = await fetch('dataset/gdp_share.json');
        if (!response.ok) {
            console.warn(`Failed to fetch GDP share data: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching GDP share data:', error);
        return null;
    }
}

// Function to process GDP share data
export function processGDPShareData(rawData) {
    if (!rawData || !rawData.data) {
        console.warn("No GDP data or invalid format");
        return { years: [], ictPercentage: [] };
    }

    // Extract years and ICT percentages from data
    const processedData = rawData.data.map(item => {
        return {
            year: item.key[0], // Assuming year is in position 1 of the key array
            percentage: parseFloat(item.values[0])
        };
    });

    // Sort by year
    processedData.sort((a, b) => {
        // Handle the case where year might be undefined
        if (!a.year) return -1;
        if (!b.year) return 1;
        return a.year.localeCompare(b.year);
    });

    // Extract years and percentages as separate arrays
    const years = processedData.map(item => item.year);
    const ictPercentage = processedData.map(item => item.percentage);

    return { years, ictPercentage };
}

// Function to create a nested proportional area chart showing ICT sector share of GDP
export function createGDPShareChart(canvasElement, data, selectedYear, language = 'en') {
    // Get existing chart instance if any
    const existingChart = Chart.getChart(canvasElement);

    // Destroy existing chart if it exists
    if (existingChart) {
        existingChart.destroy();
    }

    if (!data || !data.years || data.years.length === 0) {
        console.warn("No GDP share data available");
        canvasElement.parentNode.innerHTML = '<div class="error" role="alert">' +
            getTranslatedText(language, 'error') + '</div>';
        return null;
    }

    // If no selected year is provided, use the most recent one
    if (!selectedYear) {
        selectedYear = data.years[data.years.length - 1];
    }

    // Get data for selected year
    const yearIndex = data.years.indexOf(selectedYear);
    if (yearIndex === -1) {
        console.warn(`No GDP data available for year ${selectedYear}`);
        return null;
    }

    const ictPercentage = data.ictPercentage[yearIndex];

    // Get translated title and subtitle
    const chartTitle = getTranslatedText(language, 'gdpShareLabel', { year: selectedYear });
    const chartSubtitle = getTranslatedText(language, 'gdpShareSubtitle', { percentage: ictPercentage.toFixed(1) });

    // Create proper title display
    const titleElement = ensureProperTitleDisplay(canvasElement, chartTitle);

    // Also add subtitle
    const container = canvasElement.parentNode;
    const existingSubtitle = container.querySelector('.chart-subtitle');
    if (existingSubtitle) {
        existingSubtitle.textContent = chartSubtitle;
    } else {
        const subtitleElement = document.createElement('div');
        subtitleElement.className = 'chart-subtitle';
        subtitleElement.setAttribute('role', 'text');
        subtitleElement.setAttribute('aria-label', chartSubtitle);
        subtitleElement.textContent = chartSubtitle;
        subtitleElement.style.textAlign = 'center';
        subtitleElement.style.fontWeight = 'normal';
        subtitleElement.style.fontStyle = 'italic';
        subtitleElement.style.fontSize = '14px';
        subtitleElement.style.marginBottom = '5px';
        subtitleElement.style.padding = '0 10px';
        subtitleElement.style.position = 'absolute';
        subtitleElement.style.top = '25px';
        subtitleElement.style.left = '0';
        subtitleElement.style.right = '0';

        container.insertBefore(subtitleElement, canvasElement);
    }

    // Get ICT sector and total GDP colors from our color utility
    const ictColor = getCategoryColor('ICT_S_TOTAL');
    const gdpColor = {
        fill: 'rgba(240, 240, 240, 0.9)',
        border: 'rgba(180, 180, 180, 1)',
        highlight: 'rgba(220, 220, 220, 0.95)'
    };

    // Create a chart with no visible data - we'll draw everything custom
    const chart = new Chart(canvasElement, {
        type: 'scatter',
        data: {
            datasets: [{
                data: [{ x: 0, y: 0 }],
                backgroundColor: 'rgba(0,0,0,0)' // Transparent
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { display: false },
                y: { display: false }
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
                title: {
                    display: false, // Disable built-in title
                },
                subtitle: {
                    display: false, // Disable built-in subtitle
                }
            },
            layout: {
                padding: {
                    top: 50 // Add more padding for title and subtitle
                }
            }
        },
        plugins: [{
            id: 'nestedBubbles',
            beforeDraw: function (chart) {
                const ctx = chart.ctx;
                // Clear the canvas except for title/subtitle
                ctx.save();
                const chartArea = chart.chartArea;
                ctx.clearRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
                ctx.restore();
            },
            afterDraw: function (chart) {
                const ctx = chart.ctx;
                const width = chart.chartArea.width;
                const height = chart.chartArea.height;

                // Calculate main circle dimensions based on available space
                const mainRadius = Math.min(width, height) * 0.4;
                const centerX = chart.chartArea.left + width / 2;
                const centerY = chart.chartArea.top + height / 2 + 20; // Shifted down to account for title

                // Draw the GDP bubble
                ctx.beginPath();
                ctx.arc(centerX, centerY, mainRadius, 0, Math.PI * 2);
                ctx.fillStyle = gdpColor.fill;
                ctx.strokeStyle = gdpColor.border;
                ctx.lineWidth = 2;
                ctx.fill();
                ctx.stroke();

                // Get the ICT percentage from the stored value
                const ictPercentage = chart.ictPercentage || 0;

                // Calculate ICT sector bubble size based on percentage
                const ictRadius = mainRadius * Math.sqrt(ictPercentage / 100);

                // Position ICT bubble at bottom of GDP bubble
                const ictY = centerY + (mainRadius - ictRadius) * 0.7;

                // Draw the ICT sector bubble
                ctx.beginPath();
                ctx.arc(centerX, ictY, ictRadius, 0, Math.PI * 2);
                ctx.fillStyle = ictColor.fill;
                ctx.strokeStyle = ictColor.border;
                ctx.lineWidth = 2;
                ctx.fill();
                ctx.stroke();

                // Add labels
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // GDP label - positioned at top of GDP circle with translation
                ctx.font = 'bold 16px Arial';
                ctx.fillStyle = '#555';
                ctx.fillText(getTranslatedText(chart.language || language, 'totalGDP'), centerX, centerY - mainRadius / 2);

                // Add an outline to text for better readability
                const addTextWithOutline = (text, x, y, fillStyle, fontSize, isBold = false) => {
                    ctx.font = `${isBold ? 'bold ' : ''}${fontSize}px Arial`;
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.lineWidth = 3;
                    ctx.lineJoin = 'round';
                    ctx.strokeText(text, x, y);
                    ctx.fillStyle = fillStyle;
                    ctx.fillText(text, x, y);
                };

                // Redraw the ICT text with outline for better readability
                const displayPercentage = ictPercentage !== null ? ictPercentage.toFixed(1) : '0.0';
                addTextWithOutline(`${displayPercentage}%`, centerX, ictY, '#003366', 16, true);

                // Add a connecting line between bubbles for visual clarity
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX, ictY);
                ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Add textual representation for screen readers
                if (!chart.ariaLabel) {
                    const ariaContainer = document.createElement('div');
                    ariaContainer.className = 'sr-only';
                    ariaContainer.setAttribute('role', 'complementary');
                    ariaContainer.setAttribute('aria-label', getTranslatedText(language, 'gdpChartAriaLabel', {
                        percentage: displayPercentage,
                        year: selectedYear
                    }));
                    chart.canvas.parentNode.appendChild(ariaContainer);
                    chart.ariaLabel = ariaContainer;
                }
            }
        }]
    });

    // Store title and subtitle elements on chart for later updates
    chart.customTitleElement = titleElement;
    chart.customSubtitleElement = container.querySelector('.chart-subtitle');

    // Store the current ICT percentage and language as properties on the chart for later updates
    chart.ictPercentage = ictPercentage;
    chart.language = language;
    chart.selectedYear = selectedYear;

    // Update section title as well
    const chartSection = canvasElement.closest('.chart-section');
    if (chartSection && chartSection.querySelector('h2')) {
        chartSection.querySelector('h2').textContent = getTranslatedText(language, 'gdpShareTitle');
    }

    return chart;
}

// Update the GDP share chart function to ensure it works properly
export function updateGDPShareChart(chart, data, selectedYear, language = 'en') {
    if (!chart || !data || !data.years || data.years.length === 0) {
        console.error("Missing chart or data for GDP share chart update");
        return;
    }

    // If language changed, store the new one
    if (chart.language !== language) {
        chart.language = language;
    }

    const yearIndex = data.years.indexOf(selectedYear);
    if (yearIndex === -1) {
        console.warn(`Year ${selectedYear} not found in GDP data`);
        return;
    }

    const ictPercentage = data.ictPercentage[yearIndex];

    // Get translated title and subtitle
    const chartTitle = getTranslatedText(language, 'gdpShareLabel', { year: selectedYear });
    const chartSubtitle = getTranslatedText(language, 'gdpShareSubtitle', { percentage: ictPercentage.toFixed(1) });

    // Update custom title element if it exists
    if (chart.customTitleElement) {
        chart.customTitleElement.textContent = chartTitle;
    }

    // Update custom subtitle element if it exists
    if (chart.customSubtitleElement) {
        chart.customSubtitleElement.textContent = chartSubtitle;
    }

    // Store the updated percentage directly on the chart
    chart.ictPercentage = ictPercentage;
    chart.selectedYear = selectedYear;

    // Update section title as well
    const chartSection = chart.canvas.closest('.chart-section');
    if (chartSection && chartSection.querySelector('h2')) {
        chartSection.querySelector('h2').textContent = getTranslatedText(language, 'gdpShareTitle');
    }

    // Update aria label for screen readers
    if (chart.ariaLabel) {
        chart.ariaLabel.setAttribute('aria-label', getTranslatedText(language, 'gdpChartAriaLabel', {
            percentage: ictPercentage.toFixed(1),
            year: selectedYear
        }));
    }

    // The actual rendering will be updated on chart.update()
    chart.update();
}