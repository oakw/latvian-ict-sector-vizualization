// Importing modules
import { fetchICTData, processDataForTreemap } from './modules/data.js';
import { createTreemap } from './modules/treemap.js';
import { fetchProfitsData, processProfitsData, createBarChart } from './modules/barChart.js';
import { fetchEmploymentData, processEmploymentData, createPeopleChart, cleanupPeopleChart } from './modules/peopleChart.js';
import { fetchEnterprisesData, processEnterprisesData, createLineChart, updateLineChart } from './modules/lineChart.js';
import { fetchGDPShareData, processGDPShareData, createGDPShareChart, updateGDPShareChart } from './modules/gdpShareChart.js';
import { translations, getTranslatedText } from './modules/translations.js';

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const treemapElement = document.getElementById('treemapChart');
  const profitChartElement = document.getElementById('profitChart');
  const yearSlider = document.getElementById('yearSlider');
  const currentYearDisplay = document.getElementById('currentYearDisplay');
  const peopleChartElement = document.getElementById('peopleChart');
  const enterprisesChartElement = document.getElementById('enterprisesChart');
  const gdpShareChartElement = document.getElementById('gdpShareChart');
  const languageToggle = document.getElementById('languageToggle');
  
  // Set default language
  let currentLanguage = 'en';
  
  // Check for stored language preference immediately upon page load
  // Do this before fetching any data
  const storedLanguage = localStorage.getItem('preferredLanguage');
  if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'lv')) {
    currentLanguage = storedLanguage;
  }
  
  // Add language toggle functionality
  if (languageToggle) {
    languageToggle.addEventListener('click', () => {
      // Toggle between English and Latvian
      currentLanguage = currentLanguage === 'en' ? 'lv' : 'en';
      
      // Update language toggle button
      const languageLabel = languageToggle.querySelector('.language-label');
      if (languageLabel) {
        languageLabel.textContent = getTranslatedText(currentLanguage, 'languageToggle');
      }
      
      // Toggle button style
      if (currentLanguage === 'lv') {
        languageToggle.classList.add('lv');
      } else {
        languageToggle.classList.remove('lv');
      }
      
      // Update all translated elements
      updatePageTranslations();
      
      // Update all charts with new language - this function has been improved
      updateAllCharts();
      
      // Update tooltips
      updateButtonTooltips();
      
      // Store language preference
      localStorage.setItem('preferredLanguage', currentLanguage);
    });
    
    // Check if user has a stored language preference
    const storedLanguage = localStorage.getItem('preferredLanguage');
    if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'lv')) {
      // Apply stored language (simulating a language toggle click)
      if (storedLanguage !== currentLanguage) {
        languageToggle.click();
      }
    }
  }
  
  // Function to update all translated text elements on the page
  function updatePageTranslations() {
    // Update page title
    document.title = getTranslatedText(currentLanguage, 'pageTitle');
    document.getElementById('pageTitle').textContent = getTranslatedText(currentLanguage, 'pageTitle');
    
    // Update introduction text
    document.getElementById('introText').innerHTML = `<p>${getTranslatedText(currentLanguage, 'introText')}</p>`;
    
    // Update section titles
    document.getElementById('valueAddedTitle').textContent = getTranslatedText(currentLanguage, 'valueAddedTitle');
    document.getElementById('gdpShareTitle').textContent = getTranslatedText(currentLanguage, 'gdpShareTitle');
    document.getElementById('profitsTitle').textContent = getTranslatedText(currentLanguage, 'profitsTitle');
    document.getElementById('employmentTitle').textContent = getTranslatedText(currentLanguage, 'employmentTitle');
    document.getElementById('enterprisesTitle').textContent = getTranslatedText(currentLanguage, 'enterprisesTitle');
    
    // Update source text for all data source elements
    document.querySelectorAll('.source-prefix').forEach(element => {
      element.textContent = getTranslatedText(currentLanguage, 'sourcePrefix');
    });
    
    document.querySelectorAll('.source-text').forEach(element => {
      element.textContent = getTranslatedText(currentLanguage, 'sourceSuffix');
    });
    
    document.querySelectorAll('.source-year').forEach(element => {
      element.textContent = getTranslatedText(currentLanguage, 'sourceYear');
    });

    // Update source text for GDP chart specifically
    const gdpSourceText = document.querySelector('.chart-section:has(#gdpShareChart) .source-text');
    if (gdpSourceText) {
      gdpSourceText.textContent = getTranslatedText(currentLanguage, 'sourceSuffix');
    }

    // Update source text for GDP chart specifically (both the static label and the link text)
    const gdpSourceContainer = document.querySelector('.chart-section:has(#gdpShareChart) .data-source');
    if (gdpSourceContainer) {
      const sourcePrefix = getTranslatedText(currentLanguage, 'sourcePrefix');
      const sourceText = getTranslatedText(currentLanguage, 'sourceSuffix');
      const sourceYear = getTranslatedText(currentLanguage, 'sourceYear');
      
      gdpSourceContainer.innerHTML = `
        <span class="source-prefix">${sourcePrefix}</span> 
        <a href="https://data.stat.gov.lv/" target="_blank">
          <span class="source-text">${sourceText}</span>
        </a>, 
        <span class="source-year">${sourceYear}</span>
      `;
    }

    // Update related documents section
    document.getElementById('relatedDocsTitle').textContent = getTranslatedText(currentLanguage, 'relatedDocs');
    
    // Update document link text based on language
    document.querySelectorAll('.link-text').forEach(element => {
      if (element.closest('.document-link').querySelector('.fa-download')) {
        element.textContent = getTranslatedText(currentLanguage, 'downloadDocument');
      } else {
        element.textContent = getTranslatedText(currentLanguage, 'viewDocument');
      }
    });
  }
  
  // Function to update button tooltips with correct language
  function updateButtonTooltips() {
    // Update play button tooltip
    const playButton = document.getElementById('playButton');
    if (playButton) {
      playButton.setAttribute('aria-label', getTranslatedText(currentLanguage, 'playTooltip'));
      playButton.setAttribute('title', getTranslatedText(currentLanguage, 'playTooltip'));
    }
    
    // Update pause button tooltip
    const pauseButton = document.getElementById('pauseButton');
    if (pauseButton) {
      pauseButton.setAttribute('aria-label', getTranslatedText(currentLanguage, 'pauseTooltip'));
      pauseButton.setAttribute('title', getTranslatedText(currentLanguage, 'pauseTooltip'));
    }
    
    // Update repeat button tooltip
    const repeatButton = document.getElementById('repeatButton');
    if (repeatButton) {
      const isActive = repeatButton.classList.contains('active');
      const tooltipKey = isActive ? 'loopEnabledTooltip' : 'loopTooltip';
      repeatButton.setAttribute('title', getTranslatedText(currentLanguage, tooltipKey));
    }
    
    // Update speed button tooltip
    const speedButton = document.getElementById('speedButton');
    if (speedButton) {
      const speedLabel = speedButton.querySelector('.speed-label').textContent;
      speedButton.setAttribute('title', getTranslatedText(currentLanguage, 'speedTooltip', { speed: speedLabel }));
    }
  }
  
  // Function to update all charts with new language - improved version
  function updateAllCharts() {
    const currentYear = document.getElementById('currentYearDisplay').textContent;
    
    // Only update if charts exist and data is loaded
    if (valueAddedData) {
      // Force recreate treemap with new language
      const treeData = processDataForTreemap(valueAddedData, currentYear, currentLanguage);
      treemapChart = createTreemap(treemapElement, treeData, currentYear, currentLanguage);
    }
    
    if (profitsData) {
      // Force recreate bar chart with new language
      const barData = processProfitsData(profitsData, currentYear, currentLanguage);
      profitChart = createBarChart(profitChartElement, barData, currentYear, currentLanguage);
    }
    
    if (employmentData && peopleChartElement) {
      // Clean up previous resize handler if it exists
      if (peopleChartElement.resizeHandler) {
        window.removeEventListener('resize', peopleChartElement.resizeHandler);
        peopleChartElement.resizeHandler = null;
      }
      
      // Clean up properly
      cleanupPeopleChart(peopleChartElement);
      
      // Force recreate people chart with new language
      const employmentChartData = processEmploymentData(employmentData, currentYear, currentLanguage);
      createPeopleChart(peopleChartElement, employmentChartData, currentYear, currentLanguage);
    }
    
    if (gdpShareData && gdpShareChartElement) {
      if (gdpShareChart) {
        // First destroy the old chart to ensure clean recreation
        gdpShareChart.destroy();
      }
      gdpShareChart = createGDPShareChart(gdpShareChartElement, gdpShareData, currentYear, currentLanguage);
    }
    
    if (enterprisesData && enterprisesChartElement) {
      if (enterprisesChart) {
        // First destroy the existing chart
        enterprisesChart.destroy();
      }
      
      // Create a new chart with the current language
      const lineChartData = processEnterprisesData(enterprisesData, currentYear, currentLanguage);
      enterprisesChart = createLineChart(enterprisesChartElement, lineChartData, true, currentLanguage);
    }
    
    // Update section titles to reflect new language and current year
    document.getElementById('valueAddedTitle').textContent = getTranslatedText(currentLanguage, 'valueAddedTitle');
    document.getElementById('gdpShareTitle').textContent = getTranslatedText(currentLanguage, 'gdpShareTitle');
    document.getElementById('profitsTitle').textContent = getTranslatedText(currentLanguage, 'profitsTitle');
    document.getElementById('employmentTitle').textContent = getTranslatedText(currentLanguage, 'employmentTitle');
    document.getElementById('enterprisesTitle').textContent = getTranslatedText(currentLanguage, 'enterprisesTitle');
  }
  
  // Initialize charts with loading state
  treemapElement.parentNode.classList.add('loading');
  profitChartElement.parentNode.classList.add('loading');
  
  // Default year is 2023
  let selectedYear = '2023';
  
  // Variables to store chart instances
  let profitChart = null;
  let treemapChart = null; // Add this to store the treemap chart instance
  let enterprisesChart = null;
  
  // Fetch data for all charts at once
  const [valueAddedData, profitsData, employmentData, rawGDPData] = await Promise.all([
    fetchICTData(),
    fetchProfitsData(),
    fetchEmploymentData(),
    fetchGDPShareData()
  ]);
  
  // Process GDP share data immediately so we can use it later
  let gdpShareData = null;
  let gdpShareChart = null;
  if (rawGDPData) {
    gdpShareData = processGDPShareData(rawGDPData);
  }
  
  // Process and display treemap
  if (valueAddedData) {
    // Populate year slider if it exists
    if (yearSlider) {
      // Get all available years from the dataset
      const years = [...new Set(valueAddedData.data.map(item => item.key[3]))].sort();
      
      // Set slider range based on available years
      if (years.length > 0) {
        const minYear = years[0];
        const maxYear = years[years.length - 1];
        
        yearSlider.min = minYear;
        yearSlider.max = maxYear;
        yearSlider.value = selectedYear;
        
        // Update min/max labels
        document.querySelector('.year-min').textContent = minYear;
        document.querySelector('.year-max').textContent = maxYear;
        
        // Set initial year display
        currentYearDisplay.textContent = selectedYear;
      }
      
      // Handle year slider changes
      yearSlider.addEventListener('input', async (e) => {
        selectedYear = e.target.value;
        currentYearDisplay.textContent = selectedYear;
        
        // Important: First clean up any existing tooltips to prevent them from lingering
        document.querySelectorAll('.people-tooltip').forEach(tooltip => {
          if (document.body.contains(tooltip)) {
            document.body.removeChild(tooltip);
          }
        });
        
        
        // Update treemap with current language
        if (valueAddedData) {
          const treeData = processDataForTreemap(valueAddedData, selectedYear, currentLanguage);
          treemapChart = createTreemap(treemapElement, treeData, selectedYear, currentLanguage);
        }
        
        // Update profits chart with current language
        if (profitsData) {
          const barData = processProfitsData(profitsData, selectedYear, currentLanguage);
          profitChart = createBarChart(profitChartElement, barData, selectedYear, currentLanguage);
        }
        
        // Update people chart with proper cleanup
        if (employmentData && peopleChartElement) {
          // Clean up resources from the previous chart
          cleanupPeopleChart(peopleChartElement);
          
          // Then create updated people chart with current language
          const employmentChartData = processEmploymentData(employmentData, selectedYear, currentLanguage);
          createPeopleChart(peopleChartElement, employmentChartData, selectedYear, currentLanguage);
        }
        
        // Update GDP share chart with current language - FIXED
        if (gdpShareData && gdpShareChartElement) {
          if (gdpShareChart) {
            updateGDPShareChart(gdpShareChart, gdpShareData, selectedYear, currentLanguage);
          } else {
            gdpShareChart = createGDPShareChart(gdpShareChartElement, gdpShareData, selectedYear, currentLanguage);
          }
        }
        
        // Update enterprises chart with current language - FIXED
        if (enterprisesData && enterprisesChartElement) {
          enterprisesChart = updateLineChart(enterprisesChartElement, enterprisesData, selectedYear, currentLanguage);
        }
      });
    }
    
    // Initial rendering of treemap with language support
    const treeData = processDataForTreemap(valueAddedData, selectedYear, currentLanguage);
    treemapChart = createTreemap(treemapElement, treeData, selectedYear, currentLanguage);
    treemapElement.parentNode.classList.remove('loading');
    
    // Add slider animation functionality
    const playButton = document.getElementById('playButton');
    const pauseButton = document.getElementById('pauseButton');
    const repeatButton = document.getElementById('repeatButton');
    const speedButton = document.getElementById('speedButton');
    let animationInterval = null;
    let animationSpeed = 1000; // Default: 1 second between years (1x speed)
    let currentSpeedMultiplier = 1; // 1x is the default speed
    let isLooping = false; // Track if looping is enabled
    
    // Setup play button functionality
    if (playButton && pauseButton) {
      // Function to update the animation state
      const updatePlayState = (isPlaying) => {
        if (isPlaying) {
          playButton.style.display = 'none';
          pauseButton.style.display = 'flex';
        } else {
          playButton.style.display = 'flex';
          pauseButton.style.display = 'none';
        }
      };
      
      // Function to advance the slider by one year
      const advanceYear = () => {
        const currentValue = parseInt(yearSlider.value);
        const maxValue = parseInt(yearSlider.max);
        const minValue = parseInt(yearSlider.min);
        
        if (currentValue < maxValue) {
          // Move to next year
          yearSlider.value = currentValue + 1;
          
          // Update the year
          selectedYear = yearSlider.value;
          currentYearDisplay.textContent = selectedYear;
          
          // Important: Remove any existing orphaned tooltips
          document.querySelectorAll('.people-tooltip').forEach(tooltip => {
            if (document.body.contains(tooltip)) {
              document.body.removeChild(tooltip);
            }
          });
          
          
          // Update each chart with the new year
          if (valueAddedData) {
            const treeData = processDataForTreemap(valueAddedData, selectedYear, currentLanguage);
            treemapChart = createTreemap(treemapElement, treeData, selectedYear, currentLanguage);
          }
          
          if (profitsData) {
            const barData = processProfitsData(profitsData, selectedYear, currentLanguage);
            profitChart = createBarChart(profitChartElement, barData, selectedYear, currentLanguage);
          }
          
          if (employmentData && peopleChartElement) {
            cleanupPeopleChart(peopleChartElement);
            const employmentChartData = processEmploymentData(employmentData, selectedYear, currentLanguage);
            createPeopleChart(peopleChartElement, employmentChartData, selectedYear, currentLanguage);
          }
          
          // GDP share chart update - use gdpShareChartElement to check existence
          if (gdpShareData && gdpShareChart && gdpShareChartElement) {
            updateGDPShareChart(gdpShareChart, gdpShareData, selectedYear, currentLanguage);
          }
          
          // Enterprises chart update - use both chart and element to verify existence
          if (enterprisesData && enterprisesChartElement) {
            enterprisesChart = updateLineChart(enterprisesChartElement, enterprisesData, selectedYear, currentLanguage);
          }
          
          // Dispatch a custom event to notify that the year has been updated
          const yearChangeEvent = new CustomEvent('yearUpdated', { detail: { year: selectedYear } });
          document.dispatchEvent(yearChangeEvent);
        } else {
          // Reached the end
          if (isLooping) {
            // If looping is enabled, reset to beginning and continue
            yearSlider.value = minValue;
            const event = new Event('input', { bubbles: true });
            yearSlider.dispatchEvent(event);
          } else {
            // If not looping, stop animation
            clearInterval(animationInterval);
            animationInterval = null;
            updatePlayState(false);
          }
        }
      };
      
      // Play button starts the animation
      playButton.addEventListener('click', () => {
        if (animationInterval) return; // Already playing
        
        // If at the end and not looping, go back to beginning
        if (parseInt(yearSlider.value) === parseInt(yearSlider.max) && !isLooping) {
          yearSlider.value = yearSlider.min;
          const event = new Event('input', { bubbles: true });
          yearSlider.dispatchEvent(event);
        }
        
        // Start animation with current speed
        updatePlayState(true);
        animationInterval = setInterval(advanceYear, animationSpeed / currentSpeedMultiplier);
      });
      
      // Pause button stops the animation
      pauseButton.addEventListener('click', () => {
        clearInterval(animationInterval);
        animationInterval = null;
        updatePlayState(false);
      });
      
      // Configure repeat button as a toggle for looping behavior
      if (repeatButton) {
        // Set initial tooltip
        repeatButton.title = getTranslatedText(currentLanguage, "loopTooltip");
        
        repeatButton.addEventListener('click', () => {
          // Toggle looping state
          isLooping = !isLooping;
          
          // Toggle active class for visual feedback
          if (isLooping) {
            repeatButton.classList.add('active');
            repeatButton.title = getTranslatedText(currentLanguage, "loopEnabledTooltip");
          } else {
            repeatButton.classList.remove('active');
            repeatButton.title = getTranslatedText(currentLanguage, "loopTooltip");
          }
        });
      }
      
      // Configure speed button to cycle through different speeds
      if (speedButton) {
        // Speed options: 0.5x, 1x, 2x, 3x
        const speedOptions = [0.5, 1, 2, 3];
        let currentSpeedIndex = 1; // Start with 1x speed (index 1)
        
        // Initialize speed button with default 1x speed
        speedButton.querySelector('.speed-label').textContent = '1x';
        speedButton.title = getTranslatedText(currentLanguage, 'speedTooltip', { speed: '1x' });
        speedButton.classList.add('speed-1x');
        
        speedButton.addEventListener('click', () => {
          // If animation is running, clear the interval
          const wasPlaying = animationInterval !== null;
          if (wasPlaying) {
            clearInterval(animationInterval);
            animationInterval = null;
          }
          
          // Cycle to the next speed option
          currentSpeedIndex = (currentSpeedIndex + 1) % speedOptions.length;
          currentSpeedMultiplier = speedOptions[currentSpeedIndex];
          
          // Update button display
          const speedLabel = currentSpeedMultiplier + 'x';
          speedButton.querySelector('.speed-label').textContent = speedLabel;
          speedButton.title = getTranslatedText(currentLanguage, 'speedTooltip', { speed: speedLabel });
          
          // Remove all speed-related classes
          speedButton.classList.remove('speed-0-5x', 'speed-1x', 'speed-2x', 'speed-3x');
          // Add the current speed class
          speedButton.classList.add(`speed-${currentSpeedMultiplier.toString().replace('.', '-')}x`);
          
          // Restart the animation if it was playing
          if (wasPlaying) {
            animationInterval = setInterval(advanceYear, animationSpeed / currentSpeedMultiplier);
          }
        });
      }
      
      // Handle reaching the end of the slider
      yearSlider.addEventListener('input', () => {
        // If manually set to max and currently playing but not looping, stop animation
        if (!isLooping && animationInterval && yearSlider.value === yearSlider.max) {
          clearInterval(animationInterval);
          animationInterval = null;
          updatePlayState(false);
        }
      });
    }
  } else {
    // Display error message
    treemapElement.parentNode.innerHTML = '<div class="error">Failed to load value added data.</div>';
  }
  
  // Process and display bar chart - store the initial chart instance
  if (profitsData) {
    const barData = processProfitsData(profitsData, selectedYear, currentLanguage);
    profitChart = createBarChart(profitChartElement, barData, selectedYear, currentLanguage);
    profitChartElement.parentNode.classList.remove('loading');
  } else {
    // Display error message or fallback to sample data
    profitChartElement.parentNode.innerHTML = '<div class="error">Failed to load profit data.</div>';
    profitChartElement.parentNode.classList.remove('loading');
    createBarChart(profitChartElement, sampleData, selectedYear);
    profitChartElement.parentNode.classList.remove('loading');
    
    // Add a note about sample data
    const sourceElement = profitChartElement.parentNode.nextElementSibling;
    if (sourceElement && sourceElement.classList.contains('data-source')) {
      sourceElement.textContent = 'Error: Unable to load profit data.';
    }
  }

  // Create people chart
  if (peopleChartElement) {
    peopleChartElement.parentNode.classList.add('loading');
    
    if (employmentData) {
      // Process employment data for the initial year
      const employmentChartData = processEmploymentData(employmentData, selectedYear, currentLanguage);
      createPeopleChart(peopleChartElement, employmentChartData, selectedYear, currentLanguage);
    } else {
      // Use sample data as fallback
      createPeopleChart(peopleChartElement, null, selectedYear); // Pass selectedYear
      
      // Update the data source note
      const sourceElement = peopleChartElement.parentNode.nextElementSibling.nextElementSibling;
      if (sourceElement && sourceElement.classList.contains('data-source')) {
        sourceElement.textContent = 'Error: Unable to load employment data.';
      }
    }
    
    peopleChartElement.parentNode.classList.remove('loading');
  }

  // During initial setup of the enterprises chart, store the data for later updates
  let enterprisesData = null;

  // Initialize line chart
  if (enterprisesChartElement) {
    enterprisesChartElement.parentNode.classList.add('loading');
    
    try {
      // Clear any existing error messages
      enterprisesChartElement.parentNode.querySelectorAll('.error').forEach(el => el.remove());
      
      // Fetch enterprises data
      enterprisesData = await fetchEnterprisesData();
      
      if (enterprisesData) {
        // Process enterprises data with the initial selected year
        // Use the current language setting instead of default
        const lineChartData = processEnterprisesData(enterprisesData, selectedYear, currentLanguage);
        
        if (lineChartData && lineChartData.years.length > 0 && lineChartData.datasets.length > 0) {
          // Store the chart instance - pass current language to ensure correct translations
          enterprisesChart = createLineChart(enterprisesChartElement, lineChartData, true, currentLanguage);
        } else {
          console.warn("Processed line chart data is empty");
          enterprisesChartElement.parentNode.innerHTML = '<div class="error">' + 
            getTranslatedText(currentLanguage, 'noData') + '</div>';
        }
      } else {
        console.warn("Failed to fetch enterprises data");
        enterprisesChartElement.parentNode.innerHTML = '<div a="error">' + 
          getTranslatedText(currentLanguage, 'error') + '</div>';
      }
    } catch (error) {
      console.error("Error initializing line chart:", error);
      enterprisesChartElement.parentNode.innerHTML = '<div class="error">' + 
        getTranslatedText(currentLanguage, 'error') + '</div>';
    } finally {
      enterprisesChartElement.parentNode.classList.remove('loading');
    }
  }
  
  // Initialize GDP Share chart
  if (gdpShareChartElement) {
    gdpShareChartElement.parentNode.classList.add('loading');
    
    try {
      // We already fetched the GDP data with Promise.all above
      if (gdpShareData && gdpShareData.years && gdpShareData.years.length > 0) {
        // Create the chart with the current selected year
        gdpShareChart = createGDPShareChart(gdpShareChartElement, gdpShareData, selectedYear, currentLanguage);
        
        // Update the source note with translated text
        const sourceElement = gdpShareChartElement.parentNode.nextElementSibling;
        if (sourceElement && sourceElement.classList.contains('data-source')) {
          // Use the translation system instead of hardcoded English text
          const sourcePrefix = getTranslatedText(currentLanguage, 'sourcePrefix');
          const sourceText = getTranslatedText(currentLanguage, 'sourceSuffix');
          const sourceYear = getTranslatedText(currentLanguage, 'sourceYear');
          
          sourceElement.innerHTML = `
            <span class="source-prefix">${sourcePrefix}</span> 
            <a href="https://data.stat.gov.lv/" target="_blank">
              <span class="source-text">${sourceText}</span>
            </a>, 
            <span class="source-year">${sourceYear}</span>
          `;
        }
      } else {
        console.warn("No GDP share data available after processing");
        gdpShareChartElement.parentNode.innerHTML = '<div class="error">' + getTranslatedText(currentLanguage, 'error') + '</div>';
      }
    } catch (error) {
      console.error("Error initializing GDP share chart:", error);
      gdpShareChartElement.parentNode.innerHTML = '<div class="error">' + getTranslatedText(currentLanguage, 'error') + '</div>';
    } finally {
      gdpShareChartElement.parentNode.classList.remove('loading');
    }
  }

  // Initial call to update all translations based on starting language
  updatePageTranslations();

  // Initial call to set button tooltips with correct language
  updateButtonTooltips();
});