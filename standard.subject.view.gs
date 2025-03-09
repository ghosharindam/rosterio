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

  // Populate data
  Array.from(classes).forEach((classKey, rowIndex) => {
    sheet.getRange(rowIndex + 2, 1).setValue(classKey);
    let totalPeriods = 0;
    subjects.forEach((subject, colIndex) => {
      const count = subjectCounts[classKey] && subjectCounts[classKey][subject] ? subjectCounts[classKey][subject] : 0;
      sheet.getRange(rowIndex + 2, colIndex + 2).setValue(count);
      totalPeriods += count;
    });
    sheet.getRange(rowIndex + 2, subjects.length + 2).setValue(totalPeriods);
  });

  // Format the sheet
  sheet.getRange(1, 1, 1, subjects.length + 2).setFontWeight('bold');
  sheet.autoResizeColumns(1, subjects.length + 2);
};