roster.iterator.gs/**
 * Roster Iteration Module
 * Provides functionality to iteratively improve an existing roster
 */
var Roster = Roster || {};

// Keep track of iteration state to enable advanced optimization techniques over multiple iterations
Roster.iterationState = {
  iterationCount: 0,
  previousScores: [],
  previousChanges: [],
  stagnationCount: 0,
  temperature: 1.0, // For simulated annealing
  coolingRate: 0.85
};

/**
 * Iteratively improve an existing roster without regenerating from scratch
 * Identifies and fixes issues like unfulfilled minimum subject requirements
 */
Roster.iterateExistingRoster = function() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Check if Generated-Roster exists
    const rosterSheet = ss.getSheetByName(SHEET_NAMES.ROSTER);
    if (!rosterSheet) {
      throw new Error("Generated-Roster sheet not found. Please generate a roster first.");
    }
    
    // Display a toast message to the user
    ss.toast('Iterating roster to improve allocation...', 'Starting Iteration', 3);
    
    // Increment iteration count
    Roster.iterationState.iterationCount++;
    
    // Load all required data
    const periodsConfig = Data.loadPeriodsConfig();
    const teachers = Data.loadTeacherSubjects();
    const classes = Data.loadClassConfig();
    const subjectPeriods = Data.loadSubjectPeriods();
    
    // Extract break and lunch column information
    let breakColumn = -1;
    let lunchColumn = -1;
    
    for (let i = 0; i < periodsConfig.length; i++) {
      if (periodsConfig[i].type === 'BREAK') {
        breakColumn = i + 3; // +3 because we start from column C (index 2) in the sheet
      } else if (periodsConfig[i].type === 'LUNCH') {
        lunchColumn = i + 3;
      }
    }
    
    // Load the existing roster data
    const rosterData = rosterSheet.getDataRange().getValues();
    
    // Skip header and filter rows
    const dataStartRow = 3;
    const cleanRosterData = [];
    
    for (let i = dataStartRow - 1; i < rosterData.length; i++) {
      cleanRosterData.push(rosterData[i].slice()); // Create a copy of each row
    }
    
    // Rebuild data structures from existing roster
    const result = Roster.rebuildDataStructures(cleanRosterData, classes, teachers, subjectPeriods, breakColumn, lunchColumn);
    
    // Choose optimization strategy based on iteration state
    let optimizationStrategy = "normal";
    if (Roster.iterationState.stagnationCount >= 2) {
      optimizationStrategy = "aggressive";
      console.log("Using aggressive optimization strategy due to stagnation");
    } else if (Roster.iterationState.iterationCount > 5) {
      optimizationStrategy = "advanced";
      console.log("Using advanced optimization strategy based on iteration count");
    }
    
    // Perform optimization on the existing roster
    const optimizationResult = Roster.optimizeExistingRoster(
      cleanRosterData,
      classes,
      teachers,
      subjectPeriods,
      result.teacherAssignments,
      result.teacherAssignmentCounts,
      result.classSubjectCounts,
      result.subjectDayCounts,
      result.classTeacherMap,
      result.classSubjectTeacherMap,
      result.classKeyMap,
      result.teachersBySubject,
      result.teacherStandardMap,
      breakColumn,
      lunchColumn,
      optimizationStrategy,
      Roster.iterationState
    );
    
    const optimizedData = optimizationResult.rosterData;
    const currentScore = optimizationResult.score;
    const changesCount = optimizationResult.changesCount;
    
    // Update roster sheet with optimized data
    if (optimizedData.length > 0) {
      rosterSheet.getRange(dataStartRow, 1, optimizedData.length, optimizedData[0].length).setValues(optimizedData);
    }
    
    // Update related views
    try {
      if (typeof TeacherView !== 'undefined' && typeof TeacherView.generateAfterRoster === 'function') {
        TeacherView.generateAfterRoster();
      }
    } catch (viewError) {
      console.error('Error generating Teacher-View:', viewError);
    }

    try {
      if (typeof StandardSubjectView !== 'undefined' && typeof StandardSubjectView.generate === 'function') {
        StandardSubjectView.generate();
      }
    } catch (viewError) {
      console.error('Error generating Standard-Subject View:', viewError);
    }
    
    // Check for conflicts after optimization
    Roster.Conflicts.checkTeacherConflicts();
    
    // Update iteration state
    if (Roster.iterationState.previousScores.length > 0) {
      const lastScore = Roster.iterationState.previousScores[Roster.iterationState.previousScores.length - 1];
      
      // Check for stagnation (less than 2% improvement)
      if (changesCount === 0 || (currentScore - lastScore) / Math.abs(lastScore) < 0.02) {
        Roster.iterationState.stagnationCount++;
      } else {
        Roster.iterationState.stagnationCount = 0;
      }
    }
    
    // Store current score for next iteration
    Roster.iterationState.previousScores.push(currentScore);
    Roster.iterationState.previousChanges.push(changesCount);
    
    // Reduce temperature for simulated annealing
    Roster.iterationState.temperature *= Roster.iterationState.coolingRate;
    
    // Keep only most recent 5 scores
    if (Roster.iterationState.previousScores.length > 5) {
      Roster.iterationState.previousScores.shift();
      Roster.iterationState.previousChanges.shift();
    }
    
    ss.toast(`Roster iteration complete. Made ${changesCount} changes, score: ${currentScore.toFixed(2)}. Check Standard-Subject View to see improvements.`, 'Complete', 5);
    
    return true;
  } catch (e) {
    console.error('Error in iterateExistingRoster:', e);
    SpreadsheetApp.getActiveSpreadsheet().toast('Error: ' + e.message, 'Iteration Failed', 10);
    return false;
  }
};

/**
 * Rebuild data structures from an existing roster
 * @param {Array} rosterData - The existing roster data
 * @param {Array} classes - Class configuration
 * @param {Array} teachers - Teacher data
 * @param {Object} subjectPeriods - Subject period requirements
 * @param {number} breakColumn - Break column index
 * @param {number} lunchColumn - Lunch column index
 * @return {Object} The rebuilt data structures
 */
Roster.rebuildDataStructures = function(rosterData, classes, teachers, subjectPeriods, breakColumn, lunchColumn) {
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
  
  // Standard days
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Track teacher assignments
  const teacherAssignments = {};
  const teacherAssignmentCounts = {};
  
  // Initialize assignment tracking structures
  days.forEach(day => {
    teacherAssignments[day] = {};
    // Initialize period indices
    for (let col = 2; col < rosterData[0].length; col++) {
      teacherAssignments[day][col] = {};
    }
  });
  
  // Initialize teacher assignment counts
  teachers.forEach(teacher => {
    teacherAssignmentCounts[teacher.name] = 0;
  });
  
  // Mapping for class keys
  const classKeyMap = {};
  
  // Track class-subject assignments
  const classSubjectCounts = {};
  
  // Track subject-day counts
  const subjectDayCounts = {};
  
  // Track teachers assigned to each class
  const classTeacherMap = {};
  
  // Track teachers assigned to specific subjects for each class
  const classSubjectTeacherMap = {};
  
  // Pre-compute class keys and initialize tracking structures
  classes.forEach(classInfo => {
    const classKey = `${classInfo.standard}-${classInfo.section}`;
    classKeyMap[classInfo.standard + classInfo.section] = classKey;
    
    classSubjectCounts[classKey] = {};
    subjectDayCounts[classKey] = {};
    classTeacherMap[classKey] = {};
    classSubjectTeacherMap[classKey] = {};
    
    // Initialize subject counts
    const subjects = subjectPeriods[classInfo.standard] || {};
    Object.keys(subjects).forEach(subject => {
      classSubjectCounts[classKey][subject] = 0;
      subjectDayCounts[classKey][subject] = {};
      classSubjectTeacherMap[classKey][subject] = {};
      days.forEach(day => {
        subjectDayCounts[classKey][subject][day] = 0;
      });
    });
  });
  
  // Process the roster data to populate the data structures
  for (let i = 0; i < rosterData.length; i++) {
    const classKey = rosterData[i][0];
    const day = rosterData[i][1];
    
    // Process each period (column)
    for (let col = 2; col < rosterData[i].length; col++) {
      const cellValue = rosterData[i][col];
      
      // Skip break, lunch and empty cells
      if (!cellValue || cellValue === 'BREAK' || cellValue === 'LUNCH') {
        continue;
      }
      
      // Extract subject and teacher
      const matches = cellValue.match(/^(.+)\n\((.+)\)$/);
      if (matches && matches.length === 3) {
        const subject = matches[1].trim();
        const teacher = matches[2].trim();
        
        // Update teacher assignment
        teacherAssignments[day][col][teacher] = classKey;
        teacherAssignmentCounts[teacher] = (teacherAssignmentCounts[teacher] || 0) + 1;
        
        // Update class-subject count
        if (!classSubjectCounts[classKey][subject]) {
          classSubjectCounts[classKey][subject] = 0;
        }
        classSubjectCounts[classKey][subject]++;
        
        // Update subject-day count
        if (!subjectDayCounts[classKey][subject][day]) {
          subjectDayCounts[classKey][subject][day] = 0;
        }
        subjectDayCounts[classKey][subject][day]++;
        
        // Update teacher tracking
        classTeacherMap[classKey][teacher] = true;
        
        // Update subject-teacher mapping
        if (!classSubjectTeacherMap[classKey][subject][teacher]) {
          classSubjectTeacherMap[classKey][subject][teacher] = 0;
        }
        classSubjectTeacherMap[classKey][subject][teacher]++;
      }
    }
  }
  
  return {
    teacherAssignments,
    teacherAssignmentCounts,
    classSubjectCounts,
    subjectDayCounts,
    classTeacherMap,
    classSubjectTeacherMap,
    classKeyMap,
    teachersBySubject,
    teacherStandardMap
  };
};

/**
 * Optimize an existing roster by identifying and fixing issues
 * @param {Array} rosterData - The existing roster data
 * @param {Array} classes - Class configuration
 * @param {Array} teachers - Teacher data
 * @param {Object} subjectPeriods - Subject period requirements
 * @param {Object} teacherAssignments - Current teacher assignments
 * @param {Object} teacherAssignmentCounts - Current teacher assignment counts
 * @param {Object} classSubjectCounts - Current subject counts by class
 * @param {Object} subjectDayCounts - Current subject-day counts
 * @param {Object} classTeacherMap - Current teacher-class mapping
 * @param {Object} classSubjectTeacherMap - Current subject-teacher mapping by class
 * @param {Object} classKeyMap - Class key mapping
 * @param {Object} teachersBySubject - Teachers grouped by subject
 * @param {Object} teacherStandardMap - Map of teacher capabilities by standard
 * @param {number} breakColumn - Break column index
 * @param {number} lunchColumn - Lunch column index
 * @param {string} strategy - Optimization strategy ("normal", "advanced", or "aggressive")
 * @param {Object} iterationState - Current iteration state
 * @return {Object} The optimized roster data, score, and change count
 */
Roster.optimizeExistingRoster = function(
  rosterData,
  classes,
  teachers,
  subjectPeriods,
  teacherAssignments,
  teacherAssignmentCounts,
  classSubjectCounts,
  subjectDayCounts,
  classTeacherMap,
  classSubjectTeacherMap,
  classKeyMap,
  teachersBySubject,
  teacherStandardMap,
  breakColumn,
  lunchColumn,
  strategy = "normal",
  iterationState = null
) {
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
  
  // Track which subjects are below minimum and above maximum requirements
  const classSubjectDeficits = {}; // Below minimum
  const classSubjectExcess = {}; // Between minimum and maximum
  const classSubjectOverflow = {}; // Above maximum
  
  // Track which slots are empty
  const emptySlots = [];
  
  // Calculate and categorize subject allocations
  console.log("Analyzing current subject allocations...");
  
  // Analyze class deficit/excess/overflow and empty slots
  classes.forEach(classInfo => {
    // Get the class key, handling complex formats
    let standard = classInfo.standard;
    let classKey = classKeyMap[classInfo.standard + classInfo.section];
    
    // Initialize tracking structures
    classSubjectDeficits[classKey] = [];
    classSubjectExcess[classKey] = [];
    classSubjectOverflow[classKey] = [];
    
    // Get subjects for this standard
    const subjects = subjectPeriods[standard] || {};
    
    // Calculate allocation categories for each subject
    Object.keys(subjects).forEach(subject => {
      const subjectConfig = subjects[subject];
      const currentCount = classSubjectCounts[classKey][subject] || 0;
      const minRequired = subjectConfig.minPerWeek;
      const maxAllowed = subjectConfig.maxPerWeek;
      
      if (currentCount < minRequired) {
        // Subject is below minimum requirement
        classSubjectDeficits[classKey].push({
          subject: subject,
          deficit: minRequired - currentCount,
          minPerWeek: minRequired,
          maxPerWeek: maxAllowed,
          maxPerDay: subjectConfig.maxPerDay,
          priority: (minRequired - currentCount) * (minRequired / 5) // Higher priority for larger deficits
        });
      } else if (currentCount > maxAllowed) {
        // Subject is above maximum allowed
        classSubjectOverflow[classKey].push({
          subject: subject,
          overflow: currentCount - maxAllowed,
          minPerWeek: minRequired,
          maxPerWeek: maxAllowed,
          maxPerDay: subjectConfig.maxPerDay,
          priority: (currentCount - maxAllowed) * (maxAllowed / 5) // Higher priority for larger overflow
        });
      } else if (currentCount > minRequired) {
        // Subject is between min and max (has "excess" that could be reduced if needed)
        classSubjectExcess[classKey].push({
          subject: subject,
          excess: currentCount - minRequired,
          minPerWeek: minRequired,
          maxPerWeek: maxAllowed,
          maxPerDay: subjectConfig.maxPerDay
        });
      }
    });
    
    // Sort by priority (highest first)
    classSubjectDeficits[classKey].sort((a, b) => b.priority - a.priority);
    classSubjectOverflow[classKey].sort((a, b) => b.priority - a.priority);
    
    // Find empty slots for this class
    days.forEach(day => {
      const rowIndex = classRowIndices[classKey]?.[day];
      if (rowIndex === undefined) return;
      
      for (let col = 2; col < rosterData[rowIndex].length; col++) {
        // Skip break and lunch
        if (col === breakColumn - 1 || col === lunchColumn - 1) continue;
        
        // Add empty slots to list
        if (!rosterData[rowIndex][col]) {
          emptySlots.push({
            classKey: classKey,
            day: day,
            col: col,
            rowIndex: rowIndex,
            classInfo: classInfo
          });
        }
      }
    });
  });
  
  // Calculate initial statistics
  let initialDeficits = 0;
  let initialOverflow = 0;
  
  Object.values(classSubjectDeficits).forEach(deficits => {
    deficits.forEach(deficit => {
      initialDeficits += deficit.deficit;
    });
  });
  
  Object.values(classSubjectOverflow).forEach(overflows => {
    overflows.forEach(overflow => {
      initialOverflow += overflow.overflow;
    });
  });
  
  console.log(`Analysis complete: Found ${initialDeficits} periods below minimum, ${initialOverflow} periods above maximum, and ${emptySlots.length} empty slots`);
  
  let totalChanges = 0;
  
  // PHASE 1: Fix overflow issues (subjects above maximum)
  console.log("PHASE 1: Reducing subjects that exceed maximum allowed periods...");
  
  // Process each class with overflow issues
  Object.keys(classSubjectOverflow).forEach(classKey => {
    if (classSubjectOverflow[classKey].length === 0) return;
    
    // Extract standard and section
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
    
    // Find class info
    const classInfo = classes.find(c => 
      (c.standard === standardName && c.section === section) ||
      (c.standard + c.section === standardName + section)
    );
    
    if (!classInfo) return;
    
    // Handle each overflow subject
    classSubjectOverflow[classKey].forEach(overflowInfo => {
      const { subject, overflow } = overflowInfo;
      let reducedCount = 0;
      
      // Try each day to find periods to remove
      for (let dayIndex = 0; dayIndex < days.length && reducedCount < overflow; dayIndex++) {
        const day = days[dayIndex];
        const rowIndex = classRowIndices[classKey]?.[day];
        if (rowIndex === undefined) continue;
        
        // Check each period
        for (let col = 2; col < rosterData[rowIndex].length && reducedCount < overflow; col++) {
          // Skip break and lunch
          if (col === breakColumn - 1 || col === lunchColumn - 1) continue;
          
          // Skip empty slots
          if (!rosterData[rowIndex][col]) continue;
          
          // Check if this slot has the overflow subject
          const cellValue = rosterData[rowIndex][col];
          const matches = cellValue.match(/^(.+)\n\((.+)\)$/);
          if (!matches || matches.length < 3) continue;
          
          const currentSubject = matches[1].trim();
          const currentTeacher = matches[2].trim();
          
          // If this is the overflow subject, try to replace it
          if (currentSubject === subject) {
            // Look for a deficit subject that needs more periods
            let replacementSubject = null;
            let replacementConfig = null;
            
            // First try subjects that are below minimum
            if (classSubjectDeficits[classKey] && classSubjectDeficits[classKey].length > 0) {
              // Find a deficit subject with available teachers for this period
              for (const deficitInfo of classSubjectDeficits[classKey]) {
                if (deficitInfo.deficit <= 0) continue;
                
                // Check if this subject already has maximum periods per day
                const currentDayCount = subjectDayCounts[classKey][deficitInfo.subject][day] || 0;
                if (currentDayCount >= deficitInfo.maxPerDay) continue;
                
                // Check if we can find a teacher
                const availableTeachers = (teachersBySubject[deficitInfo.subject] || [])
                  .filter(t => 
                    teacherStandardMap[t.name][classInfo.standard] && 
                    !teacherAssignments[day][col][t.name]
                  );
                
                if (availableTeachers.length > 0) {
                  replacementSubject = deficitInfo.subject;
                  replacementConfig = deficitInfo;
                  break;
                }
              }
            }
            
            // If no deficit subject found, look for an empty slot to move this to
            if (!replacementSubject) {
              // Just remove this period and leave it empty - we'll fill empty slots later
              console.log(`Removing excess ${subject} for ${classKey} on ${day} (period ${col-1})`);
              
              // Remove current assignment
              delete teacherAssignments[day][col][currentTeacher];
              teacherAssignmentCounts[currentTeacher]--;
              classSubjectCounts[classKey][currentSubject]--;
              
              // Clear the cell
              rosterData[rowIndex][col] = '';
              
              // Update subject-day count
              if (subjectDayCounts[classKey][currentSubject][day] > 0) {
                subjectDayCounts[classKey][currentSubject][day]--;
              }
              
              // Update teacher-subject mapping
              if (classSubjectTeacherMap[classKey][currentSubject][currentTeacher] > 0) {
                classSubjectTeacherMap[classKey][currentSubject][currentTeacher]--;
              }
              
              // Add this to empty slots for later processing
              emptySlots.push({
                classKey: classKey,
                day: day,
                col: col,
                rowIndex: rowIndex,
                classInfo: classInfo
              });
              
              reducedCount++;
              totalChanges++;
              
              // Update the deficit list for this class if we've resolved an overflow
              if (reducedCount >= overflow) {
                const overflowIndex = classSubjectOverflow[classKey].findIndex(o => o.subject === subject);
                if (overflowIndex >= 0) {
                  classSubjectOverflow[classKey].splice(overflowIndex, 1);
                }
              }
              
              continue;
            }
            
            // If we found a replacement subject, replace this period
            if (replacementSubject) {
              // First remove current assignment
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
              
              // Try to assign replacement subject
              if (tryAssignTeacher(rowIndex, col, day, classInfo, classKey, replacementSubject, replacementConfig,
                                 teacherAssignments, teacherAssignmentCounts, classSubjectCounts,
                                 subjectDayCounts, classTeacherMap, classSubjectTeacherMap,
                                 teachersBySubject, teacherStandardMap, rosterData)) {
                
                console.log(`Replaced ${currentSubject} with ${replacementSubject} for ${classKey} on ${day} (period ${col-1})`);
                
                reducedCount++;
                totalChanges++;
                
                // Update deficit tracking
                const deficitInfo = classSubjectDeficits[classKey].find(d => d.subject === replacementSubject);
                if (deficitInfo) {
                  deficitInfo.deficit--;
                  if (deficitInfo.deficit <= 0) {
                    // Remove from deficits if it's now met
                    classSubjectDeficits[classKey] = classSubjectDeficits[classKey].filter(d => d.deficit > 0);
                  }
                }
              } else {
                // If replacement failed, just leave it empty
                rosterData[rowIndex][col] = '';
                
                // Add to empty slots for later processing
                emptySlots.push({
                  classKey: classKey,
                  day: day,
                  col: col,
                  rowIndex: rowIndex,
                  classInfo: classInfo
                });
                
                reducedCount++;
                totalChanges++;
              }
              
              // Update the overflow list for this class if we've resolved an overflow
              if (reducedCount >= overflow) {
                const overflowIndex = classSubjectOverflow[classKey].findIndex(o => o.subject === subject);
                if (overflowIndex >= 0) {
                  classSubjectOverflow[classKey].splice(overflowIndex, 1);
                }
              }
            }
          }
        }
      }
    });
  });
  
  // PHASE 2: Fill empty slots with deficit subjects
  console.log("PHASE 2: Filling empty slots with subjects below minimum requirements...");
  
  // Sort empty slots to prioritize classes with highest deficits
  emptySlots.sort((a, b) => {
    const aDeficitTotal = classSubjectDeficits[a.classKey]?.reduce((sum, d) => sum + d.deficit, 0) || 0;
    const bDeficitTotal = classSubjectDeficits[b.classKey]?.reduce((sum, d) => sum + d.deficit, 0) || 0;
    return bDeficitTotal - aDeficitTotal;
  });
  
  // Process empty slots to fill with deficit subjects
  for (const slot of emptySlots) {
    const { classKey, day, col, rowIndex, classInfo } = slot;
    
    // Skip if this class has no deficits
    if (!classSubjectDeficits[classKey] || classSubjectDeficits[classKey].length === 0) continue;
    
    // Get the standard name
    const classKeyComponents = classKey.split('-');
    let standardName;
    
    if (classKeyComponents.length === 2) {
      standardName = classKeyComponents[0];
    } else if (classKeyComponents.length === 3) {
      standardName = classKeyComponents[0] + '-' + classKeyComponents[1];
    } else {
      standardName = classKeyComponents[0];
    }
    
    // Get subject requirements
    const subjects = subjectPeriods[standardName] || {};
    
    // Try each deficit subject for this class
    for (const deficitInfo of classSubjectDeficits[classKey]) {
      const { subject, deficit, maxPerDay } = deficitInfo;
      
      // Skip if already at max per day
      const currentDayCount = subjectDayCounts[classKey][subject][day] || 0;
      if (currentDayCount >= maxPerDay) continue;
      
      // Attempt to assign a teacher
      if (tryAssignTeacher(rowIndex, col, day, classInfo, classKey, subject, deficitInfo, 
                         teacherAssignments, teacherAssignmentCounts, classSubjectCounts, 
                         subjectDayCounts, classTeacherMap, classSubjectTeacherMap, 
                         teachersBySubject, teacherStandardMap, rosterData)) {
        
        console.log(`Filled empty slot for ${classKey} on ${day} (period ${col-1}) with ${subject}`);
        
        // Update deficit tracking
        deficitInfo.deficit--;
        if (deficitInfo.deficit <= 0) {
          // Remove from deficits if it's now met
          classSubjectDeficits[classKey] = classSubjectDeficits[classKey].filter(d => d.deficit > 0);
        }
        
        totalChanges++;
        break;
      }
    }
  }
  
  // PHASE 3: Look for replaceable slots where we can improve deficit subjects
  console.log("PHASE 3: Replacing periods to fix remaining deficit subjects...");
  
  // Process classes with remaining deficits
  Object.keys(classSubjectDeficits).forEach(classKey => {
    // Skip if no remaining deficits
    if (classSubjectDeficits[classKey].length === 0) return;
    
    // Get class info
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
    
    // Get excess subjects that can be replaced
    const excessSubjects = classSubjectExcess[classKey] || [];
    
    // For each deficit subject, try to replace excess subjects
    for (const deficitInfo of classSubjectDeficits[classKey]) {
      if (deficitInfo.deficit <= 0) continue;
      
      const { subject, deficit, maxPerDay } = deficitInfo;
      let filledCount = 0;
      
      // Try each day
      for (let dayIndex = 0; dayIndex < days.length && filledCount < deficit; dayIndex++) {
        const day = days[dayIndex];
        const rowIndex = classRowIndices[classKey]?.[day];
        if (rowIndex === undefined) continue;
        
        // Check if we can add more on this day
        const currentDayCount = subjectDayCounts[classKey][subject][day] || 0;
        if (currentDayCount >= maxPerDay) continue;
        
        // Calculate how many more we can add
        const maxMoreOnThisDay = maxPerDay - currentDayCount;
        
        // Try each period
        for (let col = 2; col < rosterData[rowIndex].length && filledCount < deficit; col++) {
          if (filledCount >= maxMoreOnThisDay) break;
          
          // Skip break, lunch, and empty slots
          if (col === breakColumn - 1 || col === lunchColumn - 1 || !rosterData[rowIndex][col]) continue;
          
          // Get current cell value
          const cellValue = rosterData[rowIndex][col];
          
          // Extract current subject and teacher
          const matches = cellValue.match(/^(.+)\n\((.+)\)$/);
          if (!matches || matches.length < 3) continue;
          
          const currentSubject = matches[1].trim();
          const currentTeacher = matches[2].trim();
          
          // Skip if this is already the deficit subject
          if (currentSubject === subject) continue;
          
          // Check if current subject has excess and can be replaced
          const canReplace = excessSubjects.some(e => e.subject === currentSubject && e.excess > 0);
          if (!canReplace) continue;
          
          // Try to replace with deficit subject
          // First remove current assignment
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
          
          // Try to assign deficit subject
          if (tryAssignTeacher(rowIndex, col, day, classInfo, classKey, subject, deficitInfo,
                             teacherAssignments, teacherAssignmentCounts, classSubjectCounts,
                             subjectDayCounts, classTeacherMap, classSubjectTeacherMap,
                             teachersBySubject, teacherStandardMap, rosterData)) {
            
            console.log(`Replaced ${currentSubject} with ${subject} for ${classKey} on ${day} (period ${col-1})`);
            
            // Update tracking
            filledCount++;
            totalChanges++;
            
            // Update excess tracking
            const excessSubject = excessSubjects.find(e => e.subject === currentSubject);
            if (excessSubject) {
              excessSubject.excess--;
            }
            
          } else {
            // Restore original if couldn't assign
            rosterData[rowIndex][col] = cellValue;
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
    }
  });
  
  // PHASE 4: Special handling for difficult-to-assign subjects like PE and Art
  console.log("PHASE 4: Handling special subjects and remaining empty slots...");
  
  // Define special subjects that need attention
  const specialSubjects = ['Phy Ed', 'Art'];
  
  // Process remaining empty slots for special subjects
  for (const slot of emptySlots) {
    const { classKey, day, col, rowIndex, classInfo } = slot;
    
    // Skip if the slot has been filled
    if (rosterData[rowIndex][col]) continue;
    
    // Get the standard
    const classKeyComponents = classKey.split('-');
    let standardName;
    
    if (classKeyComponents.length === 2) {
      standardName = classKeyComponents[0];
    } else if (classKeyComponents.length === 3) {
      standardName = classKeyComponents[0] + '-' + classKeyComponents[1];
    } else {
      standardName = classKeyComponents[0];
    }
    
    // Get subject requirements
    const subjects = subjectPeriods[standardName] || {};
    
    // Try each special subject
    for (const specialSubject of specialSubjects) {
      if (!subjects[specialSubject]) continue;
      
      const subjectConfig = subjects[specialSubject];
      const currentCount = classSubjectCounts[classKey][specialSubject] || 0;
      
      // Skip if already at max per week or day
      if (currentCount >= subjectConfig.maxPerWeek) continue;
      
      const currentDayCount = subjectDayCounts[classKey][specialSubject][day] || 0;
      if (currentDayCount >= subjectConfig.maxPerDay) continue;
      
      // Find teachers for this subject
      const subjectTeachers = teachersBySubject[specialSubject] || [];
      
      // Try to find a teacher with relaxed constraints
      for (const teacher of subjectTeachers) {
        // Skip if teacher already assigned in this period
        if (teacherAssignments[day][col][teacher.name]) continue;
        
        // Assign with relaxed constraints for special subjects
        rosterData[rowIndex][col] = `${specialSubject}\n(${teacher.name})`;
        teacherAssignments[day][col][teacher.name] = classKey;
        teacherAssignmentCounts[teacher.name]++;
        
        if (!classSubjectCounts[classKey][specialSubject]) {
          classSubjectCounts[classKey][specialSubject] = 0;
        }
        classSubjectCounts[classKey][specialSubject]++;
        
        if (!subjectDayCounts[classKey][specialSubject][day]) {
          subjectDayCounts[classKey][specialSubject][day] = 0;
        }
        subjectDayCounts[classKey][specialSubject][day]++;
        
        // Update teacher tracking
        classTeacherMap[classKey][teacher.name] = true;
        
        // Update subject-teacher mapping
        if (!classSubjectTeacherMap[classKey][specialSubject][teacher.name]) {
          classSubjectTeacherMap[classKey][specialSubject][teacher.name] = 0;
        }
        classSubjectTeacherMap[classKey][specialSubject][teacher.name]++;
        
        console.log(`Filled empty slot for ${classKey} on ${day} (period ${col-1}) with special subject ${specialSubject}`);
        totalChanges++;
        break;
      }
      
      // Break out if slot filled
      if (rosterData[rowIndex][col]) break;
    }
  }
  
  // PHASE 5: Advanced swapping optimization (for advanced and aggressive strategies)
  if (strategy === "advanced" || strategy === "aggressive") {
    console.log("PHASE 5: Performing advanced subject-teacher swap optimization...");
    
    // Maintain a list of potential swaps
    const potentialSwaps = [];
    
    // Process each class to look for potential swaps
    classes.forEach(classInfo => {
      const classKey = classKeyMap[classInfo.standard + classInfo.section];
      if (!classKey) return;
      
      const standardName = classInfo.standard;
      
      // Get remaining deficits and overflow for this class
      const deficits = classSubjectDeficits[classKey] || [];
      const overflows = classSubjectOverflow[classKey] || [];
      
      // Skip if no deficits or overflows to fix
      if (deficits.length === 0 && overflows.length === 0) return;
      
      // Get the subject requirements
      const subjects = subjectPeriods[standardName] || {};
      
      // Find pairs of periods that could be swapped to improve the schedule
      days.forEach(day1 => {
        const rowIndex1 = classRowIndices[classKey]?.[day1];
        if (rowIndex1 === undefined) return;
        
        // For each period in the first day
        for (let col1 = 2; col1 < rosterData[rowIndex1].length; col1++) {
          // Skip break, lunch, and empty slots
          if (col1 === breakColumn - 1 || col1 === lunchColumn - 1 || !rosterData[rowIndex1][col1]) continue;
          
          // Extract first subject and teacher
          const cellValue1 = rosterData[rowIndex1][col1];
          const matches1 = cellValue1.match(/^(.+)\n\((.+)\)$/);
          if (!matches1 || matches1.length < 3) continue;
          
          const subject1 = matches1[1].trim();
          const teacher1 = matches1[2].trim();
          
          // Check if this subject is in overflow
          const isOverflow1 = overflows.some(o => o.subject === subject1);
          
          // Look at each subsequent day for potential swaps
          days.slice(days.indexOf(day1)).forEach(day2 => {
            const rowIndex2 = classRowIndices[classKey]?.[day2];
            if (rowIndex2 === undefined) return;
            
            const startCol = day1 === day2 ? col1 + 1 : 2; // If same day, start from next period
            
            // For each period in the second day
            for (let col2 = startCol; col2 < rosterData[rowIndex2].length; col2++) {
              // Skip break, lunch, and empty slots
              if (col2 === breakColumn - 1 || col2 === lunchColumn - 1 || !rosterData[rowIndex2][col2]) continue;
              
              // Extract second subject and teacher
              const cellValue2 = rosterData[rowIndex2][col2];
              const matches2 = cellValue2.match(/^(.+)\n\((.+)\)$/);
              if (!matches2 || matches2.length < 3) continue;
              
              const subject2 = matches2[1].trim();
              const teacher2 = matches2[2].trim();
              
              // Skip if subjects are the same
              if (subject1 === subject2) continue;
              
              // Check if second subject is in deficit
              const isDeficit2 = deficits.some(d => d.subject === subject2);
              const isOverflow2 = overflows.some(o => o.subject === subject2);
              
              // Calculate current day counts
              const day1Count1 = subjectDayCounts[classKey][subject1][day1] || 0;
              const day2Count2 = subjectDayCounts[classKey][subject2][day2] || 0;
              
              // Calculate what day counts would be after swap
              let newDay1Count1 = day1Count1 - 1;
              let newDay1Count2 = (subjectDayCounts[classKey][subject2][day1] || 0) + 1;
              let newDay2Count1 = (subjectDayCounts[classKey][subject1][day2] || 0) + 1;
              let newDay2Count2 = day2Count2 - 1;
              
              // Check day constraints
              const dayConstraintViolated = 
                newDay1Count2 > (subjects[subject2]?.maxPerDay || 0) ||
                newDay2Count1 > (subjects[subject1]?.maxPerDay || 0);
              
              if (dayConstraintViolated) continue;
              
              // Check teacher availability for the swap
              const teacher1Busy = teacherAssignments[day2][col2][teacher1];
              const teacher2Busy = teacherAssignments[day1][col1][teacher2];
              
              // Skip if teachers are already busy in the swapped slots
              if (teacher1Busy || teacher2Busy) continue;
              
              // Determine swap score/priority
              let swapScore = 0;
              
              if (isOverflow1 && isDeficit2) {
                // Perfect swap: reduces overflow and deficit
                swapScore = 100;
              } else if (isOverflow1 || isDeficit2) {
                // Good swap: addresses either overflow or deficit
                swapScore = 50;
              } else if (isOverflow2) {
                // Counterproductive, would increase overflow
                swapScore = -50;
              } else {
                // Neutral swap, might help distribute subjects
                swapScore = 10;
              }
              
              // Add day distribution bonus - reward spreading subjects across days
              const day1SubjectCount = Object.keys(subjectDayCounts[classKey]).filter(
                sub => subjectDayCounts[classKey][sub][day1] > 0
              ).length;
              
              const day2SubjectCount = Object.keys(subjectDayCounts[classKey]).filter(
                sub => subjectDayCounts[classKey][sub][day2] > 0
              ).length;
              
              // If this swap improves subject distribution across days, increase score
              if (Math.abs(day1SubjectCount - day2SubjectCount) > 
                  Math.abs((day1SubjectCount - 1 + 1) - (day2SubjectCount + 1 - 1))) {
                swapScore += 15;
              }
              
              // Add the potential swap to our list
              potentialSwaps.push({
                classKey,
                day1, col1, rowIndex1, subject1, teacher1,
                day2, col2, rowIndex2, subject2, teacher2,
                score: swapScore
              });
            }
          });
        }
      });
    });
    
    // Sort potential swaps by score (highest first)
    potentialSwaps.sort((a, b) => b.score - a.score);
    
    // Determine how many swaps to apply
    let maxSwapsToApply = strategy === "aggressive" ? 
      Math.min(potentialSwaps.length, 10) : 
      Math.min(potentialSwaps.length, 5);
    
    // Apply the best swaps
    let swapsApplied = 0;
    
    // Keep track of affected slots to avoid conflicting changes
    const affectedSlots = new Set();
    
    for (const swap of potentialSwaps) {
      // Skip if we've reached our limit
      if (swapsApplied >= maxSwapsToApply) break;
      
      // Skip if either slot has already been affected by a previous swap
      const slot1Key = `${swap.day1}-${swap.col1}`;
      const slot2Key = `${swap.day2}-${swap.col2}`;
      
      if (affectedSlots.has(slot1Key) || affectedSlots.has(slot2Key)) continue;
      
      // Apply the swap
      // First remove current assignments
      delete teacherAssignments[swap.day1][swap.col1][swap.teacher1];
      delete teacherAssignments[swap.day2][swap.col2][swap.teacher2];
      
      // Update day counts
      if (subjectDayCounts[swap.classKey][swap.subject1][swap.day1] > 0) {
        subjectDayCounts[swap.classKey][swap.subject1][swap.day1]--;
      }
      if (subjectDayCounts[swap.classKey][swap.subject2][swap.day2] > 0) {
        subjectDayCounts[swap.classKey][swap.subject2][swap.day2]--;
      }
      
      // Swap the cells
      rosterData[swap.rowIndex1][swap.col1] = `${swap.subject2}\n(${swap.teacher2})`;
      rosterData[swap.rowIndex2][swap.col2] = `${swap.subject1}\n(${swap.teacher1})`;
      
      // Update teacher assignments
      teacherAssignments[swap.day1][swap.col1][swap.teacher2] = swap.classKey;
      teacherAssignments[swap.day2][swap.col2][swap.teacher1] = swap.classKey;
      
      // Update day counts
      if (!subjectDayCounts[swap.classKey][swap.subject2][swap.day1]) {
        subjectDayCounts[swap.classKey][swap.subject2][swap.day1] = 0;
      }
      if (!subjectDayCounts[swap.classKey][swap.subject1][swap.day2]) {
        subjectDayCounts[swap.classKey][swap.subject1][swap.day2] = 0;
      }
      
      subjectDayCounts[swap.classKey][swap.subject2][swap.day1]++;
      subjectDayCounts[swap.classKey][swap.subject1][swap.day2]++;
      
      // Mark these slots as affected
      affectedSlots.add(slot1Key);
      affectedSlots.add(slot2Key);
      
      console.log(`Swapped ${swap.subject1} with ${swap.subject2} for ${swap.classKey} between ${swap.day1} period ${swap.col1-1} and ${swap.day2} period ${swap.col2-1}`);
      
      swapsApplied++;
      totalChanges++;
    }
    
    console.log(`Applied ${swapsApplied} subject swaps`);
  }
  
  // PHASE 6: Teacher load balancing (for advanced and aggressive strategies)
  if (strategy === "advanced" || strategy === "aggressive") {
    console.log("PHASE 6: Balancing teacher loads...");
    
    // Calculate teacher load statistics
    const teacherStats = {};
    let totalAssignments = 0;
    let teacherCount = 0;
    
    Object.entries(teacherAssignmentCounts).forEach(([teacher, count]) => {
      teacherStats[teacher] = count;
      totalAssignments += count;
      teacherCount++;
    });
    
    const averageLoad = totalAssignments / teacherCount;
    console.log(`Average teacher load: ${averageLoad.toFixed(2)} periods`);
    
    // Find overloaded and underloaded teachers
    const overloadedTeachers = [];
    const underloadedTeachers = [];
    
    Object.entries(teacherStats).forEach(([teacher, count]) => {
      // Consider a teacher overloaded if they have 20% more than average
      if (count > averageLoad * 1.2) {
        overloadedTeachers.push({
          name: teacher,
          load: count,
          overload: count - averageLoad
        });
      }
      // Consider a teacher underloaded if they have 20% less than average
      else if (count < averageLoad * 0.8) {
        underloadedTeachers.push({
          name: teacher,
          load: count,
          capacity: averageLoad - count
        });
      }
    });
    
    // Sort by overload/capacity
    overloadedTeachers.sort((a, b) => b.overload - a.overload);
    underloadedTeachers.sort((a, b) => b.capacity - a.capacity);
    
    console.log(`Found ${overloadedTeachers.length} overloaded teachers and ${underloadedTeachers.length} underloaded teachers`);
    
    // Try to balance loads by transferring assignments
    let balancingChanges = 0;
    const maxBalancingChanges = strategy === "aggressive" ? 8 : 4;
    
    // Keep track of affected slots to avoid conflicting changes
    const affectedSlots = new Set();
    
    // Process each overloaded teacher
    for (const overloadedTeacher of overloadedTeachers) {
      if (balancingChanges >= maxBalancingChanges) break;
      if (underloadedTeachers.length === 0) break;
      
      const teacherName = overloadedTeacher.name;
      const subject = teachers.find(t => t.name === teacherName)?.subject;
      
      if (!subject) continue;
      
      // Find all periods taught by this teacher
      const teacherPeriods = [];
      
      days.forEach(day => {
        for (let col = 2; col < rosterData[0].length; col++) {
          if (teacherAssignments[day][col][teacherName]) {
            const classKey = teacherAssignments[day][col][teacherName];
            const rowIndex = classRowIndices[classKey]?.[day];
            
            if (rowIndex !== undefined) {
              teacherPeriods.push({
                day, col, rowIndex, classKey
              });
            }
          }
        }
      });
      
      // Try to transfer periods to underloaded teachers
      for (const period of teacherPeriods) {
        if (balancingChanges >= maxBalancingChanges) break;
        
        const { day, col, rowIndex, classKey } = period;
        const slotKey = `${day}-${col}`;
        
        // Skip if already affected
        if (affectedSlots.has(slotKey)) continue;
        
        // Get the class details
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
        
        // Find underloaded teachers who can teach this subject and standard
        const eligibleTeachers = underloadedTeachers.filter(t => {
          const teacher = teachers.find(teacher => teacher.name === t.name);
          return teacher && 
                 teacher.subject === subject && 
                 teacherStandardMap[t.name][standardName] && 
                 !teacherAssignments[day][col][t.name];
        });
        
        if (eligibleTeachers.length === 0) continue;
        
        // Take the most underloaded eligible teacher
        const newTeacher = eligibleTeachers[0];
        
        // Get current cell value
        const cellValue = rosterData[rowIndex][col];
        const matches = cellValue.match(/^(.+)\n\((.+)\)$/);
        
        if (!matches || matches.length < 3) continue;
        
        const currentSubject = matches[1].trim();
        
        // Transfer the period
        delete teacherAssignments[day][col][teacherName];
        teacherAssignments[day][col][newTeacher.name] = classKey;
        
        // Update counts
        teacherAssignmentCounts[teacherName]--;
        teacherAssignmentCounts[newTeacher.name]++;
        
        // Update the cell
        rosterData[rowIndex][col] = `${currentSubject}\n(${newTeacher.name})`;
        
        // Update teacher-subject mapping if needed
        if (classSubjectTeacherMap[classKey][currentSubject][teacherName] > 0) {
          classSubjectTeacherMap[classKey][currentSubject][teacherName]--;
        }
        
        if (!classSubjectTeacherMap[classKey][currentSubject][newTeacher.name]) {
          classSubjectTeacherMap[classKey][currentSubject][newTeacher.name] = 0;
        }
        classSubjectTeacherMap[classKey][currentSubject][newTeacher.name]++;
        
        // Update class-teacher mapping
        classTeacherMap[classKey][newTeacher.name] = true;
        
        // Mark this slot as affected
        affectedSlots.add(slotKey);
        
        console.log(`Transferred ${currentSubject} from ${teacherName} to ${newTeacher.name} for ${classKey} on ${day} period ${col-1}`);
        
        balancingChanges++;
        totalChanges++;
        
        // Update teacher loads in our tracking structures
        overloadedTeacher.load--;
        overloadedTeacher.overload--;
        newTeacher.load++;
        newTeacher.capacity--;
        
        // Remove the underloaded teacher if they're now balanced
        if (newTeacher.capacity <= 0) {
          underloadedTeachers.splice(underloadedTeachers.indexOf(newTeacher), 1);
        }
      }
    }
    
    console.log(`Made ${balancingChanges} teacher balancing changes`);
  }
  
  // Calculate final statistics for reporting
  let finalDeficits = 0;
  let finalOverflow = 0;
  
  // Recalculate deficits and overflow for final report
  classes.forEach(classInfo => {
    const classKey = classKeyMap[classInfo.standard + classInfo.section];
    const standard = classInfo.standard;
    const subjects = subjectPeriods[standard] || {};
    
    Object.keys(subjects).forEach(subject => {
      const currentCount = classSubjectCounts[classKey][subject] || 0;
      const minRequired = subjects[subject].minPerWeek;
      const maxAllowed = subjects[subject].maxPerWeek;
      
      if (currentCount < minRequired) {
        finalDeficits += (minRequired - currentCount);
      } else if (currentCount > maxAllowed) {
        finalOverflow += (currentCount - maxAllowed);
      }
    });
  });
  
  // Calculate a schedule score - higher is better
  const minMaxPenalty = (finalDeficits * 10) + (finalOverflow * 5);
  
  // Calculate teacher load imbalance
  let totalLoad = 0;
  let teacherLoadVariance = 0;
  let teacherCount = Object.keys(teacherAssignmentCounts).length;
  
  Object.values(teacherAssignmentCounts).forEach(count => {
    totalLoad += count;
  });
  
  const averageLoad = totalLoad / teacherCount;
  
  Object.values(teacherAssignmentCounts).forEach(count => {
    teacherLoadVariance += Math.pow(count - averageLoad, 2);
  });
  
  const teacherImbalancePenalty = Math.sqrt(teacherLoadVariance / teacherCount) * 2;
  
  // Calculate schedule score (higher is better)
  const scheduleScore = 1000 - minMaxPenalty - teacherImbalancePenalty;
  
  console.log(`Iteration results: Made ${totalChanges} changes, ${finalDeficits} periods below minimum, ${finalOverflow} periods above maximum remain. Schedule score: ${scheduleScore.toFixed(2)}`);
  
  return {
    rosterData,
    score: scheduleScore,
    changesCount: totalChanges
  };
};

/**
 * Helper function to try to assign a teacher for a subject in a specific slot
 */
function tryAssignTeacher(
  rowIndex, col, day, classInfo, classKey, subject, subjectConfig,
  teacherAssignments, teacherAssignmentCounts, classSubjectCounts,
  subjectDayCounts, classTeacherMap, classSubjectTeacherMap,
  teachersBySubject, teacherStandardMap, rosterData
) {
  // Maximum number of different teachers per class
  const MAX_TEACHERS_PER_CLASS = 8;
  
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
    if (teacherStandardMap[teacher.name][classInfo.standard] === true && 
        !teacherAssignments[day][col][teacher.name]) {
      
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
