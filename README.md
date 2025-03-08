# Rosterio - School Timetable Generator

A Google Apps Script application for generating and managing school timetables.

## Project Structure

The codebase is organized into the following modules:

- **Code.gs** - Main entry point, menu setup, and sheet initialization
- **rosterGenerator.gs** - Core roster generation function that orchestrates the process
- **dataLoader.gs** - Functions for loading data from sheets
- **rosterCreator.gs** - Functions for creating and formatting the roster
- **conflictChecker.gs** - Functions for checking and highlighting conflicts
- **schedulingHelpers.gs** - Helper functions for roster scheduling
- **sampleData.gs** - Functions for populating sample data
- **sheetInitializer.gs** - Functions for initializing sheet structures
- **teacherView.gs** - Functions for teacher-specific views
- **rosterFilters.gs** - Functions for filtering the roster

## Key Functions

- `initializeSheets()` - Creates all necessary sheets with the required structure
- `generateRoster()` - Main function to generate the timetable
- `populateSampleData()` - Populates sheets with sample data for testing
- `clearAllData()` - Clears all data from sheets
- `checkTeacherConflicts()` - Checks for and highlights scheduling conflicts

## Sheet Structure

The application uses the following sheets:

1. **Teacher-Subjects** - Maps teachers to subjects and standards they can teach
2. **Class-Configuration** - Defines standards and sections
3. **Subject-Periods** - Defines subject period requirements
4. **Periods-Configuration** - Defines school timing configuration
5. **Generated-Roster** - Contains the generated timetable

## How to Use

1. Run "Initialize Sheets" to set up the required structure
2. Optionally run "Populate Sample Data" to load test data
3. Configure your data in the various sheets
4. Run "Generate Roster" to create the timetable
5. View and resolve any conflicts highlighted in red 