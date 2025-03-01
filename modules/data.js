// Sample hierarchical data for treemap
export const sampleData = [
  { category: 'Technology', value: 80, color: 'rgba(54, 162, 235, 0.8)' },
  { category: 'Healthcare', value: 65, color: 'rgba(255, 99, 132, 0.8)' },
  { category: 'Finance', value: 52, color: 'rgba(255, 206, 86, 0.8)' },
  { category: 'Consumer', value: 48, color: 'rgba(75, 192, 192, 0.8)' },
  { category: 'Energy', value: 40, color: 'rgba(153, 102, 255, 0.8)' },
  { category: 'Materials', value: 35, color: 'rgba(255, 159, 64, 0.8)' },
  { category: 'Utilities', value: 25, color: 'rgba(199, 199, 199, 0.8)' },
  { category: 'Real Estate', value: 20, color: 'rgba(83, 145, 101, 0.8)' }
];

// Import translations helper
import { getTranslatedText } from './translations.js';

// Function to fetch ICT data
export async function fetchICTData() {
  try {
    const response = await fetch('/dataset/value_added.json');
    if (!response.ok) {
      console.warn(`Failed to fetch ICT data: ${response.status} ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ICT data:', error);
    return null;
  }
}

// Function to process data for treemap - fixed to prevent nested subcategories
export function processDataForTreemap(rawData, selectedYear = '2023', language = 'en') {
  if (!rawData || !rawData.data) {
    console.warn("No data available to process for treemap");
    return [];
  }

  // Filter data for the selected year and value added indicator
  const filteredData = rawData.data.filter(item =>
    item.key[0] === 'EMP_TOTAL' &&
    item.key[3] === selectedYear &&
    item.key[2] === 'ICT_S_VA'
  );

  if (filteredData.length === 0) {
    console.warn(`No data for selected year ${selectedYear}`);
    return [];
  }

  // Create a properly structured treemap dataset with fixed categories
  const treeData = [];

  // Process ICT Manufacturing - as a standalone category, no subcategories
  const manufacturingItem = filteredData.find(item => item.key[1] === 'ICT_S_M');
  if (manufacturingItem) {
    treeData.push({
      category: getTranslatedText(language, 'ictManufacturing'),
      group: getTranslatedText(language, 'ictManufacturing'), // Same as category to avoid subcategories
      value: parseInt(manufacturingItem.values[0], 10),
      color: 'rgba(24, 119, 242, 0.85)', // Blue for manufacturing
      activityCode: 'ICT_S_M'
    });
  }

  // Process ICT Wholesale - as a standalone category, no subcategories
  const wholesaleItem = filteredData.find(item => item.key[1] === 'ICT_S_WS');
  if (wholesaleItem) {
    treeData.push({
      category: getTranslatedText(language, 'ictWholesale'),
      group: getTranslatedText(language, 'ictWholesale'), // Same as category to avoid subcategories
      value: parseInt(wholesaleItem.values[0], 10),
      color: 'rgba(220, 57, 18, 0.85)', // Red for wholesale
      activityCode: 'ICT_S_WS'
    });
  }

  // Create ICT Services parent group with subcategories
  const servicesGroup = getTranslatedText(language, 'ictServicesTotal');

  // Add all ICT Services subcategories
  const servicesCodes = ['ICT_S_S_S1', 'ICT_S_S_S2', 'ICT_S_S_S3', 'ICT_S_S_S4', 'ICT_S_S_S5'];
  const servicesTranslationKeys = {
    'ICT_S_S_S1': 'softwarePublishing',
    'ICT_S_S_S2': 'telecommunications',
    'ICT_S_S_S3': 'computerProgramming',
    'ICT_S_S_S4': 'informationServices',
    'ICT_S_S_S5': 'repairOfComputers'
  };

  servicesCodes.forEach(code => {
    const item = filteredData.find(item => item.key[1] === code);
    if (item) {
      const value = parseInt(item.values[0], 10);
      if (value > 0) { // Only include non-zero values
        treeData.push({
          category: `${servicesGroup}: ${getTranslatedText(language, servicesTranslationKeys[code])}`,
          group: servicesGroup,
          value: value,
          color: 'rgba(16, 150, 110, 0.85)', // Teal for all ICT services
          activityCode: code
        });
      }
    }
  });

  // Sort data by value descending for better visibility of larger blocks
  return treeData.sort((a, b) => b.value - a.value);
}