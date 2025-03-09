/**
 * Sample data initialization module for Rosterio
 * Contains functions to populate sheets with sample data
 */
var Init = Init || {};

/**
 * Populate all sheets with sample data for testing
 */
Init.populateSampleData = function() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Populate teacher-subject data
  Init.populateTeacherSubjectData(spreadsheet);
  
  // Populate class configuration
  Init.populateClassConfigData(spreadsheet);
  
  // Populate subject-periods requirements
  Init.populateSubjectPeriodsData(spreadsheet);
  
  // Show success message
  SpreadsheetApp.getActiveSpreadsheet().toast('Sample data populated successfully!');
};

/**
 * Populate teacher-subject sheet with sample data
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The active spreadsheet
 */
Init.populateTeacherSubjectData = function(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(SHEET_NAMES.TEACHER_SUBJECTS);
  if (!sheet) {
    console.error('Teacher-Subjects sheet not found');
    return;
  }
  
  // Create sample teacher-subject data
  const data = [
    ['Teacher Name','Subject','Standard I','Standard II','Standard III','Standard IV','Standard V','Standard VI','Standard VII','Standard VIII','Standard IX','Standard X','Standard XI-Science','Standard XII-Science','Standard XI-Commerce','Standard XII-Commerce'],
    ['ADG','SSC','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['ADB','Phy Ed','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes'],
    ['AMD','Phy Ed','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['AKC','SSC','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['ATC','SSC','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['DBC','Eng','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['DJP','Physics','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','No','No'],
    ['DPC','Eng','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes'],
    ['DWG','Physics','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['GTB','Physics','No','No','No','No','No','No','No','No','No','No','Yes','Yes','No','No'],
    ['IBS','Comp','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','No','No'],
    ['IMR','Maths','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['JHA','Pol Sc','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['JBS','Phy Ed','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['KTB','Phy Ed','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['MDM','Maths','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['MMR','Beng','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes'],
    ['ONP','Beng','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes'],
    ['PBL','Biology','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','No','No'],
    ['PMM','Phy Ed','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes'],
    ['PMN','SSC','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['PRG','Science','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['PBM','Science','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['PPS','Eng','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['PDS','Maths','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['PYK','Maths','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','No','No'],
    ['PKS','Comp','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['RJC','Economics','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No ','Yes','Yes'],
    ['RBC','Eng','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['RPB','Eng','No','No','No','No','No','No','No','No','No','No','Yes','Yes','Yes','Yes'],
    ['SDS','Chemistry','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','No','No'],
    ['SBM','SSC','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No ','Yes','Yes'],
    ['SKG','Chemistry','No','No','No','No','No','No','No','No','No','No','Yes','Yes','No','No'],
    ['SKP','Art','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['SSK','Beng','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['SSJ','Maths','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','No','No'],
    ['SYD','Eng','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['SJH','Maths','No','No','No','No','No','No','No','No','No','No','Yes','Yes','No','No'],
    ['SDM','Math/Commerce','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No ','Yes','Yes'],
    ['SKA','Eng','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['SKR','SSC','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['SRB','Math/Commerce','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No ','Yes','Yes'],
    ['SPM','Biology','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['SKD','Science','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['UPG','Math/Commerce','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No ','Yes','Yes'],
    ['KTP-MNS','Beng-Hindi','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['SMD-PTS','Beng-Hindi','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
    ['SRD-PRD','Beng-Hindi','No','No','No','No','No','Yes','Yes','Yes','Yes','Yes','No','No','No','No'],
  ];
  
  // Write data to sheet
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
};

/**
 * Populate class configuration sheet with sample data
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The active spreadsheet
 */
Init.populateClassConfigData = function(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(SHEET_NAMES.CLASS_CONFIG);
  if (!sheet) {
    console.error('Class-Configuration sheet not found');
    return;
  }
  
  // Create sample class configuration data
  const data = [
    ['VI','A'],
    ['VI','B'],
    ['VI','C'],
    ['VI','D'],
    ['VI','E'],
    ['VII','A'],
    ['VII','B'],
    ['VII','C'],
    ['VII','D'],
    ['VIII','A'],
    ['VIII','B'],
    ['VIII','C'],
    ['VIII','D'],
    ['IX','A'],
    ['IX','B'],
    ['IX','C'],
    ['IX','D'],
    ['X','A'],
    ['X','B'],
    ['X','C'],
    ['XI-Science','A'],
    ['XI-Science','B'],
    ['XI-Commerce','C'],
    ['XI-Commerce','D'],
    ['XII-Science','A'],
    ['XII-Science','B'],
    ['XII-Commerce','C'],
    ['XII-Commerce','D']
  ];
  
  // Write data to sheet
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
};

/**
 * Populate subject-periods sheet with sample data
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The active spreadsheet
 */
Init.populateSubjectPeriodsData = function(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(SHEET_NAMES.SUBJECT_PERIODS);
  if (!sheet) {
    console.error('Subject-Periods sheet not found');
    return;
  }
  
  // Create sample subject-periods data
  const data = [
    ['Standard','Subject','Min Periods/Week','Max Periods/Week','Max Periods/Day'],
    ['VI','Eng','10','10','2'],
    ['VI','Beng-Hindi','5','5','1'],
    ['VI','Maths','5','5','1'],
    ['VI','Physics','5','5','1'],
    ['VI','Chemistry','5','5','1'],
    ['VI','Biology','5','5','1'],
    ['VI','SSC','5','5','1'],
    ['VI','Comp','3','3','1'],
    ['VI','Phy Ed','1','1','1'],
    ['VI','Art','1','1','1'],
    ['VII','Eng','10','10','2'],
    ['VII','Beng-Hindi','5','5','1'],
    ['VII','Maths','5','5','1'],
    ['VII','Physics','5','5','1'],
    ['VII','Chemistry','5','5','1'],
    ['VII','Biology','5','5','1'],
    ['VII','SSC','5','5','1'],
    ['VII','Comp','3','3','1'],
    ['VII','Phy Ed','1','1','1'],
    ['VII','Art','1','1','1'],
    ['VIII','Eng','10','10','2'],
    ['VIII','Beng-Hindi','5','5','1'],
    ['VIII','Maths','5','5','1'],
    ['VIII','Physics','5','5','1'],
    ['VIII','Chemistry','5','5','1'],
    ['VIII','Biology','5','5','1'],
    ['VIII','SSC','5','5','1'],
    ['VIII','Comp','3','3','1'],
    ['VIII','Phy Ed','1','1','1'],
    ['VIII','Art','1','1','1'],
    ['IX','Eng','10','10','2'],
    ['IX','Beng-Hindi','5','5','1'],
    ['IX','Maths','5','5','1'],
    ['IX','Physics','5','5','1'],
    ['IX','Chemistry','5','5','1'],
    ['IX','Biology','5','5','1'],
    ['IX','SSC','5','5','1'],
    ['IX','Comp','3','3','1'],
    ['IX','Phy Ed','1','1','1'],
    ['IX','Art','1','1','1'],
    ['X','Eng','10','10','2'],
    ['X','Beng-Hindi','5','5','1'],
    ['X','Maths','5','5','1'],
    ['X','Physics','5','5','1'],
    ['X','Chemistry','5','5','1'],
    ['X','Biology','5','5','1'],
    ['X','SSC','5','5','1'],
    ['X','Comp','3','3','1'],
    ['X','Phy Ed','1','1','1'],
    ['X','Art','1','1','1'],
    ['XI-Science','Eng','7','7','2'],
    ['XI-Science','Physics','7','7','2'],
    ['XI-Science','Chemistry','7','7','2'],
    ['XI-Science','Beng','5','5','1'],
    ['XI-Science','Maths','7','7','2'],
    ['XI-Science','Comp','5','5','1'],
    ['XI-Science','Biology','5','5','1'],
    ['XI-Science','Phy Ed','1','1','1'],
    ['XI-Commerce','Eng','7','7','2'],
    ['XI-Commerce','Pol Sc','7','7','2'],
    ['XI-Commerce','Economics','7','7','2'],
    ['XI-Science','Beng','5','5','1'],
    ['XI-Commerce','Math/Commerce','7','7','2'],
    ['XI-Commerce','SSC','5','5','1'],
    ['XI-Commerce','Phy Ed','1','1','1'],
    ['XII-Science','Eng','7','7','2'],
    ['XII-Science','Physics','7','7','2'],
    ['XII-Science','Chemistry','7','7','2'],
    ['XII-Science','Beng','5','5','1'],
    ['XII-Science','Maths','7','7','2'],
    ['XII-Science','Comp','5','5','1'],
    ['XII-Science','Biology','5','5','1'],
    ['XII-Science','Phy Ed','1','1','1'],
    ['XII-Commerce','Eng','7','7','2'],
    ['XII-Commerce','Pol Sc','7','7','2'],
    ['XII-Commerce','Economics','7','7','2'],
    ['XII-Commerce','Beng','5','5','1'],
    ['XII-Commerce','Math/Commerce','7','7','2'],
    ['XII-Commerce','SSC','5','5','1'],
    ['XII-Commerce','Phy Ed','1','1','1']
  ];
  
  // Write data to sheet
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}; 