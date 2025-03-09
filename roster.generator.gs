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
    
    // Run validation first to check for potential conflicts
    if (typeof Roster.Validator !== 'undefined' && typeof Roster.Validator.validateRoster === 'function') {
      const validationResults = Roster.Validator.validateRoster();
      
      // If validation fails and user doesn't want to continue, abort
      if (!validationResults.feasible) {
        const ui = SpreadsheetApp.getUi();
        const response = ui.alert(
          'Schedule Conflicts Detected',
          'There are potential conflicts that may prevent all requirements from being met. Continue anyway?',
          ui.ButtonSet.YES_NO
        );
        
        if (response !== ui.Button.YES) {
          SpreadsheetApp.getActiveSpreadsheet().toast('Roster generation aborted by user', 'Aborted', 5);
          return;
        }
      }
    }
    
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
    
    // Generate the Teacher-View after roster generation
    try {
      if (typeof TeacherView !== 'undefined' && typeof TeacherView.generateAfterRoster === 'function') {
        TeacherView.generateAfterRoster();
      }
    } catch (viewError) {
      console.error('Error generating Teache-View:', viewError);
      // Don't let Teacher-View errors affect the main roster generation
    }

    // Generate the Standard-Subject View after roster generation
    try {
      if (typeof StandardSubjectView !== 'undefined' && typeof StandardSubjectView.generate === 'function') {
        StandardSubjectView.generate();
      }
    } catch (viewError) {
      console.error('Error generating Standard-Subject View:', viewError);
      // Don't let Standard-Subject View errors affect the main roster generation
    }

    // Move the tabs to the end
    const sheetsToMove = ['Generated-Roster', 'Teacher-View', 'Standard-Subject View', 'Schedule-Conflicts'];
    sheetsToMove.forEach(sheetName => {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
      if (sheet) {
        SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);
        SpreadsheetApp.getActiveSpreadsheet().moveActiveSheet(SpreadsheetApp.getActiveSpreadsheet().getSheets().length);
      }
    });

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
  
  // NEW: Calculate complexity score for each class based on subject requirements
  const classComplexity = {};
  
  classes.forEach(classInfo => {
    const standard = classInfo.standard;
    const subjects = subjectPeriods[standard] || {};
    
    let totalMinPeriods = 0;
    let subjectCount = 0;
    
    // Sum up minimum periods required
    Object.keys(subjects).forEach(subject => {
      totalMinPeriods += subjects[subject].minPerWeek;
      subjectCount++;
    });
    
    // Calculate a complexity score based on total periods and subject count
    classComplexity[`${standard}-${classInfo.section}`] = {
      totalMinPeriods: totalMinPeriods,
      subjectCount: subjectCount,
      score: totalMinPeriods * (subjectCount / 5) // Normalized by typical subject count
    };
  });
  
  // Create all combinations upfront
  days.forEach(day => {
    classes.forEach(classInfo => {
      sortedDayClassCombos.push({
        day: day,
        classInfo: classInfo,
        dayOrder: dayOrder[day],
        complexity: classComplexity[`${classInfo.standard}-${classInfo.section}`]?.score || 0
      });
    });
  });
  
  // MODIFIED: Sort by complexity first (most complex to least), then by day
  sortedDayClassCombos.sort((a, b) => {
    // First sort by complexity (higher complexity first)
    if (a.complexity !== b.complexity) {
      return b.complexity - a.complexity;
    }
    
    // Then sort by day
    const dayComparison = a.dayOrder - b.dayOrder;
    if (dayComparison !== 0) return dayComparison;
    
    // Then sort by class (standard first, then section)
    if (a.classInfo.standard !== b.classInfo.standard) {
      // NEW: Higher standards get higher priority
      // Use reverse order to prioritize higher classes (XII, XI, etc.)
      return b.classInfo.standard.localeCompare(a.classInfo.standard);
    }
    return a.classInfo.section.localeCompare(b.classInfo.section);
  });
  
  // Initialize the roster data structure
  const rosterData = new Array(sortedDayClassCombos.length);
  
  // Pre-allocate each row data array with empty strings to avoid resizing
  for (let i = 0; i < rosterData.length; i++) {
    rosterData[i] = new Array(totalColumns).fill('');
  }
  
  // Create a map to find the index of each day-class combination in the rosterData array
  const comboIndices = {};
  sortedDayClassCombos.forEach((combo, index) => {
    const key = `${combo.day}-${combo.classInfo.standard}-${combo.classInfo.section}`;
    comboIndices[key] = index;
  });
  
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
  
  // Track teachers assigned to each class to limit teacher variety
  // Structure: { standard-section: { teacherName: true } }
  const classTeacherMap = {};
  
  // Track teachers assigned to specific subjects for each class
  // Structure: { standard-section: { subject: { teacherName: count } } }
  const classSubjectTeacherMap = {};
  
  // Maximum number of different teachers per class - adjust as needed
  const MAX_TEACHERS_PER_CLASS = 8;
  
  // Pre-compute class keys and initialize tracking structures
  const classKeyMap = {};
  classes.forEach(classInfo => {
    const classKey = `${classInfo.standard}-${classInfo.section}`;
    classKeyMap[classInfo.standard + classInfo.section] = classKey; // For faster lookups
    
    classSubjectCounts[classKey] = {};
    subjectDayCounts[classKey] = {};
    classTeacherMap[classKey] = {}; // Initialize teacher tracking per class
    classSubjectTeacherMap[classKey] = {}; // Initialize subject-teacher mapping
    
    // Initialize subject counts
    const subjects = subjectPeriods[classInfo.standard] || {};
    Object.keys(subjects).forEach(subject => {
      classSubjectCounts[classKey][subject] = 0;
      subjectDayCounts[classKey][subject] = {};
      classSubjectTeacherMap[classKey][subject] = {}; // Initialize teacher tracking per subject
      days.forEach(day => {
        subjectDayCounts[classKey][subject][day] = 0;
      });
    });
  });
  
  // NEW: First pass - prioritize minimum subject requirements
  // Create a list of class-subject-day combinations sorted by priority
  const priorityAssignments = [];
  
  classes.forEach(classInfo => {
    const classKey = classKeyMap[classInfo.standard + classInfo.section];
    const subjects = subjectPeriods[classInfo.standard] || {};
    
    Object.keys(subjects).forEach(subject => {
      const minPerWeek = subjects[subject].minPerWeek;
      const maxPerDay = subjects[subject].maxPerDay;
      
      // Calculate how many days this subject needs to be taught on
      const minDays = Math.ceil(minPerWeek / maxPerDay);
      
      // Get available teachers for this subject and standard
      const availableTeachers = (teachersBySubject[subject] || [])
        .filter(t => teacherStandardMap[t.name][classInfo.standard]);
      
      if (availableTeachers.length > 0 && minPerWeek > 0) {
        // Add to priority assignments list with calculated priority
        // Higher grades get higher priority
        const gradePriority = classInfo.standard.startsWith('XII') ? 3 : 
                              classInfo.standard.startsWith('XI') ? 2 :
                              classInfo.standard.startsWith('X') ? 1 : 0;
        
        priorityAssignments.push({
          classInfo: classInfo,
          classKey: classKey,
          subject: subject,
          minPerWeek: minPerWeek,
          maxPerDay: maxPerDay,
          minDays: minDays,
          teachers: availableTeachers,
          // Prioritize subjects with higher min requirements and higher grades
          priority: minPerWeek * (1 + gradePriority * 0.1)
        });
      }
    });
  });
  
  // Sort by priority (highest first)
  priorityAssignments.sort((a, b) => b.priority - a.priority);
  
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
    
    // Get teacher count for this class
    const teacherCount = Object.keys(classTeacherMap[classKey]).length;
    
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
      
      // Check if the previous period had the same subject (for constraint #2)
      let previousSubject = null;
      let previousTeacher = null;
      
      if (col > 2 && rowData[col-1] && !['BREAK', 'LUNCH'].includes(rowData[col-1])) {
        // Extract subject and teacher from the previous cell
        const prevCellContent = rowData[col-1];
        const matches = prevCellContent.match(/^(.+)\n\((.+)\)$/);
        if (matches && matches.length === 3) {
          previousSubject = matches[1].trim();
          previousTeacher = matches[2].trim();
        }
      }
      
      // Get subjects that need to meet minimum requirements
      // Start with subjects that are furthest from meeting their minimum
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
        
        // NEW: Increase priority for subjects that have not met minimum requirements
        const currentCount = classSubjectCounts[classKey][subject] || 0;
        
        // Calculate how far this subject is from meeting its minimum
        const remaining = subjectConfig.minPerWeek - currentCount;
        
        // Give preference to the subject from the previous period
        const isPreviousSubject = (subject === previousSubject) ? 1 : 0;
        
        // NEW: Check how many teachers are available for this subject/standard
        const availableTeachers = (teachersBySubject[subject] || [])
          .filter(t => 
            teacherStandardMap[t.name][classInfo.standard] && 
            !teacherAssignments[day][col][t.name]
          ).length;
        
        // Only add if we have available teachers
        if (availableTeachers > 0) {
          availableSubjects.push({
            name: subject,
            remaining: remaining, // How far from meeting minimum
            isPreviousSubject: isPreviousSubject, // Prioritize continuation
            config: subjectConfig,
            // NEW: Give higher priority to subjects that need to meet minimums
            priority: remaining > 0 ? remaining * 2 : 0
          });
        }
      }
      
      // If we have available subjects, try to assign a teacher
      if (availableSubjects.length > 0) {
        // MODIFIED: Sort subjects by:
        // 1. Continuity from previous period
        // 2. Higher priority for subjects below minimum requirements
        // 3. How far they are from meeting minimum requirements
        availableSubjects.sort((a, b) => {
          // First prioritize subjects that continue from the previous period
          if (a.isPreviousSubject !== b.isPreviousSubject) {
            return b.isPreviousSubject - a.isPreviousSubject;
          }
          
          // Then prioritize subjects that haven't met minimums
          if ((a.remaining > 0) !== (b.remaining > 0)) {
            return b.remaining > 0 ? 1 : -1;
          }
          
          // Finally sort by priority and how far from meeting requirements
          return (b.priority + b.remaining) - (a.priority + a.remaining);
        });
        
        let assigned = false;
        
        for (let i = 0; i < availableSubjects.length && !assigned; i++) {
          const subject = availableSubjects[i].name;
          
          // Find teachers who can teach this subject for this standard
          const subjectTeachers = teachersBySubject[subject] || [];
          
          // Check if this subject is continuing from previous period
          const isContinuation = (subject === previousSubject);
          
          // For constraint #2: Try to assign the same teacher for consecutive periods with same subject
          if (isContinuation && previousTeacher) {
            // Find the previous teacher in the available teachers
            const previousTeacherObj = subjectTeachers.find(t => t.name === previousTeacher);
            
            // Check if previous teacher is available for this period
            if (previousTeacherObj && !teacherAssignments[day][col][previousTeacher]) {
              // CORRECTED: We only need to check if teacher is already assigned in this specific period
              // No need to check other periods on the same day
              
              // Assign the same teacher
              rowData[col] = `${subject}\n(${previousTeacher})`;
              teacherAssignments[day][col][previousTeacher] = classKey;
              teacherAssignmentCounts[previousTeacher]++;
              classSubjectCounts[classKey][subject]++;
              subjectDayCounts[classKey][subject][day]++;
              
              // Update teacher tracking for this class
              classTeacherMap[classKey][previousTeacher] = true;
              
              // Update subject-teacher mapping
              if (!classSubjectTeacherMap[classKey][subject][previousTeacher]) {
                classSubjectTeacherMap[classKey][subject][previousTeacher] = 0;
              }
              classSubjectTeacherMap[classKey][subject][previousTeacher]++;
              
              assigned = true;
              continue;
            }
          }
          
          // Organize teachers into different groups based on constraints
          const existingClassTeachers = []; // Teachers already assigned to this class
          const existingSubjectTeachers = []; // Teachers already teaching this subject to this class
          const newTeachers = []; // Teachers not yet assigned to this class
          
          for (let j = 0; j < subjectTeachers.length; j++) {
            const teacher = subjectTeachers[j];
            
            // Check if teacher can teach this standard and isn't already assigned this period
            if (teacherStandardMap[teacher.name][classInfo.standard] === true && 
                !teacherAssignments[day][col][teacher.name]) {
              
              // CORRECTED: Remove the day-level conflict check as it's unnecessary
              // The check above (!teacherAssignments[day][col][teacher.name]) already ensures
              // the teacher isn't assigned to any class in this specific period
              
              // For constraint #1: Check if teacher is already assigned to this class
              if (classTeacherMap[classKey][teacher.name]) {
                // Further prioritize teachers already teaching this subject to this class
                if (classSubjectTeacherMap[classKey][subject][teacher.name]) {
                  existingSubjectTeachers.push({
                    teacher: teacher,
                    assignments: teacherAssignmentCounts[teacher.name],
                    subjectAssignments: classSubjectTeacherMap[classKey][subject][teacher.name]
                  });
                } else {
                  existingClassTeachers.push({
                    teacher: teacher,
                    assignments: teacherAssignmentCounts[teacher.name]
                  });
                }
              } else if (teacherCount < MAX_TEACHERS_PER_CLASS || Object.keys(classTeacherMap[classKey]).length === 0) {
                // Add new teacher only if we haven't reached the maximum or if no teachers assigned yet
                newTeachers.push({
                  teacher: teacher,
                  assignments: teacherAssignmentCounts[teacher.name]
                });
              }
            }
          }
          
          // Try to assign teachers in order of priority
          let availableTeachers = [];
          
          // First try teachers already teaching this subject to this class
          if (existingSubjectTeachers.length > 0) {
            // Sort by number of subject-specific assignments to balance subject teaching load
            existingSubjectTeachers.sort((a, b) => a.subjectAssignments - b.subjectAssignments);
            availableTeachers = existingSubjectTeachers;
          } 
          // Then try teachers already assigned to this class for other subjects
          else if (existingClassTeachers.length > 0) {
            // Sort by total assignments to balance overall load
            existingClassTeachers.sort((a, b) => a.assignments - b.assignments);
            availableTeachers = existingClassTeachers;
          } 
          // Finally try new teachers if we haven't reached the limit
          else if (newTeachers.length > 0) {
            // Sort by total assignments to balance overall load
            newTeachers.sort((a, b) => a.assignments - b.assignments);
            availableTeachers = newTeachers;
          }
          
          // If we have an available teacher, make the assignment
          if (availableTeachers.length > 0) {
            const teacherData = availableTeachers[0];
            const teacher = teacherData.teacher;
            
            // Assign the teacher
            rowData[col] = `${subject}\n(${teacher.name})`;
            teacherAssignments[day][col][teacher.name] = classKey;
            
            // Update counts
            teacherAssignmentCounts[teacher.name]++;
            classSubjectCounts[classKey][subject]++;
            subjectDayCounts[classKey][subject][day]++;
            
            // Update teacher tracking for this class
            classTeacherMap[classKey][teacher.name] = true;
            
            // Update subject-teacher mapping
            if (!classSubjectTeacherMap[classKey][subject][teacher.name]) {
              classSubjectTeacherMap[classKey][subject][teacher.name] = 0;
            }
            classSubjectTeacherMap[classKey][subject][teacher.name]++;
            
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
    classTeacherMap,
    classSubjectTeacherMap,
    subjectDayCounts,
    breakColumn, 
    lunchColumn
  );
  
  return rosterData;
};

/**
 * Ensure that all subjects meet their minimum period requirements
 * Uses a more aggressive approach to ensure minimum requirements are met
 * 
 * @param {Array} rosterData - The roster data
 * @param {Array} classes - The class data
 * @param {Object} subjectPeriods - The subject period requirements
 * @param {Object} classSubjectCounts - Current subject counts by class
 * @param {Object} teacherAssignments - Current teacher assignments
 * @param {Object} teacherAssignmentCounts - Cached teacher assignment counts
 * @param {Object} classKeyMap - Map of class identifiers to keys
 * @param {Object} teachersBySubject - Teachers grouped by subject
 * @param {Object} teacherStandardMap - Map of teacher capabilities by standard
 * @param {Object} classTeacherMap - Map of teachers assigned to each class
 * @param {Object} classSubjectTeacherMap - Map of teachers assigned to subjects per class
 * @param {Object} subjectDayCounts - Counts of subjects per day
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
  classTeacherMap,
  classSubjectTeacherMap,
  subjectDayCounts,
  breakColumn, 
  lunchColumn
) {
  // Maximum number of different teachers per class - adjust as needed
  const MAX_TEACHERS_PER_CLASS = 8;
  
  // Standard days
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
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
  
  // Calculate the subject deficit for each class (how far below minimum requirements)
  const classSubjectDeficits = {};
  
  // Track which subjects are over their minimum (excess) for potential replacement
  const classSubjectExcess = {};
  
  classes.forEach(classInfo => {
    // Get the appropriate key format based on class type (regular or special like "XII-Science")
    let standard = classInfo.standard;
    let classKey = classKeyMap[classInfo.standard + classInfo.section];
    
    // Initialize deficit tracking
    classSubjectDeficits[classKey] = [];
    classSubjectExcess[classKey] = [];
    
    // Get subjects for this standard
    const subjects = subjectPeriods[standard] || {};
    
    // Calculate deficit/excess for each subject
    Object.keys(subjects).forEach(subject => {
      const subjectConfig = subjects[subject];
      const currentCount = classSubjectCounts[classKey][subject] || 0;
      const minRequired = subjectConfig.minPerWeek;
      
      if (currentCount < minRequired) {
        // Subject has a deficit (below minimum)
        classSubjectDeficits[classKey].push({
          subject: subject,
          deficit: minRequired - currentCount,
          minPerWeek: minRequired,
          maxPerDay: subjectConfig.maxPerDay,
          priority: (minRequired - currentCount) * (minRequired / 10) // Higher priority for larger deficits and higher requirements
        });
      } else if (currentCount > minRequired) {
        // Subject has an excess (above minimum)
        classSubjectExcess[classKey].push({
          subject: subject,
          excess: currentCount - minRequired,
          minPerWeek: minRequired
        });
      }
    });
    
    // Sort deficits by priority (highest first) - classes with larger deficits and higher min requirements first
    classSubjectDeficits[classKey].sort((a, b) => b.priority - a.priority);
  });
  
  // Log the deficits for debugging
  console.log("Class subject deficits:", JSON.stringify(classSubjectDeficits));
  
  // Track changes made during optimization
  let totalChanges = 0;
  let totalDeficits = 0;
  
  // Count total deficits for reporting
  Object.values(classSubjectDeficits).forEach(deficits => {
    deficits.forEach(deficit => {
      totalDeficits += deficit.deficit;
    });
  });
  
  console.log(`Total subject deficits before optimization: ${totalDeficits}`);
  
  // PHASE 1: Fill empty slots for subjects with deficits
  
  // Process classes that have deficits
  Object.keys(classSubjectDeficits).forEach(classKey => {
    if (classSubjectDeficits[classKey].length === 0) return; // Skip classes with no deficits
    
    // Get the class info
    const classKeyComponents = classKey.split('-');
    let standardName, section;
    
    // Handle different class key formats
    if (classKeyComponents.length === 2) {
      // Simple format: "Standard-Section"
      standardName = classKeyComponents[0];
      section = classKeyComponents[1];
    } else if (classKeyComponents.length === 3) {
      // Complex format: "Standard-Type-Section"
      standardName = classKeyComponents[0] + '-' + classKeyComponents[1];
      section = classKeyComponents[2];
    } else {
      // Fallback
      standardName = classKeyComponents[0];
      section = classKeyComponents[1] || 'A';
    }
    
    // Find the class info object matching this standard and section
    const classInfo = classes.find(c => 
      (c.standard === standardName && c.section === section) ||
      (c.standard + c.section === standardName + section)
    );
    
    if (!classInfo) {
      console.log(`Could not find class info for ${classKey}`);
      return;
    }
    
    // Process deficits for this class
    classSubjectDeficits[classKey].forEach(deficitInfo => {
      const { subject, deficit } = deficitInfo;
      let filledCount = 0;
      
      // Try to fill empty slots first
      for (let dayIndex = 0; dayIndex < days.length && filledCount < deficit; dayIndex++) {
        const day = days[dayIndex];
        const rowIndex = classRowIndices[classKey]?.[day];
        
        if (rowIndex === undefined) continue;
        
        // Check each period in this day
        for (let col = 2; col < rosterData[rowIndex].length && filledCount < deficit; col++) {
          // Skip break and lunch columns
          if (col === breakColumn - 1 || col === lunchColumn - 1) continue;
          
          // Try to fill empty slots first
          if (!rosterData[rowIndex][col]) {
            // Check if we can assign within maxPerDay constraint
            if ((subjectDayCounts[classKey][subject][day] || 0) >= deficitInfo.maxPerDay) {
              continue; // Skip - already at max for this day
            }
            
            if (tryAssignTeacher(rowIndex, col, day, classInfo, classKey, subject, deficitInfo)) {
              filledCount++;
              totalChanges++;
            }
          }
        }
      }
      
      // Update the deficit after filling empty slots
      classSubjectDeficits[classKey].find(d => d.subject === subject).deficit -= filledCount;
    });
  });
  
  // PHASE 2: Replace less critical subjects if still have deficits
  
  // For each class with remaining deficits, try to replace periods from subjects with excess
  Object.keys(classSubjectDeficits).forEach(classKey => {
    // Filter to only subjects still with deficits
    const remainingDeficits = classSubjectDeficits[classKey].filter(d => d.deficit > 0);
    if (remainingDeficits.length === 0) return; // Skip if no deficits remain
    
    // Get class info
    const classKeyComponents = classKey.split('-');
    let standardName, section;
    
    // Handle different class key formats
    if (classKeyComponents.length === 2) {
      standardName = classKeyComponents[0];
      section = classKeyComponents[1];
    } else if (classKeyComponents.length === 3) {
      standardName = classKeyComponents[0] + '-' + classKeyComponents[1];
      section = classKeyComponents[2];
    } else {
      standardName = classKeyComponents[0];
      section = classKeyComponents[1] || 'A';
    }
    
    const classInfo = classes.find(c => 
      (c.standard === standardName && c.section === section) ||
      (c.standard + c.section === standardName + section)
    );
    
    if (!classInfo) return;
    
    // Sort excess subjects by excess amount (most excess first)
    const excessSubjects = classSubjectExcess[classKey].sort((a, b) => b.excess - a.excess);
    
    // For each deficit subject
    remainingDeficits.forEach(deficitInfo => {
      const { subject, deficit } = deficitInfo;
      let filledCount = 0;
      
      // Try to replace subjects with excess
      for (let dayIndex = 0; dayIndex < days.length && filledCount < deficit; dayIndex++) {
        const day = days[dayIndex];
        const rowIndex = classRowIndices[classKey]?.[day];
        
        if (rowIndex === undefined) continue;
        
        // Calculate how many periods we can still allocate on this day
        const currentDayCount = subjectDayCounts[classKey][subject][day] || 0;
        const maxMoreOnThisDay = deficitInfo.maxPerDay - currentDayCount;
        
        if (maxMoreOnThisDay <= 0) continue; // Skip this day if already at max
        
        // Check each period
        for (let col = 2; col < rosterData[rowIndex].length && filledCount < deficit; col++) {
          // Skip if already filled maxPerDay for this subject on this day
          if (filledCount >= maxMoreOnThisDay) break;
          
          // Skip break and lunch columns
          if (col === breakColumn - 1 || col === lunchColumn - 1) continue;
          
          // Skip empty slots (these were tried in Phase 1)
          if (!rosterData[rowIndex][col]) continue;
          
          // Get the current subject in this slot
          const currentCellValue = rosterData[rowIndex][col];
          if (currentCellValue === 'BREAK' || currentCellValue === 'LUNCH') continue;
          
          // Extract current subject and teacher
          const currentMatches = currentCellValue.match(/^(.+)\n\((.+)\)$/);
          if (!currentMatches || currentMatches.length < 3) continue;
          
          const currentSubject = currentMatches[1].trim();
          const currentTeacher = currentMatches[2].trim();
          
          // Skip if this is already the deficit subject
          if (currentSubject === subject) continue;
          
          // Check if current subject has excess we can use
          const excessSubject = excessSubjects.find(e => e.subject === currentSubject && e.excess > 0);
          if (!excessSubject) continue;
          
          // Try to replace this period with our deficit subject
          // First, remove the current assignment
          delete teacherAssignments[day][col][currentTeacher];
          teacherAssignmentCounts[currentTeacher]--;
          classSubjectCounts[classKey][currentSubject]--;
          
          // Decrement subject-day count
          if (subjectDayCounts[classKey][currentSubject][day] > 0) {
            subjectDayCounts[classKey][currentSubject][day]--;
          }
          
          // Update teacher-subject mapping
          if (classSubjectTeacherMap[classKey][currentSubject][currentTeacher] > 0) {
            classSubjectTeacherMap[classKey][currentSubject][currentTeacher]--;
          }
          
          // Try to assign our deficit subject
          if (tryAssignTeacher(rowIndex, col, day, classInfo, classKey, subject, deficitInfo)) {
            filledCount++;
            totalChanges++;
            
            // Update the excess tracking
            excessSubject.excess--;
          } else {
            // If we couldn't assign the deficit subject, restore the original
            rosterData[rowIndex][col] = currentCellValue;
            teacherAssignments[day][col][currentTeacher] = classKey;
            teacherAssignmentCounts[currentTeacher]++;
            classSubjectCounts[classKey][currentSubject]++;
            
            // Restore subject-day count
            if (!subjectDayCounts[classKey][currentSubject][day]) {
              subjectDayCounts[classKey][currentSubject][day] = 0;
            }
            subjectDayCounts[classKey][currentSubject][day]++;
            
            // Restore teacher-subject mapping
            if (!classSubjectTeacherMap[classKey][currentSubject][currentTeacher]) {
              classSubjectTeacherMap[classKey][currentSubject][currentTeacher] = 0;
            }
            classSubjectTeacherMap[classKey][currentSubject][currentTeacher]++;
          }
        }
      }
      
      // Update the deficit after filling
      deficitInfo.deficit -= filledCount;
    });
  });
  
  // PHASE 3: Last resort - try to swap with any subject if we still have deficits
  // This is more aggressive and will try to reach minimums at all costs
  
  // Calculate remaining deficits
  let remainingDeficits = 0;
  Object.values(classSubjectDeficits).forEach(deficits => {
    deficits.forEach(deficit => {
      remainingDeficits += deficit.deficit;
    });
  });
  
  console.log(`After initial optimization, remaining deficits: ${remainingDeficits}`);
  
  // Only enter Phase 3 if we still have deficits and haven't made too many changes yet
  if (remainingDeficits > 0 && totalChanges < 100) { // Limit total changes to avoid excessive computation
    // Process remaining deficits more aggressively
    Object.keys(classSubjectDeficits).forEach(classKey => {
      // Get only subjects still with deficits
      const criticalDeficits = classSubjectDeficits[classKey].filter(d => d.deficit > 0);
      if (criticalDeficits.length === 0) return;
      
      // Get class info (same as before)
      const classKeyComponents = classKey.split('-');
      let standardName, section;
      
      if (classKeyComponents.length === 2) {
        standardName = classKeyComponents[0];
        section = classKeyComponents[1];
      } else if (classKeyComponents.length === 3) {
        standardName = classKeyComponents[0] + '-' + classKeyComponents[1];
        section = classKeyComponents[2];
      } else {
        standardName = classKeyComponents[0];
        section = classKeyComponents[1] || 'A';
      }
      
      const classInfo = classes.find(c => 
        (c.standard === standardName && c.section === section) ||
        (c.standard + c.section === standardName + section)
      );
      
      if (!classInfo) return;
      
      // For each critical deficit subject
      criticalDeficits.forEach(deficitInfo => {
        const { subject, deficit } = deficitInfo;
        let filledCount = 0;
        
        // Now try replacing ANY subject (not just excess ones)
        for (let dayIndex = 0; dayIndex < days.length && filledCount < deficit; dayIndex++) {
          const day = days[dayIndex];
          const rowIndex = classRowIndices[classKey]?.[day];
          
          if (rowIndex === undefined) continue;
          
          // Skip days where we already have max per day
          const currentDayCount = subjectDayCounts[classKey][subject][day] || 0;
          if (currentDayCount >= deficitInfo.maxPerDay) continue;
          
          // Calculate how many more we can add to this day
          const maxMoreOnThisDay = deficitInfo.maxPerDay - currentDayCount;
          
          for (let col = 2; col < rosterData[rowIndex].length && filledCount < deficit; col++) {
            // Skip if already filled maxPerDay for this subject on this day
            if (filledCount >= maxMoreOnThisDay) break;
            
            // Skip break and lunch columns
            if (col === breakColumn - 1 || col === lunchColumn - 1) continue;
            
            // Skip empty slots (these were tried earlier)
            if (!rosterData[rowIndex][col]) continue;
            
            // Get current cell value
            const currentCellValue = rosterData[rowIndex][col];
            if (currentCellValue === 'BREAK' || currentCellValue === 'LUNCH') continue;
            
            // Extract current subject and teacher
            const currentMatches = currentCellValue.match(/^(.+)\n\((.+)\)$/);
            if (!currentMatches || currentMatches.length < 3) continue;
            
            const currentSubject = currentMatches[1].trim();
            const currentTeacher = currentMatches[2].trim();
            
            // Skip if this is already the deficit subject
            if (currentSubject === subject) continue;
            
            // Don't replace subjects that would fall below their minimum
            const currentSubjectConfig = subjectPeriods[standardName]?.[currentSubject];
            if (currentSubjectConfig) {
              const currentCount = classSubjectCounts[classKey][currentSubject] || 0;
              // Only replace if it won't push this subject below its minimum
              if (currentCount <= currentSubjectConfig.minPerWeek) continue;
            }
            
            // Try to replace with our deficit subject
            delete teacherAssignments[day][col][currentTeacher];
            teacherAssignmentCounts[currentTeacher]--;
            classSubjectCounts[classKey][currentSubject]--;
            
            // Decrement subject-day count
            if (subjectDayCounts[classKey][currentSubject][day] > 0) {
              subjectDayCounts[classKey][currentSubject][day]--;
            }
            
            // Update teacher-subject mapping
            if (classSubjectTeacherMap[classKey][currentSubject][currentTeacher] > 0) {
              classSubjectTeacherMap[classKey][currentSubject][currentTeacher]--;
            }
            
            if (tryAssignTeacher(rowIndex, col, day, classInfo, classKey, subject, deficitInfo)) {
              filledCount++;
              totalChanges++;
            } else {
              // Restore original if we couldn't assign
              rosterData[rowIndex][col] = currentCellValue;
              teacherAssignments[day][col][currentTeacher] = classKey;
              teacherAssignmentCounts[currentTeacher]++;
              classSubjectCounts[classKey][currentSubject]++;
              
              // Restore subject-day count
              if (!subjectDayCounts[classKey][currentSubject][day]) {
                subjectDayCounts[classKey][currentSubject][day] = 0;
              }
              subjectDayCounts[classKey][currentSubject][day]++;
              
              // Restore teacher-subject mapping
              if (!classSubjectTeacherMap[classKey][currentSubject][currentTeacher]) {
                classSubjectTeacherMap[classKey][currentSubject][currentTeacher] = 0;
              }
              classSubjectTeacherMap[classKey][currentSubject][currentTeacher]++;
            }
          }
        }
        
        // Update the deficit
        deficitInfo.deficit -= filledCount;
      });
    });
  }
  
  // Calculate final deficits
  let finalDeficits = 0;
  Object.values(classSubjectDeficits).forEach(deficits => {
    deficits.forEach(deficit => {
      finalDeficits += deficit.deficit;
    });
  });
  
  console.log(`Final optimization results: Made ${totalChanges} changes, reduced deficits from ${totalDeficits} to ${finalDeficits}`);
  
  // Helper function to try to assign a teacher for a subject in a specific slot
  function tryAssignTeacher(rowIndex, col, day, classInfo, classKey, subject, subjectConfig) {
    // Check if assigning this subject would exceed maxPerDay
    const dayCount = (subjectDayCounts[classKey][subject][day] || 0);
    if (dayCount >= subjectConfig.maxPerDay) {
      return false;
    }
    
    // Find potential teachers
    const subjectTeachers = teachersBySubject[subject] || [];
    
    // Check if there's an adjacent period with the same subject - try to use the same teacher
    let adjacentTeacher = null;
    
    // Check previous period
    if (col > 2 && rosterData[rowIndex][col-1] && !['BREAK', 'LUNCH'].includes(rosterData[rowIndex][col-1])) {
      const prevCellContent = rosterData[rowIndex][col-1];
      const matches = prevCellContent.match(/^(.+)\n\((.+)\)$/);
      if (matches && matches.length === 3 && matches[1].trim() === subject) {
        adjacentTeacher = matches[2].trim();
      }
    }
    
    // Check next period
    if (!adjacentTeacher && col < rosterData[rowIndex].length - 1 && 
        rosterData[rowIndex][col+1] && !['BREAK', 'LUNCH'].includes(rosterData[rowIndex][col+1])) {
      const nextCellContent = rosterData[rowIndex][col+1];
      const matches = nextCellContent.match(/^(.+)\n\((.+)\)$/);
      if (matches && matches.length === 3 && matches[1].trim() === subject) {
        adjacentTeacher = matches[2].trim();
      }
    }
    
    // If we found an adjacent teacher, try to assign them first
    if (adjacentTeacher && !teacherAssignments[day][col][adjacentTeacher]) {
      // Check if this teacher can teach this subject and standard
      const teacherObj = subjectTeachers.find(t => t.name === adjacentTeacher);
      
      if (teacherObj && teacherStandardMap[adjacentTeacher][classInfo.standard] === true) {
        // Assign the same teacher for continuity
        rosterData[rowIndex][col] = `${subject}\n(${adjacentTeacher})`;
        teacherAssignments[day][col][adjacentTeacher] = classKey;
        teacherAssignmentCounts[adjacentTeacher]++;
        classSubjectCounts[classKey][subject]++;
        subjectDayCounts[classKey][subject][day]++;
        
        // Update teacher tracking
        classTeacherMap[classKey][adjacentTeacher] = true;
        
        // Update subject-teacher mapping
        if (!classSubjectTeacherMap[classKey][subject][adjacentTeacher]) {
          classSubjectTeacherMap[classKey][subject][adjacentTeacher] = 0;
        }
        classSubjectTeacherMap[classKey][subject][adjacentTeacher]++;
        
        return true;
      }
    }
    
    // Get the teacher count for this class
    const teacherCount = Object.keys(classTeacherMap[classKey]).length;
    
    // Organize teachers into different groups based on constraints
    const existingClassTeachers = []; // Teachers already assigned to this class
    const existingSubjectTeachers = []; // Teachers already teaching this subject to this class
    const newTeachers = []; // Teachers not yet assigned to this class
    
    for (let i = 0; i < subjectTeachers.length; i++) {
      const teacher = subjectTeachers[i];
      
      // Check if teacher can teach this standard and isn't already assigned this period
      // CORRECTED: We only need to check if the teacher is free for this specific period
      if (teacherStandardMap[teacher.name][classInfo.standard] === true && 
          !teacherAssignments[day][col][teacher.name]) {
        
        // CORRECTED: Remove day-level conflict check, as we only care about this specific period
        
        // For constraint #1: Check if teacher is already assigned to this class
        if (classTeacherMap[classKey][teacher.name]) {
          // Further prioritize teachers already teaching this subject to this class
          if (classSubjectTeacherMap[classKey][subject][teacher.name]) {
            existingSubjectTeachers.push({
              teacher: teacher,
              assignments: teacherAssignmentCounts[teacher.name],
              subjectAssignments: classSubjectTeacherMap[classKey][subject][teacher.name]
            });
          } else {
            existingClassTeachers.push({
              teacher: teacher,
              assignments: teacherAssignmentCounts[teacher.name]
            });
          }
        } else if (teacherCount < MAX_TEACHERS_PER_CLASS || Object.keys(classTeacherMap[classKey]).length === 0) {
          // Add new teacher only if we haven't reached the maximum or if no teachers assigned yet
          newTeachers.push({
            teacher: teacher,
            assignments: teacherAssignmentCounts[teacher.name]
          });
        }
      }
    }
    
    // Try to assign teachers in order of priority
    let availableTeachers = [];
    
    // First try teachers already teaching this subject to this class
    if (existingSubjectTeachers.length > 0) {
      existingSubjectTeachers.sort((a, b) => a.subjectAssignments - b.subjectAssignments);
      availableTeachers = existingSubjectTeachers;
    } 
    // Then try teachers already assigned to this class for other subjects
    else if (existingClassTeachers.length > 0) {
      existingClassTeachers.sort((a, b) => a.assignments - b.assignments);
      availableTeachers = existingClassTeachers;
    } 
    // Finally try new teachers if we haven't reached the limit
    else if (newTeachers.length > 0) {
      newTeachers.sort((a, b) => a.assignments - b.assignments);
      availableTeachers = newTeachers;
    }
    
    // If we have available teachers, assign one
    if (availableTeachers.length > 0) {
      const teacherData = availableTeachers[0];
      const teacher = teacherData.teacher;
      
      // Assign the teacher
      rosterData[rowIndex][col] = `${subject}\n(${teacher.name})`;
      teacherAssignments[day][col][teacher.name] = classKey;
      teacherAssignmentCounts[teacher.name]++;
      classSubjectCounts[classKey][subject]++;
      subjectDayCounts[classKey][subject][day]++;
      
      // Update teacher tracking
      classTeacherMap[classKey][teacher.name] = true;
      
      // Update subject-teacher mapping
      if (!classSubjectTeacherMap[classKey][subject][teacher.name]) {
        classSubjectTeacherMap[classKey][subject][teacher.name] = 0;
      }
      classSubjectTeacherMap[classKey][subject][teacher.name]++;
      
      return true;
    }
    
    return false;
  }
};

/**
 * Get teacher data (wrapper function for Data.loadTeacherSubjects for testing)
 * @return {Array} Array of teacher objects
 */
Roster.getTeachers = function() {
  return Data.loadTeacherSubjects();
};