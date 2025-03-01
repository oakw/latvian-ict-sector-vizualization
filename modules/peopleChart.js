// Import translations helper
import { getTranslatedText } from './translations.js';
import { getCategoryColor } from './colorUtils.js';

// Function to fetch employment data
export async function fetchEmploymentData() {
    try {
        const response = await fetch('dataset/employees.json');
        if (!response.ok) {
            console.warn(`Failed to fetch employment data: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = await response.json();

        return data;
    } catch (error) {
        console.error('Error fetching employment data:', error);
        return null;
    }
}

// Function to process employment data
export function processEmploymentData(rawData, selectedYear = '2023', language = 'en') {
    if (!rawData || !rawData.data) {
        console.warn("No employment data or invalid format");
        return [];
    }

    // Define category codes using our centralized color system
    const categoryCodes = [
        'ICT_S_M',
        'ICT_S_WS',
        'ICT_S_S_S1',
        'ICT_S_S_S2',
        'ICT_S_S_S3',
        'ICT_S_S_S4',
        'ICT_S_S_S5'
    ];

    // Filter data to get only employment numbers for specific sectors in the selected year
    const filteredData = rawData.data.filter(item =>
        item.key[3] === selectedYear &&
        item.key[2] === 'ICT_S_NUMB_EMP' &&
        item.key[1] !== 'ICT_S_TOTAL' &&
        item.key[1] !== 'ICT_S_S_TOTAL' &&
        categoryCodes.includes(item.key[1])
    );

    // Calculate total employment for the filtered categories
    const totalEmployment = filteredData.reduce((sum, item) => sum + parseInt(item.values[0], 10), 0);

    // Calculate percentages and prepare data for visualization
    const employmentData = filteredData.map(item => {
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

        const employeeCount = parseInt(item.values[0], 10);
        const percentage = (employeeCount / totalEmployment * 100).toFixed(1);

        return {
            category: categoryName,
            code: categoryCode,
            percentage: parseFloat(percentage),
            color: color.fill,
            employeeCount: employeeCount
        };
    });

    // Sort by employee count (descending)
    employmentData.sort((a, b) => b.employeeCount - a.employeeCount);

    return employmentData;
}

// Function to create the people chart with simplified layout
export function createPeopleChart(containerElement, data, selectedYear = '2023', language = 'en') {
    // Clear the container
    containerElement.innerHTML = '';

    // First, remove any lingering tooltips from previous chart
    document.querySelectorAll('.people-tooltip').forEach(tooltip => {
        document.body.removeChild(tooltip);
    });

    // Update chart title with selected year
    const chartSection = containerElement.closest('.chart-section');
    if (chartSection && chartSection.querySelector('h2')) {
        const titleText = getTranslatedText(language, 'employmentLabel', { year: selectedYear });
        chartSection.querySelector('h2').textContent = titleText;
    }

    // If no data is provided, don't render anything
    if (!data || data.length === 0) {
        console.warn("No data available for people chart");
        containerElement.innerHTML = `<div class="no-data-message">${getTranslatedText(language, 'noData')}</div>`;
        return;
    }

    // Define the total number of people icons to display - FIXED AT 200
    const totalPeople = 200;

    // Create a single container for all icons
    const peopleContainer = document.createElement('div');
    peopleContainer.className = 'people-icons';

    // Create an array to hold all our icons
    const allIcons = [];

    // For each category, calculate exact number of icons needed based on percentage
    let iconsCreated = 0;

    // First, calculate the exact number of icons for each category
    data.forEach(category => {
        // Calculate number of icons for this category
        const exactIconCount = (category.percentage * totalPeople / 100);
        let iconCount = Math.floor(exactIconCount);

        // Track leftover fractional counts to ensure we get exactly totalPeople icons
        const remainder = exactIconCount - iconCount;
        category.remainder = remainder;
        category.iconCount = iconCount;
    });

    // Distribute remaining icons based on remainder values
    if (data.reduce((sum, cat) => sum + cat.iconCount, 0) < totalPeople) {
        // Sort by remainder (descending) to allocate remaining icons
        const sortedData = [...data].sort((a, b) => b.remainder - a.remainder);

        // Add remaining icons to reach exactly totalPeople
        let remainingIcons = totalPeople - data.reduce((sum, cat) => sum + cat.iconCount, 0);
        let index = 0;

        while (remainingIcons > 0 && index < sortedData.length) {
            sortedData[index].iconCount++;
            remainingIcons--;
            index = (index + 1) % sortedData.length; // Cycle through categories
        }
    }

    // Now create icons grouped by category - maintain original ordering to keep sorting by count
    data.forEach(category => {
        // Create the specified number of icons for this category
        for (let i = 0; i < category.iconCount; i++) {
            const icon = document.createElement('i');
            icon.className = 'fas fa-user';
            icon.style.color = category.color;
            icon.dataset.category = category.category;

            // Get translated tooltip content
            const employeesText = getTranslatedText(language, 'employees');
            icon.dataset.count = category.employeeCount ?
                `${category.category}: ${category.employeeCount.toLocaleString()} ${employeesText}` :
                category.category;

            allIcons.push(icon);
        }
    });

    // Determine appropriate icon size based on container width
    const containerWidth = containerElement.clientWidth;
    const idealIconsPerRow = Math.ceil(Math.sqrt(totalPeople));

    // Set a CSS custom property for the grid columns
    peopleContainer.style.setProperty('--icons-per-row', `${idealIconsPerRow}`);

    // Add all icons to container
    allIcons.forEach(icon => {
        peopleContainer.appendChild(icon);
    });

    // Add the container to main element
    containerElement.appendChild(peopleContainer);

    // Create legend
    createPeopleChartLegend(containerElement.parentNode.nextElementSibling, data, language);

    // Add tooltips
    addPeopleChartTooltips(containerElement);

    // Add resize handler to adjust icon size when window is resized
    const handleResize = () => {
        const newContainerWidth = containerElement.clientWidth;

        // Improved responsive sizing logic
        let idealIconSize;
        if (newContainerWidth <= 400) {
            // Small screens (mobile)
            idealIconSize = Math.max(6, Math.min(10, Math.floor(newContainerWidth / idealIconsPerRow)));
        } else if (newContainerWidth <= 768) {
            // Medium screens (tablets)
            idealIconSize = Math.max(10, Math.min(14, Math.floor(newContainerWidth / idealIconsPerRow)));
        } else {
            // Large screens (desktop)
            idealIconSize = Math.max(14, Math.min(24, Math.floor(newContainerWidth / idealIconsPerRow)));
        }

        peopleContainer.style.setProperty('--icon-size', `${idealIconSize}px`);
    };

    // Initial call to set size
    handleResize();

    // Add resize event listener
    window.addEventListener('resize', handleResize);

    // Store the resize handler to allow removal later
    containerElement.resizeHandler = handleResize;

    // Add mutation observer to handle tooltip cleanup when chart changes
    setupTooltipMutationObserver(containerElement);
}

// Function to create the legend - updated for left alignment
function createPeopleChartLegend(legendContainer, data, language) {
    legendContainer.innerHTML = '';

    // Create a flex container for rows
    const legendWrapper = document.createElement('div');
    legendWrapper.className = 'legend-wrapper';
    legendWrapper.style.display = 'flex';
    legendWrapper.style.flexDirection = 'column';
    legendWrapper.style.alignItems = 'flex-start'; // Align items to the left
    legendWrapper.style.gap = '5px';

    data.forEach(category => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';

        const colorBox = document.createElement('span');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = category.color;

        const label = document.createElement('span');
        label.className = 'legend-label';

        // Include employee count if available
        if (category.employeeCount) {
            label.textContent = `${category.category} (${category.percentage}% - ${category.employeeCount.toLocaleString()} ${getTranslatedText(language, 'employees')})`;
        } else {
            label.textContent = `${category.category} (${category.percentage}%)`;
        }

        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendWrapper.appendChild(legendItem);
    });

    legendContainer.appendChild(legendWrapper);
}

// Function to add tooltips
function addPeopleChartTooltips(container) {
    const icons = container.querySelectorAll('.fa-user');

    icons.forEach(icon => {
        // Add tab index for keyboard focus
        icon.setAttribute('tabindex', '0');

        // Add ARIA label for screen readers
        if (icon.dataset.count) {
            icon.setAttribute('aria-label', icon.dataset.count);
        }

        // Handle both mouse and keyboard events
        const showTooltip = (e) => {
            const tooltipText = e.target.dataset.count || e.target.dataset.category;
            if (!tooltipText) return;

            // Remove any existing tooltip
            if (e.target.tooltip && document.body.contains(e.target.tooltip)) {
                document.body.removeChild(e.target.tooltip);
            }

            const tooltip = document.createElement('div');
            tooltip.className = 'people-tooltip';
            tooltip.setAttribute('role', 'tooltip');
            tooltip.dataset.forIcon = icon.dataset.uniqueId || 'icon';
            tooltip.textContent = tooltipText;

            // Position the tooltip
            const rect = e.target.getBoundingClientRect();
            tooltip.style.left = `${rect.left}px`;
            tooltip.style.top = `${rect.top - 30}px`;

            document.body.appendChild(tooltip);
            e.target.tooltip = tooltip;

            // Announce tooltip text for screen readers
            if (e.type === 'keydown') {
                const srAnnounce = document.createElement('div');
                srAnnounce.setAttribute('aria-live', 'polite');
                srAnnounce.className = 'sr-only';
                srAnnounce.textContent = tooltipText;
                document.body.appendChild(srAnnounce);

                // Remove after announcement
                setTimeout(() => {
                    if (document.body.contains(srAnnounce)) {
                        document.body.removeChild(srAnnounce);
                    }
                }, 3000);
            }
        };

        const hideTooltip = (e) => {
            if (e.target.tooltip && document.body.contains(e.target.tooltip)) {
                document.body.removeChild(e.target.tooltip);
                e.target.tooltip = null;
            }
        };

        // Mouse events
        icon.addEventListener('mouseenter', showTooltip);
        icon.addEventListener('mouseleave', hideTooltip);

        // Keyboard events
        icon.addEventListener('focus', showTooltip);
        icon.addEventListener('blur', hideTooltip);
        icon.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showTooltip(e);
            } else if (e.key === 'Escape') {
                hideTooltip(e);
            }
        });
    });

    // Global handler to clean up orphaned tooltips (those without corresponding icons)
    document.addEventListener('mousemove', (e) => {
        // If we're not hovering over an icon, check for orphaned tooltips
        if (!e.target.classList.contains('fa-user')) {
            const tooltips = document.querySelectorAll('.people-tooltip');
            tooltips.forEach(tooltip => {
                // Check if the tooltip is orphaned (no corresponding icon is currently being hovered)
                const isHoveredIconPresent = Array.from(container.querySelectorAll('.fa-user:hover')).length > 0;
                if (!isHoveredIconPresent) {
                    document.body.removeChild(tooltip);
                }
            });
        }
    });
}

// Function to set up a mutation observer to clean up tooltips when the chart changes
function setupTooltipMutationObserver(container) {
    // Create new observer
    const observer = new MutationObserver(() => {
        // When chart content changes, remove all tooltips
        document.querySelectorAll('.people-tooltip').forEach(tooltip => {
            if (document.body.contains(tooltip)) {
                document.body.removeChild(tooltip);
            }
        });
    });

    // Start observing for chart content changes
    observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });

    // Store the observer on the container to clean up later if needed
    container.tooltipObserver = observer;
}

// Add this cleanup function to be called before recreating the chart
export function cleanupPeopleChart(containerElement) {
    // Remove resize handler if exists
    if (containerElement.resizeHandler) {
        window.removeEventListener('resize', containerElement.resizeHandler);
        containerElement.resizeHandler = null;
    }

    // Disconnect mutation observer if exists - FIX: use containerElement instead of container
    if (containerElement.tooltipObserver) {
        containerElement.tooltipObserver.disconnect();
        containerElement.tooltipObserver = null;
    }

    // Remove any lingering tooltips
    document.querySelectorAll('.people-tooltip').forEach(tooltip => {
        if (document.body.contains(tooltip)) {
            document.body.removeChild(tooltip);
        }
    });
}

// Add this CSS to improve accessibility
function addAccessibilityStyles() {
    // Check if styles already exist
    if (document.getElementById('accessibility-styles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'accessibility-styles';
    styleEl.innerHTML = `
    /* Screen reader only class */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }
    
    /* Focus styles for keyboard navigation */
    .people-icons .fa-user:focus {
      outline: 2px solid #36a2eb;
      outline-offset: 2px;
      box-shadow: 0 0 0 2px white;
    }
    
    /* Make tooltips more accessible */
    .people-tooltip {
      background-color: rgba(0, 0, 0, 0.9); /* Darker for better contrast */
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px; /* Larger font for better readability */
      z-index: 1000;
      pointer-events: none;
      white-space: nowrap;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
  `;

    document.head.appendChild(styleEl);
}

// Call this function at module load time
addAccessibilityStyles();
