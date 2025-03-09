/**
 * Sheet initialization module for Rosterio
 * Contains functions for creating and setting up the individual sheets
 */
var Init = Init || {};
Init.Sheets = Init.Sheets || {};

/**
 * Create teacher-subject sheet
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The active spreadsheet
 */
Init.Sheets.createTeacherSubjectSheet = function(spreadsheet) {
  // Delete existing sheet if it exists
  let sheet = spreadsheet.getSheetByName(SHEET_NAMES.TEACHER_SUBJECTS);
  if (sheet) spreadsheet.deleteSheet(sheet);
  
  // Create new sheet
  sheet = spreadsheet.insertSheet(SHEET_NAMES.TEACHER_SUBJECTS);
  
//   // Set up headers
//   const headers = ['Teacher Name', 'Subject'];
//   // Add Standard columns (I to XII)
//   for (let i = 1; i <= 12; i++) {
//     headers.push(`Standard ${Utils.toRoman(i)}`);
//   }
  
//   sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
//   sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
//   sheet.setFrozenRows(1);
};

/**
 * Create periods configuration sheet
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The active spreadsheet
 */
Init.Sheets.createPeriodsConfigSheet = function(spreadsheet) {
  // Delete existing sheet if it exists
  let sheet = spreadsheet.getSheetByName(SHEET_NAMES.PERIODS_CONFIG);
  if (sheet) spreadsheet.deleteSheet(sheet);
  
  // Create new sheet
  sheet = spreadsheet.insertSheet(SHEET_NAMES.PERIODS_CONFIG);
  
  // Set up configuration options
  const config = [
    ['Setting', 'Value'],
    ['School Start Time', '8:00 AM'],
    ['School End Time', '3:00 PM'],
    ['Period Duration (minutes)', '45'],
    ['Break Duration (minutes)', '15'],
    ['Lunch Duration (minutes)', '30'],
    ['Periods per day', '9']
  ];
  
  sheet.getRange(1, 1, config.length, 2).setValues(config);
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
  sheet.setFrozenRows(1);
};

/**
 * Create class configuration sheet
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The active spreadsheet
 */
Init.Sheets.createClassConfigSheet = function(spreadsheet) {
  // Delete existing sheet if it exists
  let sheet = spreadsheet.getSheetByName(SHEET_NAMES.CLASS_CONFIG);
  if (sheet) spreadsheet.deleteSheet(sheet);
  
  // Create new sheet
  sheet = spreadsheet.insertSheet(SHEET_NAMES.CLASS_CONFIG);
  
  // Set up headers
  const headers = ['Standard', 'Section'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
};

/**
 * Create subject periods sheet
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The active spreadsheet
 */
Init.Sheets.createSubjectPeriodsSheet = function(spreadsheet) {
  // Delete existing sheet if it exists
  let sheet = spreadsheet.getSheetByName(SHEET_NAMES.SUBJECT_PERIODS);
  if (sheet) spreadsheet.deleteSheet(sheet);
  
  // Create new sheet
  sheet = spreadsheet.insertSheet(SHEET_NAMES.SUBJECT_PERIODS);
  
  // Set up headers
  const headers = ['Standard', 'Subject', 'Min Periods/Week', 'Max Periods/Week', 'Max Periods/Day'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
};

/**
 * Create empty roster sheet
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The active spreadsheet
 */
Init.Sheets.createRosterSheet = function(spreadsheet) {
  // Delete existing sheet if it exists
  let sheet = spreadsheet.getSheetByName(SHEET_NAMES.ROSTER);
  if (sheet) spreadsheet.deleteSheet(sheet);
  
  // Create new sheet
  sheet = spreadsheet.insertSheet(SHEET_NAMES.ROSTER);
  
  // This will be populated by the roster generation algorithm
  sheet.getRange('A1').setValue('Roster will be generated here');
}; 