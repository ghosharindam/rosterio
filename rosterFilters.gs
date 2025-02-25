// Add filter controls to the roster sheet
function addRosterFilters(sheet) {
  // Delete all existing triggers first
  deleteAllTriggers();
  
  // First, create or get the hidden sheet for storing original data
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let originalDataSheet = ss.getSheetByName('_OriginalRosterData');
  if (!originalDataSheet) {
    originalDataSheet = ss.insertSheet('_OriginalRosterData');
    originalDataSheet.hideSheet();
  }
  
  // Store the current roster data (excluding filter row) in the hidden sheet
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  originalDataSheet.clear();
  originalDataSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  
  // Create a new row for filters above the headers
  sheet.insertRowBefore(1);
  
  // Add filter labels and dropdowns
  sheet.getRange('A1').setValue('Filters:');
  sheet.getRange('C1').setValue('Teacher:');
  sheet.getRange('E1').setValue('Subject:');
  sheet.getRange('G1').setValue('Day:');
  
  // Get unique teachers and subjects from the original data
  const teachers = getUniqueTeachers(originalDataSheet);
  const subjects = getUniqueSubjects(originalDataSheet);
  const days = ['All Days', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Create teacher dropdown
  const teacherCell = sheet.getRange('D1');
  const teacherValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['All Teachers', ...teachers], true)
    .build();
  teacherCell.setDataValidation(teacherValidation);
  teacherCell.setValue('All Teachers');
  
  // Create subject dropdown
  const subjectCell = sheet.getRange('F1');
  const subjectValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['All Subjects', ...subjects], true)
    .build();
  subjectCell.setDataValidation(subjectValidation);
  subjectCell.setValue('All Subjects');
  
  // Create day dropdown
  const dayCell = sheet.getRange('H1');
  const dayValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(days, true)
    .build();
  dayCell.setDataValidation(dayValidation);
  dayCell.setValue('All Days');
  
  // Format filter row
  sheet.getRange('A1:H1').setBackground('#e3f2fd');
  sheet.getRange('A1:H1').setFontWeight('bold');
  
  // Set up Teacher-View sheet
  setupTeacherView();
  
  // Add onEdit triggers
  createFilterTrigger();
  createTeacherViewTrigger();
}

// Get unique teachers from the roster
function getUniqueTeachers(sheet) {
  const data = sheet.getDataRange().getValues();
  const teachers = new Set();
  
  // Start from row 3 (after filter and header rows)
  for (let row = 2; row < data.length; row++) {
    for (let col = 2; col < data[row].length; col++) {
      const cellValue = data[row][col];
      if (cellValue && typeof cellValue === 'string') {
        const match = cellValue.match(/\((.*?)\)$/);
        if (match) {
          teachers.add(match[1]);
        }
      }
    }
  }
  
  return Array.from(teachers).sort();
}

// Get unique subjects from the roster
function getUniqueSubjects(sheet) {
  const data = sheet.getDataRange().getValues();
  const subjects = new Set();
  
  // Start from row 3 (after filter and header rows)
  for (let row = 2; row < data.length; row++) {
    for (let col = 2; col < data[row].length; col++) {
      const cellValue = data[row][col];
      if (cellValue && typeof cellValue === 'string') {
        const subject = cellValue.split('\n')[0];
        if (subject !== 'BREAK' && subject !== 'LUNCH') {
          subjects.add(subject);
        }
      }
    }
  }
  
  return Array.from(subjects).sort();
}

// Apply filters to the roster
function applyRosterFilters(sheet) {
  const selectedTeacher = sheet.getRange('D1').getValue();
  const selectedSubject = sheet.getRange('F1').getValue();
  const selectedDay = sheet.getRange('H1').getValue();
  
  // Get original data from hidden sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const originalDataSheet = ss.getSheetByName('_OriginalRosterData');
  const originalData = originalDataSheet.getDataRange().getValues();
  
  // Get the header row from the visible sheet (row 2, after filters)
  const headerRow = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Create a new array for filtered data
  const filteredData = [];
  
  // Add the header row first
  filteredData.push(headerRow);
  
  // Process each row of original data
  for (let row = 0; row < originalData.length; row++) {
    const newRow = [...originalData[row]];
    const rowDay = newRow[1]; // Column B contains the day
    
    // Check if this row should be included based on day filter
    if (selectedDay !== 'All Days' && rowDay !== selectedDay) {
      // If day doesn't match, clear all period cells
      for (let col = 2; col < originalData[0].length; col++) {
        if (newRow[col] !== 'BREAK' && newRow[col] !== 'LUNCH') {
          newRow[col] = '';
        }
      }
    } else {
      // Process each period cell
      for (let col = 2; col < originalData[0].length; col++) {
        const cellValue = originalData[row][col];
        
        // Skip break and lunch
        if (cellValue === 'BREAK' || cellValue === 'LUNCH') {
          continue;
        }
        
        if (cellValue && typeof cellValue === 'string') {
          const subject = cellValue.split('\n')[0];
          const teacherMatch = cellValue.match(/\((.*?)\)$/);
          const teacher = teacherMatch ? teacherMatch[1] : '';
          
          // Apply filters
          if ((selectedTeacher === 'All Teachers' || teacher === selectedTeacher) &&
              (selectedSubject === 'All Subjects' || subject === selectedSubject)) {
            // Keep the cell value
          } else {
            newRow[col] = '';
          }
        }
      }
    }
    
    filteredData.push(newRow);
  }
  
  // Update visible sheet with filtered data (starting from row 2, after filter row)
  sheet.getRange(2, 1, filteredData.length, filteredData[0].length)
       .setValues(filteredData);
  
  // After applying filters, update the conflict highlighting
  checkTeacherConflicts();
}


// Update original data when roster is regenerated or manually edited
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

// Delete all existing triggers
function deleteAllTriggers() {
  const allTriggers = ScriptApp.getProjectTriggers();
  allTriggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
}

// Create trigger for filter changes
function createFilterTrigger() {
  const ss = SpreadsheetApp.getActive();
  ScriptApp.newTrigger('onFilterEdit')
           .forSpreadsheet(ss)
           .onEdit()
           .create();
}

// Handle filter edit events
function onFilterEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() === SHEET_NAMES.ROSTER) {
    const range = e.range;
    if (range.getRow() === 1 && (range.getColumn() === 4 || range.getColumn() === 6 || range.getColumn() === 8)) {
      applyRosterFilters(sheet);
    }
  }
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