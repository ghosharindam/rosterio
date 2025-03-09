/**
 * Teacher View module for Roster
 * Creates a separate view for viewing teacher schedules
 */
var TeacherView = TeacherView || {};

/**
 * Create the Teacher-View sheet if it doesn't exist
 * and set up the interface
 */
TeacherView.createTeacherView = function() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Save the current selected teacher if view already exists
    let currentSelectedTeacher = null;
    let sheet = ss.getSheetByName('Teacher-View');
    if (sheet) {
      try {
        // Try to get the currently selected teacher from the dropdown
        const dropdown = sheet.getRange('C1');
        const dataValidation = dropdown.getDataValidation();
        if (dataValidation) {
          const selectedIndex = dropdown.getValue();
          const criteria = dataValidation.getCriteriaValues();
          if (criteria && criteria.length > 0 && criteria[0].length > 0) {
            const teachersList = criteria[0];
            if (selectedIndex >= 1 && selectedIndex <= teachersList.length) {
              currentSelectedTeacher = teachersList[selectedIndex - 1];
            }
          }
        }
      } catch (e) {
        console.log("Couldn't retrieve currently selected teacher:", e);
      }
      
      // Clear existing content if sheet already exists
      sheet.clear();
    } else {
      // If the sheet doesn't exist, create it
      sheet = ss.insertSheet('Teacher-View');
    }
    
    // Add instructions
    sheet.getRange('A1').setValue('Select a teacher to view their schedule:');
    
    // Create empty schedule template
    TeacherView.createScheduleTemplate(sheet);
    
    // Format the sheet
    TeacherView.formatSheet(sheet);
    
    // Get the list of teachers for the dropdown - do this after sheet setup
    try {
      const teachers = TeacherView.getTeachersList();
      
      // Create the teacher selection dropdown if we have teachers
      if (teachers && teachers.length > 0) {
        TeacherView.createTeacherDropdown(sheet, teachers);
        
        // Add dropdown change trigger
        TeacherView.setupDropdownTrigger();
        
        // If we had a previously selected teacher, try to restore it
        if (currentSelectedTeacher) {
          console.log(`Attempting to restore previously selected teacher: ${currentSelectedTeacher}`);
          const teacherIndex = teachers.indexOf(currentSelectedTeacher);
          
          if (teacherIndex >= 0) {
            // Select the teacher in the dropdown (1-indexed for dropdown)
            sheet.getRange('C1').setValue(teacherIndex + 1);
            
            // Update the view with that teacher
            console.log(`Restoring view for teacher: ${currentSelectedTeacher}`);
            setTimeout(function() {
              TeacherView.updateTeacherSchedule(currentSelectedTeacher);
            }, 500);
          } else {
            console.log(`Previously selected teacher "${currentSelectedTeacher}" not found in current list`);
            // Default to first teacher
            TeacherView.updateTeacherSchedule(teachers[0]);
          }
        } else {
          // Default to first teacher
          TeacherView.updateTeacherSchedule(teachers[0]);
        }
      } else {
        // Handle case when no teachers are available
        sheet.getRange('C1').setValue('No teachers available');
        sheet.getRange('A3').setValue('No teacher data found. Please check teacher configuration.');
      }
    } catch (teacherError) {
      console.error('Error loading teachers:', teacherError);
      sheet.getRange('C1').setValue('Error loading teachers');
      sheet.getRange('A3').setValue('Error: ' + teacherError.message);
    }
    
    return sheet;
  } catch (e) {
    console.error('Error creating Teacher-View:', e);
    // Don't re-throw so that roster generation can continue
    return null;
  }
};

/**
 * Get a list of all teachers from the teacher data
 * @return {Array} Array of teacher names
 */
TeacherView.getTeachersList = function() {
  try {
    // Use the existing Data module to get teacher data
    const teachers = Data.loadTeacherSubjects();
    
    // Check if teachers data is valid
    if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
      console.warn('No teachers found or invalid teacher data returned');
      return [];
    }
    
    // Extract just the names and sort alphabetically
    const teacherNames = teachers
      .filter(teacher => teacher && teacher.name) // Ensure each teacher has a name
      .map(teacher => teacher.name)
      .sort();
    
    console.log(`Found ${teacherNames.length} teachers`);
    return teacherNames;
  } catch (error) {
    console.error('Error in getTeachersList:', error);
    return []; // Return empty array to prevent further errors
  }
};

/**
 * Create a dropdown for selecting teachers
 * @param {Sheet} sheet - The sheet to add the dropdown to
 * @param {Array} teachers - Array of teacher names
 */
TeacherView.createTeacherDropdown = function(sheet, teachers) {
  try {
    // Validate inputs to prevent errors
    if (!sheet) {
      console.error('Invalid sheet provided to createTeacherDropdown');
      return;
    }
    
    if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
      console.error('Invalid teacher list provided to createTeacherDropdown');
      sheet.getRange('C1').setValue('No teachers available');
      return;
    }
    
    // Create the dropdown in cell C1
    const dropdown = sheet.getRange('C1');
    
    // Create a data validation rule for the dropdown
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(teachers, true)
      .setAllowInvalid(false)
      .build();
    
    dropdown.setDataValidation(rule);
    
    // Set the initial value to the first teacher in the list
    dropdown.setValue(teachers[0]);
    
    // Make the dropdown more visible
    dropdown.setBackground('#e6f2ff');
    dropdown.setBorder(true, true, true, true, true, true);
    
    // After setting up the dropdown, update the schedule for the first teacher
    try {
      TeacherView.updateTeacherSchedule(teachers[0]);
    } catch (scheduleError) {
      console.error('Error updating initial schedule:', scheduleError);
      // Don't throw the error, just log it
    }
  } catch (error) {
    console.error('Error in createTeacherDropdown:', error);
    // Don't throw the error, just log it
  }
};

/**
 * Create the empty schedule template
 * @param {Sheet} sheet - The sheet to create the template in
 */
TeacherView.createScheduleTemplate = function(sheet) {
  try {
    // Get the periods configuration
    const periodsConfig = Data.loadPeriodsConfig();
    const periods = periodsConfig.activePeriods || [];
    
    // Define standard days
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Start position for the schedule
    const startRow = 4;
    const startCol = 1;
    
    // Create headers for periods (columns)
    const headerRow = [];
    headerRow.push('Day/Period'); // First cell is empty
    
    // Add period numbers as headers - ensure they always show even if periods array is empty
    const numPeriods = Math.max(periods.length, 11); // Ensure at least 11 periods (from screenshot)
    for (let i = 0; i < numPeriods; i++) {
      const periodName = periods[i] ? periods[i].name : '';
      // Always show the period number, add name if available
      headerRow.push(`Period ${i+1}${periodName ? '\n' + periodName : ''}`);
    }
    
    // Set the header row
    sheet.getRange(startRow, startCol, 1, headerRow.length).setValues([headerRow]);
    
    // Create day labels (rows)
    for (let i = 0; i < days.length; i++) {
      sheet.getRange(startRow + 1 + i, startCol).setValue(days[i]);
    }
    
    // Create empty cells for schedule
    const emptySchedule = [];
    for (let i = 0; i < days.length; i++) {
      const row = new Array(numPeriods).fill('');
      emptySchedule.push(row);
    }
    
    // Set empty cells
    sheet.getRange(startRow + 1, startCol + 1, days.length, numPeriods).setValues(emptySchedule);
  } catch (error) {
    console.error('Error in createScheduleTemplate:', error);
    // Continue execution, don't throw
  }
};

/**
 * Set up a trigger to handle dropdown changes
 */
TeacherView.setupDropdownTrigger = function() {
  try {
    // Install an onEdit trigger
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Check if the trigger already exists
    const triggers = ScriptApp.getUserTriggers(ss);
    let triggerExists = false;
    
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'handleTeacherViewDropdown') {
        triggerExists = true;
        break;
      }
    }
    
    if (!triggerExists) {
      ScriptApp.newTrigger('handleTeacherViewDropdown')
        .forSpreadsheet(ss)
        .onEdit()
        .create();
    }
  } catch (error) {
    console.error('Error setting up dropdown trigger:', error);
    // Continue execution, don't throw
  }
};

/**
 * Update the schedule display for the selected teacher
 * @param {string} teacherName - The name of the selected teacher
 */
TeacherView.updateTeacherSchedule = function(teacherName) {
  try {
    if (!teacherName) {
      console.error('No teacher name provided to updateTeacherSchedule');
      return;
    }
    
    console.log(`Updating schedule for teacher: ${teacherName}`);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Teacher-View');
    
    if (!sheet) {
      console.error('Teacher-View sheet not found');
      return;
    }
    
    // Get the teacher code (abbreviation) for matching
    let teacherCode = TeacherView.getTeacherCode(teacherName);
    if (!teacherCode) {
      console.warn(`No teacher code found for ${teacherName}, using name as fallback`);
      teacherCode = teacherName;
    }
    
    console.log(`Looking for teacher with code: ${teacherCode}`);
    
    // Clear existing schedule
    try {
      TeacherView.clearSchedule();
    } catch (clearError) {
      console.error('Error during schedule clearing:', clearError);
      // Continue anyway - we'll just be writing over old data
    }
    
    // Get the roster data - use our checking function for better error reporting
    const rosterSheet = TeacherView.getRosterSheet();
    if (!rosterSheet) {
      sheet.getRange('A3').setValue('Error: Roster sheet not found or has invalid format. Please generate a roster first.');
      console.error('Roster sheet not found or invalid');
      return;
    }
    
    // Get all data from the roster
    const rosterData = rosterSheet.getDataRange().getValues();
    console.log(`Got roster data with ${rosterData.length} rows from sheet "${rosterSheet.getName()}"`);
    
    // Get period headers from the roster or use defaults
    let periodNames = [];
    
    // Try to get periods from roster header row
    if (rosterData.length > 0) {
      const headerRow = rosterData[0];
      // Skip class and day columns (first two columns)
      if (headerRow.length > 2) {
        periodNames = headerRow.slice(2);
        console.log(`Found ${periodNames.length} periods in header: ${periodNames.join(', ')}`);
      }
    }
    
    // If no periods found in roster, create default period names
    if (periodNames.length === 0) {
      // Use a minimum of 11 periods (based on screenshot)
      for (let i = 0; i < 11; i++) {
        periodNames.push(`Period ${i+1}`);
      }
      console.log(`Using ${periodNames.length} default period names`);
    }
    
    // Create period objects for schedule layout
    const periods = periodNames.map((name, index) => ({
      name: String(name),
      periodNumber: index + 1
    }));
    
    console.log(`Using ${periods.length} periods in schedule`);
    
    // Standard days
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Initialize the schedule data
    const scheduleData = new Array(days.length);
    for (let i = 0; i < days.length; i++) {
      scheduleData[i] = new Array(periods.length).fill('');
    }
    
    // Store some sample cells for debugging
    let sampleCells = [];
    
    // BRUTE FORCE APPROACH: Just scan every cell for the exact code
    let matchesFound = 0;
    let exactMatches = [];
    
    // Debugging info
    console.log(`Searching for teacher code "${teacherCode}" in ${rosterData.length} rows`);
    
    // Start at row 2 (skip headers)
    for (let rowIndex = 2; rowIndex < rosterData.length; rowIndex++) {
      const rowData = rosterData[rowIndex];
      
      // Skip empty rows
      if (!rowData || rowData.length < 3) {
        console.log(`Row ${rowIndex} is empty or too short, skipping`);
        continue;
      }
      
      const classKey = rowData[0];
      const day = rowData[1];
      
      // Skip if invalid data
      if (!classKey || !day) {
        console.log(`Row ${rowIndex} missing class or day, skipping`);
        continue;
      }
      
      const dayIndex = days.indexOf(day);
      if (dayIndex === -1) {
        console.log(`Row ${rowIndex} has invalid day "${day}", skipping`);
        continue;
      }
      
      console.log(`Checking row ${rowIndex} for class ${classKey} (${day})`);
      
      // Check each period cell for this teacher - STARTING AT COLUMN 2
      for (let colIndex = 2; colIndex < rowData.length; colIndex++) {
        const periodIndex = colIndex - 2; // Adjust for 0-based array and 2 columns offset
        const cellContent = rowData[colIndex];
        
        // Store sample cells for debugging
        if (sampleCells.length < 5 && cellContent && typeof cellContent === 'string' && cellContent.trim() !== '') {
          sampleCells.push(cellContent);
          console.log(`Sample cell at row ${rowIndex}, col ${colIndex}: "${cellContent}"`);
        }
        
        // Skip empty, non-string cells or "BREAK"/"LUNCH"
        if (!cellContent || typeof cellContent !== 'string' || 
            cellContent.trim().toUpperCase() === "BREAK" || 
            cellContent.trim().toUpperCase() === "LUNCH") {
          continue;
        }
        
        // EXACT SUBSTRING MATCH - no fancy matching, just look for the code
        if (cellContent.includes(teacherCode)) {
          console.log(`MATCH! Found "${teacherCode}" in row ${rowIndex}, col ${colIndex}: "${cellContent}"`);
          
          // Extract subject (everything before the parenthesis or the whole string)
          let subject = cellContent;
          if (cellContent.includes('(')) {
            subject = cellContent.split('(')[0].trim();
          }
          
          // Include period number with the data for better clarity
          const periodNumber = periodIndex + 1;
          
          // Record the exact match with all context
          exactMatches.push({
            rowIndex: rowIndex,
            colIndex: colIndex,
            day: day,
            dayIndex: dayIndex,
            classKey: classKey,
            periodIndex: periodIndex,
            periodNumber: periodNumber,
            periodName: periodNames[periodIndex] || `Period ${periodNumber}`,
            cellContent: cellContent,
            subject: subject
          });
          
          matchesFound++;
          
          // Also directly add to the schedule
          if (periodIndex >= 0 && periodIndex < periods.length) {
            // Simplified cell content - removed redundant period number
            scheduleData[dayIndex][periodIndex] = `${subject}\n${classKey}`;
          }
        }
      }
    }
    
    // Log all matches in detail
    console.log(`----- Found ${matchesFound} matches for teacher code "${teacherCode}" -----`);
    exactMatches.forEach(match => {
      console.log(`Match: ${match.day}, Class ${match.classKey}, ${match.periodName}: "${match.cellContent}"`);
      console.log(`  -> Subject: "${match.subject}"`);
    });
    
    // Update the schedule display
    const startRow = 5; // Schedule content starts at row 5
    const startCol = 2; // Schedule content starts at column 2
    
    // If we didn't find any assignments, show a message
    if (matchesFound === 0) {
      let message = `No classes found for ${teacherName} (code "${teacherCode}").`;
      
      // For debugging, show a few sample cells from the roster
      if (sampleCells.length > 0) {
        message += ` Sample cell formats: "${sampleCells.join('", "')}"`;
      }
      
      // Additional debug info
      if (teacherCode === "ADB") {
        message += "\n\nSPECIAL DEBUGGING FOR ADB:";
        message += "\nExpected to find 'Phy Ed (ADB)' in the roster. If this text exists but wasn't matched,";
        message += "\nplease check for any hidden special characters or different parentheses types.";
      } else {
        message += "\n\nThe teacher code might not exist in the roster or might be in a different format.";
        message += "\nTry selecting a different teacher (like DBC, IMR, or KTP) to see if it works.";
      }
      
      sheet.getRange('A3').setValue(message);
      console.log(`No classes found. Sample cell formats: ${sampleCells.join(', ')}`);
    } else {
      console.log(`Adding ${matchesFound} classes to the schedule`);
      
      // Update the display with the found data
      sheet.getRange(startRow, startCol, days.length, periods.length).setValues(scheduleData);
      
      // Add title with teacher name
      sheet.getRange('A3').setValue(`Schedule for ${teacherName} (${matchesFound} classes):`);
      
      // Format the schedule cells
      TeacherView.formatScheduleCells(sheet, startRow, startCol, days.length, periods.length);
    }
  } catch (error) {
    console.error('Error updating teacher schedule:', error);
    // Log the full error details for debugging
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    
    // Try to display the error in the sheet for visibility
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('Teacher-View');
      if (sheet) {
        sheet.getRange('A3').setValue(`Error: ${error.message}`);
      }
    } catch (e) {
      // Just log if we can't display the error
      console.error('Error displaying error message:', e);
    }
  }
};

/**
 * Clear the schedule data
 */
TeacherView.clearSchedule = function() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Teacher-View');
    
    if (!sheet) {
      console.error('Teacher-View sheet not found in clearSchedule');
      return;
    }
    
    // Just clear the title in cell A3
    sheet.getRange('A3').setValue('');
    
    // Standard days
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Determine how many columns to clear
    const lastCol = Math.max(sheet.getLastColumn(), 12); // Ensure at least 12 columns
    const numCols = lastCol - 1; // Exclude the first column (days)
    const numRows = days.length;
    
    // Check if the dimensions make sense before proceeding
    if (numRows <= 0 || numCols <= 0) {
      console.error(`Invalid dimensions for clearSchedule: rows=${numRows}, cols=${numCols}`);
      return;
    }
    
    console.log(`Clearing schedule with dimensions: ${numRows} rows × ${numCols} columns`);
    
    // Create empty data
    const emptyData = [];
    for (let i = 0; i < numRows; i++) {
      emptyData.push(new Array(numCols).fill(''));
    }
    
    // Clear the schedule cells only if we have valid dimensions
    const startRow = 5;  // Schedule content starts at row 5
    const startCol = 2;  // Schedule content starts at column 2
    
    // Set empty data
    sheet.getRange(startRow, startCol, numRows, numCols).setValues(emptyData);
    
  } catch (error) {
    console.error('Error clearing schedule:', error);
    // Log the full error details for debugging
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
  }
};

/**
 * Format the schedule cells
 * @param {Sheet} sheet - The sheet to format
 * @param {number} startRow - Starting row for schedule data
 * @param {number} startCol - Starting column for schedule data
 * @param {number} numRows - Number of rows (days)
 * @param {number} numCols - Number of columns (periods)
 */
TeacherView.formatScheduleCells = function(sheet, startRow, startCol, numRows, numCols) {
  try {
    if (!sheet || numRows <= 0 || numCols <= 0) return;
    
    const scheduleRange = sheet.getRange(startRow, startCol, numRows, numCols);
    
    // Set text wrap and alignment
    scheduleRange.setWrap(true);
    scheduleRange.setVerticalAlignment('middle');
    scheduleRange.setHorizontalAlignment('center');
    
    // Set borders
    scheduleRange.setBorder(true, true, true, true, true, true);
    
    // Set background color for cells with data
    const scheduleData = scheduleRange.getValues();
    
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        if (scheduleData[i][j]) {
          // Set background color for cells with classes
          sheet.getRange(startRow + i, startCol + j).setBackground('#e6ffe6');
        } else {
          // Set background color for empty cells
          sheet.getRange(startRow + i, startCol + j).setBackground('#f9f9f9');
        }
      }
    }
  } catch (error) {
    console.error('Error formatting schedule cells:', error);
    // Continue execution, don't throw
  }
};

/**
 * Format the entire sheet
 * @param {Sheet} sheet - The sheet to format
 */
TeacherView.formatSheet = function(sheet) {
  try {
    if (!sheet) return;
    
    // Format the title
    sheet.getRange('A1').setFontWeight('bold');
    
    // Format dropdown label
    sheet.getRange('A1:B1').merge();
    
    // Format the teacher dropdown
    const dropdown = sheet.getRange('C1');
    dropdown.setFontWeight('bold');
    dropdown.setBackground('#e6f2ff');
    
    // Get columns for headers based on actual data in the sheet
    const maxCol = Math.max(sheet.getLastColumn(), 12); // Ensure at least 12 columns for periods
    
    // Format the schedule header row
    const headerRow = sheet.getRange(4, 1, 1, maxCol);
    headerRow.setFontWeight('bold');
    headerRow.setBackground('#d9d9d9');
    headerRow.setHorizontalAlignment('center');
    headerRow.setVerticalAlignment('middle');
    headerRow.setWrap(true);
    
    // Format the day column
    const dayCol = sheet.getRange('A5:A9'); // 5 days
    dayCol.setFontWeight('bold');
    dayCol.setBackground('#d9d9d9');
    dayCol.setHorizontalAlignment('center');
    
    // Set column widths
    sheet.setColumnWidth(1, 120); // Day column
    
    // Set period column widths - ensure all columns have a reasonable width
    for (let i = 0; i < maxCol; i++) {
      sheet.setColumnWidth(i + 1, i === 0 ? 120 : 120); // Day/period columns
    }
    
    // Set row heights
    sheet.setRowHeight(4, 40); // Header row - taller for period numbers and names
    for (let i = 0; i < 5; i++) {
      sheet.setRowHeight(i + 5, 80); // Day rows - taller to accommodate multiple lines
    }
    
    // Make sure header row has proper text wrap
    headerRow.setWrap(true);
  } catch (error) {
    console.error('Error formatting sheet:', error);
    // Continue execution, don't throw
  }
};

/**
 * Main function to create and display the Teacher-View
 * This is the entry point for the user
 */
function showTeacherView() {
  try {
    const sheet = TeacherView.createTeacherView();
    // Show the sheet
    SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);
    SpreadsheetApp.getActiveSpreadsheet().toast('Teacher-View created. Please select a teacher from the dropdown to see their schedule.');
  } catch (error) {
    console.error('Error showing Teacher-View:', error);
    SpreadsheetApp.getActiveSpreadsheet().toast('Error showing Teacher-View: ' + error.message, 'Error', 10);
  }
}

/**
 * External handler function for the dropdown change trigger
 * This needs to be a global function (not a method)
 */
function handleTeacherViewDropdown(e) {
  try {
    // Check if this is an edit in the teacher dropdown (C1)
    const range = e.range;
    const sheet = range.getSheet();
    
    if (sheet.getName() === 'Teacher-View' && range.getA1Notation() === 'C1') {
      const selectedTeacher = range.getValue();
      
      // Update the schedule for the selected teacher
      if (selectedTeacher) {
        TeacherView.updateTeacherSchedule(selectedTeacher);
      }
    }
  } catch (error) {
    console.error('Error handling dropdown change:', error);
    // Don't throw errors in event handlers
  }
}

/**
 * Generate Teacher-View after roster has been created or updated
 */
TeacherView.generateAfterRoster = function() {
  try {
    console.log('Starting Teacher-View generation after roster...');
    
    // Add a small delay to ensure roster data is fully saved
    Utilities.sleep(1000);
    
    // Force reset the roster sheet cache to ensure we get the latest data
    TeacherView.rosterSheetName = null;
    
    // Force a check for the roster sheet to ensure we're using the latest
    if (!TeacherView.checkRosterSheet()) {
      console.error('Could not find roster sheet for Teacher-View generation');
      SpreadsheetApp.getActiveSpreadsheet().toast('Error: Could not find roster sheet. Teacher-View was not updated.', 'Error', 5);
      return null;
    }
    
    console.log(`Teacher-View will use roster sheet: ${TeacherView.rosterSheetName}`);
    
    // Create or update the Teacher-View
    const sheet = TeacherView.createTeacherView();
    
    if (!sheet) {
      console.error('Failed to create Teacher-View sheet');
      return null;
    }
    
    // Make sure the sheet is not hidden
    if (sheet.isSheetHidden()) {
      sheet.showSheet();
    }
    
    // Show a message to the user
    SpreadsheetApp.getActiveSpreadsheet().toast('Teacher-View has been updated with the new roster. Click "Teacher-View > Show Teacher-View" from the menu to view it.');
    
    console.log('Teacher-View generation completed successfully');
    return sheet;
  } catch(e) {
    console.error("Error updating Teacher-View:", e);
    if (e.stack) {
      console.error("Stack trace:", e.stack);
    }
    
    // Try to show an error message to the user
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast('Error updating Teacher-View: ' + e.message, 'Error', 10);
    } catch(toastError) {
      // Just log if we can't even show a toast
      console.error("Could not show error toast:", toastError);
    }
    
    return null;
  }
};

/**
 * Add Teacher-View to the spreadsheet menu
 * Call this from the onOpen event in your main script
 */
TeacherView.addToMenu = function(ui) {
  try {
    ui.createMenu('Teacher-View')
      .addItem('Show Teacher-View', 'showTeacherView')
      .addToUi();
  } catch (error) {
    console.error('Error adding Teacher-View to menu:', error);
  }
};

// Automatically add the menu when the spreadsheet is opened
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    TeacherView.addToMenu(ui);
  } catch (error) {
    console.error('Error in onOpen handler:', error);
  }
}

/**
 * Check if the Roster sheet exists and is valid
 * @return {boolean} True if the Roster sheet exists and is valid, false otherwise
 */
TeacherView.checkRosterSheet = function() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Check all sheets to find one that might contain roster data
    const sheets = ss.getSheets();
    let rosterSheet = null;
    
    // First try to find a sheet with the standard name from constants
    if (typeof SHEET_NAMES !== 'undefined' && SHEET_NAMES.ROSTER) {
      rosterSheet = ss.getSheetByName(SHEET_NAMES.ROSTER);
      if (rosterSheet) {
        console.log(`Found roster sheet using SHEET_NAMES.ROSTER: "${SHEET_NAMES.ROSTER}"`);
        TeacherView.rosterSheetName = SHEET_NAMES.ROSTER;
        return true;
      }
    }
    
    // Then try to find a sheet named "Roster"
    rosterSheet = ss.getSheetByName('Roster');
    
    // If not found, try to find a sheet with "roster" in the name (case insensitive)
    if (!rosterSheet) {
      for (let i = 0; i < sheets.length; i++) {
        const sheetName = sheets[i].getName().toLowerCase();
        if (sheetName.includes('roster')) {
          rosterSheet = sheets[i];
          console.log(`Found potential roster sheet: ${sheets[i].getName()}`);
          break;
        }
      }
    }
    
    // If still not found, check if there's a sheet that looks like a roster
    // (has columns for class, day, and periods)
    if (!rosterSheet) {
      for (let i = 0; i < sheets.length; i++) {
        // Skip sheets that are clearly not rosters
        const sheetName = sheets[i].getName().toLowerCase();
        if (sheetName === 'teacher-view' || 
            sheetName === 'config' || 
            sheetName === 'settings' ||
            sheetName === 'data') {
          continue;
        }
        
        // Try to analyze this sheet to see if it looks like a roster
        try {
          const sheet = sheets[i];
          const data = sheet.getDataRange().getValues();
          
          // Check if first row has "Class" and "Day" headers
          if (data.length > 0 && data[0].length >= 2) {
            const firstCell = String(data[0][0]).toLowerCase();
            const secondCell = String(data[0][1]).toLowerCase();
            
            // Look for Class and Day columns
            if ((firstCell.includes('class') && secondCell.includes('day')) ||
                (data.length > 1 && 
                 data[1].length >= 2 &&
                 String(data[1][0]).length > 0 && 
                 String(data[1][1]).length > 0 &&
                 ['monday','tuesday','wednesday','thursday','friday'].includes(String(data[1][1]).toLowerCase()))) {
              
              rosterSheet = sheet;
              console.log(`Found roster-like sheet: ${sheet.getName()}`);
              break;
            }
          }
        } catch (analyzeError) {
          console.error(`Error analyzing sheet ${sheets[i].getName()}:`, analyzeError);
          // Continue checking other sheets
        }
      }
    }
    
    // If we found a roster sheet, store its name and return true
    if (rosterSheet) {
      TeacherView.rosterSheetName = rosterSheet.getName();
      return true;
    }
    
    // No roster sheet found
    return false;
  } catch (error) {
    console.error('Error checking roster sheet:', error);
    return false;
  }
};

/**
 * Get the roster sheet
 * @return {Sheet|null} The roster sheet or null if not found
 */
TeacherView.getRosterSheet = function() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // If we already determined the roster sheet name, use it
    if (TeacherView.rosterSheetName) {
      return ss.getSheetByName(TeacherView.rosterSheetName);
    }
    
    // Otherwise check for roster sheet
    if (TeacherView.checkRosterSheet()) {
      return ss.getSheetByName(TeacherView.rosterSheetName);
    }
    
    // If we couldn't find a roster sheet, return null
    return null;
  } catch (error) {
    console.error('Error getting roster sheet:', error);
    return null;
  }
};

/**
 * Add this empty function to handle the existing trigger shown in your error screenshot
 * This prevents the "Script function not found: onFilterEdit" error
 */
function onFilterEdit(e) {
  // This function is just a placeholder to prevent the trigger error
  // It doesn't need to do anything
  console.log('onFilterEdit called');
}

/**
 * Get the teacher code (abbreviation) for a teacher name
 * @param {string} teacherName - The full teacher name
 * @return {string|null} The teacher code or null if not found
 */
TeacherView.getTeacherCode = function(teacherName) {
  try {
    // First check if the teacher name is already a code (3-letter code)
    if (teacherName && teacherName.length === 3 && teacherName === teacherName.toUpperCase()) {
      return teacherName; // It's already a code like "DBC"
    }
    
    // Check if the name contains a code in parens like "Name (CODE)"
    const codeMatch = teacherName.match(/\(([A-Z]{2,4})\)/);
    if (codeMatch && codeMatch[1]) {
      return codeMatch[1];
    }
    
    // Check if the name is in "CODE-Name" or "Name-CODE" format
    let parts = [];
    if (teacherName.includes('-')) {
      parts = teacherName.split('-').map(part => part.trim());
      
      // Check if any part is all uppercase and 2-4 letters
      for (const part of parts) {
        if (part.length >= 2 && part.length <= 4 && part === part.toUpperCase()) {
          return part;
        }
      }
    }
    
    // Try to load the teacher data and find their code
    try {
      const teachers = Data.loadTeacherSubjects() || [];
      
      // Look for this teacher by name
      for (const teacher of teachers) {
        if (teacher.name === teacherName) {
          // Check if they have a code property
          if (teacher.code) {
            return teacher.code;
          }
          // If no direct code property, try to extract from name
          const teacherCodeMatch = teacher.name.match(/\(([A-Z]{2,4})\)/);
          if (teacherCodeMatch && teacherCodeMatch[1]) {
            return teacherCodeMatch[1];
          }
        }
      }
    } catch (err) {
      console.warn('Error getting teacher data:', err);
    }
    
    // Last resort: just use the first 3 letters capitalized
    if (teacherName && teacherName.length >= 3) {
      return teacherName.substring(0, 3).toUpperCase();
    }
    
    return null;
  } catch (error) {
    console.error('Error getting teacher code:', error);
    return null;
  }
}; 