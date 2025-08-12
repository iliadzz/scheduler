// This file encapsulates all logic for the "Manage Events" modal. It handles creating, editing, deleting, and listing both recurring and single-date events that 
// appear on the scheduler's header

// js/ui/events.js

// 1. Import Dependencies
import { events, EVENT_COLORS, saveEvents } from '../state.js';

import {
    eventsModal,
    eventNameInput,
    eventColorInput,
    eventColorPalette,
    eventRecurrenceRuleSelect,
    eventSpecificDatesSection,
    eventSpecificDateInput,
    addEventSpecificDateBtn,
    eventSpecificDatesListUl,
    eventRecurrenceOptionsSection,
    eventStartDateInput,
    eventRecurrenceCountInput,
    addEventBtn,
    eventListUl,
    editingEventIdInput,
    cancelEditEventBtn
} from '../dom.js';

import { getTranslatedString } from '../i18n.js';
import { generateId, formatDate, createItemActionButtons } from '../utils.js';
import { renderWeeklySchedule } from './scheduler.js';


// --- Private State for this Module ---
let tempEventSpecificDates = []; // Holds dates for the event currently being edited


// --- Helper Functions ---

function getEventListSummary(event) {
    const rule = event.recurrenceRule || { type: 'none' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (rule.type === 'none') {
        const dates = (event.specificDates || []).map(d => new Date(d.date + 'T00:00:00Z'));
        if (dates.length === 0) return 'No dates';
        const futureDates = dates.filter(d => d >= today).sort((a, b) => a - b);
        if (futureDates.length > 0) {
            return formatDate(futureDates[0]);
        } else {
            const sortedDates = dates.sort((a, b) => a - b);
            return `${formatDate(sortedDates[sortedDates.length - 1])} (Past)`;
        }
    }
    if (rule.type === 'weekly' || rule.type === 'bi-weekly') {
        if (!rule.startDate || !rule.count) return 'Invalid Rule';
        const startDate = new Date(rule.startDate + 'T00:00:00Z');
        const increment = rule.type === 'weekly' ? 7 : 14;
        let nextDate = new Date(startDate);
        while (nextDate < today) {
            nextDate.setUTCDate(nextDate.getUTCDate() + increment);
        }
        const finalDate = new Date(startDate);
        finalDate.setUTCDate(finalDate.getUTCDate() + (rule.count - 1) * increment);
        if (nextDate > finalDate) {
            return `${formatDate(finalDate)} (Ended)`;
        }
        return `${formatDate(nextDate)}`;
    }
    return '';
}

function renderEventSpecificDatesList() {
    if (!eventSpecificDatesListUl) return;
    eventSpecificDatesListUl.innerHTML = '';
    tempEventSpecificDates.sort((a, b) => new Date(a.date) - new Date(b.date));
    tempEventSpecificDates.forEach((eventDate, index) => {
        const li = document.createElement('li');
        li.textContent = `Date: ${eventDate.date}`;
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.className = 'danger-btn';
        deleteBtn.style.marginLeft = '10px';
        deleteBtn.onclick = () => {
            tempEventSpecificDates.splice(index, 1);
            renderEventSpecificDatesList();
        };
        li.appendChild(deleteBtn);
        eventSpecificDatesListUl.appendChild(li);
    });
}

function populateEventFormForEdit(event) {
    editingEventIdInput.value = event.id;
    eventNameInput.value = event.name;

    const swatch = eventColorPalette.querySelector(`[data-color="${event.color}"]`);
    if (swatch) swatch.click();

    const rule = event.recurrenceRule || { type: 'none' };
    eventRecurrenceRuleSelect.value = rule.type;
    eventRecurrenceRuleSelect.dispatchEvent(new Event('change'));

    if (rule.type !== 'none') {
        eventStartDateInput.value = rule.startDate || '';
        eventRecurrenceCountInput.value = rule.count || 1;
    }

    tempEventSpecificDates = JSON.parse(JSON.stringify(event.specificDates || []));
    renderEventSpecificDatesList();

    addEventBtn.innerHTML = getTranslatedString('btnSaveChanges');
    cancelEditEventBtn.style.display = 'inline-block';
}

function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    const updatedEvents = events.filter(e => e.id !== eventId);
    events.length = 0;
    Array.prototype.push.apply(events, updatedEvents);

    saveEvents();
    renderEventsList();
    renderWeeklySchedule();
    if (editingEventIdInput.value === eventId) {
        resetEventForm();
    }
}

function renderEventsList() {
    if (!eventListUl) return;
    eventListUl.innerHTML = '';
    if (events.length === 0) {
        eventListUl.innerHTML = `<li>${getTranslatedString('lblNoEvents') || 'No scheduled events.'}</li>`;
        return;
    }

    const sortedEvents = [...events].sort((a, b) => (a.name > b.name) ? 1 : -1);

    sortedEvents.forEach(event => {
        const li = document.createElement('li');
        const contentDiv = document.createElement('div');
        contentDiv.style.display = 'flex';
        contentDiv.style.alignItems = 'center';

        const colorSwatch = document.createElement('span');
        colorSwatch.className = 'role-color-swatch';
        colorSwatch.style.backgroundColor = event.color;
        contentDiv.appendChild(colorSwatch);

        const textSpan = document.createElement('span');
        const summary = getEventListSummary(event);
        textSpan.textContent = ` ${event.name} (${summary})`;
        contentDiv.appendChild(textSpan);

        li.appendChild(contentDiv);
        li.appendChild(createItemActionButtons(() => populateEventFormForEdit(event), () => deleteEvent(event.id)));
        eventListUl.appendChild(li);
    });
}

// --- Exported Functions ---

/**
 * Checks if a given date has any active events. Used by the scheduler.
 * @param {Date} dateObj - The date to check.
 * @returns {Array} An array of active event objects for that date.
 */
export function isEventOnDate(dateObj) {
    const activeEvents = [];
    const checkDateStr = formatDate(dateObj);
    const checkDateTime = new Date(checkDateStr + 'T00:00:00Z').getTime();

    events.forEach(event => {
        const rule = event.recurrenceRule || { type: 'none' };
        if (rule.type === 'none') {
            if ((event.specificDates || []).some(d => d.date === checkDateStr)) {
                activeEvents.push(event);
            }
        } else {
            if (!rule.startDate || !rule.count) return;
            const startDateTime = new Date(rule.startDate + 'T00:00:00Z').getTime();
            if (checkDateTime < startDateTime) return;
            const startDateObj = new Date(rule.startDate + 'T00:00:00Z');
            if (dateObj.getUTCDay() !== startDateObj.getUTCDay()) return;
            const diffDays = (checkDateTime - startDateTime) / (1000 * 60 * 60 * 24);
            const increment = rule.type === 'weekly' ? 7 : 14;
            const diffPeriods = Math.round(diffDays / increment);
            if (diffPeriods < rule.count && diffDays % increment < 1) {
                activeEvents.push(event);
            }
        }
    });
    return activeEvents;
}

/**
 * Resets the event form to its default state.
 */
export function resetEventForm() {
    if (!editingEventIdInput) return; // Guard against call before DOM is ready
    editingEventIdInput.value = '';
    eventNameInput.value = '';
    if (eventColorPalette.firstChild) {
        eventColorPalette.firstChild.click();
    }
    eventRecurrenceRuleSelect.value = 'none';
    eventRecurrenceRuleSelect.dispatchEvent(new Event('change'));
    eventStartDateInput.value = '';
    eventRecurrenceCountInput.value = 1;
    tempEventSpecificDates = [];
    renderEventSpecificDatesList();
    eventSpecificDateInput.value = '';
    addEventBtn.innerHTML = getTranslatedString('btnAddEvent');
    cancelEditEventBtn.style.display = 'none';
}

/**
 * Initializes the "Manage Events" modal and shows it.
 */
export function showEventsModal() {
    resetEventForm();
    renderEventsList();
    if (eventsModal) eventsModal.style.display = 'block';
}

/**
 * Handles the logic for saving a new or edited event.
 */
export function handleSaveEvent() {
    const name = eventNameInput.value.trim();
    const editingId = editingEventIdInput.value;
    if (!name) {
        alert('Please provide a name for the event.');
        return;
    }
    const recurrenceType = eventRecurrenceRuleSelect.value;
    let eventData = {
        name,
        color: eventColorInput.value || EVENT_COLORS[0],
        recurrenceRule: { type: recurrenceType },
        specificDates: tempEventSpecificDates
    };
    if (recurrenceType !== 'none') {
        const startDate = eventStartDateInput.value;
        const count = parseInt(eventRecurrenceCountInput.value, 10);
        if (!startDate || !count || count < 1) {
            alert('For a recurring event, please provide a valid start date and number of times.');
            return;
        }
        eventData.recurrenceRule.startDate = startDate;
        eventData.recurrenceRule.count = count;
    }

    if (editingId) {
        const eventIndex = events.findIndex(e => e.id === editingId);
        if (eventIndex > -1) {
            events[eventIndex] = { ...events[eventIndex], ...eventData };
        }
    } else {
        events.push({ id: generateId('evt'), ...eventData });
    }
    saveEvents();
    renderEventsList();
    renderWeeklySchedule();
    resetEventForm();
}

/**
 * Sets up the color palette picker.
 */
export function populateEventColorPalette() {
    if (!eventColorPalette) return;
    eventColorPalette.innerHTML = '';
    EVENT_COLORS.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;
        swatch.addEventListener('click', () => {
            eventColorInput.value = color;
            eventColorPalette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
        });
        eventColorPalette.appendChild(swatch);
    });
    if (eventColorPalette.firstChild) {
        eventColorPalette.firstChild.click();
    }
}

/**
 * Sets up the event listeners specific to the event modal form.
 */
export function initEventListeners() {
    if (eventRecurrenceRuleSelect) {
        eventRecurrenceRuleSelect.addEventListener('change', () => {
            const isRecurring = eventRecurrenceRuleSelect.value === 'weekly' || eventRecurrenceRuleSelect.value === 'bi-weekly';
            eventRecurrenceOptionsSection.style.display = isRecurring ? 'block' : 'none';
            eventSpecificDatesSection.style.display = isRecurring ? 'none' : 'block';
        });
    }
    if (addEventSpecificDateBtn) {
        addEventSpecificDateBtn.addEventListener('click', () => {
            const date = eventSpecificDateInput.value;
            if (!date) { alert('Please select a date.'); return; }
            if (tempEventSpecificDates.some(d => d.date === date)) { alert('This date is already added.'); return; }
            tempEventSpecificDates.push({ date });
            renderEventSpecificDatesList();
            eventSpecificDateInput.value = '';
        });
    }
    if (cancelEditEventBtn) {
        cancelEditEventBtn.addEventListener('click', resetEventForm);
    }
}