function generateRoster() {
  try {
    // Load all required data
    const periodsConfig = loadPeriodsConfig();
    const teachers = loadTeacherSubjects();
    const classes = loadClassConfig();
    const subjectPeriods = loadSubjectPeriods();
    
    // Create empty roster template and get sheet info
    const { sheet, totalColumns, breakColumn, lunchColumn } = createEmptyRoster(classes, periodsConfig);
    
    // Prepare data array for batch update
    const numRows = classes.length * Object.keys(periodsConfig.dayTimings).length;
    const rosterData = [];
    
    // Generate roster data
    classes.forEach((cls, classIndex) => {
      Object.keys(periodsConfig.dayTimings).forEach(day => {
        if (periodsConfig.dayTimings[day].isActive !== false) {
          const rowData = new Array(totalColumns).fill('');
          rowData[0] = `${cls.standard}-${cls.section}`;
          rowData[1] = day;
          
          // Fill in periods
          for (let col = 2; col < totalColumns; col++) {
            if (col === breakColumn - 1) {
              rowData[col] = 'BREAK';
            } else if (col === lunchColumn - 1) {
              rowData[col] = 'LUNCH';
            } else {
              // Add subject and teacher assignment
              const standard = cls.standard;
              const subjects = subjectPeriods[standard] || {};
              const availableSubjects = Object.keys(subjects);
              
              if (availableSubjects.length > 0) {
                const randomSubject = availableSubjects[Math.floor(Math.random() * availableSubjects.length)];
                const teachersForSubject = teachers.filter(t => 
                  t.standards[standard] === true && t.subject === randomSubject
                );
                
                if (teachersForSubject.length > 0) {
                  const randomTeacher = teachersForSubject[Math.floor(Math.random() * teachersForSubject.length)];
                  rowData[col] = `${randomSubject}\n(${randomTeacher.name})`;
                }
              }
            }
          }
          
          rosterData.push(rowData);
        }
      });
    });
    
    // Batch update the sheet
    const range = sheet.getRange(2, 1, rosterData.length, totalColumns);
    range.setValues(rosterData);
    
    // Format cells
    range.setWrap(true);
    range.setVerticalAlignment('middle');
    
    // Format the sheet
    formatRosterSheet(sheet, totalColumns);
    
    // Store the generated data
    updateOriginalData(sheet);
    
    // Add filters to the sheet
    addRosterFilters(sheet);
    
    // Check for conflicts after generation
    checkTeacherConflicts();
    
    SpreadsheetApp.getActiveSpreadsheet().toast('Roster generated successfully!');
    
  } catch (e) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Error generating roster: ' + e.toString(), 'Error', 30);
    console.error('Roster generation error:', e);
  }
}

// Update formatRosterSheet to handle dynamic columns
function formatRosterSheet(sheet, totalColumns) {
  // Auto-resize columns
  sheet.autoResizeColumns(1, totalColumns);
  
  // Set minimum column width for period columns
  for (let i = 3; i <= totalColumns; i++) {
    if (sheet.getColumnWidth(i) < 120) {
      sheet.setColumnWidth(i, 120);
    }
  }
  
  // Get the last row
  const lastRow = sheet.getLastRow();
  
  // Batch format the entire range
  const range = sheet.getRange(1, 1, lastRow, totalColumns);
  range.setHorizontalAlignment('center');
  range.setBorder(true, true, true, true, true, true);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, totalColumns);
  headerRange.setBackground('#f3f3f3');
  headerRange.setFontWeight('bold');
}

// Create empty roster template
function createEmptyRoster(classes, periodsConfig) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.ROSTER);
  
  // Clear existing content
  sheet.clear();
  
  // Calculate total columns needed based on number of periods
  const numPeriods = periodsConfig.periodsPerDay;
  const totalColumns = 2 + numPeriods + 2; // Class, Day, Periods, Break, Lunch
  
  // Create headers
  const headers = ['Class', 'Day'];
  for (let i = 1; i <= numPeriods; i++) {
    if (i === Math.floor(numPeriods / 2)) {
      headers.push('Break');
    } else if (i === Math.floor(3 * numPeriods / 4)) {
      headers.push('Lunch');
    } else {
      headers.push(`Period ${i}`);
    }
  }
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  return {
    sheet: sheet,
    totalColumns: headers.length,
    breakColumn: headers.indexOf('Break') + 1,
    lunchColumn: headers.indexOf('Lunch') + 1
  };
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

// Similar loading functions for other data...

function generateRosterMatrix(teacherData, periodsConfig, classConfig, subjectPeriods) {
  // Implementation of the constraint satisfaction algorithm
  // This is where the main logic for generating the roster while
  // satisfying all constraints will go
  
  // For now, returning a placeholder
  return {
    message: 'Roster generation to be implemented'
  };
}

function displayRoster(rosterData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.ROSTER);
  
  // Clear existing roster
  sheet.clear();
  
  // Implementation of roster display logic
  // This will format and display the generated roster
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
    periodsPerDay: parseInt(data[4][1]),
    dayTimings: {}
  };
  
  // Parse day-wise timings (starting from row 7)
  for (let i = 7; i < data.length; i++) {
    const day = data[i][0];
    const isActive = data[i][3] === 'Yes';
    if (isActive) {
      config.dayTimings[day] = {
        startTime: data[i][1],
        endTime: data[i][2]
      };
    }
  }
  
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

// Function to check and highlight teacher conflicts
function checkTeacherConflicts() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.ROSTER);
    const originalDataSheet = ss.getSheetByName('_OriginalRosterData');
    if (!sheet || !originalDataSheet) return;

    // Get original data (without filters)
    const originalData = originalDataSheet.getDataRange().getValues();
    if (originalData.length === 0) return;

    // Clear existing conflict highlighting on visible sheet
    sheet.getRange(3, 1, sheet.getLastRow() - 2, sheet.getLastColumn())
         .setBackground(null);

    // Track conflicts by day and period
    const teacherSchedule = new Map(); // Map of "day-period" to array of {teacher, class, row}
    const conflictCells = new Set();

    // Find all conflicts in original data
    for (let row = 0; row < originalData.length; row++) {
      const day = originalData[row][1];      // Column B: Day
      const className = originalData[row][0]; // Column A: Class
      const rowData = originalData[row];

      // Check each period column (starting from C)
      for (let col = 2; col < rowData.length; col++) {
        const cellValue = rowData[col];
        
        // Skip break, lunch, and empty cells
        if (!cellValue || cellValue === 'BREAK' || cellValue === 'LUNCH') continue;

        // Extract teacher name
        const match = cellValue.match(/\((.*?)\)$/);
        if (!match) continue;

        const teacherName = match[1];
        const key = `${day}-${col}`; // Key is day-period combination

        if (!teacherSchedule.has(key)) {
          teacherSchedule.set(key, []);
        }

        const periodSchedule = teacherSchedule.get(key);
        
        // Check if this teacher is already scheduled in this period
        const existingSchedule = periodSchedule.find(s => s.teacher === teacherName);
        if (existingSchedule && existingSchedule.class !== className) {
          // Conflict found - teacher is teaching different classes in same period
          conflictCells.add(`${existingSchedule.row},${col}`);
          conflictCells.add(`${row},${col}`);
        }

        periodSchedule.push({
          teacher: teacherName,
          class: className,
          row: row
        });
      }
    }

    // Apply highlighting to visible sheet
    const visibleData = sheet.getDataRange().getValues();

    // Apply highlighting in one pass
    for (let visRow = 2; visRow < visibleData.length; visRow++) {
      for (let visCol = 2; visCol < visibleData[visRow].length; visCol++) {
        const visibleCell = visibleData[visRow][visCol];
        if (!visibleCell || visibleCell === 'BREAK' || visibleCell === 'LUNCH') continue;

        // Check if this cell's position matches any conflict
        const match = visibleCell.match(/\((.*?)\)$/);
        if (!match) continue;

        const teacherName = match[1];
        const day = visibleData[visRow][1];
        const key = `${day}-${visCol}`;

        const periodSchedule = teacherSchedule.get(key) || [];
        const teacherSchedules = periodSchedule.filter(s => s.teacher === teacherName);
        
        if (teacherSchedules.length > 1 && 
            teacherSchedules.some(s => s.class !== visibleData[visRow][0])) {
          sheet.getRange(visRow + 1, visCol + 1).setBackground('#ffcdd2');
        }
      }
    }

    // Show conflict summary
    if (conflictCells.size > 0) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Found ${conflictCells.size / 2} teacher conflicts (highlighted in red)`,
        'Warning',
        30
      );
    }

  } catch (e) {
    console.error('Error checking teacher conflicts:', e);
  }
}

// Add trigger for on-edit checks
function createOnEditTrigger() {
  const ss = SpreadsheetApp.getActive();
  ScriptApp.newTrigger('onRosterEdit')
           .forSpreadsheet(ss)
           .onEdit()
           .create();
}

// Handle edit events
function onRosterEdit(e) {
  // Check if edit was in the roster sheet
  if (e.source.getActiveSheet().getName() === SHEET_NAMES.ROSTER) {
    // Wait a brief moment for the edit to complete
    Utilities.sleep(100);
    checkTeacherConflicts();
  }
}

// Store the generated data
function updateOriginalData(sheet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let originalDataSheet = ss.getSheetByName('_OriginalRosterData');
  if (!originalDataSheet) {
    originalDataSheet = ss.insertSheet('_OriginalRosterData');
    originalDataSheet.hideSheet();
  }
  
  // Store the current roster data (excluding filter row)
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  originalDataSheet.clear();
  originalDataSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
}

// Helper function to format time
function formatTime(timeStr) {
  const date = new Date(`1/1/2000 ${timeStr}`);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'h:mm a');
}

// Helper function to add minutes to time
function addMinutes(timeStr, minutes) {
  const date = new Date(`1/1/2000 ${timeStr}`);
  date.setMinutes(date.getMinutes() + minutes);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'h:mm a');
} 