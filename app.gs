/**
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
 * Handle filter edit events
 * Called automatically by Google Apps Script
 * @param {Object} e - The edit event
 */
function onFilterEdit(e) {
  try {
    const sheet = e.source.getActiveSheet();
    
    // Only process edits in the roster sheet and in the filter row (row 2)
    if (sheet.getName() === SHEET_NAMES.ROSTER && e.range.getRow() === 2) {
      const column = e.range.getColumn();
      const value = e.value || ''; // Default to empty string if no value
      
      // Check which filter was changed
      if (column === 1) { // Class filter
        Roster.Filters.filterByClass(value);
      } else if (column === 2) { // Day filter
        Roster.Filters.filterByDay(value);
      }
    }
  } catch (e) {
    console.error("Error in filter edit handler:", e);
  }
} 