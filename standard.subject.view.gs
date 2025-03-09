var StandardSubjectView = StandardSubjectView || {};

/**
 * Generate the Standard-Subject view
 * Creates a new sheet and populates it with the number of periods each subject has for each class (Standard-Section)
 */
StandardSubjectView.generate = function() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'Standard-Subject View';
  let sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    ss.deleteSheet(sheet);
  }
  sheet = ss.insertSheet(sheetName);

  // Load data from Generated-Roster
  const rosterSheet = ss.getSheetByName('Generated-Roster');
  const rosterData = rosterSheet.getDataRange().getValues();

  // Load subject-periods requirements data
  const subjectPeriods = Data.loadSubjectPeriods();
  
  // Log subject periods data for debugging
  console.log("Subject Periods data:", JSON.stringify(subjectPeriods));
  
  // Log all available subjects for specific standards we're interested in
  if (subjectPeriods['XII-Science']) {
    console.log("XII-Science subjects:", Object.keys(subjectPeriods['XII-Science']));
    Object.entries(subjectPeriods['XII-Science']).forEach(([subj, config]) => {
      console.log(`XII-Science - ${subj}: min=${config.minPerWeek}, max=${config.maxPerWeek}`);
    });
  }
  
  if (subjectPeriods['XI-Science']) {
    console.log("XI-Science subjects:", Object.keys(subjectPeriods['XI-Science']));
  }
  
  // Initialize data structures
  const subjectCounts = {};
  const classes = new Set();

  // Iterate through the roster data to count subjects
  for (let i = 2; i < rosterData.length; i++) { // Start from row 3 to skip headers
    const classKey = rosterData[i][0];
    const day = rosterData[i][1];
    classes.add(classKey);

    for (let j = 2; j < rosterData[i].length; j++) { // Start from column 3 to skip class and day
      const cellValue = rosterData[i][j];
      if (cellValue && typeof cellValue === 'string' && !['BREAK', 'LUNCH'].includes(cellValue.toUpperCase())) {
        const subject = cellValue.split('\n')[0].trim();
        if (!subjectCounts[classKey]) {
          subjectCounts[classKey] = {};
        }
        if (!subjectCounts[classKey][subject]) {
          subjectCounts[classKey][subject] = 0;
        }
        subjectCounts[classKey][subject]++;
      }
    }
  }

  // Set headers
  sheet.getRange(1, 1).setValue('Class');
  const subjects = Array.from(new Set(Object.values(subjectCounts).flatMap(Object.keys)));
  subjects.forEach((subject, index) => {
    sheet.getRange(1, index + 2).setValue(subject);
  });
  sheet.getRange(1, subjects.length + 2).setValue('Total Periods');

  // Populate data with min requirements in brackets and highlight issues
  let redCellCount = 0;
  let yellowCellCount = 0;
  Array.from(classes).forEach((classKey, rowIndex) => {
    // Extract standard from classKey (format is "Standard-Section" or "Standard-Type-Section")
    // Handle cases like "XII-Science-A" where standard is "XII-Science"
    let standard;
    const parts = classKey.split('-');
    if (parts.length === 2) {
      // Simple case: "Standard-Section"
      standard = parts[0];
    } else if (parts.length === 3) {
      // Complex case: "Standard-Type-Section" (e.g., "XII-Science-A")
      standard = parts[0] + '-' + parts[1];
    } else {
      // Fallback
      standard = parts[0];
    }
    
    // Log for debugging special cases
    if (classKey.startsWith('XII-Science') || classKey.startsWith('XI-Science')) {
      console.log(`Class: ${classKey}, Extracted standard: ${standard}`);
      console.log(`Available subjects for ${standard}:`, subjectPeriods[standard] ? 
                  Object.keys(subjectPeriods[standard]) : "None found");
    }
    
    sheet.getRange(rowIndex + 2, 1).setValue(classKey);
    let totalPeriods = 0;
    
    subjects.forEach((subject, colIndex) => {
      // Get actual count of periods assigned
      const count = subjectCounts[classKey] && subjectCounts[classKey][subject] ? subjectCounts[classKey][subject] : 0;
      
      // Get minimum and maximum required from subject-periods data
      let minRequired = 0;
      let maxAllowed = 0;
      
      if (subjectPeriods[standard] && subjectPeriods[standard][subject]) {
        minRequired = subjectPeriods[standard][subject].minPerWeek;
        maxAllowed = subjectPeriods[standard][subject].maxPerWeek;
        
        // Log for debugging specific subjects for science streams
        if ((classKey.startsWith('XII-Science') || classKey.startsWith('XI-Science')) && 
            (subject === 'Eng' || subject === 'Physics' || subject === 'Chemistry')) {
          console.log(`${classKey} - ${subject}: minRequired = ${minRequired}, maxAllowed = ${maxAllowed}, found in subjectPeriods[${standard}][${subject}]`);
        }
      } else {
        // Log missing subject requirements
        if ((classKey.startsWith('XII-Science') || classKey.startsWith('XI-Science')) && 
            (subject === 'Eng' || subject === 'Physics' || subject === 'Chemistry')) {
          console.log(`WARNING: ${classKey} - ${subject}: No requirement found in subjectPeriods[${standard}]`);
        }
      }
      
      // Set cell value with min and max requirements in brackets
      const cell = sheet.getRange(rowIndex + 2, colIndex + 2);
      cell.setValue(`${count} (${minRequired}, ${maxAllowed})`);
      
      // Highlight cell in red if count is less than minimum
      if (count < minRequired) {
        cell.setBackground('#f4cccc'); // Light red
        redCellCount++; // Increment red cell counter
      } 
      // Highlight cell in yellow if count is more than maximum
      else if (maxAllowed > 0 && count > maxAllowed) {
        cell.setBackground('#fff2cc'); // Light yellow
        yellowCellCount++; // Increment yellow cell counter
      }
      
      totalPeriods += count;
    });
    
    sheet.getRange(rowIndex + 2, subjects.length + 2).setValue(totalPeriods);
  });

  // Format the sheet
  sheet.getRange(1, 1, 1, subjects.length + 2).setFontWeight('bold');
  sheet.autoResizeColumns(1, subjects.length + 2);
  
  // Add a legend explaining the formatting
  const lastRow = sheet.getLastRow() + 2;
  sheet.getRange(lastRow, 1).setValue('Legend:');
  sheet.getRange(lastRow, 1).setFontWeight('bold');
  
  // Format header row
  sheet.getRange(lastRow + 1, 1).setValue('Format:');
  sheet.getRange(lastRow + 1, 2, 1, 3).merge();
  sheet.getRange(lastRow + 1, 2).setValue('# (min, max): Actual periods (Minimum required, Maximum allowed)');
  
  // Format red highlight row - split description and count
  sheet.getRange(lastRow + 2, 1).setValue('Red highlight:');
  sheet.getRange(lastRow + 2, 1).setBackground('#f4cccc');
  sheet.getRange(lastRow + 2, 2).setValue('Actual periods less than minimum required');
  sheet.getRange(lastRow + 2, 3).setValue(redCellCount);
  sheet.getRange(lastRow + 2, 4).setValue('cells');
  
  // Format yellow highlight row - split description and count
  sheet.getRange(lastRow + 3, 1).setValue('Yellow highlight:');
  sheet.getRange(lastRow + 3, 1).setBackground('#fff2cc');
  sheet.getRange(lastRow + 3, 2).setValue('Actual periods more than maximum allowed');
  sheet.getRange(lastRow + 3, 3).setValue(yellowCellCount);
  sheet.getRange(lastRow + 3, 4).setValue('cells');
  
  // Auto-resize all columns to fit content
  sheet.autoResizeColumns(1, subjects.length + 4);
};