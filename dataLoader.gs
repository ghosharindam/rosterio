// Functions for loading data from various sheets
// for the roster generation process

// Get the number of periods from configuration
function getPeriodCount() {
  // Get the number of periods from the configuration
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(SHEET_NAMES.PERIODS_CONFIG);
  
  // If config sheet exists, get the number of periods from it
  if (configSheet) {
    // Find the periods configuration row
    const configData = configSheet.getDataRange().getValues();
    for (let i = 0; i < configData.length; i++) {
      if (configData[i][0] === 'Number of Periods') {
        return parseInt(configData[i][1]);
      }
    }
  }
  
  // Fallback to a default number of periods if not found in config
  return 8; // Default to 8 periods if not specified
}

// Load configuration from the Periods Configuration sheet
function loadPeriodsConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PERIODS_CONFIG);
  const data = sheet.getDataRange().getValues();
  
  // Parse general configuration
  const config = {
    periodDuration: parseInt(data[1][1]),
    breakDuration: parseInt(data[2][1]),
    lunchDuration: parseInt(data[3][1]),
    periodsPerDay: getPeriodCount(), // Use the static number of periods from configuration
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
}

// Load teacher availability data
function loadTeacherSubjects() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.TEACHER_SUBJECTS);
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
}

// Load class configuration
function loadClassConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.CLASS_CONFIG);
  const data = sheet.getDataRange().getValues();
  
  const classes = [];
  for (let i = 1; i < data.length; i++) {
    classes.push({
      standard: data[i][0],
      section: data[i][1]
    });
  }
  
  return classes;
}

// Load subject period requirements
function loadSubjectPeriods() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.SUBJECT_PERIODS);
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
}

function loadTeacherData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.TEACHER_SUBJECTS);
  const data = sheet.getDataRange().getValues();
  
  // Remove header row and process data
  data.shift();
  return data.map(row => ({
    teacherName: row[0],
    subject: row[1],
    standard: row[2],
    minPeriods: row[3],
    maxPeriods: row[4]
  }));
} 