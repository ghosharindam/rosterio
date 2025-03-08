// Functions for checking and highlighting conflicts in the roster

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

// Validate teacher-subject-standard combinations
function validateTeacherSubjectMatrix() {
  // Validate teacher-subject-standard combinations
  console.log("Validating teacher subject matrix...");
  // Implementation...
}

// Validate period timings and counts
function validatePeriodConfig() {
  // Validate period timings and counts
  console.log("Validating period configuration...");
  // Implementation...
}

// Check if subject period requirements can be met
function validateSubjectDistribution() {
  // Check if subject period requirements can be met
  console.log("Validating subject distribution...");
  // Implementation...
} 