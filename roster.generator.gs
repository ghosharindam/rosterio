/**
 * Roster generation module
 * Contains the core roster generation functionality
 */
var Roster = Roster || {};

/**
 * Main function to generate the roster
 * Orchestrates the entire roster generation process
 */
Roster.generate = function() {
  try {
    // Load all required data
    const periodsConfig = Data.loadPeriodsConfig();
    const teachers = Data.loadTeacherSubjects();
    const classes = Data.loadClassConfig();
    const subjectPeriods = Data.loadSubjectPeriods();
    
    // Create empty roster template and get sheet info
    const { sheet, totalColumns, breakColumn, lunchColumn } = Roster.Creator.createEmptyRoster(classes, periodsConfig);
    
    // Use standard week days instead of active days from config
    const standardDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Generate the roster using constraint-based algorithm
    const rosterData = Roster.generateConstraintBasedRoster(
      classes, 
      standardDays, 
      teachers, 
      subjectPeriods,
      totalColumns,
      breakColumn,
      lunchColumn
    );
    
    // Ensure we have data to update
    if (rosterData.length === 0) {
      throw new Error("No roster data generated. Please check class and teacher configurations.");
    }
    
    // Insert filter row (leave it empty for now)
    const filterRow = new Array(totalColumns).fill('');
    
    // First add the filter row (row 2)
    sheet.getRange(2, 1, 1, totalColumns).setValues([filterRow]);
    
    // Then add the data starting from row 3
    if (rosterData.length > 0) {
      sheet.getRange(3, 1, rosterData.length, totalColumns).setValues(rosterData);
    }
    
    // Format cells
    sheet.getRange(3, 1, rosterData.length, totalColumns).setWrap(true);
    sheet.getRange(3, 1, rosterData.length, totalColumns).setVerticalAlignment('middle');
    
    // Format the sheet
    Roster.Creator.formatRosterSheet(sheet, totalColumns);
    
    // Store the generated data
    Roster.Creator.updateOriginalData(sheet);
    
    // Add filters to the sheet
    Roster.Filters.addRosterFilters(sheet);
    
    // Set up filter handlers
    Roster.Filters.setupFilterHandlers();
    
    // Check for conflicts after generation
    Roster.Conflicts.checkTeacherConflicts();
    
    SpreadsheetApp.getActiveSpreadsheet().toast('Roster generated successfully!');
    
  } catch (e) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Error generating roster: ' + e.toString(), 'Error', 30);
    console.error('Roster generation error:', e);
  }
};

/**
 * Generate a roster using a constraint-based algorithm to avoid teacher conflicts
 * @param {Array} classes - Array of classes
 * @param {Array} days - Array of days
 * @param {Array} teachers - Array of teachers
 * @param {Object} subjectPeriods - Subject period requirements
 * @param {number} totalColumns - Total columns in the roster
 * @param {number} breakColumn - Break column index
 * @param {number} lunchColumn - Lunch column index
 * @return {Array} Generated roster data
 */
Roster.generateConstraintBasedRoster = function(classes, days, teachers, subjectPeriods, totalColumns, breakColumn, lunchColumn) {
  // Create a sorted array of all day-class combinations
  const sortedDayClassCombos = [];
  
  days.forEach(day => {
    classes.forEach(classInfo => {
      sortedDayClassCombos.push({
        day: day,
        classInfo: classInfo
      });
    });
  });
  
  // Sort by day first, then by class
  sortedDayClassCombos.sort((a, b) => {
    // First sort by day
    const dayOrder = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5
    };
    
    const dayComparison = dayOrder[a.day] - dayOrder[b.day];
    if (dayComparison !== 0) return dayComparison;
    
    // Then sort by class (standard first, then section)
    if (a.classInfo.standard !== b.classInfo.standard) {
      return a.classInfo.standard.localeCompare(b.classInfo.standard);
    }
    return a.classInfo.section.localeCompare(b.classInfo.section);
  });
  
  // Initialize the roster data structure
  const rosterData = [];
  
  // Track teacher assignments to prevent conflicts
  // Structure: { day: { periodIndex: { teacherName: className } } }
  const teacherAssignments = {};
  days.forEach(day => {
    teacherAssignments[day] = {};
  });
  
  // Track class-subject assignments to meet subject requirements
  // Structure: { standard-section: { subject: count } }
  const classSubjectCounts = {};
  
  // Track subject-day occurrences to avoid more than maxPerDay
  // Structure: { standard-section: { subject: { day: count } } }
  const subjectDayCounts = {};
  
  // Initialize the tracking structures
  classes.forEach(classInfo => {
    const classKey = `${classInfo.standard}-${classInfo.section}`;
    classSubjectCounts[classKey] = {};
    subjectDayCounts[classKey] = {};
    
    // Initialize subject counts
    const subjects = subjectPeriods[classInfo.standard] || {};
    Object.keys(subjects).forEach(subject => {
      classSubjectCounts[classKey][subject] = 0;
      subjectDayCounts[classKey][subject] = {};
      days.forEach(day => {
        subjectDayCounts[classKey][subject][day] = 0;
      });
    });
  });
  
  // Generate roster for each day-class combination
  sortedDayClassCombos.forEach(combo => {
    const { day, classInfo } = combo;
    const rowData = new Array(totalColumns).fill('');
    
    // Set class and day columns
    rowData[0] = `${classInfo.standard}-${classInfo.section}`;
    rowData[1] = day;
    
    // Get subjects for this standard
    const classKey = `${classInfo.standard}-${classInfo.section}`;
    const subjects = subjectPeriods[classInfo.standard] || {};
    
    // Fill in periods
    for (let col = 2; col < totalColumns; col++) {
      // Skip break and lunch columns
      if (col === breakColumn - 1) {
        rowData[col] = 'BREAK';
        continue;
      } else if (col === lunchColumn - 1) {
        rowData[col] = 'LUNCH';
        continue;
      }
      
      // Get available subjects that haven't exceeded their maximum periods
      const availableSubjects = Object.keys(subjects).filter(subject => {
        const subjectConfig = subjects[subject];
        
        // Check if we've reached the max periods per week for this subject
        if (classSubjectCounts[classKey][subject] >= subjectConfig.maxPerWeek) {
          return false;
        }
        
        // Check if we've reached the max periods per day for this subject
        if (subjectDayCounts[classKey][subject][day] >= subjectConfig.maxPerDay) {
          return false;
        }
        
        return true;
      });
      
      // If we have available subjects, try to assign a teacher
      if (availableSubjects.length > 0) {
        // Initialize period in teacher assignments if not exists
        if (!teacherAssignments[day][col]) {
          teacherAssignments[day][col] = {};
        }
        
        // Try each subject in order to find one with an available teacher
        let assigned = false;
        
        // Sort subjects by how far they are from meeting their min requirements
        availableSubjects.sort((a, b) => {
          const aConfig = subjects[a];
          const bConfig = subjects[b];
          
          const aRemaining = aConfig.minPerWeek - classSubjectCounts[classKey][a];
          const bRemaining = bConfig.minPerWeek - classSubjectCounts[classKey][b];
          
          // Prioritize subjects that need more periods to meet min requirements
          return bRemaining - aRemaining;
        });
        
        for (const subject of availableSubjects) {
          // Find teachers who can teach this subject for this standard
          const availableTeachers = teachers.filter(teacher => {
            return teacher.subject === subject && 
                   teacher.standards[classInfo.standard] === true &&
                   !teacherAssignments[day][col][teacher.name]; // Teacher not already assigned this period
          });
          
          // If we have an available teacher, make the assignment
          if (availableTeachers.length > 0) {
            // Sort teachers by number of assignments to balance the load
            availableTeachers.sort((a, b) => {
              const aAssignments = countTeacherAssignments(a.name, teacherAssignments);
              const bAssignments = countTeacherAssignments(b.name, teacherAssignments);
              return aAssignments - bAssignments; // Teacher with fewer assignments first
            });
            
            const teacher = availableTeachers[0];
            
            // Assign the teacher
            rowData[col] = `${subject}\n(${teacher.name})`;
            teacherAssignments[day][col][teacher.name] = classKey;
            
            // Update subject counts
            classSubjectCounts[classKey][subject]++;
            subjectDayCounts[classKey][subject][day]++;
            
            assigned = true;
            break;
          }
        }
        
        // If we couldn't assign anything, leave it empty
        if (!assigned) {
          rowData[col] = '';
        }
      }
    }
    
    rosterData.push(rowData);
  });
  
  // Check for subjects that didn't meet minimum requirements and try to fill them
  Roster.ensureMinimumSubjectRequirements(rosterData, classes, subjectPeriods, classSubjectCounts, teacherAssignments, breakColumn, lunchColumn);
  
  return rosterData;
};

/**
 * Count how many times a teacher is assigned across the roster
 * @param {string} teacherName - The teacher's name
 * @param {Object} teacherAssignments - The current teacher assignments
 * @return {number} The count of assignments
 */
function countTeacherAssignments(teacherName, teacherAssignments) {
  let count = 0;
  Object.keys(teacherAssignments).forEach(day => {
    Object.keys(teacherAssignments[day]).forEach(periodIndex => {
      if (teacherAssignments[day][periodIndex][teacherName]) {
        count++;
      }
    });
  });
  return count;
}

/**
 * Ensure that all subjects meet their minimum period requirements
 * @param {Array} rosterData - The roster data
 * @param {Array} classes - The class data
 * @param {Object} subjectPeriods - The subject period requirements
 * @param {Object} classSubjectCounts - Current subject counts by class
 * @param {Object} teacherAssignments - Current teacher assignments
 * @param {number} breakColumn - Break column index
 * @param {number} lunchColumn - Lunch column index
 */
Roster.ensureMinimumSubjectRequirements = function(rosterData, classes, subjectPeriods, classSubjectCounts, teacherAssignments, breakColumn, lunchColumn) {
  // For each class, check if each subject meets minimum requirements
  classes.forEach(classInfo => {
    const classKey = `${classInfo.standard}-${classInfo.section}`;
    const subjects = subjectPeriods[classInfo.standard] || {};
    
    Object.keys(subjects).forEach(subject => {
      const subjectConfig = subjects[subject];
      const currentCount = classSubjectCounts[classKey][subject] || 0;
      
      // If we haven't met the minimum requirement
      if (currentCount < subjectConfig.minPerWeek) {
        const needed = subjectConfig.minPerWeek - currentCount;
        
        // Find rows for this class in the roster data
        const classRows = [];
        for (let i = 0; i < rosterData.length; i++) {
          if (rosterData[i][0] === classKey) {
            classRows.push(i);
          }
        }
        
        // Try to fill empty slots or replace less important subjects
        let filled = 0;
        
        for (let i = 0; i < classRows.length && filled < needed; i++) {
          const rowIndex = classRows[i];
          const day = rosterData[rowIndex][1];
          
          // Check each period
          for (let col = 2; col < rosterData[rowIndex].length && filled < needed; col++) {
            // Skip break and lunch
            if (col === breakColumn - 1 || col === lunchColumn - 1) continue;
            
            // Try to replace an empty slot first
            if (!rosterData[rowIndex][col]) {
              const result = Roster.tryAssignTeacher(subject, classInfo, day, col, teacherAssignments, rosterData, rowIndex);
              if (result) {
                filled++;
                classSubjectCounts[classKey][subject]++;
              }
            }
          }
        }
      }
    });
  });
};

/**
 * Try to assign a teacher for a specific subject, class, day, and period
 * @param {string} subject - The subject to assign
 * @param {Object} classInfo - The class information
 * @param {string} day - The day of the week
 * @param {number} col - The column (period) index
 * @param {Object} teacherAssignments - Current teacher assignments
 * @param {Array} rosterData - The roster data to update
 * @param {number} rowIndex - The row index in rosterData
 * @return {boolean} Whether assignment was successful
 */
Roster.tryAssignTeacher = function(subject, classInfo, day, col, teacherAssignments, rosterData, rowIndex) {
  // Find teachers who can teach this subject for this standard
  const teachers = Roster.getTeachers();
  const classKey = `${classInfo.standard}-${classInfo.section}`;
  
  // Ensure this period exists in teacherAssignments
  if (!teacherAssignments[day][col]) {
    teacherAssignments[day][col] = {};
  }
  
  const availableTeachers = teachers.filter(teacher => {
    return teacher.subject === subject && 
           teacher.standards[classInfo.standard] === true &&
           !teacherAssignments[day][col][teacher.name]; // Teacher not already assigned this period
  });
  
  // If we have an available teacher, make the assignment
  if (availableTeachers.length > 0) {
    // Sort teachers by number of assignments to balance the load
    availableTeachers.sort((a, b) => {
      const aAssignments = countTeacherAssignments(a.name, teacherAssignments);
      const bAssignments = countTeacherAssignments(b.name, teacherAssignments);
      return aAssignments - bAssignments; // Teacher with fewer assignments first
    });
    
    const teacher = availableTeachers[0];
    
    // Assign the teacher
    rosterData[rowIndex][col] = `${subject}\n(${teacher.name})`;
    teacherAssignments[day][col][teacher.name] = classKey;
    
    return true;
  }
  
  return false;
};

/**
 * Get teacher data (wrapper function for Data.loadTeacherSubjects for testing)
 * @return {Array} Array of teacher objects
 */
Roster.getTeachers = function() {
  return Data.loadTeacherSubjects();
}; 