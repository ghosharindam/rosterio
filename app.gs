app.gs /**
 * Roster App - School Timetable Generator
 * Main application file
 */

// Constants for sheet names - global definition used by all modules
const SHEET_NAMES = {
  CONFIG: 'Configuration',
  ROSTER: 'Generated-Roster',
  TEACHER_SUBJECTS: 'Teacher-Subjects',
  PERIODS_CONFIG: 'Periods-Configuration',
  CLASS_CONFIG: 'Class-Configuration',
  SUBJECT_PERIODS: 'Subject-Periods'
};

// Global API functions that are exposed to the menu

/**
 * Initialize all sheets
 * Called from the menu
 */
function initializeSheets() {
  Init.initializeSheets();
}

/**
 * Populate sample data
 * Called from the menu
 */
function populateSampleData() {
  Init.populateSampleData();
}

/**
 * Generate the roster
 * Called from the menu
 */
function generateRoster() {
  Roster.generate();
}

/**
 * Clear all data
 * Called from the menu
 */
function clearAllData() {
  Utils.clearAllData();
}

/**
 * Handle edit events
 * Called automatically by Google Apps Script
 * @param {Object} e - The edit event
 */
function onEdit(e) {
  Roster.Conflicts.onRosterEdit(e);
}

/**
 * Validate the schedule feasibility
 * Checks if the roster generation can satisfy all constraints
 */
function validateSchedule() {
  if (typeof Roster !== 'undefined' && 
      typeof Roster.Validator !== 'undefined' && 
      typeof Roster.Validator.validateRoster === 'function') {
    Roster.Validator.validateRoster();
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Schedule validation module is not available. Please check your installation.',
      'Error',
      10
    );
  }
}
