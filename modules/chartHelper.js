/**
 * Helper function to ensure chart titles are properly displayed on all screen sizes
 * @param {HTMLCanvasElement} canvasElement The chart canvas element
 * @param {string} title The chart title to display
 */
export function ensureProperTitleDisplay(canvasElement, title) {
  // Get the container of the canvas
  const container = canvasElement.parentNode;

  // Remove any existing title element
  const existingTitle = container.querySelector('.chart-title');
  if (existingTitle) {
    existingTitle.remove();
  }

  // Create a title element that will sit above the chart
  const titleElement = document.createElement('div');
  titleElement.className = 'chart-title';
  titleElement.textContent = title;
  titleElement.style.textAlign = 'center';
  titleElement.style.fontWeight = '500';
  titleElement.style.fontSize = '16px';
  titleElement.style.marginBottom = '10px';
  titleElement.style.padding = '0 10px';
  titleElement.style.position = 'absolute';
  titleElement.style.top = '5px';
  titleElement.style.left = '0';
  titleElement.style.right = '0';

  // Insert at the beginning of the container
  container.insertBefore(titleElement, container.firstChild);

  return titleElement;
}
