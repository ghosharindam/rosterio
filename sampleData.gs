// Sample data for testing
const SAMPLE_DATA = {
  teacherSubjects: [
    ['Teacher Name', 'Subject', 'Standard I', 'Standard II', 'Standard III', 'Standard IV', 'Standard V', 'Standard VI', 'Standard VII', 'Standard VIII', 'Standard IX', 'Standard X', 'Standard XI', 'Standard XII'],
    ['John Smith', 'English Literature', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Mary Johnson', 'English Language', '', '', '', '', '', '', '', '', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Robert Wilson', 'Mathematics', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Sarah Brown', 'History', 'Yes', 'Yes', 'Yes', 'Yes', '', '', '', '', '', '', '', ''],
    ['Michael Davis', 'Physics', '', '', '', '', '', '', '', '', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Emma White', 'Chemistry', '', '', '', '', '', '', '', '', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['James Taylor', 'Biology', '', '', '', '', '', '', '', '', 'Yes', 'Yes', 'Yes', 'Yes']
  ],
  
  periodsConfig: [
    ['Setting', 'Value'],
    ['School Start Time', '8:00 AM'],
    ['School End Time', '3:00 PM'],
    ['Period Duration (minutes)', '45'],
    ['Break Duration (minutes)', '15'],
    ['Lunch Duration (minutes)', '30'],
    ['Number of Periods per Day', '8']
  ],
  
  classConfig: [
    ['Standard', 'Section'],
    ['I', 'A'],
    ['I', 'B'],
    ['II', 'A'],
    ['II', 'B'],
    ['III', 'A'],
    ['IX', 'A'],
    ['IX', 'B'],
    ['X', 'A'],
    ['XI', 'Science'],
    ['XII', 'Science']
  ],
  
  subjectPeriods: [
    ['Standard', 'Subject', 'Min Periods/Week', 'Max Periods/Week', 'Max Periods/Day'],
    ['IX', 'English Literature', '4', '6', '1'],
    ['IX', 'English Language', '4', '6', '1'],
    ['IX', 'Mathematics', '6', '8', '2'],
    ['IX', 'Physics', '4', '6', '1'],
    ['IX', 'Chemistry', '4', '6', '1'],
    ['IX', 'Biology', '4', '6', '1'],
    ['X', 'English Literature', '4', '6', '1'],
    ['X', 'English Language', '4', '6', '1'],
    ['X', 'Mathematics', '6', '8', '2'],
    ['X', 'Physics', '4', '6', '1'],
    ['X', 'Chemistry', '4', '6', '1'],
    ['X', 'Biology', '4', '6', '1']
  ]
};

function populateSampleData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    // Populate Teacher-Subject-Standard sheet
    let sheet = ss.getSheetByName(SHEET_NAMES.TEACHER_SUBJECTS);
    sheet.getRange(1, 1, SAMPLE_DATA.teacherSubjects.length, SAMPLE_DATA.teacherSubjects[0].length)
         .setValues(SAMPLE_DATA.teacherSubjects);
    
    // Populate Periods Configuration sheet
    sheet = ss.getSheetByName(SHEET_NAMES.PERIODS_CONFIG);
    sheet.getRange(1, 1, SAMPLE_DATA.periodsConfig.length, SAMPLE_DATA.periodsConfig[0].length)
         .setValues(SAMPLE_DATA.periodsConfig);
    
    // Populate Class Configuration sheet
    sheet = ss.getSheetByName(SHEET_NAMES.CLASS_CONFIG);
    sheet.getRange(1, 1, SAMPLE_DATA.classConfig.length, SAMPLE_DATA.classConfig[0].length)
         .setValues(SAMPLE_DATA.classConfig);
    
    // Populate Subject-Periods sheet
    sheet = ss.getSheetByName(SHEET_NAMES.SUBJECT_PERIODS);
    sheet.getRange(1, 1, SAMPLE_DATA.subjectPeriods.length, SAMPLE_DATA.subjectPeriods[0].length)
         .setValues(SAMPLE_DATA.subjectPeriods);
    
    SpreadsheetApp.getActiveSpreadsheet().toast('Sample data populated successfully!');
  } catch (e) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Error populating sample data: ' + e.toString(), 'Error', 30);
  }
} 