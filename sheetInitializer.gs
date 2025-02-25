function createTeacherSubjectSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_NAMES.TEACHER_SUBJECTS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.TEACHER_SUBJECTS);
  }
  
  // Set up headers
  const headers = [
    'Teacher Name',
    'Subject',
    'Standard',
    'Min Periods/Week',
    'Max Periods/Week'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function createPeriodsConfigSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_NAMES.PERIODS_CONFIG);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.PERIODS_CONFIG);
  }
  
  // Set up headers and default values
  const generalConfig = [
    ['General Configuration', 'Value', '', ''],
    ['Period Duration (minutes)', '45', '', ''],
    ['Break Duration (minutes)', '15', '', ''],
    ['Lunch Duration (minutes)', '30', '', ''],
    ['Number of Periods', '8', '', ''],
  ];
  
  
  // Clear existing content
  sheet.clear();
  
  // Set the values
  const allData = [...generalConfig];
  sheet.getRange(1, 1, allData.length, 4).setValues(allData);
  
  // Format the sheet
  sheet.getRange("A1:D1").setBackground("#f3f3f3");
  sheet.getRange("A1:D1").merge();

  
  // Set time validation for start and end times
  const timeRange1 = sheet.getRange("B8:B14");
  const timeRange2 = sheet.getRange("C8:C14");
  const timeValidation = SpreadsheetApp.newDataValidation()
    .requireFormulaSatisfied('=AND(ISTIME(VALUE(B8)), VALUE(B8)>=0, VALUE(B8)<1)')
    .setHelpText('Please enter a valid time (e.g., 8:30 AM)')
    .build();
  timeRange1.setDataValidation(timeValidation);
  timeRange2.setDataValidation(timeValidation);
  


  // Format headers
  sheet.getRange(1, 1, allData.length, 4).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, 4);
}

function createClassConfigSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_NAMES.CLASS_CONFIG);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.CLASS_CONFIG);
  }
  
  // Set up headers
  const headers = ['Standard', 'Section'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function createSubjectPeriodsSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_NAMES.SUBJECT_PERIODS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.SUBJECT_PERIODS);
  }
  
  // Set up headers
  const headers = [
    'Standard',
    'Subject',
    'Min Periods/Week',
    'Max Periods/Week',
    'Max Periods/Day'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function createRosterSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_NAMES.ROSTER);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.ROSTER);
  }
  
  // Clear any existing content
  sheet.clear();
  
  // This will be populated when generating the roster
  sheet.getRange(1, 1).setValue('Roster will be generated here');
}

function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create all required sheets
  createTeacherSubjectSheet(ss);
  createPeriodsConfigSheet(ss);
  createClassConfigSheet(ss);
  createSubjectPeriodsSheet(ss);
  createRosterSheet(ss);
  
  // Create the on-edit trigger
  createOnEditTrigger();
} 