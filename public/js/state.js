// js/state.js

// --- Core Data Collections ---
// These are loaded from localStorage and represent the main data of the application.
export let departments = JSON.parse(localStorage.getItem('departments')) || [];
export let roles = JSON.parse(localStorage.getItem('roles')) || [];
export let users = JSON.parse(localStorage.getItem('users')) || [];
export let shiftTemplates = JSON.parse(localStorage.getItem('shiftTemplates')) || [];
export let scheduleAssignments = JSON.parse(localStorage.getItem('scheduleAssignments')) || {};
export let events = JSON.parse(localStorage.getItem('events')) || [];
export let restaurantSettings = JSON.parse(localStorage.getItem('restaurantSettings')) || {};

// --- Save Functions ---
// Functions to persist the core data collections to localStorage and Firestore.
export function saveDepartments() {
    localStorage.setItem('departments', JSON.stringify(departments));
}
export function saveRoles() {
    localStorage.setItem('roles', JSON.stringify(roles));
}
export function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}
export function saveShiftTemplates() {
    localStorage.setItem('shiftTemplates', JSON.stringify(shiftTemplates));
}
export function saveScheduleAssignments() {
    localStorage.setItem('scheduleAssignments', JSON.stringify(scheduleAssignments));
}
export function saveEvents() {
    localStorage.setItem('events', JSON.stringify(events));
}
export function saveRestaurantSettings() {
    localStorage.setItem('restaurantSettings', JSON.stringify(restaurantSettings));
}

/**
 * Saves the scheduler's currently viewed date to local storage.
 */
export function saveCurrentViewDate() {
    localStorage.setItem('schedulerCurrentViewDate', currentViewDate.toISOString());
}


// --- Application UI State ---
// These variables manage the current state of the user interface.
const savedDate = localStorage.getItem('schedulerCurrentViewDate');
export let currentViewDate = savedDate ? new Date(savedDate) : new Date();

export let weekStartsOnMonday = true;
export let selectedDepartmentIds = ['all'];
export let copiedShiftDetails = null;
export let draggedShiftDetails = null;
export let draggedEmployeeRowInfo = null;
export let draggedShiftTemplateInfo = null;
export let draggedRoleInfo = null;
export let draggedDepartmentInfo = null;
export let currentAssignMode = 'template';
export let editingAssignmentDetails = null;
export let copyConflictQueue = [];
export let currentConflictResolver = null;
export let tempEventSpecificDates = [];
export let clearWeekContext = { usersToClear: [], datesToClear: [] };


// --- History (Undo/Redo) State ---
// This is now managed privately within the history.js module.
// We no longer export these from the global state.
// export let historyStack = [];
// export let historyPointer = -1;

// --- Constants ---
export const DEFAULT_VACATION_DAYS = 0;
export const EVENT_COLORS = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff'];
export const terminationReasons = [
    "Resigned",
    "Terminated",
    "Contract Ended",
    "Retired",
    "Other"
];