/**
 * Common utilities module
 * Contains utility functions used throughout the application
 */
var Utils = Utils || {};

/**
 * Convert a number to Roman numeral
 * @param {number} num - The number to convert
 * @return {string} The Roman numeral representation
 */
Utils.toRoman = function(num) {
  const roman = {
    1000: 'M', 900: 'CM', 500: 'D', 400: 'CD',
    100: 'C', 90: 'XC', 50: 'L', 40: 'XL',
    10: 'X', 9: 'IX', 5: 'V', 4: 'IV', 1: 'I'
  };
  let result = '';
  for (let key of Object.keys(roman).sort((a, b) => b - a)) {
    while (num >= key) {
      result += roman[key];
      num -= key;
    }
  }
  return result;
};

/**
 * Format time string
 * @param {string} timeStr - Time string in the format "HH:MM AM/PM"
 * @return {string} Formatted time string
 */
Utils.formatTime = function(timeStr) {
  const date = new Date(`1/1/2000 ${timeStr}`);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'h:mm a');
};

/**
 * Add minutes to a time string
 * @param {string} timeStr - Time string in the format "HH:MM AM/PM"
 * @param {number} minutes - Minutes to add
 * @return {string} Resulting time string
 */
Utils.addMinutes = function(timeStr, minutes) {
  const date = new Date(`1/1/2000 ${timeStr}`);
  date.setMinutes(date.getMinutes() + minutes);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'h:mm a');
};

/**
 * Clear all data from sheets
 */
Utils.clearAllData = function() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Clear data from all sheets defined in SHEET_NAMES
  Object.values(SHEET_NAMES).forEach(sheetName => {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      // Delete the sheet (it will be recreated with empty data)
      spreadsheet.deleteSheet(sheet);
    }
  });
  
  // Also delete the Teacher-View sheet if it exists
  const teacherViewSheet = spreadsheet.getSheetByName('Teacher-View');
  if (teacherViewSheet) {
    spreadsheet.deleteSheet(teacherViewSheet);
  }
  
  // Remove any other sheets that might have been generated
  const generatedRosterPattern = /^Generated-Roster/;
  spreadsheet.getSheets().forEach(sheet => {
    const sheetName = sheet.getName();
    // Delete any generated roster sheets (if they follow a pattern)
    if (generatedRosterPattern.test(sheetName) && !Object.values(SHEET_NAMES).includes(sheetName)) {
      spreadsheet.deleteSheet(sheet);
    }
  });
  
  // Show success message
  SpreadsheetApp.getActiveSpreadsheet().toast('All data has been cleared successfully.');
}; 