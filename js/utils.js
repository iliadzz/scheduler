//A module for generic, reusable helper functions that don't belong to a specific feature. This will include functions like generateId, formatDate, getContrastColor, and
// createItemActionButtons.

// js/utils.js

import { currentViewDate } from './state.js';
import { copyFromWeekPicker } from './dom.js';

/**
 * Generates a unique ID string with a given prefix.
 * @param {string} [prefix='id'] - The prefix for the ID.
 * @returns {string} A unique ID.
 */
export function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formats a Date object into 'YYYY-MM-DD' string format.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
export function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) return "Invalid Date";
    return date.toISOString().split('T')[0];
}

/**
 * Calculates the start and end dates of the week containing the given date.
 * @param {Date} date - A date within the desired week.
 * @returns {{start: Date, end: Date}} An object with the start and end dates of the week.
 */
export function getWeekRange(date) {
    const d = new Date(date);
    // Assumes week starts on Monday, as per original logic
    let weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayOfWeek = d.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + diff);

    let weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return { start: weekStart, end: weekEnd };
}

/**
 * Gets an array of all 7 Date objects for a given week start date.
 * @param {Date} startDate - The starting date of the week.
 * @returns {Date[]} An array of 7 Date objects.
 */
export function getDatesOfWeek(startDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    for (let i = 0; i < 7; i++) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

/**
 * Formats a time string for display (currently just returns the string).
 * @param {string} timeStr - The time string (e.g., '09:00').
 * @returns {string} The formatted time string.
 */
export function formatTimeForDisplay(timeStr) {
    if (!timeStr) return '';
    return timeStr;
}

/**
 * Formats an hour and minute into 'HH:MM' string format.
 * @param {number|string} hour - The hour.
 * @param {number|string} minute - The minute.
 * @returns {string} The formatted 'HH:MM' string.
 */
export function formatTimeToHHMM(hour, minute) {
    const h = String(hour).padStart(2, '0');
    const m = String(minute).padStart(2, '0');
    return `${h}:${m}`;
}

/**
 * Calculates the duration in hours between two time strings.
 * @param {string} startTime - The start time ('HH:MM').
 * @param {string} endTime - The end time ('HH:MM').
 * @returns {number} The duration in hours.
 */
export function calculateShiftDuration(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    let diff = (end - start) / (1000 * 60 * 60);
    if (diff < 0) diff += 24; // Handles overnight shifts
    return diff;
}

/**
 * Populates hour and minute select elements with time options.
 * @param {HTMLSelectElement} hourSelect - The select element for hours.
 * @param {HTMLSelectElement} minuteSelect - The select element for minutes.
 * @param {string} [defaultHour='09'] - The default hour to select.
 * @param {string} [defaultMinute='00'] - The default minute to select.
 */
export function populateTimeSelectsForElements(hourSelect, minuteSelect, defaultHour = "09", defaultMinute = "00") {
    if (!hourSelect || !minuteSelect) return;
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = ['00', '15', '30', '45'];
    hourSelect.innerHTML = '';
    hours.forEach(hour => {
        const option = document.createElement('option');
        option.value = hour;
        option.textContent = hour;
        hourSelect.appendChild(option);
    });
    minuteSelect.innerHTML = '';
    minutes.forEach(minute => {
        const option = document.createElement('option');
        option.value = minute;
        option.textContent = minute;
        minuteSelect.appendChild(option);
    });
    hourSelect.value = defaultHour;
    minuteSelect.value = defaultMinute;
}

/**
 * Determines whether to use light or dark text based on a background color's brightness.
 * @param {string} hexColor - The background color in hex format (e.g., '#RRGGBB').
 * @returns {string} Either '#1C3A4D' (dark) or '#FFFFFF' (light).
 */
export function getContrastColor(hexColor) {
    if (!hexColor || hexColor.length < 7) return '#1C3A4D';
    try {
        let r = parseInt(hexColor.substr(1, 2), 16);
        let g = parseInt(hexColor.substr(3, 2), 16);
        let b = parseInt(hexColor.substr(5, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#1C3A4D' : '#FFFFFF';
    } catch (e) {
        return '#1C3A4D';
    }
}

/**
 * Creates a container with standard Edit and Delete action buttons for list items.
 * @param {function} editHandler - The function to call when the Edit button is clicked.
 * @param {function} deleteHandler - The function to call when the Delete button is clicked.
 * @returns {HTMLDivElement} The div element containing the buttons.
 */
export function createItemActionButtons(editHandler, deleteHandler) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'item-actions';

    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = 'Edit';
    editBtn.onclick = editHandler;
    actionsDiv.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteBtn.title = 'Delete';
    deleteBtn.classList.add('danger-btn');
    deleteBtn.onclick = deleteHandler;
    actionsDiv.appendChild(deleteBtn);

    return actionsDiv;
}

/**
 * Sets the default date for the 'Copy From Week' picker to the previous week.
 * This is not a pure utility as it depends on state and DOM, but is a shared helper action.
 */
export function setDefaultCopyFromDate() {
    if (copyFromWeekPicker) {
        let tempDate = new Date(currentViewDate);
        tempDate.setDate(tempDate.getDate() - 7);
        const prevWeekDateRange = getWeekRange(tempDate);
        copyFromWeekPicker.value = formatDate(prevWeekDateRange.start);
    }
}