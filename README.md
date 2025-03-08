# Roster App - School Timetable Generator

A Google Apps Script application for generating and managing school timetables.

## Project Structure

The codebase is organized into logical modules simulating a directory structure:

### Core Application
- **app.gs** - Main application file with constants and exposed functions

### Initialization Module (init/)
- **init.core.gs** - Core initialization functions
- **init.sheets.gs** - Sheet creation and setup
- **init.data.gs** - Sample data population

### Data Module (data/)
- **data.loader.gs** - Functions for loading data from sheets

### Roster Management (roster/)
- **roster.generator.gs** - Core roster generation function
- **roster.creator.gs** - Roster creation and formatting
- **roster.helpers.gs** - Scheduling helper functions
- **roster.conflicts.gs** - Conflict checking and highlighting
- **roster.filters.gs** - Roster filtering functionality

### User Interface (ui/)
- **ui.menu.gs** - Menu creation and event handling

### Utilities (utils/)
- **utils.common.gs** - Common utility functions

## Namespace Structure

All code is organized into namespaces to prevent global namespace pollution:

- `Init` - Initialization functions
- `Data` - Data loading functions
- `Roster` - Roster management functions
  - `Roster.Creator` - Roster creation functions
  - `Roster.Conflicts` - Conflict management
  - `Roster.Helpers` - Scheduling helpers
  - `Roster.Filters` - Filtering functions
- `UI` - User interface functions
- `Utils` - Utility functions

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

## Development Notes

- Each module has its own file(s) for better code organization
- Namespaces prevent function name conflicts
- The app.gs file provides the global API functions that are exposed to the UI
- No function is defined directly in the global scope except necessary entry points 