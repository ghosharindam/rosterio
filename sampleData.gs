// Sample data for testing
const SAMPLE_DATA = {
  teacherSubjects: [
    ['Teacher Name', 'Subject', 'Standard I', 'Standard II', 'Standard III', 'Standard IV', 'Standard V', 'Standard VI', 'Standard VII', 'Standard VIII', 'Standard IX', 'Standard X', 'Standard XI', 'Standard XII'],
    // Primary School Teachers
    ['John Smith', 'English Literature', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Alice Thompson', 'English Literature', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', '', ''],
    ['Mary Johnson', 'English Language', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Susan Miller', 'English Language', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', '', ''],
    ['Robert Wilson', 'Mathematics', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Daniel Brown', 'Mathematics', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', '', ''],
    ['Sarah Brown', 'History', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', '', '', '', ''],
    ['George Martin', 'History', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', '', '', '', ''],
    ['David Lee', 'Geography', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', '', '', '', ''],
    ['Laura Chen', 'Geography', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', '', '', '', ''],
    ['Lisa Anderson', 'Science', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', '', '', '', ''],
    ['Mark Wilson', 'Science', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', '', '', '', ''],

    // Middle & High School Science Teachers
    ['Michael Davis', 'Physics', '', '', '', '', '', '', '', '', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Richard Scott', 'Physics', '', '', '', '', '', '', '', '', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Emma White', 'Chemistry', '', '', '', '', '', '', '', '', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Catherine Park', 'Chemistry', '', '', '', '', '', '', '', '', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['James Taylor', 'Biology', '', '', '', '', '', '', '', '', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Helen Garcia', 'Biology', '', '', '', '', '', '', '', '', 'Yes', 'Yes', 'Yes', 'Yes'],

    // Computer Science Teachers
    ['Patricia Moore', 'Computer Science', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Kevin Zhang', 'Computer Science', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],

    // Social Studies & Economics
    ['Thomas Clark', 'Economics', '', '', '', '', '', '', '', '', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Jennifer Hall', 'Social Studies', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', '', '', '', ''],
    ['Andrew Kim', 'Social Studies', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', '', '', '', ''],

    // Physical Education
    ['William Turner', 'Physical Education', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Sarah Martinez', 'Physical Education', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes']
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
    ['III', 'B'],
    ['IV', 'A'],
    ['IV', 'B'],
    ['V', 'A'],
    ['V', 'B'],
    ['VI', 'A'],
    ['VI', 'B'],
    ['VII', 'A'],
    ['VII', 'B'],
    ['VIII', 'A'],
    ['VIII', 'B'],
    ['IX', 'A'],
    ['IX', 'B'],
    ['X', 'A'],
    ['X', 'B'],
    ['XI', 'Science'],
    ['XII', 'Science']
  ],
  
  subjectPeriods: [
    ['Standard', 'Subject', 'Min Periods/Week', 'Max Periods/Week', 'Max Periods/Day'],
    // Primary Classes (I-V)
    ['I', 'English Literature', '5', '6', '2'],
    ['I', 'English Language', '5', '6', '2'],
    ['I', 'Mathematics', '6', '8', '2'],
    ['I', 'Science', '4', '5', '1'],
    ['I', 'History', '3', '4', '1'],
    ['I', 'Geography', '3', '4', '1'],
    
    ['II', 'English Literature', '5', '6', '2'],
    ['II', 'English Language', '5', '6', '2'],
    ['II', 'Mathematics', '6', '8', '2'],
    ['II', 'Science', '4', '5', '1'],
    ['II', 'History', '3', '4', '1'],
    ['II', 'Geography', '3', '4', '1'],
    
    ['III', 'English Literature', '5', '6', '2'],
    ['III', 'English Language', '5', '6', '2'],
    ['III', 'Mathematics', '6', '8', '2'],
    ['III', 'Science', '4', '5', '1'],
    ['III', 'History', '3', '4', '1'],
    ['III', 'Geography', '3', '4', '1'],
    
    ['IV', 'English Literature', '5', '6', '2'],
    ['IV', 'English Language', '5', '6', '2'],
    ['IV', 'Mathematics', '6', '8', '2'],
    ['IV', 'Science', '4', '5', '1'],
    ['IV', 'History', '3', '4', '1'],
    ['IV', 'Geography', '3', '4', '1'],
    ['IV', 'Computer Science', '2', '3', '1'],
    ['IV', 'Physical Education', '2', '3', '1'],
    
    ['V', 'English Literature', '5', '6', '2'],
    ['V', 'English Language', '5', '6', '2'],
    ['V', 'Mathematics', '6', '8', '2'],
    ['V', 'Science', '4', '5', '1'],
    ['V', 'History', '3', '4', '1'],
    ['V', 'Geography', '3', '4', '1'],
    ['V', 'Computer Science', '2', '3', '1'],
    ['V', 'Physical Education', '2', '3', '1'],
    
    // Middle School (VI-VIII)
    ['VI', 'English Literature', '5', '6', '2'],
    ['VI', 'English Language', '5', '6', '2'],
    ['VI', 'Mathematics', '6', '8', '2'],
    ['VI', 'Science', '4', '5', '1'],
    ['VI', 'Social Studies', '4', '5', '1'],
    ['VI', 'Computer Science', '2', '3', '1'],
    ['VI', 'Physical Education', '2', '3', '1'],
    
    ['VII', 'English Literature', '5', '6', '2'],
    ['VII', 'English Language', '5', '6', '2'],
    ['VII', 'Mathematics', '6', '8', '2'],
    ['VII', 'Science', '4', '5', '1'],
    ['VII', 'Social Studies', '4', '5', '1'],
    ['VII', 'Computer Science', '2', '3', '1'],
    ['VII', 'Physical Education', '2', '3', '1'],
    
    ['VIII', 'English Literature', '5', '6', '2'],
    ['VIII', 'English Language', '5', '6', '2'],
    ['VIII', 'Mathematics', '6', '8', '2'],
    ['VIII', 'Science', '4', '5', '1'],
    ['VIII', 'Social Studies', '4', '5', '1'],
    ['VIII', 'Computer Science', '2', '3', '1'],
    ['VIII', 'Physical Education', '2', '3', '1'],

    // High School (IX-X)
    ['IX', 'English Literature', '4', '6', '1'],
    ['IX', 'English Language', '4', '6', '1'],
    ['IX', 'Mathematics', '6', '8', '2'],
    ['IX', 'Physics', '4', '6', '1'],
    ['IX', 'Chemistry', '4', '6', '1'],
    ['IX', 'Biology', '4', '6', '1'],
    ['IX', 'Computer Science', '2', '3', '1'],
    ['IX', 'Physical Education', '2', '3', '1'],
    
    ['X', 'English Literature', '4', '6', '1'],
    ['X', 'English Language', '4', '6', '1'],
    ['X', 'Mathematics', '6', '8', '2'],
    ['X', 'Physics', '4', '6', '1'],
    ['X', 'Chemistry', '4', '6', '1'],
    ['X', 'Biology', '4', '6', '1'],
    ['X', 'Computer Science', '2', '3', '1'],
    ['X', 'Physical Education', '2', '3', '1'],
    
    // Higher Secondary (XI-XII)
    ['XI', 'English Literature', '4', '6', '1'],
    ['XI', 'Mathematics', '6', '8', '2'],
    ['XI', 'Physics', '6', '8', '2'],
    ['XI', 'Chemistry', '6', '8', '2'],
    ['XI', 'Biology', '6', '8', '2'],
    ['XI', 'Computer Science', '4', '6', '1'],
    ['XI', 'Physical Education', '2', '3', '1'],
    
    ['XII', 'English Literature', '4', '6', '1'],
    ['XII', 'Mathematics', '6', '8', '2'],
    ['XII', 'Physics', '6', '8', '2'],
    ['XII', 'Chemistry', '6', '8', '2'],
    ['XII', 'Biology', '6', '8', '2'],
    ['XII', 'Computer Science', '4', '6', '1'],
    ['XII', 'Physical Education', '2', '3', '1']
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