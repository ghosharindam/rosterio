// /**
//  * Roster filters module
//  * Contains functions for filtering the roster
//  */
// var Roster = Roster || {};
// Roster.Filters = Roster.Filters || {};

// /**
//  * Add filters to the roster sheet
//  * @param {SpreadsheetApp.Sheet} sheet - The roster sheet
//  */
// Roster.Filters.addRosterFilters = function(sheet) {
//   // Make sure we have rows to filter (at least header row)
//   if (sheet.getLastRow() < 1) return;
  
//   // Add filter row
//   const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
//   const filterRow = sheet.getRange(2, 1, 1, sheet.getLastColumn());
  
//   // Get the filter values
//   const headers = headerRange.getValues()[0];
// //   const filterValues = new Array(headers.length).fill('');
  
// //   // We only add filter dropdowns if there's actually data to filter
// //   if (sheet.getLastRow() >= 3) {
// //     // Set filter placeholders
// //     filterValues[0] = '=UNIQUE(A3:A)';  // Class filter
// //     filterValues[1] = '=UNIQUE(B3:B)';  // Day filter
// //   }
  
// //   // Set the filter values
// //   filterRow.setValues([filterValues]);
  
// //   // Format the filter row
// //   filterRow.setBackground('#e0e0e0');
// //   filterRow.setFontStyle('italic');
  
//   // Only set up data validation if we have data rows
//   if (sheet.getLastRow() >= 3) {
//     try {
//       // Set up data validation dropdowns for filters
//       const classRange = sheet.getRange(2, 1);
//       const dayRange = sheet.getRange(2, 2);
      
//       // Create validation for class column - allow any value from column A starting from row 3
//       const classRule = SpreadsheetApp.newDataValidation()
//         .requireValueInRange(sheet.getRange('A3:A'), true)
//         .setAllowInvalid(true) // Allow invalid to prevent errors
//         .build();
      
//       // Create validation for day column - allow any value from column B starting from row 3
//       const dayRule = SpreadsheetApp.newDataValidation()
//         .requireValueInRange(sheet.getRange('B3:B'), true)
//         .setAllowInvalid(true) // Allow invalid to prevent errors
//         .build();
      
//       classRange.setDataValidation(classRule);
//       dayRange.setDataValidation(dayRule);
//     } catch (e) {
//       // Log but continue if validation fails
//       console.error("Failed to set data validation:", e);
//     }
//   }
// };

// /**
//  * Filter roster by class
//  * @param {string} classFilter - The class to filter by
//  */
// Roster.Filters.filterByClass = function(classFilter) {
//   const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
//   const sheet = spreadsheet.getSheetByName(SHEET_NAMES.ROSTER);
  
//   // If no filter or no sheet, return
//   if (!classFilter || !sheet) return;
  
//   // Get filter row data
//   const filterRow = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
  
//   // Update class filter
//   filterRow[0] = classFilter;
  
//   // Update filter row
//   sheet.getRange(2, 1, 1, sheet.getLastColumn()).setValues([filterRow]);
  
//   // Apply the filter
//   Roster.Filters.applyFilters(sheet);
// };

// /**
//  * Filter roster by day
//  * @param {string} dayFilter - The day to filter by
//  */
// Roster.Filters.filterByDay = function(dayFilter) {
//   const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
//   const sheet = spreadsheet.getSheetByName(SHEET_NAMES.ROSTER);
  
//   // If no filter or no sheet, return
//   if (!dayFilter || !sheet) return;
  
//   // Get filter row data
//   const filterRow = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
  
//   // Update day filter
//   filterRow[1] = dayFilter;
  
//   // Update filter row
//   sheet.getRange(2, 1, 1, sheet.getLastColumn()).setValues([filterRow]);
  
//   // Apply the filter
//   Roster.Filters.applyFilters(sheet);
// };

// /**
//  * Apply all roster filters
//  * @param {SpreadsheetApp.Sheet} sheet - The roster sheet
//  */
// Roster.Filters.applyFilters = function(sheet) {
//   // Get original and filter data
//   const originalDataSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('_OriginalRosterData');
//   if (!originalDataSheet || originalDataSheet.getLastRow() < 1) {
//     console.log("No original data to filter");
//     return;
//   }
  
//   try {
//     // Get original data
//     const originalData = originalDataSheet.getDataRange().getValues();
    
//     // Get filter criteria
//     const filterRow = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
//     const classFilter = filterRow[0];
//     const dayFilter = filterRow[1];
    
//     // // Filter the data
//     // const filteredData = originalData.filter(row => {
//     //   // Skip empty rows
//     //   if (!row[0] && !row[1]) return false;
      
//     //   // Apply class filter
//     //   if (classFilter && classFilter !== '=UNIQUE(A3:A)' && classFilter !== '' && row[0] !== classFilter) return false;
      
//     //   // Apply day filter
//     //   if (dayFilter && dayFilter !== '=UNIQUE(B3:B)' && dayFilter !== '' && row[1] !== dayFilter) return false;
      
//     //   // Include row if it passes all filters
//     //   return true;
//     // });
    
//     // Clear existing data (except headers and filter row)
//     const dataRows = sheet.getLastRow() - 2;
//     if (dataRows > 0) {
//       sheet.getRange(3, 1, dataRows, sheet.getLastColumn()).clearContent();
//     }
    
//     // Add filtered data if any
//     if (filteredData.length > 0) {
//       sheet.getRange(3, 1, filteredData.length, filteredData[0].length).setValues(filteredData);
//     }
    
//     // Check for conflicts after filtering
//     try {
//       Roster.Conflicts.checkTeacherConflicts();
//     } catch (e) {
//       console.error("Error checking conflicts after filtering:", e);
//     }
//   } catch (e) {
//     console.error("Error applying filters:", e);
//   }
// };

// /**
//  * Add event handlers for filter changes
//  */
// Roster.Filters.setupFilterHandlers = function() {
//   const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
//   const sheet = spreadsheet.getSheetByName(SHEET_NAMES.ROSTER);
  
//   if (!sheet) return;
  
//   // Add onEdit trigger if not already present
//   const triggers = ScriptApp.getUserTriggers(spreadsheet);
//   let hasFilterTrigger = false;
  
//   for (let i = 0; i < triggers.length; i++) {
//     if (triggers[i].getHandlerFunction() === 'onFilterEdit') {
//       hasFilterTrigger = true;
//       break;
//     }
//   }
  
//   if (!hasFilterTrigger) {
//     ScriptApp.newTrigger('onFilterEdit')
//         .forSpreadsheet(spreadsheet)
//         .onEdit()
//         .create();
//   }
// }; 