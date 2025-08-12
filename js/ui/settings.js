// This module is for the "Settings" tab. It will manage saving restaurant hours, setting minimum coverage requirements, and handling the data backup and restore functionality.

// js/ui/settings.js

// 1. Import Dependencies
import {
    restaurantSettings,
    departments,
    roles,
    users,
    shiftTemplates,
    scheduleAssignments,
    events,
    saveRestaurantSettings
} from '../state.js';

import {
    restaurantHoursGrid,
    minCoverageGridContainer,
    minCoverageDepartmentSelect,
    minMealCoverageDurationSelect,
    restoreDataInput,
    restoreFileNameDisplay
} from '../dom.js';

import { getTranslatedString } from '../i18n.js';
import { renderWeeklySchedule } from './scheduler.js';


// --- Helper Functions for Rendering ---

// Creates a <select> element for time selection
function createTimeInput(id, value) {
    const select = document.createElement('select');
    select.id = id;
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 15) {
            const hour = String(i).padStart(2, '0');
            const minute = String(j).padStart(2, '0');
            const time = `${hour}:${minute}`;
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            if (time === value) option.selected = true;
            select.appendChild(option);
        }
    }
    return select;
}

function populateMinCoverageDepartmentSelect() {
    if (!minCoverageDepartmentSelect) return;
    minCoverageDepartmentSelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '_default';
    defaultOption.setAttribute('data-lang-key', 'optDefault');
    defaultOption.textContent = getTranslatedString('optDefault');
    minCoverageDepartmentSelect.appendChild(defaultOption);

    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        minCoverageDepartmentSelect.appendChild(option);
    });
}

function renderMinCoverageForDepartment(deptId) {
    if (!minCoverageGridContainer) return;
    minCoverageGridContainer.innerHTML = '';

    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayNames = { mon: 'dayMon', tue: 'dayTue', wed: 'dayWed', thu: 'dayThu', fri: 'dayFri', sat: 'daySat', sun: 'daySun' };

    const coverageSettings = restaurantSettings.minCoverage?.[deptId] || restaurantSettings.minCoverage?._default || {};

    days.forEach(day => {
        const dayData = coverageSettings[day] || restaurantSettings.minCoverage._default?.[day] || {};
        const minCard = document.createElement('div');
        minCard.className = 'day-settings-card';
        const dayKey = dayNames[day];
        minCard.innerHTML = `<h5 data-lang-key="${dayKey}">${getTranslatedString(dayKey)}</h5>`;

        const minFields = [
            { id: `minOp-${day}`, label: 'lblMinOp', value: dayData.minOp || 0 },
            { id: `minAl-${day}`, label: 'lblMinLunch', value: dayData.minAl || 0 },
            { id: `minCe-${day}`, label: 'lblMinDinner', value: dayData.minCe || 0 },
            { id: `minCl-${day}`, label: 'lblMinClose', value: dayData.minCl || 0 }
        ];
        minFields.forEach(field => {
            const group = document.createElement('div');
            group.className = 'form-group';
            group.innerHTML = `<label for="${field.id}" data-lang-key="${field.label}">${getTranslatedString(field.label)}</label>
                               <input type="number" id="${field.id}" min="0" value="${field.value}">`;
            minCard.appendChild(group);
        });
        minCoverageGridContainer.appendChild(minCard);
    });
}

// --- Exported Main Functions ---

/**
 * Renders the entire settings tab UI.
 */
export function initSettingsTab() {
    if (!restaurantHoursGrid) return;
    restaurantHoursGrid.innerHTML = '';

    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayNames = { mon: 'dayMon', tue: 'dayTue', wed: 'dayWed', thu: 'dayThu', fri: 'dayFri', sat: 'daySat', sun: 'daySun' };

    days.forEach(day => {
        const dayData = restaurantSettings[day] || {};
        const hoursCard = document.createElement('div');
        hoursCard.className = 'day-settings-card';
        const dayKey = dayNames[day];
        hoursCard.innerHTML = `<h5 data-lang-key="${dayKey}">${getTranslatedString(dayKey)}</h5>`;

        const hoursFields = [
            { id: `open-${day}`, label: 'lblOpen', value: dayData.open || '12:00' },
            { id: `lunchStart-${day}`, label: 'lblLunch', value: dayData.lunchStart || '14:00' },
            { id: `lunchEnd-${day}`, label: 'lblLunch', value: dayData.lunchEnd || '16:00' },
            { id: `dinnerStart-${day}`, label: 'lblDinner', value: dayData.dinnerStart || '19:00' },
            { id: `dinnerEnd-${day}`, label: 'lblDinner', value: dayData.dinnerEnd || '20:30' },
            { id: `close-${day}`, label: 'lblClose', value: dayData.close || '22:00' }
        ];
        hoursFields.forEach(field => {
            const group = document.createElement('div');
            group.className = 'form-group';
            const label = document.createElement('label');
            label.setAttribute('for', field.id);
            label.setAttribute('data-lang-key', field.label);
            label.textContent = getTranslatedString(field.label);
            group.appendChild(label);
            group.appendChild(createTimeInput(field.id, field.value));
            hoursCard.appendChild(group);
        });
        restaurantHoursGrid.appendChild(hoursCard);
    });

    populateMinCoverageDepartmentSelect();
    renderMinCoverageForDepartment(minCoverageDepartmentSelect.value);

    minMealCoverageDurationSelect.value = restaurantSettings.minMealCoverageDuration || '60';

    // Set up listener for the department dropdown within the settings tab
    minCoverageDepartmentSelect.addEventListener('change', () => renderMinCoverageForDepartment(minCoverageDepartmentSelect.value));
}

/**
 * Saves the restaurant hours and minimum coverage settings.
 */
export function handleSaveSettings() {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    days.forEach(day => {
        if (!restaurantSettings[day]) restaurantSettings[day] = {};
        restaurantSettings[day].open = document.getElementById(`open-${day}`).value;
        restaurantSettings[day].lunchStart = document.getElementById(`lunchStart-${day}`).value;
        restaurantSettings[day].lunchEnd = document.getElementById(`lunchEnd-${day}`).value;
        restaurantSettings[day].dinnerStart = document.getElementById(`dinnerStart-${day}`).value;
        restaurantSettings[day].dinnerEnd = document.getElementById(`dinnerEnd-${day}`).value;
        restaurantSettings[day].close = document.getElementById(`close-${day}`).value;
    });

    const selectedDeptId = minCoverageDepartmentSelect.value;
    if (!restaurantSettings.minCoverage[selectedDeptId]) {
        restaurantSettings.minCoverage[selectedDeptId] = {};
    }
    days.forEach(day => {
        if (!restaurantSettings.minCoverage[selectedDeptId][day]) {
            restaurantSettings.minCoverage[selectedDeptId][day] = {};
        }
        restaurantSettings.minCoverage[selectedDeptId][day] = {
            minOp: parseInt(document.getElementById(`minOp-${day}`).value, 10) || 0,
            minAl: parseInt(document.getElementById(`minAl-${day}`).value, 10) || 0,
            minCe: parseInt(document.getElementById(`minCe-${day}`).value, 10) || 0,
            minCl: parseInt(document.getElementById(`minCl-${day}`).value, 10) || 0,
        };
    });

    restaurantSettings.minMealCoverageDuration = minMealCoverageDurationSelect.value;

    saveRestaurantSettings(); // Saves the updated object to localStorage
    renderWeeklySchedule(); // Re-render schedule to reflect new coverage rules
    alert('Restaurant settings saved!');
}

/**
 * Handles the full data backup process.
 */
export function handleFullBackup() {
    const backupData = {
        backupType: 'full',
        data: {
            departments,
            roles,
            users,
            shiftTemplates,
            scheduleAssignments,
            events,
            appSettings: restaurantSettings,
        },
        backupVersion: '2.0-modular', // Use a version to handle future migrations
        backupDate: new Date().toISOString()
    };
    try {
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `scheduler_full_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (error) {
        alert("Error creating full backup file.");
        console.error("Backup Error:", error);
    }
}

/**
 * Handles restoring data from a backup file.
 */
export function handleRestoreFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    restoreFileNameDisplay.textContent = file.name;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);
            // Here you would add logic to confirm the restore with the user
            // and then overwrite the state variables and re-save/re-render everything.
            alert(`File "${file.name}" is ready to be restored. (Restore logic not fully implemented in this step).`);
            console.log("Parsed restore data:", backupData);
        } catch (error) {
            alert("Error: The selected file is not a valid JSON backup file.");
            console.error("Restore Error:", error);
            restoreFileNameDisplay.textContent = getTranslatedString('lblNoFileChosen');
        }
    };
    reader.readAsText(file);
}