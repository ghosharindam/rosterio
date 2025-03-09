/**
 * UI menu module for Roster App
 * Contains menu setup and UI elements
 */
var UI = UI || {};

/**
 * Create and add the menu when the spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  UI.createMenu(ui);
}

/**
 * Create the application menu
 * @param {SpreadsheetApp.UI} ui - The spreadsheet UI
 */
UI.createMenu = function(ui) {
  ui.createMenu('Roster App')
    .addItem('Initialize Sheets', 'initializeSheets')
    .addItem('Populate Sample Data', 'populateSampleData')
    .addSeparator()
    .addItem('Validate Schedule Feasibility', 'validateSchedule')
    .addItem('Generate Roster', 'generateRoster')
    .addSeparator()
    .addItem('Clear All Data', 'clearAllData')
    .addToUi();
}; 