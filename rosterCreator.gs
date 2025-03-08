// Functions for creating and formatting the roster sheet

// Update formatRosterSheet to handle dynamic columns
function formatRosterSheet(sheet, totalColumns) {
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
}

// Create empty roster template
function createEmptyRoster(classes, periodsConfig) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.ROSTER);
  
  // Clear existing content
  sheet.clear();
  
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
}

// Store the generated data
function updateOriginalData(sheet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let originalDataSheet = ss.getSheetByName('_OriginalRosterData');
  if (!originalDataSheet) {
    originalDataSheet = ss.insertSheet('_OriginalRosterData');
    originalDataSheet.hideSheet();
  }
  
  // Store the current roster data (excluding filter row)
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  originalDataSheet.clear();
  originalDataSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
}

// Function to display the generated roster
function displayRoster(rosterData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.ROSTER);
  
  // Clear existing roster
  sheet.clear();
  
  // Implementation of roster display logic
  // This will format and display the generated roster
}

// Helper function to format time
function formatTime(timeStr) {
  const date = new Date(`1/1/2000 ${timeStr}`);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'h:mm a');
}

// Helper function to add minutes to time
function addMinutes(timeStr, minutes) {
  const date = new Date(`1/1/2000 ${timeStr}`);
  date.setMinutes(date.getMinutes() + minutes);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'h:mm a');
} 