function generateRoster() {
  try {
    // Load all required data
    const periodsConfig = loadPeriodsConfig();
    const teachers = loadTeacherSubjects();
    const classes = loadClassConfig();
    const subjectPeriods = loadSubjectPeriods();
    
    // Create empty roster template
    const sheet = createEmptyRoster(classes, periodsConfig);
    
    // Define break and lunch columns (1-based column indices)
    const BREAK_COLUMN = 7;  // Column G
    const LUNCH_COLUMN = 10; // Column J
    
    // Get number of periods from configuration
    const totalPeriods = periodsConfig.periodsPerDay;
    
    // Prepare data array for batch update
    const numRows = classes.length * 5; // 5 days per class
    const numCols = 12; // Total columns including class, day, and all periods
    const rosterData = [];
    
    // For each class
    classes.forEach((cls, classIndex) => {
      const standard = cls.standard;
      const subjects = subjectPeriods[standard] || {};
      
      // Get available teachers for this standard
      const availableTeachers = teachers.filter(teacher => 
        teacher.standards[standard] === true
      );
      
      // For each day (5 days)
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(day => {
        // Create a row with empty strings
        const rowData = new Array(numCols).fill('');
        
        // Set class and day (columns A and B)
        rowData[0] = `${cls.standard}-${cls.section}`;
        rowData[1] = day;
        
        // Set break and lunch (columns G and J)
        rowData[6] = 'BREAK';  // Column G (index 6)
        rowData[9] = 'LUNCH';  // Column J (index 9)
        
        // Fill in periods (starting from column C)
        for (let period = 0; period < totalPeriods; period++) {
          // Calculate the actual column index in the array (0-based)
          let colIndex = period + 2;  // Start from column C (index 2)
          
          // Adjust column index for break and lunch
          if (period >= 4) colIndex++; // After break
          if (period >= 6) colIndex++; // After lunch
          
          // Skip if this would be a break or lunch column
          if (colIndex === 6 || colIndex === 9) continue; // Skip G and J
          
          // Randomly select a subject and teacher
          const availableSubjects = Object.keys(subjects);
          if (availableSubjects.length > 0) {
            const randomSubject = availableSubjects[Math.floor(Math.random() * availableSubjects.length)];
            const teachersForSubject = availableTeachers.filter(t => t.subject === randomSubject);
            
            if (teachersForSubject.length > 0) {
              const randomTeacher = teachersForSubject[Math.floor(Math.random() * teachersForSubject.length)];
              rowData[colIndex] = `${randomSubject}\n(${randomTeacher.name})`;
            }
          }
        }
        
        rosterData.push(rowData);
      });
    });
    
    // Batch update the sheet
    const range = sheet.getRange(2, 1, rosterData.length, numCols);
    range.setValues(rosterData);
    
    // Batch format the cells
    range.setWrap(true);
    range.setVerticalAlignment('middle');
    
    // Format the sheet
    formatRosterSheet(sheet);
    
    // Check for conflicts after generation
    checkTeacherConflicts();
    
    SpreadsheetApp.getActiveSpreadsheet().toast('Roster generated successfully!');
    
  } catch (e) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Error generating roster: ' + e.toString(), 'Error', 30);
    console.error('Roster generation error:', e);
  }
}

// Helper function to format the roster sheet
function formatRosterSheet(sheet) {
  // Auto-resize columns
  sheet.autoResizeColumns(1, 12);
  
  // Set minimum column width for period columns
  for (let i = 3; i <= 12; i++) {
    if (sheet.getColumnWidth(i) < 120) {
      sheet.setColumnWidth(i, 120);
    }
  }
  
  // Get the last row
  const lastRow = sheet.getLastRow();
  
  // Batch format the entire range
  const range = sheet.getRange(1, 1, lastRow, 12);
  range.setHorizontalAlignment('center');
  range.setBorder(true, true, true, true, true, true);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, 12);
  headerRange.setBackground('#f3f3f3');
  headerRange.setFontWeight('bold');
  
  // Format break and lunch columns in one operation
  const breakRange = sheet.getRange(2, 7, lastRow - 1, 1);
  const lunchRange = sheet.getRange(2, 10, lastRow - 1, 1);
  breakRange.setBackground('#e6e6e6');
  lunchRange.setBackground('#e6e6e6');
}

// Create empty roster template
function createEmptyRoster(classes, periodsConfig) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.ROSTER);
  
  // Clear existing content
  sheet.clear();
  
  // Create headers
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const headers = ['Class', 'Day', 'Period 1', 'Period 2', 'Period 3', 'Period 4', 
                  'Break', 'Period 5', 'Period 6', 'Lunch', 'Period 7', 'Period 8'];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  return sheet;
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
  
  // Convert the 2D array into an object
  const config = {};
  for (let i = 1; i < data.length; i++) {
    config[data[i][0]] = data[i][1];
  }
  
  return {
    startTime: config['School Start Time'],
    endTime: config['School End Time'],
    periodDuration: parseInt(config['Period Duration (minutes)']),
    breakDuration: parseInt(config['Break Duration (minutes)']),
    lunchDuration: parseInt(config['Lunch Duration (minutes)']),
    periodsPerDay: parseInt(config['Number of Periods per Day'])
  };
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
    if (!sheet) return;

    // Get all roster data
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return; // Empty or only headers

    // Clear existing conflict highlighting
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
         .setBackground(null);

    // Track teacher assignments by day and period
    const teacherSchedule = {};
    const conflictCells = [];

    // Process each row (skipping header)
    for (let row = 1; row < data.length; row++) {
      const day = data[row][1];  // Column B: Day
      const rowData = data[row];

      // Initialize day in schedule if needed
      if (!teacherSchedule[day]) {
        teacherSchedule[day] = {};
      }

      // Check each period column (starting from C)
      for (let col = 2; col < rowData.length; col++) {
        // Skip break and lunch columns
        if (col === 6 || col === 9) continue;

        const cellValue = rowData[col];
        if (!cellValue) continue;

        // Extract teacher name from cell (format: "Subject\n(Teacher Name)")
        const match = cellValue.match(/\((.*?)\)$/);
        if (!match) continue;

        const teacherName = match[1];
        const classInfo = rowData[0]; // Column A: Class

        // Initialize period in schedule if needed
        if (!teacherSchedule[day][col]) {
          teacherSchedule[day][col] = [];
        }

        // Check for conflicts
        if (teacherSchedule[day][col].some(schedule => schedule.teacher === teacherName)) {
          // Conflict found - mark both cells
          conflictCells.push({row: row + 1, col: col + 1});
          // Find and mark the conflicting cell from previous assignment
          const conflictRow = teacherSchedule[day][col].find(s => s.teacher === teacherName).row;
          conflictCells.push({row: conflictRow, col: col + 1});
        }

        // Record this assignment
        teacherSchedule[day][col].push({
          teacher: teacherName,
          class: classInfo,
          row: row + 1
        });
      }
    }

    // Highlight conflicts
    conflictCells.forEach(cell => {
      sheet.getRange(cell.row, cell.col)
           .setBackground('#ffcdd2');  // Light red background
    });

    // Show conflict summary
    if (conflictCells.length > 0) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Found ${conflictCells.length / 2} teacher conflicts (highlighted in red)`,
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