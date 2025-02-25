// Sheet names constant for reference
// const SHEET_NAMES = {
//   CONFIG: 'Configuration',
//   ROSTER: 'Generated-Roster'
// };

// Create and setup Teacher-View sheet
function setupTeacherView() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let teacherViewSheet = ss.getSheetByName('Teacher-View');
  
  // Create the sheet if it doesn't exist
  if (!teacherViewSheet) {
    teacherViewSheet = ss.insertSheet('Teacher-View');
  } else {
    teacherViewSheet.clear();
  }
  
  // Set up the basic structure
  teacherViewSheet.getRange('A1').setValue('Select Teacher:');
  teacherViewSheet.getRange('C1').setValue('Filter Subject:');
  
  // Get teachers list from roster
  const originalDataSheet = ss.getSheetByName('_OriginalRosterData');
  const teachers = getUniqueTeachers(originalDataSheet);
  const subjects = getUniqueSubjects(originalDataSheet);
  
  // Create teacher dropdown
  const teacherCell = teacherViewSheet.getRange('B1');
  const teacherValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Select...', ...teachers], true)
    .build();
  teacherCell.setDataValidation(teacherValidation);
  teacherCell.setValue('Select...');
  
  // Create subject filter dropdown
  const subjectCell = teacherViewSheet.getRange('D1');
  const subjectValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['All Subjects', ...subjects], true)
    .build();
  subjectCell.setDataValidation(subjectValidation);
  subjectCell.setValue('All Subjects');
  
  // Format header
  teacherViewSheet.getRange('A1:D1').setBackground('#e3f2fd');
  teacherViewSheet.getRange('A1:D1').setFontWeight('bold');
  
  // Add period numbers in row 2
  const numPeriods = getPeriodCount();
  const periods = Array.from({length: numPeriods}, (_, i) => `Period ${i + 1}`);
  teacherViewSheet.getRange(2, 2, 1, periods.length).setValues([periods]);
  teacherViewSheet.getRange(2, 2, 1, periods.length).setFontWeight('bold');
  teacherViewSheet.getRange(2, 2, 1, periods.length).setBackground('#e3f2fd');
  
  // Set up initial day labels
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  teacherViewSheet.getRange('A3:A7').setValues(days.map(day => [day]));
  teacherViewSheet.getRange('A3:A7').setFontWeight('bold');
  
  // Auto-resize columns
  teacherViewSheet.autoResizeColumns(1, periods.length + 1);
}

// Get the number of periods from the original data
function getPeriodCount() {
  // Get the number of periods from the configuration
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  
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

// Create trigger for teacher view changes
function createTeacherViewTrigger() {
  const ss = SpreadsheetApp.getActive();
  ScriptApp.newTrigger('onTeacherViewEdit')
           .forSpreadsheet(ss)
           .onEdit()
           .create();
}

// Handle teacher selection change
function onTeacherViewEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() === 'Teacher-View') {
    const range = e.range;
    if ((range.getRow() === 1 && range.getColumn() === 2) || // Teacher selection
        (range.getRow() === 1 && range.getColumn() === 4)) { // Subject filter
      updateTeacherView();
    }
  }
}

// Update Teacher-View based on selected teacher
function updateTeacherView() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const teacherViewSheet = ss.getSheetByName('Teacher-View');
  const selectedTeacher = teacherViewSheet.getRange('B1').getValue();
  const selectedSubject = teacherViewSheet.getRange('D1').getValue();
  
  if (selectedTeacher === 'Select...') {
    // Clear the timetable area
    clearTimetableArea(teacherViewSheet);
    return;
  }
  
  const originalDataSheet = ss.getSheetByName('_OriginalRosterData');
  const originalData = originalDataSheet.getDataRange().getValues();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Clear existing timetable
  clearTimetableArea(teacherViewSheet);
  
  let currentRow = 3; // Start from row 3
  
  // Process each day
  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    const day = days[dayIndex];
    
    // Find all rows for this day
    const dayRows = [];
    for (let i = 0; i < originalData.length; i++) {
      if (originalData[i][1] === day) {
        dayRows.push(i);
      }
    }
    
    if (dayRows.length > 0) {
      // Get all classes for this day across all class rows
      const dayClasses = [];
      
      // Process each row for this day
      for (let rowIdx of dayRows) {
        const classInfo = originalData[rowIdx][0]; // Class name from column A
        
        // Start from column 3 (first period) in original data
        for (let col = 2; col < originalData[rowIdx].length; col++) {
          const cellValue = originalData[rowIdx][col];
          if (cellValue && typeof cellValue === 'string') {
            const teacherMatch = cellValue.match(/\((.*?)\)$/);
            if (teacherMatch && teacherMatch[1] === selectedTeacher) {
              const subject = cellValue.split('\n')[0];
              if (selectedSubject === 'All Subjects' || subject === selectedSubject) {
                // Add to classes array with period index, class info and subject
                dayClasses.push({
                  period: col - 2,
                  class: classInfo,
                  subject: subject
                });
              }
            }
          }
        }
      }
      
      // If there are classes on this day
      if (dayClasses.length > 0) {
        // Group classes by period to find conflicts
        const periodGroups = groupClassesByPeriod(dayClasses);
        const maxConflicts = Math.max(...Object.values(periodGroups).map(g => g.length));
        
        // Create rows for this day (one row per maximum conflicts)
        for (let i = 0; i < maxConflicts; i++) {
          // Add day label only for first row
          if (i === 0) {
            teacherViewSheet.getRange(currentRow, 1).setValue(day);
            teacherViewSheet.getRange(currentRow, 1).setFontWeight('bold');
          }
          
          // Create empty row data
          const rowData = new Array(originalData[0].length - 2).fill('');
          
          // Fill in classes for this conflict row
          Object.entries(periodGroups).forEach(([period, classes]) => {
            if (classes[i]) {
              // Format: "Subject (Class)"
              rowData[period] = `${classes[i].subject} (${classes[i].class})`;
            }
          });
          
          // Set the row data
          teacherViewSheet.getRange(currentRow, 2, 1, rowData.length).setValues([rowData]);
          currentRow++;
        }
      } else {
        // Add empty row with just the day label
        teacherViewSheet.getRange(currentRow, 1).setValue(day);
        teacherViewSheet.getRange(currentRow, 1).setFontWeight('bold');
        currentRow++;
      }
    }
  }
  
  // Auto-resize columns
  teacherViewSheet.autoResizeColumns(1, originalData[0].length - 1);
}

// Clear the timetable area of the Teacher-View sheet
function clearTimetableArea(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 7); // At least up to row 7
  const lastCol = sheet.getLastColumn();
  sheet.getRange(3, 1, lastRow - 2, lastCol).clear();
}

// Group classes by period to handle conflicts
function groupClassesByPeriod(classes) {
  const groups = {};
  classes.forEach(cls => {
    if (!groups[cls.period]) {
      groups[cls.period] = [];
    }
    groups[cls.period].push(cls);
  });
  return groups;
}

// Extract class information from cell value
function getClassFromCell(cellValue) {
  const lines = cellValue.split('\n');
  return lines.length > 1 ? lines[1] : '';
}