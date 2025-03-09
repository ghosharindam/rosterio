/**
 * Data loading module
 * Contains functions for loading data from sheets
 */
var Data = Data || {};

/**
 * Get the number of periods from configuration
 * @return {number} The number of periods (default 8)
 */
Data.getPeriodCount = function() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = spreadsheet.getSheetByName(SHEET_NAMES.PERIODS_CONFIG);
  var periodCount = 8; // Default to 8 periods if not specified

  // If config sheet exists, get the number of periods from it
  if (configSheet) {
    // Find the periods configuration row
    const configData = configSheet.getDataRange().getValues();
    for (let i = 0; i < configData.length; i++) {
      if (configData[i][0] === 'Periods per day') {
        periodCount = parseInt(configData[i][1]);
      }
    }
  }

  // Add 2 to the period count for the breaks
  periodCount += 2;
  
  // Fallback to a default number of periods if not found in config
  return periodCount; 
};

/**
 * Load configuration from the Periods Configuration sheet
 * @return {Object} Configuration object with period settings
 */
Data.loadPeriodsConfig = function() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAMES.PERIODS_CONFIG);
  const data = sheet.getDataRange().getValues();
  
  // Parse general configuration
  const config = {
    periodDuration: parseInt(data[1][1]),
    breakDuration: parseInt(data[2][1]),
    lunchDuration: parseInt(data[3][1]),
    periodsPerDay: Data.getPeriodCount(), // Use the static number of periods from configuration
    // Standard week days
    dayTimings: {
      'Monday': { isActive: true },
      'Tuesday': { isActive: true },
      'Wednesday': { isActive: true },
      'Thursday': { isActive: true },
      'Friday': { isActive: true }
    }
  };
  
  return config;
};

/**
 * Load teacher availability data
 * @return {Array} Array of teacher objects with subjects and standards
 */
Data.loadTeacherSubjects = function() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAMES.TEACHER_SUBJECTS);
  const data = sheet.getDataRange().getValues();
  
  const teachers = [];
  for (let i = 1; i < data.length; i++) {
    const teacher = {
      name: data[i][0],
      subject: data[i][1],
      standards: {}
    };
    
    // Start from column 2 (index 2) for standards
    for (let j = 2; j < data[0].length; j++) {
      const standard = data[0][j].replace('Standard ', '');
      teacher.standards[standard] = data[i][j] === 'Yes';
    }
    
    teachers.push(teacher);
  }
  
  return teachers;
};

/**
 * Load class configuration
 * @return {Array} Array of class objects with standard and section
 */
Data.loadClassConfig = function() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAMES.CLASS_CONFIG);
  const data = sheet.getDataRange().getValues();
  
  const classes = [];
  for (let i = 1; i < data.length; i++) {
    classes.push({
      standard: data[i][0],
      section: data[i][1]
    });
  }
  
  return classes;
};

/**
 * Load subject period requirements
 * @return {Object} Object with subject period requirements by standard
 */
Data.loadSubjectPeriods = function() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAMES.SUBJECT_PERIODS);
  const data = sheet.getDataRange().getValues();
  
  const requirements = {};
  for (let i = 1; i < data.length; i++) {
    const standard = data[i][0];
    if (!requirements[standard]) {
      requirements[standard] = {};
    }
    
    requirements[standard][data[i][1]] = {
      minPerWeek: parseInt(data[i][2]),
      maxPerWeek: parseInt(data[i][3]),
      maxPerDay: parseInt(data[i][4])
    };
  }
  
  return requirements;
}; 