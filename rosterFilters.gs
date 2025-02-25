// Add filter controls to the roster sheet
function addRosterFilters(sheet) {
  // Create a new row for filters above the headers
  sheet.insertRowBefore(1);
  
  // Add filter labels and dropdowns
  sheet.getRange('A1').setValue('Filters:');
  sheet.getRange('C1').setValue('Teacher:');
  sheet.getRange('E1').setValue('Subject:');
  
  // Get unique teachers and subjects from the roster
  const teachers = getUniqueTeachers(sheet);
  const subjects = getUniqueSubjects(sheet);
  
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
  
  // Format filter row
  sheet.getRange('A1:F1').setBackground('#e3f2fd');
  sheet.getRange('A1:F1').setFontWeight('bold');
  
  // Add onEdit trigger for filter changes
  createFilterTrigger();
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
  
  // Get all data
  const data = sheet.getDataRange().getValues();
  const numRows = data.length;
  const numCols = data[0].length;
  
  // Create a new array for filtered data
  const filteredData = [];
  
  // Copy header row (row 2 after filter row)
  filteredData.push(data[1]);
  
  // Process each row starting from row 3
  for (let row = 2; row < numRows; row++) {
    const newRow = [...data[row]];
    
    // Process each period cell
    for (let col = 2; col < numCols; col++) {
      const cellValue = data[row][col];
      
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
    
    filteredData.push(newRow);
  }
  
  // Update the sheet with filtered data
  sheet.getRange(1, 1, filteredData.length, filteredData[0].length)
       .setValues(filteredData);
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
    if (range.getRow() === 1 && (range.getColumn() === 4 || range.getColumn() === 6)) {
      applyRosterFilters(sheet);
    }
  }
}