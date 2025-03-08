/**
 * Roster creator module
 * Contains functions for creating and formatting the roster sheet
 */
var Roster = Roster || {};
Roster.Creator = Roster.Creator || {};

/**
 * Format the roster sheet
 * @param {SpreadsheetApp.Sheet} sheet - The roster sheet to format
 * @param {number} totalColumns - The total number of columns in the sheet
 */
Roster.Creator.formatRosterSheet = function(sheet, totalColumns) {
  // Auto-resize columns
  sheet.autoResizeColumns(1, totalColumns);
  
  // Set minimum column width for period columns
  for (let i = 3; i <= totalColumns; i++) {
    if (sheet.getColumnWidth(i) < 120) {
      sheet.setColumnWidth(i, 120);
    }
  }
  
  // Get the last row
  const lastRow = sheet.getLastRow();
  
  // Batch format the entire range
  const range = sheet.getRange(1, 1, lastRow, totalColumns);
  range.setHorizontalAlignment('center');
  range.setBorder(true, true, true, true, true, true);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, totalColumns);
  headerRange.setBackground('#f3f3f3');
  headerRange.setFontWeight('bold');
};

/**
 * Create an empty roster template
 * @param {Array} classes - Array of class objects
 * @param {Object} periodsConfig - Configuration for periods
 * @return {Object} Object with sheet, totalColumns, breakColumn, and lunchColumn
 */
Roster.Creator.createEmptyRoster = function(classes, periodsConfig) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Delete existing roster sheet if it exists to avoid conflicts
  let sheet = spreadsheet.getSheetByName(SHEET_NAMES.ROSTER);
  if (sheet) {
    spreadsheet.deleteSheet(sheet);
  }
  
  // Create a fresh roster sheet
  sheet = spreadsheet.insertSheet(SHEET_NAMES.ROSTER);
  
  // Calculate total columns needed based on number of periods
  const numPeriods = periodsConfig.periodsPerDay;
  
  // Ensure numPeriods is valid
  if (!numPeriods || numPeriods <= 0) {
    throw new Error("Invalid number of periods: " + numPeriods);
  }
  
  // Create headers
  const headers = ['Class', 'Day'];
  
  // Add period headers with break and lunch
  let breakAdded = false;
  let lunchAdded = false;
  let breakColumn = -1;
  let lunchColumn = -1;
  
  for (let i = 1; i <= numPeriods; i++) {
    // Add break around 1/3 of the way through
    if (i === Math.ceil(numPeriods / 3) && !breakAdded) {
      headers.push('Break');
      breakColumn = headers.length;
      breakAdded = true;
    } 
    // Add lunch around 2/3 of the way through
    else if (i === Math.ceil(2 * numPeriods / 3) && !lunchAdded) {
      headers.push('Lunch');
      lunchColumn = headers.length;
      lunchAdded = true;
    } 
    else {
      headers.push(`Period ${i}`);
    }
  }
  
  // If break or lunch wasn't added, add them at the end
  if (!breakAdded) {
    headers.push('Break');
    breakColumn = headers.length;
  }
  
  if (!lunchAdded) {
    headers.push('Lunch');
    lunchColumn = headers.length;
  }
  
  // Set the headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  return {
    sheet: sheet,
    totalColumns: headers.length,
    breakColumn: breakColumn,
    lunchColumn: lunchColumn
  };
};

/**
 * Store the generated data in a hidden sheet for reference
 * @param {SpreadsheetApp.Sheet} sheet - The roster sheet containing the data
 */
Roster.Creator.updateOriginalData = function(sheet) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Delete the old original data sheet if it exists
  let originalDataSheet = spreadsheet.getSheetByName('_OriginalRosterData');
  if (originalDataSheet) {
    spreadsheet.deleteSheet(originalDataSheet);
  }
  
  // Create a new original data sheet
  originalDataSheet = spreadsheet.insertSheet('_OriginalRosterData');
  originalDataSheet.hideSheet();
  
  // Get data starting from row 3 (after headers and filter row)
  const startRow = 3;
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  // Only copy if there's data to copy
  if (lastRow >= startRow) {
    const data = sheet.getRange(startRow, 1, lastRow - startRow + 1, lastCol).getValues();
    originalDataSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  }
}; 