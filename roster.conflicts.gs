/**
 * Roster conflicts module
 * Contains functions for checking and highlighting conflicts in the roster
 */
var Roster = Roster || {};
Roster.Conflicts = Roster.Conflicts || {};

/**
 * Check and highlight teacher conflicts in the roster
 */
Roster.Conflicts.checkTeacherConflicts = function() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAMES.ROSTER);
    const originalDataSheet = spreadsheet.getSheetByName('_OriginalRosterData');
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
};

/**
 * Create an on-edit trigger for checking conflicts
 */
Roster.Conflicts.createOnEditTrigger = function() {
  const spreadsheet = SpreadsheetApp.getActive();
  ScriptApp.newTrigger('Roster.Conflicts.onRosterEdit')
           .forSpreadsheet(spreadsheet)
           .onEdit()
           .create();
};

/**
 * Handle edit events on the roster sheet
 * @param {Object} e - The edit event object
 */
Roster.Conflicts.onRosterEdit = function(e) {
  // Check if edit was in the roster sheet
  if (e.source.getActiveSheet().getName() === SHEET_NAMES.ROSTER) {
    // Wait a brief moment for the edit to complete
    Utilities.sleep(100);
    Roster.Conflicts.checkTeacherConflicts();
  }
};

/**
 * Validate teacher-subject-standard combinations
 */
Roster.Conflicts.validateTeacherSubjectMatrix = function() {
  // Validate teacher-subject-standard combinations
  console.log("Validating teacher subject matrix...");
  // Implementation...
};

/**
 * Validate period timings and counts
 */
Roster.Conflicts.validatePeriodConfig = function() {
  // Validate period timings and counts
  console.log("Validating period configuration...");
  // Implementation...
};

/**
 * Check if subject period requirements can be met
 */
Roster.Conflicts.validateSubjectDistribution = function() {
  // Check if subject period requirements can be met
  console.log("Validating subject distribution...");
  // Implementation...
}; 