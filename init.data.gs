/**
 * Sample data initialization module for Rosterio
 * Contains functions to populate sheets with sample data
 */
var Init = Init || {};

/**
 * Populate all sheets with sample data for testing
 */
Init.populateSampleData = function() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Populate teacher-subject data
  Init.populateTeacherSubjectData(spreadsheet);
  
  // Populate class configuration
  Init.populateClassConfigData(spreadsheet);
  
  // Populate subject-periods requirements
  Init.populateSubjectPeriodsData(spreadsheet);
  
  // Show success message
  SpreadsheetApp.getActiveSpreadsheet().toast('Sample data populated successfully!');
};

/**
 * Populate teacher-subject sheet with sample data
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The active spreadsheet
 */
Init.populateTeacherSubjectData = function(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(SHEET_NAMES.TEACHER_SUBJECTS);
  if (!sheet) {
    console.error('Teacher-Subjects sheet not found');
    return;
  }
  
  // Create sample teacher-subject data
  const data = [
    ['John Smith', 'Mathematics', 'Yes', 'Yes', 'Yes', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No'],
    ['Mary Johnson', 'English', 'Yes', 'Yes', 'Yes', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No'],
    ['Robert Brown', 'Science', 'No', 'No', 'No', 'Yes', 'Yes', 'Yes', 'No', 'No', 'No', 'No', 'No', 'No'],
    ['Patricia Davis', 'History', 'No', 'No', 'No', 'Yes', 'Yes', 'Yes', 'No', 'No', 'No', 'No', 'No', 'No'],
    ['Michael Wilson', 'Geography', 'No', 'No', 'No', 'No', 'No', 'No', 'Yes', 'Yes', 'Yes', 'No', 'No', 'No'],
    ['Linda Martinez', 'Art', 'No', 'No', 'No', 'No', 'No', 'No', 'Yes', 'Yes', 'Yes', 'No', 'No', 'No'],
    ['James Taylor', 'Physical Education', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'Yes', 'Yes', 'Yes'],
    ['Elizabeth Anderson', 'Computer Science', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'Yes', 'Yes', 'Yes']
  ];
  
  // Write data to sheet
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
};

/**
 * Populate class configuration sheet with sample data
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The active spreadsheet
 */
Init.populateClassConfigData = function(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(SHEET_NAMES.CLASS_CONFIG);
  if (!sheet) {
    console.error('Class-Configuration sheet not found');
    return;
  }
  
  // Create sample class configuration data
  const data = [
    ['I', 'A'],
    ['I', 'B'],
    ['II', 'A'],
    ['II', 'B'],
    ['III', 'A'],
    ['III', 'B'],
    ['IV', 'A'],
    ['IV', 'B'],
    ['V', 'A'],
    ['V', 'B'],
    ['VI', 'A'],
    ['VI', 'B']
  ];
  
  // Write data to sheet
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
};

/**
 * Populate subject-periods sheet with sample data
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The active spreadsheet
 */
Init.populateSubjectPeriodsData = function(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(SHEET_NAMES.SUBJECT_PERIODS);
  if (!sheet) {
    console.error('Subject-Periods sheet not found');
    return;
  }
  
  // Create sample subject-periods data
  const data = [
    ['I', 'Mathematics', '5', '7', '2'],
    ['I', 'English', '5', '7', '2'],
    ['I', 'Science', '3', '5', '1'],
    ['I', 'History', '2', '3', '1'],
    ['II', 'Mathematics', '5', '7', '2'],
    ['II', 'English', '5', '7', '2'],
    ['II', 'Science', '3', '5', '1'],
    ['II', 'History', '2', '3', '1'],
    ['III', 'Mathematics', '5', '7', '2'],
    ['III', 'English', '5', '7', '2'],
    ['III', 'Science', '3', '5', '1'],
    ['III', 'Geography', '2', '3', '1']
  ];
  
  // Write data to sheet
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}; 