/**
 * Roster Validator Module
 * Pre-evaluates scheduling constraints to determine if the roster generation is feasible
 * and identifies potential conflicts before actual roster generation
 */
var Roster = Roster || {};
Roster.Validator = Roster.Validator || {};

/**
 * Main validation function to be called before roster generation
 * Checks if all minimum subject requirements can be satisfied
 * 
 * @param {Array} classes - Array of class objects with standard and section
 * @param {Array} teachers - Array of teacher objects
 * @param {Object} subjectPeriods - Subject period requirements
 * @param {Array} days - Array of days in the week
 * @param {number} periodsPerDay - Number of periods per day
 * @return {Object} Validation results with conflicts information
 */
Roster.Validator.validateScheduleFeasibility = function(classes, teachers, subjectPeriods, days, periodsPerDay) {
  // Create result object
  const results = {
    feasible: true,
    conflicts: [],
    teacherCapacityIssues: [],
    subjectRequirementIssues: [],
    summary: ""
  };
  
  // Calculate total teaching capacity of each subject
  const subjectCapacity = {};
  const teachersBySubject = {};
  const teacherStandardMap = {};
  
  // Group teachers by subject for easier lookup
  teachers.forEach(teacher => {
    if (!teachersBySubject[teacher.subject]) {
      teachersBySubject[teacher.subject] = [];
      subjectCapacity[teacher.subject] = {};
    }
    teachersBySubject[teacher.subject].push(teacher);
    
    // Cache standards each teacher can teach
    teacherStandardMap[teacher.name] = {};
    Object.keys(teacher.standards).forEach(standard => {
      if (teacher.standards[standard]) {
        teacherStandardMap[teacher.name][standard] = true;
        
        // Increment capacity for this subject+standard combination
        if (!subjectCapacity[teacher.subject][standard]) {
          subjectCapacity[teacher.subject][standard] = 0;
        }
        subjectCapacity[teacher.subject][standard]++;
      }
    });
  });
  
  // Calculate total required periods for each subject+standard
  const subjectRequirements = {};
  
  classes.forEach(classInfo => {
    const standard = classInfo.standard;
    
    if (!subjectRequirements[standard]) {
      subjectRequirements[standard] = {};
    }
    
    // Get subjects for this standard
    const subjects = subjectPeriods[standard] || {};
    
    // For each subject, increment the total required periods
    Object.keys(subjects).forEach(subject => {
      if (!subjectRequirements[standard][subject]) {
        subjectRequirements[standard][subject] = {
          minPerWeek: 0,
          maxPerWeek: 0,
          classCount: 0
        };
      }
      
      subjectRequirements[standard][subject].minPerWeek += subjects[subject].minPerWeek;
      subjectRequirements[standard][subject].maxPerWeek += subjects[subject].maxPerWeek;
      subjectRequirements[standard][subject].classCount++;
    });
  });
  
  // Calculate total available teaching periods
  const totalPeriods = days.length * periodsPerDay;
  
  // Check feasibility by comparing required vs. available
  Object.keys(subjectRequirements).forEach(standard => {
    Object.keys(subjectRequirements[standard]).forEach(subject => {
      const req = subjectRequirements[standard][subject];
      
      // Total required periods for this subject+standard across all sections
      const totalMinRequired = req.minPerWeek;
      
      // How many teachers can teach this subject for this standard
      const teacherCount = (teachersBySubject[subject] || [])
        .filter(t => teacherStandardMap[t.name][standard])
        .length;
      
      // Max periods these teachers can theoretically teach
      const maxTeacherPeriods = teacherCount * totalPeriods;
      
      // Check if there are enough teachers to cover minimum periods
      if (maxTeacherPeriods < totalMinRequired) {
        results.feasible = false;
        results.teacherCapacityIssues.push({
          standard: standard,
          subject: subject,
          teacherCount: teacherCount,
          requiredPeriods: totalMinRequired,
          availablePeriods: maxTeacherPeriods,
          shortfall: totalMinRequired - maxTeacherPeriods,
          classCount: req.classCount
        });
      }
    });
  });
  
  // For each class, simulate assigning minimum periods and check for conflicts
  classes.forEach(classInfo => {
    const standard = classInfo.standard;
    const section = classInfo.section;
    const classKey = `${standard}-${section}`;
    
    // Get subjects for this standard
    const subjects = subjectPeriods[standard] || {};
    
    // Calculate total minimum periods required for this class
    let totalMinPeriods = 0;
    Object.keys(subjects).forEach(subject => {
      totalMinPeriods += subjects[subject].minPerWeek;
    });
    
    // Check if total required exceeds available periods
    const maxAvailablePeriods = days.length * (periodsPerDay - 2); // Subtract 2 for break and lunch
    
    if (totalMinPeriods > maxAvailablePeriods) {
      results.feasible = false;
      results.subjectRequirementIssues.push({
        classKey: classKey,
        standard: standard,
        section: section,
        totalMinPeriods: totalMinPeriods,
        maxAvailablePeriods: maxAvailablePeriods,
        exceeded: totalMinPeriods - maxAvailablePeriods
      });
    }
    
    // Identify specific subjects with potential issues
    Object.keys(subjects).forEach(subject => {
      const minRequired = subjects[subject].minPerWeek;
      const availableTeachers = (teachersBySubject[subject] || [])
        .filter(t => teacherStandardMap[t.name][standard])
        .length;
      
      if (availableTeachers === 0 && minRequired > 0) {
        results.feasible = false;
        results.conflicts.push({
          classKey: classKey,
          standard: standard,
          section: section,
          subject: subject,
          minRequired: minRequired,
          availableTeachers: availableTeachers,
          type: 'NoTeachers'
        });
      }
    });
  });
  
  // Generate summary message
  if (results.feasible) {
    results.summary = "Schedule generation is feasible. All requirements can theoretically be met.";
  } else {
    results.summary = "Schedule generation may not satisfy all constraints. See conflicts for details.";
  }
  
  return results;
};

/**
 * Creates or updates the Schedule-Conflicts sheet with validation results
 * 
 * @param {Object} validationResults - Results from validateScheduleFeasibility
 * @return {SpreadsheetApp.Sheet} The conflicts sheet
 */
Roster.Validator.createConflictsSheet = function(validationResults) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Schedule-Conflicts');
  
  // Create the sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('Schedule-Conflicts');
  } else {
    // Clear existing content
    sheet.clear();
  }
  
  // Set up the header row
  sheet.getRange('A1:G1').setValues([['Type', 'Standard', 'Section', 'Subject', 'Requirement', 'Available', 'Details']]);
  sheet.getRange('A1:G1').setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Add a summary row
  sheet.getRange('A2:G2').merge();
  sheet.getRange('A2').setValue(validationResults.summary);
  sheet.getRange('A2').setFontWeight('bold');
  if (!validationResults.feasible) {
    sheet.getRange('A2').setBackground('#f4cccc'); // Light red
  } else {
    sheet.getRange('A2').setBackground('#d9ead3'); // Light green
  }
  
  let row = 3;
  
  // Add teacher capacity issues
  validationResults.teacherCapacityIssues.forEach(issue => {
    sheet.getRange(row, 1, 1, 7).setValues([[
      'Teacher Capacity',
      issue.standard,
      'All Sections',
      issue.subject,
      `${issue.requiredPeriods} periods`,
      `${issue.availablePeriods} periods`,
      `Shortfall of ${issue.shortfall} periods across ${issue.classCount} sections`
    ]]);
    sheet.getRange(row, 1, 1, 7).setBackground('#f4cccc'); // Light red
    row++;
  });
  
  // Add subject requirement issues
  validationResults.subjectRequirementIssues.forEach(issue => {
    sheet.getRange(row, 1, 1, 7).setValues([[
      'Time Constraint',
      issue.standard,
      issue.section,
      'All Subjects',
      `${issue.totalMinPeriods} periods`,
      `${issue.maxAvailablePeriods} periods`,
      `Total minimum periods exceed available slots by ${issue.exceeded}`
    ]]);
    sheet.getRange(row, 1, 1, 7).setBackground('#fce5cd'); // Light orange
    row++;
  });
  
  // Add specific conflicts
  validationResults.conflicts.forEach(conflict => {
    sheet.getRange(row, 1, 1, 7).setValues([[
      'Subject Assignment',
      conflict.standard,
      conflict.section,
      conflict.subject,
      `${conflict.minRequired} periods`,
      `${conflict.availableTeachers} teachers`,
      'No teachers available for this subject+standard combination'
    ]]);
    sheet.getRange(row, 1, 1, 7).setBackground('#f4cccc'); // Light red
    row++;
  });
  
  // Auto-size columns
  sheet.autoResizeColumns(1, 7);
  
  // Return the sheet
  return sheet;
};

/**
 * Main validation function to call before roster generation
 * This evaluates the scheduling constraints and creates the conflicts sheet
 * 
 * @return {Object} Validation results
 */
Roster.Validator.validateRoster = function() {
  try {
    // Load all required data
    const periodsConfig = Data.loadPeriodsConfig();
    const teachers = Data.loadTeacherSubjects();
    const classes = Data.loadClassConfig();
    const subjectPeriods = Data.loadSubjectPeriods();
    
    // Standard days
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Calculate available periods per day (excluding breaks and lunch)
    const periodsPerDay = periodsConfig.periodsPerDay;
    
    // Run the validation
    const validationResults = Roster.Validator.validateScheduleFeasibility(
      classes, 
      teachers, 
      subjectPeriods, 
      days, 
      periodsPerDay
    );
    
    // Create the conflicts sheet
    Roster.Validator.createConflictsSheet(validationResults);
    
    // Display a toast message with the results
    if (!validationResults.feasible) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'Schedule generation may not satisfy all constraints. Check the Schedule-Conflicts tab for details.',
        'Validation Warning',
        30
      );
    } else {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'Schedule validation completed successfully. No conflicts found.',
        'Validation Success',
        5
      );
    }
    
    return validationResults;
  } catch (e) {
    console.error('Error during roster validation:', e);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Error during schedule validation: ' + e.toString(),
      'Validation Error',
      30
    );
    return {
      feasible: false,
      summary: 'Error during validation: ' + e.toString(),
      conflicts: [],
      teacherCapacityIssues: [],
      subjectRequirementIssues: []
    };
  }
}; 