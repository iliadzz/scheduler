//A module for generic, reusable helper functions that don't belong to a specific feature. This will include functions like generateId, formatDate, getContrastColor, and
// createItemActionButtons.

// js/utils.js// js/utils.js

import { currentViewDate } from './state.js';
import { copyFromWeekPicker } from './dom.js';

export function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) return "Invalid Date";
    return date.toISOString().split('T')[0];
}

export function getWeekRange(date) {
    const d = new Date(date);
    let weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayOfWeek = d.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + diff);

    let weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return { start: weekStart, end: weekEnd };
}

export function getDatesOfWeek(startDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    for (let i = 0; i < 7; i++) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

export function formatTimeForDisplay(timeStr) {
    if (!timeStr) return '';
    return timeStr;
}

export function formatTimeToHHMM(hour, minute) {
    const h = String(hour).padStart(2, '0');
    const m = String(minute).padStart(2, '0');
    return `${h}:${m}`;
}

export function calculateShiftDuration(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    let diff = (end - start) / (1000 * 60 * 60);
    if (diff < 0) diff += 24; // Handles overnight shifts
    return diff;
}

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

export function setDefaultCopyFromDate() {
    if (copyFromWeekPicker) {
        let tempDate = new Date(currentViewDate);
        tempDate.setDate(tempDate.getDate() - 7);
        const prevWeekDateRange = getWeekRange(tempDate);
        copyFromWeekPicker.value = formatDate(prevWeekDateRange.start);
    }
}

// --- THIS IS THE FIX ---
// These functions are now correctly located and exported from this utility file.
export function timeToMinutes(timeStr) {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

export function calculateOverlap(shiftStart, shiftEnd, periodStart, periodEnd) {
    const shiftStartMin = timeToMinutes(shiftStart);
    let shiftEndMin = timeToMinutes(shiftEnd);
    const periodStartMin = timeToMinutes(periodStart);
    let periodEndMin = timeToMinutes(periodEnd);

    if (shiftEndMin < shiftStartMin) shiftEndMin += 24 * 60;
    if (periodEndMin < periodStartMin) periodEndMin += 24 * 60;

    const overlapStart = Math.max(shiftStartMin, periodStartMin);
    const overlapEnd = Math.min(shiftEndMin, periodEndMin);

    return Math.max(0, overlapEnd - overlapStart);
}