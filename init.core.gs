/**
 * Initialization module for Roster App
 * Contains core initialization functionality
 */
var Init = Init || {};

/**
 * Initialize all required sheets
 */
Init.initializeSheets = function() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // First, clear all existing data
  Utils.clearAllData();
  
  // Delete the Standard-Subject View sheet if it exists
  const standardSubjectSheet = spreadsheet.getSheetByName('Standard-Subject View');
  if (standardSubjectSheet) {
    spreadsheet.deleteSheet(standardSubjectSheet);
  }

  // Create Teacher-Subject-Standard sheet
  Init.Sheets.createTeacherSubjectSheet(spreadsheet);
  
  // Create Periods Configuration sheet
  Init.Sheets.createPeriodsConfigSheet(spreadsheet);
  
  // Create Standard-Section sheet
  Init.Sheets.createClassConfigSheet(spreadsheet);
  
  // Create Standard-Subject-Periods sheet
  Init.Sheets.createSubjectPeriodsSheet(spreadsheet);
  
  // Create Roster sheet (empty template)
  Init.Sheets.createRosterSheet(spreadsheet);
  
  // Show success message
  SpreadsheetApp.getActiveSpreadsheet().toast('All sheets have been initialized successfully.');
};