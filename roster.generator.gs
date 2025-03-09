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
    
    // // Add filters to the sheet
    // Roster.Filters.addRosterFilters(sheet);
    
    // // Set up filter handlers
    // Roster.Filters.setupFilterHandlers();
    
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
  // Cache teacher-subject mapping for faster lookup
  const teachersBySubject = {};
  const teacherStandardMap = {};
  
  // Pre-process teachers data for faster lookups
  teachers.forEach(teacher => {
    // Create a map of subjects to teachers
    if (!teachersBySubject[teacher.subject]) {
      teachersBySubject[teacher.subject] = [];
    }
    teachersBySubject[teacher.subject].push(teacher);
    
    // Cache standards each teacher can teach
    teacherStandardMap[teacher.name] = {};
    Object.keys(teacher.standards).forEach(standard => {
      teacherStandardMap[teacher.name][standard] = teacher.standards[standard];
    });
  });
  
  // Create a sorted array of all day-class combinations
  const sortedDayClassCombos = [];
  
  // Define day order for sorting
  const dayOrder = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5
  };
  
  // Create all combinations upfront
  days.forEach(day => {
    classes.forEach(classInfo => {
      sortedDayClassCombos.push({
        day: day,
        classInfo: classInfo,
        dayOrder: dayOrder[day]
      });
    });
  });
  
  // Sort by day first, then by class (pre-compute sorting criteria)
  sortedDayClassCombos.sort((a, b) => {
    // First sort by day using pre-computed order
    const dayComparison = a.dayOrder - b.dayOrder;
    if (dayComparison !== 0) return dayComparison;
    
    // Then sort by class (standard first, then section)
    if (a.classInfo.standard !== b.classInfo.standard) {
      return a.classInfo.standard.localeCompare(b.classInfo.standard);
    }
    return a.classInfo.section.localeCompare(b.classInfo.section);
  });
  
  // Initialize the roster data structure
  const rosterData = new Array(sortedDayClassCombos.length);
  
  // Pre-allocate each row data array with empty strings to avoid resizing
  for (let i = 0; i < rosterData.length; i++) {
    rosterData[i] = new Array(totalColumns).fill('');
  }
  
  // Track teacher assignments to prevent conflicts
  // Structure: { day: { periodIndex: { teacherName: className } } }
  const teacherAssignments = {};
  const teacherAssignmentCounts = {}; // Cache for teacher assignment counts
  
  // Initialize assignment tracking structures
  days.forEach(day => {
    teacherAssignments[day] = {};
    // Initialize period indices too to avoid checks later
    for (let col = 2; col < totalColumns; col++) {
      teacherAssignments[day][col] = {};
    }
  });
  
  // Initialize teacher assignment counts
  teachers.forEach(teacher => {
    teacherAssignmentCounts[teacher.name] = 0;
  });
  
  // Track class-subject assignments to meet subject requirements
  // Structure: { standard-section: { subject: count } }
  const classSubjectCounts = {};
  
  // Track subject-day occurrences to avoid more than maxPerDay
  // Structure: { standard-section: { subject: { day: count } } }
  const subjectDayCounts = {};
  
  // Pre-compute class keys and initialize tracking structures
  const classKeyMap = {};
  classes.forEach(classInfo => {
    const classKey = `${classInfo.standard}-${classInfo.section}`;
    classKeyMap[classInfo.standard + classInfo.section] = classKey; // For faster lookups
    
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
  for (let comboIndex = 0; comboIndex < sortedDayClassCombos.length; comboIndex++) {
    const combo = sortedDayClassCombos[comboIndex];
    const { day, classInfo } = combo;
    const rowData = rosterData[comboIndex];
    
    // Set class and day columns
    const classKey = classKeyMap[classInfo.standard + classInfo.section];
    rowData[0] = classKey;
    rowData[1] = day;
    
    // Get subjects for this standard
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
      const availableSubjects = [];
      
      // Check each subject without creating a new array each time
      for (const subject in subjects) {
        const subjectConfig = subjects[subject];
        
        // Check if we've reached the max periods per week for this subject
        if (classSubjectCounts[classKey][subject] >= subjectConfig.maxPerWeek) {
          continue;
        }
        
        // Check if we've reached the max periods per day for this subject
        if (subjectDayCounts[classKey][subject][day] >= subjectConfig.maxPerDay) {
          continue;
        }
        
        // Keep track of how far this subject is from meeting requirements (for sorting)
        const remaining = subjectConfig.minPerWeek - classSubjectCounts[classKey][subject];
        
        availableSubjects.push({
          name: subject,
          remaining: remaining, // Used for sorting
          config: subjectConfig
        });
      }
      
      // If we have available subjects, try to assign a teacher
      if (availableSubjects.length > 0) {
        // Sort subjects by how far they are from meeting their min requirements
        // This avoids repeatedly calculating the difference inside the sort
        availableSubjects.sort((a, b) => b.remaining - a.remaining);
        
        let assigned = false;
        
        for (let i = 0; i < availableSubjects.length && !assigned; i++) {
          const subject = availableSubjects[i].name;
          
          // Find teachers who can teach this subject for this standard
          const subjectTeachers = teachersBySubject[subject] || [];
          
          // Filter available teachers without creating new array
          const availableTeachers = [];
          for (let j = 0; j < subjectTeachers.length; j++) {
            const teacher = subjectTeachers[j];
            
            // Check if teacher can teach this standard and isn't already assigned
            if (teacherStandardMap[teacher.name][classInfo.standard] === true && 
                !teacherAssignments[day][col][teacher.name]) {
              
              availableTeachers.push({
                teacher: teacher,
                assignments: teacherAssignmentCounts[teacher.name]
              });
            }
          }
          
          // If we have an available teacher, make the assignment
          if (availableTeachers.length > 0) {
            // Sort teachers by assignment count to balance the load
            availableTeachers.sort((a, b) => a.assignments - b.assignments);
            
            const teacherData = availableTeachers[0];
            const teacher = teacherData.teacher;
            
            // Assign the teacher
            rowData[col] = `${subject}\n(${teacher.name})`;
            teacherAssignments[day][col][teacher.name] = classKey;
            
            // Update counts
            teacherAssignmentCounts[teacher.name]++;
            classSubjectCounts[classKey][subject]++;
            subjectDayCounts[classKey][subject][day]++;
            
            assigned = true;
          }
        }
      }
    }
  }
  
  // Check for subjects that didn't meet minimum requirements and try to fill them
  Roster.ensureMinimumSubjectRequirements(
    rosterData, 
    classes, 
    subjectPeriods, 
    classSubjectCounts, 
    teacherAssignments, 
    teacherAssignmentCounts,
    classKeyMap,
    teachersBySubject,
    teacherStandardMap,
    breakColumn, 
    lunchColumn
  );
  
  return rosterData;
};

/**
 * Ensure that all subjects meet their minimum period requirements
 * @param {Array} rosterData - The roster data
 * @param {Array} classes - The class data
 * @param {Object} subjectPeriods - The subject period requirements
 * @param {Object} classSubjectCounts - Current subject counts by class
 * @param {Object} teacherAssignments - Current teacher assignments
 * @param {Object} teacherAssignmentCounts - Cached teacher assignment counts
 * @param {Object} classKeyMap - Map of class identifiers to keys
 * @param {Object} teachersBySubject - Teachers grouped by subject
 * @param {Object} teacherStandardMap - Map of teacher capabilities by standard
 * @param {number} breakColumn - Break column index
 * @param {number} lunchColumn - Lunch column index
 */
Roster.ensureMinimumSubjectRequirements = function(
  rosterData, 
  classes, 
  subjectPeriods, 
  classSubjectCounts, 
  teacherAssignments, 
  teacherAssignmentCounts,
  classKeyMap,
  teachersBySubject,
  teacherStandardMap,
  breakColumn, 
  lunchColumn
) {
  // Pre-compute class row indices for faster lookups
  const classRowIndices = {};
  
  for (let i = 0; i < rosterData.length; i++) {
    const classKey = rosterData[i][0];
    const day = rosterData[i][1];
    
    if (!classRowIndices[classKey]) {
      classRowIndices[classKey] = {};
    }
    
    classRowIndices[classKey][day] = i;
  }
  
  // For each class, check if each subject meets minimum requirements
  classes.forEach(classInfo => {
    const classKey = classKeyMap[classInfo.standard + classInfo.section];
    const subjects = subjectPeriods[classInfo.standard] || {};
    
    Object.keys(subjects).forEach(subject => {
      const subjectConfig = subjects[subject];
      const currentCount = classSubjectCounts[classKey][subject] || 0;
      
      // If we haven't met the minimum requirement
      if (currentCount < subjectConfig.minPerWeek) {
        const needed = subjectConfig.minPerWeek - currentCount;
        let filled = 0;
        
        // Standard days
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        // Try to fill empty slots
        for (let dayIndex = 0; dayIndex < days.length && filled < needed; dayIndex++) {
          const day = days[dayIndex];
          const rowIndex = classRowIndices[classKey]?.[day];
          
          if (rowIndex === undefined) continue;
          
          // Check each period
          for (let col = 2; col < rosterData[rowIndex].length && filled < needed; col++) {
            // Skip break and lunch
            if (col === breakColumn - 1 || col === lunchColumn - 1) continue;
            
            // Try to replace an empty slot first
            if (!rosterData[rowIndex][col]) {
              // Find available teachers for this subject
              const subjectTeachers = teachersBySubject[subject] || [];
              let assigned = false;
              
              // Get teachers who can teach this subject for this class and aren't busy
              const availableTeachers = [];
              
              for (let i = 0; i < subjectTeachers.length; i++) {
                const teacher = subjectTeachers[i];
                
                if (teacherStandardMap[teacher.name][classInfo.standard] === true && 
                    !teacherAssignments[day][col][teacher.name]) {
                  
                  availableTeachers.push({
                    teacher: teacher,
                    assignments: teacherAssignmentCounts[teacher.name]
                  });
                }
              }
              
              // If we have available teachers, assign one
              if (availableTeachers.length > 0) {
                // Sort by assignment count
                availableTeachers.sort((a, b) => a.assignments - b.assignments);
                
                const teacherData = availableTeachers[0];
                const teacher = teacherData.teacher;
                
                // Assign the teacher
                rosterData[rowIndex][col] = `${subject}\n(${teacher.name})`;
                teacherAssignments[day][col][teacher.name] = classKey;
                teacherAssignmentCounts[teacher.name]++;
                classSubjectCounts[classKey][subject]++;
                
                filled++;
                assigned = true;
              }
            }
          }
        }
      }
    });
  });
};

/**
 * Get teacher data (wrapper function for Data.loadTeacherSubjects for testing)
 * @return {Array} Array of teacher objects
 */
Roster.getTeachers = function() {
  return Data.loadTeacherSubjects();
}; 