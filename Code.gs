// Main entry point for the application
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Rosterio')
    .addItem('Initialize Sheets', 'initializeSheets')
    .addItem('Populate Sample Data', 'populateSampleData')
    .addItem('Generate Roster', 'generateRoster')
    .addSeparator()
    .addItem('Clear All Data', 'clearAllData')
    .addToUi();
}

// Constants for sheet names
const SHEET_NAMES = {
  TEACHER_SUBJECTS: 'Teacher-Subject-Standard',
  PERIODS_CONFIG: 'Periods-Configuration',
  CLASS_CONFIG: 'Standard-Section',
  SUBJECT_PERIODS: 'Standard-Subject-Periods',
  ROSTER: 'Generated-Roster'
};

// Initialize all required sheets
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Teacher-Subject-Standard sheet
  createTeacherSubjectSheet(ss);
  
  // Create Periods Configuration sheet
  createPeriodsConfigSheet(ss);
  
  // Create Standard-Section sheet
  createClassConfigSheet(ss);
  
  // Create Standard-Subject-Periods sheet
  createSubjectPeriodsSheet(ss);
  
  // Create Roster sheet (empty template)
  createRosterSheet(ss);
}

// Need to implement:
function validateTeacherSubjectMatrix() {
  // Validate teacher-subject-standard combinations
}

function validatePeriodConfig() {
  // Validate period timings and counts
}

function validateSubjectDistribution() {
  // Check if subject period requirements can be met
}

function generateRoster() {
  // Main algorithm to generate the timetable
  // Should consider all constraints:
  // - Teacher availability
  // - Subject distribution
  // - Period constraints
}

function distributeSubjects() {
  // Distribute subjects across the week
  // Ensure min/max constraints are met
}

function assignTeachers() {
  // Assign teachers to slots while respecting constraints
}

function onEdit(e) {
  // Trigger roster regeneration when input data changes
}

function setupTriggers() {
  // Set up necessary triggers for automatic updates
}

function createTeacherSubjectSheet(ss) {
  // Delete existing sheet if it exists
  let sheet = ss.getSheetByName(SHEET_NAMES.TEACHER_SUBJECTS);
  if (sheet) ss.deleteSheet(sheet);
  
  // Create new sheet
  sheet = ss.insertSheet(SHEET_NAMES.TEACHER_SUBJECTS);
  
  // Set up headers
  const headers = ['Teacher Name', 'Subject'];
  // Add Standard columns (I to XII)
  for (let i = 1; i <= 12; i++) {
    headers.push(`Standard ${toRoman(i)}`);
  }
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function createPeriodsConfigSheet(ss) {
  // Delete existing sheet if it exists
  let sheet = ss.getSheetByName(SHEET_NAMES.PERIODS_CONFIG);
  if (sheet) ss.deleteSheet(sheet);
  
  // Create new sheet
  sheet = ss.insertSheet(SHEET_NAMES.PERIODS_CONFIG);
  
  // Set up configuration options
  const config = [
    ['Setting', 'Value'],
    ['School Start Time', '8:00 AM'],
    ['School End Time', '3:00 PM'],
    ['Period Duration (minutes)', '45'],
    ['Break Duration (minutes)', '15'],
    ['Lunch Duration (minutes)', '30'],
    ['Number of Periods per Day', '8']
  ];
  
  sheet.getRange(1, 1, config.length, 2).setValues(config);
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function createClassConfigSheet(ss) {
  // Delete existing sheet if it exists
  let sheet = ss.getSheetByName(SHEET_NAMES.CLASS_CONFIG);
  if (sheet) ss.deleteSheet(sheet);
  
  // Create new sheet
  sheet = ss.insertSheet(SHEET_NAMES.CLASS_CONFIG);
  
  // Set up headers
  const headers = ['Standard', 'Section'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function createSubjectPeriodsSheet(ss) {
  // Delete existing sheet if it exists
  let sheet = ss.getSheetByName(SHEET_NAMES.SUBJECT_PERIODS);
  if (sheet) ss.deleteSheet(sheet);
  
  // Create new sheet
  sheet = ss.insertSheet(SHEET_NAMES.SUBJECT_PERIODS);
  
  // Set up headers
  const headers = ['Standard', 'Subject', 'Min Periods/Week', 'Max Periods/Week', 'Max Periods/Day'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function createRosterSheet(ss) {
  // Delete existing sheet if it exists
  let sheet = ss.getSheetByName(SHEET_NAMES.ROSTER);
  if (sheet) ss.deleteSheet(sheet);
  
  // Create new sheet
  sheet = ss.insertSheet(SHEET_NAMES.ROSTER);
  
  // This will be populated by the roster generation algorithm
  sheet.getRange('A1').setValue('Roster will be generated here');
}

// Helper function to convert numbers to Roman numerals
function toRoman(num) {
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
}

// Add this test function
function testValidations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Test teacher subject matrix
  validateTeacherSubjectMatrix();
  
  // Test period config
  validatePeriodConfig();
  
  // Test subject distribution
  validateSubjectDistribution();
  
  Logger.log('Validation tests completed');
} 