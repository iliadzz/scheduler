// js/i18n.js
// This file centralizes all logic related to language and translations, making it easy to add more languages or change text in the future.
/**
 * The main object holding all translation strings for different languages.
 */
export const translations = {
    en: {
        appTitle: "Las Tres Amigas",
        navScheduler: '<i class="fas fa-calendar-alt"></i> Scheduler',
        navEmployees: '<i class="fas fa-users"></i> Employees',
        navRoles: '<i class="fas fa-user-tag"></i> Roles/Positions',
        navDepartments: '<i class="fas fa-building"></i> Departments',
        navShifts: '<i class="fas fa-clock"></i> Shift Templates',
        navSettings: '<i class="fas fa-cog"></i> Settings',
        navExit: '<i class="fas fa-sign-out-alt"></i> Log Out',
        btnThisWeek: '<i class="fas fa-calendar-day"></i> This Week',
        btnPrevWeek: '<i class="fas fa-arrow-left"></i> Prev',
        btnNextWeek: 'Next <i class="fas fa-arrow-right"></i>',
        optAllDepts: 'All Departments',
        optSelectDept: '-- Select Department --',
        optGeneral: 'General',
        optNoDept: 'No Department Assigned',
        undo: '<i class="fas fa-undo"></i>',
        redo: '<i class="fas fa-redo"></i>',
        btnPrint: '<i class="fas fa-print"></i>',
        btnManageEvents: 'Events',
        btnClearWeek: '<i class="fas fa-calendar-times"></i> Clear',
        btnClearCopied: '<i class="fas fa-times-circle"></i> Clear Copied Shift',
        lblLanguage: 'Language:',
        headerEmployee: 'Employee <span class="hours-header">(Hrs)</span>',
        dayMon: 'Mon', dayTue: 'Tue', dayWed: 'Wed', dayThu: 'Thu', dayFri: 'Fri', daySat: 'Sat', daySun: 'Sun',
        modalAssignTitle: 'Assign Shift / Time Off',
        lblCopied: 'Copied:',
        btnPasteHere: '<i class="fas fa-paste"></i> Paste Here',
        btnAssignNew: 'Assign New Instead',
        lblAssignmentType: 'Assignment Type:',
        btnFromTemplate: 'From Template',
        btnCustomShift: 'Custom Shift',
        btnTimeOff: 'Time Off',
        lblFilterDept: 'Filter Department:',
        lblSelectShiftTemplate: 'Select Shift Template:',
        lblStartTime: 'Start Time:',
        lblEndTime: 'End Time:',
        lblSaveAsTemplate: 'Save as new template?',
        lblTemplateName: 'Template Name:',
        phTemplateName: 'e.g., Custom Lunch Shift',
        lblReason: 'Reason:',
        optVacation: 'Vacation',
        optSick: 'Sick Leave',
        optPersonal: 'Personal Day',
        optUnpaid: 'Unpaid Time Off',
        lblAssignRole: 'Assign Role/Position:',
        btnAssignShift: 'Assign Shift',
        modalConflictTitle: 'Schedule Conflict',
        btnOverwrite: 'Overwrite',
        btnMerge: 'Merge',
        btnKeepExisting: 'Keep Existing',
        modalCopyEmployeeDesc: "Select any date within the source week you want to copy the schedule from.",
        lblSourceWeek: 'Source Week:',
        btnCopySchedule: 'Copy Schedule',
        modalManageEventsTitle: 'Manage Events',
        lblDate: 'Date:',
        lblEventName: 'Event Name:',
        phEventName: 'e.g., Independence Day Parade',
        btnAddEvent: '<i class="fas fa-plus"></i> Add Event',
        hdrScheduledEvents: 'Scheduled Events:',
        headerManageEmployees: '<i class="fas fa-users"></i> Manage Employees',
        hdrAddEmployee: 'Add New Employee',
        hdrEditEmployee: 'Edit Employee',
        hdrPersonalDetails: "Personal Details",
        lblFirstName: "First Name:", phFirstName: "e.g., Jane",
        lblLastName: "Last Name:", phLastName: "e.g., Doe",
        lblDisplayName: "Display Name:", phDisplayName: "e.g., Jane D.",
        lblDob: "Date of Birth:",
        lblTelephone: "Telephone:",
        lblEmail: "E-mail:", phEmail: "e.g., jane.d@email.com",
        hdrAddress: "Address",
        lblAddress1: "Address 1:",
        lblAddress2: "Address 2:",
        lblCity: "City:",
        lblStateDept: "Department:",
        lblCountry: "Country:",
        hdrEmploymentDetails: "Employment Details",
        lblDept: "Department:",
        lblStartDate: "Start Date:",
        lblVacationDays: "Vacation Days:",
        lblTermDate: "Termination Date:",
        lblReasonLeaving: "Reason for Leaving:",
        optActiveEmployee: "-- Active Employee --",
        btnAddEmployee: "Add Employee",
        btnCancelEdit: "Cancel Edit",
        lblFilterByDept: "Filter by Department:",
        hdrCurrentEmployees: "Current Employees:",
        headerManageRoles: '<i class="fas fa-user-tag"></i> Manage Roles/Positions',
        lblRoleName: "Role Name:", phRoleName: "e.g., Server, Chef",
        lblRoleColor: "Role Color:",
        btnAddRole: "Add Role",
        hdrAvailableRoles: "Available Roles:",
        headerManageDepts: '<i class="fas fa-building"></i> Manage Departments',
        lblDeptName: "Department Name:", phDeptName: "e.g., Front of House, Kitchen",
        phDeptAbbr: "e.g., FOH, BOH",
        btnAddDept: "Add Department",
        hdrAvailableDepts: "Available Departments:",
        headerManageShiftTemplates: '<i class="fas fa-clock"></i> Manage Shift Templates',
        phShiftTemplateName: "e.g., Morning Shift",
        btnAddShiftTemplate: "Add Shift Template",
        headerSettings: '<i class="fas fa-cog"></i> Application Settings',
        hdrDisplaySettings: "Display Settings",
        headerRestaurantHours: '<i class="fas fa-concierge-bell"></i> Restaurant &amp; Meal Hours',
        hdrDailyHours: "Restaurant & Meal Hours",
        hdrMinCoverage: "Minimum Coverage Requirements",
        lblMinCoverageHelp: "Set the minimum staff for key periods. This determines the color-coding in the Coverage Summary.",
        hdrMealCoverageCalc: "Meal Coverage Calculation",
        lblMealCoverageDur: "Count employee if they work at least:",
        opt30mins: "30 minutes",
        opt1hour: "1 hour",
        opt90mins: "90 minutes",
        lblDuringMealPeriod: " during a meal period.",
        btnSaveChanges: '<i class="fas fa-save"></i> Save Changes',
        headerDataMgmt: '<i class="fas fa-database"></i> Data Management',
        hdrFullBackup: "Full Backup",
        btnBackupAll: '<i class="fas fa-download"></i> Backup All Data',
        lblFullBackupHelp: "Saves a single file with all your settings and schedules.",
        hdrSelectiveBackup: "Selective Backup",
        lblCategory: "Category:",
        optSchedules: "Schedules",
        optEmployees: "Employees",
        optRoles: "Roles",
        optDepts: "Departments",
        optShiftTemplates: "Shift Templates",
        optAppSettings: "Restaurant Settings",
        btnBackupSelected: '<i class="fas fa-download"></i> Backup Selected',
        hdrRestore: "Restore from File",
        btnChooseFile: "Choose Restore File...",
        lblNoFileChosen: "No file chosen.",
        lblRestoreHelp: "<strong>Important:</strong> Restoring will overwrite data. The app will detect if it's a full or partial backup and ask for confirmation.",
        hdrDangerZone: "Danger Zone",
        btnClearCache: '<i class="fas fa-trash-alt"></i> Clear Cache & Log Out',
        lblClearAllHelp: "Clears the application's local cache in your browser. You will be logged out, and data will be re-synced from the cloud upon your next login.",
        alertDeptNameEmpty: 'Department name and abbreviation cannot be empty.',
        confirmDeleteDept: 'Are you sure you want to delete this department? This will also remove it from any users, roles, or shifts assigned to it.',
        headerCoverageSummary: "Coverage Summary",
        lblOpen: "Open:", lblLunch: "Lunch:", lblDinner: "Dinner:", lblClose: "Close:",
        // --- THIS IS THE FIX ---
        lblMinOp: "MIN OP:", 
        lblMinLunch: "MIN AL:", 
        lblMinDinner: "MIN CE:", 
        lblMinClose: "MIN CL:",
        optDefault: "Default",
        modalClearWeekTitle: "Confirm Schedule Deletion",
        btnClearShiftsOnly: "Clear Shifts Only",
        btnClearEverything: "Clear Everything",
        btnCancel: "Cancel",
    },
    es: {
        // ... Spanish translations remain the same
    }
};

/**
 * Gets a translated string for a given key. Falls back to English if the key is not found.
 * @param {string} key - The key of the string to translate.
 * @returns {string} The translated string.
 */
export function getTranslatedString(key) {
    const lang = localStorage.getItem('selectedLanguage') || 'en';
    return (translations[lang] && translations[lang][key]) ? translations[lang][key] : (translations.en[key] || key);
}

/**
 * Applies translations to all elements with a 'data-lang-key' attribute.
 * NOTE: This function only translates static text. Dynamically generated components
 * must be re-rendered by their respective modules to apply language changes.
 * @param {string} lang - The language to switch to (e.g., 'en', 'es').
 */
export function setLanguage(lang) {
    localStorage.setItem('selectedLanguage', lang);

    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        const translation = getTranslatedString(key);

        if (translation) {
            // Handle placeholders
            if (element.placeholder !== undefined) {
                element.placeholder = translation.replace(/<[^>]*>?/gm, ''); // Strip HTML for placeholders
            }

            // Handle elements that can contain HTML
            const elementTag = element.tagName.toLowerCase();
            if (['button', 'h1', 'h2', 'h3', 'h4', 'h5', 'p', 'span', 'label', 'small', 'option', 'strong'].includes(elementTag) || element.classList.contains('header-employee') || element.classList.contains('tab-link')) {
                // If translation contains HTML tags, use innerHTML. Otherwise, use textContent for security.
                if (translation.includes('<')) {
                    element.innerHTML = translation;
                } else {
                    element.textContent = translation;
                }
            }
        }
    });

    // It is the responsibility of the calling function in main.js
    // to re-render dynamic components like the schedule or department lists.
}