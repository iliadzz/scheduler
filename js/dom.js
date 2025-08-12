// js/dom.js

// General App & Navigation
export const languageSelect = document.getElementById('language-select');
export const tabLinks = document.querySelectorAll('.tab-link');
export const tabContents = document.querySelectorAll('.tab-content');
export const exitBtn = document.getElementById('exit-btn');

// Department Tab
export const departmentNameInput = document.getElementById('department-name');
export const departmentAbbreviationInput = document.getElementById('department-abbreviation');
export const addDepartmentBtn = document.getElementById('add-department-btn');
export const departmentListUl = document.getElementById('department-list');
export const editingDepartmentIdInput = document.getElementById('editing-department-id');
export const cancelEditDepartmentBtn = document.getElementById('cancel-edit-department-btn');

// Roles Tab
export const roleNameInput = document.getElementById('role-name');
export const roleColorInput = document.getElementById('role-color');
export const roleColorPalette = document.getElementById('role-color-palette');
export const roleColorPreview = document.getElementById('role-color-preview');
export const roleDepartmentSelect = document.getElementById('role-department');
export const addRoleBtn = document.getElementById('add-role-btn');
export const roleListUl = document.getElementById('role-list');
export const editingRoleIdInput = document.getElementById('editing-role-id');
export const cancelEditRoleBtn = document.getElementById('cancel-edit-role-btn');

// Employees Tab & Modal
export const employeeStatusSelect = document.getElementById('employee-status');
export const terminationDetails = document.getElementById('termination-details');
export const showInactiveEmployeesCheckbox = document.getElementById('show-inactive-employees');
export const showAddEmployeeModalBtn = document.getElementById('show-add-employee-modal-btn');
export const employeeListUl = document.getElementById('employee-list');
export const employeeListFilter = document.getElementById('employee-list-filter');
export const employeeFormModal = document.getElementById('employee-form-modal');
export const employeeModalTitle = document.getElementById('employee-modal-title');
export const editingEmployeeIdInput = document.getElementById('editing-employee-id');
export const addEmployeeBtn = document.getElementById('add-employee-btn');
export const cancelEditEmployeeBtn = document.getElementById('cancel-edit-employee-btn');
export const employeeFirstNameInput = document.getElementById('employee-first-name');
export const employeeLastNameInput = document.getElementById('employee-last-name');
export const employeeDisplayNameInput = document.getElementById('employee-display-name');
export const employeeDobInput = document.getElementById('employee-dob');
export const employeePhoneCodeInput = document.getElementById('employee-phone-code');
export const employeePhoneNumberInput = document.getElementById('employee-phone-number');
export const employeeEmailInput = document.getElementById('employee-email');
export const employeeAddress1Input = document.getElementById('employee-address-1');
export const employeeAddress2Input = document.getElementById('employee-address-2');
export const employeeCityInput = document.getElementById('employee-city');
export const employeeDepartmentAddressInput = document.getElementById('employee-department-address');
export const employeeCountryInput = document.getElementById('employee-country');
export const employeeDepartmentSelect = document.getElementById('employee-department');
export const employeeStartDateInput = document.getElementById('employee-start-date');
export const employeeTerminationDateInput = document.getElementById('employee-termination-date');
export const employeeTerminationReasonInput = document.getElementById('employee-termination-reason');
export const employeeVacationBalanceInput = document.getElementById('employee-vacation-balance');

// Shift Templates Tab
export const shiftTemplateNameInput = document.getElementById('shift-template-name');
export const shiftTemplateDepartmentSelect = document.getElementById('shift-template-department');
export const shiftTemplateStartHourSelect = document.getElementById('shift-template-start-hour');
export const shiftTemplateStartMinuteSelect = document.getElementById('shift-template-start-minute');
export const shiftTemplateEndHourSelect = document.getElementById('shift-template-end-hour');
export const shiftTemplateEndMinuteSelect = document.getElementById('shift-template-end-minute');
export const addShiftTemplateBtn = document.getElementById('add-shift-template-btn');
export const shiftTemplateContainer = document.getElementById('shift-template-container');
export const editingShiftTemplateIdInput = document.getElementById('editing-shift-template-id');
export const cancelEditShiftTemplateBtn = document.getElementById('cancel-edit-shift-template-btn');
export const shiftTemplateListFilter = document.getElementById('shift-template-list-filter');

// Scheduler View
export const prevWeekBtn = document.getElementById('prev-week-btn');
export const thisWeekBtn = document.getElementById('this-week-btn');
export const nextWeekBtn = document.getElementById('next-week-btn');
export const currentWeekDisplay = document.getElementById('current-week-display');
export const weekPickerAlt = document.getElementById('week-picker-alt');
export const scheduleGridBody = document.getElementById('schedule-grid-body');
export const departmentFilterMultiselect = document.getElementById('department-filter-multiselect');
export const departmentFilterButton = document.getElementById('department-filter-button');
export const departmentFilterText = document.getElementById('department-filter-text');
export const departmentCheckboxesContainer = document.getElementById('department-checkboxes');
export const printScheduleBtn = document.getElementById('print-schedule-btn');

// Scheduler Actions (Copy/Clear Week, etc.)
export const copyFromWeekPicker = document.getElementById('copy-from-week-picker');
export const executeCopyWeekBtn = document.getElementById('execute-copy-week-btn');
export const clearCurrentWeekBtn = document.getElementById('clear-current-week-btn');
export const clearCopiedShiftBtn = document.getElementById('clear-copied-shift-btn');
export const manageEventsBtn = document.getElementById('manage-events-btn');

// Assign Shift / Time Off Modal
export const assignShiftModal = document.getElementById('assign-shift-modal');
export const assignModalTitle = document.getElementById('assign-modal-title');
export const assignModalEmployeeIdInput = document.getElementById('assign-modal-employee-id');
export const assignModalDateInput = document.getElementById('assign-modal-date');
export const assignModalPasteOptionDiv = document.getElementById('assign-modal-paste-option');
export const copiedShiftDetailsText = document.getElementById('copied-shift-details-text');
export const pasteCopiedShiftBtn = document.getElementById('paste-copied-shift-btn');
export const assignNewShiftInsteadBtn = document.getElementById('assign-new-shift-instead-btn');
export const assignTypeChoiceDiv = document.getElementById('assign-type-choice');
export const assignTypeTemplateBtn = document.getElementById('assign-type-template-btn');
export const assignTypeCustomBtn = document.getElementById('assign-type-custom-btn');
export const assignTypeTimeOffBtn = document.getElementById('assign-type-timeoff-btn');
export const assignModalDeptFilterGroup = document.getElementById('assign-modal-dept-filter-group');
export const assignModalDepartmentFilter = document.getElementById('assign-modal-department-filter');
export const assignModalTemplateFieldsDiv = document.getElementById('assign-modal-template-fields');
export const assignModalShiftTemplateSelect = document.getElementById('assign-modal-shift-template');
export const assignModalCustomFieldsDiv = document.getElementById('assign-modal-custom-fields');
export const customShiftStartHourSelect = document.getElementById('custom-shift-start-hour');
export const customShiftStartMinuteSelect = document.getElementById('custom-shift-start-minute');
export const customShiftEndHourSelect = document.getElementById('custom-shift-end-hour');
export const customShiftEndMinuteSelect = document.getElementById('custom-shift-end-minute');
export const saveCustomAsTemplateSection = document.getElementById('save-custom-as-template-section');
export const saveAsTemplateCheckbox = document.getElementById('save-as-template-checkbox');
export const newTemplateFieldsDiv = document.getElementById('new-template-fields');
export const newTemplateNameInput = document.getElementById('new-template-name');
export const assignModalTimeOffFieldsDiv = document.getElementById('assign-modal-timeoff-fields');
export const assignModalTimeOffReasonSelect = document.getElementById('assign-modal-timeoff-reason');
export const assignModalRoleGroup = document.getElementById('assign-modal-role-group');
export const assignModalRoleSelect = document.getElementById('assign-modal-role');
export const saveAssignedShiftBtn = document.getElementById('save-assigned-shift-btn');

// Copy Conflict Modal
export const copyConflictModal = document.getElementById('copy-conflict-modal');
export const copyConflictText = document.getElementById('copy-conflict-text');
export const conflictOverwriteBtn = document.getElementById('conflict-overwrite-btn');
export const conflictMergeBtn = document.getElementById('conflict-merge-btn');
export const conflictIgnoreBtn = document.getElementById('conflict-ignore-btn');

// Copy Employee Week Modal
export const copyEmployeeWeekModal = document.getElementById('copy-employee-week-modal');
export const copyEmployeeModalTitle = document.getElementById('copy-employee-modal-title');
export const copyEmployeeFromDateInput = document.getElementById('copy-employee-from-date');
export const copyEmployeeModalUserIdInput = document.getElementById('copy-employee-modal-user-id');
export const executeCopyEmployeeBtn = document.getElementById('execute-copy-employee-btn');

// Events Modal
export const eventsModal = document.getElementById('events-modal');
export const editingEventIdInput = document.getElementById('editing-event-id');
export const eventNameInput = document.getElementById('event-name');
export const eventColorInput = document.getElementById('event-color');
export const eventColorPalette = document.getElementById('event-color-palette');
export const eventRecurrenceRuleSelect = document.getElementById('event-recurrence-rule');
export const eventRecurrenceOptionsSection = document.getElementById('event-recurrence-options');
export const eventStartDateInput = document.getElementById('event-start-date');
export const eventRecurrenceCountInput = document.getElementById('event-recurrence-count');
export const eventSpecificDatesSection = document.getElementById('event-specific-dates-section');
export const eventSpecificDateInput = document.getElementById('event-specific-date');
export const addEventSpecificDateBtn = document.getElementById('add-event-specific-date-btn');
export const eventSpecificDatesListUl = document.getElementById('event-specific-dates-list');
export const addEventBtn = document.getElementById('add-event-btn');
export const cancelEditEventBtn = document.getElementById('cancel-edit-event-btn');
export const eventListUl = document.getElementById('event-list-ul');

// Clear Week Confirmation Modal
export const clearWeekConfirmModal = document.getElementById('clear-week-confirm-modal');
export const clearWeekConfirmText = document.getElementById('clear-week-confirm-text');
export const clearShiftsOnlyBtn = document.getElementById('clear-shifts-only-btn');
export const clearAllAssignmentsBtn = document.getElementById('clear-all-assignments-btn');
export const clearCancelBtn = document.getElementById('clear-cancel-btn');

// Settings Tab
export const restaurantHoursGrid = document.getElementById('restaurant-hours-grid');
export const minCoverageGridContainer = document.getElementById('min-coverage-grid-container');
export const minCoverageDepartmentSelect = document.getElementById('min-coverage-department-select');
export const minMealCoverageDurationSelect = document.getElementById('min-meal-coverage-duration');
export const saveRestaurantSettingsBtn = document.getElementById('save-restaurant-settings-btn');
export const backupAllDataBtn = document.getElementById('backup-all-data-btn');
export const backupCategorySelect = document.getElementById('backup-category-select');
export const backupCategoryBtn = document.getElementById('backup-category-btn');
export const restoreDataInput = document.getElementById('restore-data-input');
export const restoreFileNameDisplay = document.getElementById('restore-file-name');
export const clearAllDataBtn = document.getElementById('clear-all-data-btn');