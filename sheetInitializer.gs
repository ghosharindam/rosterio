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
  const headers = [
    ['Configuration', 'Value'],
    ['Periods Per Day', '8'],
    ['Period Duration (minutes)', '45'],
    ['School Days Per Week', '5'],
    ['First Period Start Time', '8:30 AM']
  ];
  
  sheet.getRange(1, 1, headers.length, 2).setValues(headers);
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
  sheet.setFrozenRows(1);
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