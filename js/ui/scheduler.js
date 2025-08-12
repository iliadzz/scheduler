// js/ui/scheduler.js

// 1. Import Dependencies
import {
    users,
    departments,
    roles,
    shiftTemplates,
    scheduleAssignments,
    events,
    restaurantSettings,
    currentViewDate,
    weekStartsOnMonday,
    saveUsers,
    saveScheduleAssignments,
    saveCurrentViewDate
} from '../state.js';

import {
    scheduleGridBody,
    currentWeekDisplay,
    weekPickerAlt,
    minMealCoverageDurationSelect,
    copyFromWeekPicker,
    clearWeekConfirmModal,
    clearWeekConfirmText,
    copyEmployeeWeekModal,
    copyEmployeeModalTitle,
    copyEmployeeFromDateInput,
    copyEmployeeModalUserIdInput,
    copyConflictModal,
    copyConflictText
} from '../dom.js';

import { getTranslatedString } from '../i18n.js';
import { formatDate, getWeekRange, getDatesOfWeek, formatTimeForDisplay, calculateShiftDuration, getContrastColor, generateId } from '../utils.js';
import { HistoryManager, ModifyAssignmentCommand, DeleteAssignmentCommand, DragDropCommand } from '../features/history.js';
import { openModalForEdit, openAssignShiftModalForNewOrCustom } from './modals.js';
import { isEventOnDate } from './events.js';


// --- Private State for this Module ---
let draggedShiftDetails = null;
let draggedEmployeeRowInfo = null;


// --- Helper Functions ---

function timeToMinutes(timeStr) {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function calculateOverlap(shiftStart, shiftEnd, periodStart, periodEnd) {
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

function handleVacationClick(event) {
    const userId = event.currentTarget.dataset.userId;
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newBalanceStr = prompt(`Enter new vacation balance for ${user.displayName}:`, user.vacationBalance);
    if (newBalanceStr === null) return;

    const newBalance = parseInt(newBalanceStr, 10);
    if (isNaN(newBalance)) {
        alert("Invalid number. Please enter a valid number for the vacation balance.");
        return;
    }

    user.vacationBalance = newBalance;
    saveUsers();
    renderWeeklySchedule();
}

function deleteAssignedShift(userId, dateStr, assignmentId) {
    const command = new DeleteAssignmentCommand(userId, dateStr, assignmentId);
    HistoryManager.doAction(command);
}

// --- Drag and Drop Handlers ---

function handleDragStart(event, originalUserId, originalDateStr, assignment) {
    event.target.classList.add('dragging');
    const isCopy = event.ctrlKey || event.altKey;
    draggedShiftDetails = { ...assignment, originalUserId, originalDateStr, isCopyOperation: isCopy };
    event.dataTransfer.effectAllowed = isCopy ? 'copy' : 'move';
    event.dataTransfer.setData('text/plain', assignment.assignmentId);
}

function handleDragEnd(event) {
    event.target.classList.remove('dragging');
    document.querySelectorAll('.day-cell.drag-over').forEach(cell => cell.classList.remove('drag-over'));
    draggedShiftDetails = null;
}

function handleDragOver(event) {
    event.preventDefault();
    if (event.target.closest('.day-cell')) {
        event.dataTransfer.dropEffect = (event.ctrlKey || event.altKey) ? 'copy' : 'move';
    } else {
        event.dataTransfer.dropEffect = 'none';
    }
}

function handleDragEnter(event) {
    const cell = event.target.closest('.day-cell');
    if (cell) cell.classList.add('drag-over');
}

function handleDragLeave(event) {
    const cell = event.target.closest('.day-cell');
    if (cell) cell.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    const targetCell = event.target.closest('.day-cell');
    if (!targetCell || !draggedShiftDetails) {
        draggedShiftDetails = null;
        return;
    }
    targetCell.classList.remove('drag-over');
    const { originalUserId, originalDateStr, isCopyOperation } = draggedShiftDetails;
    const targetUserId = targetCell.dataset.userId;
    const targetDateStr = targetCell.dataset.date;
    if (!isCopyOperation && originalUserId === targetUserId && originalDateStr === targetDateStr) {
        draggedShiftDetails = null;
        return;
    }
    const commandDetails = { ...draggedShiftDetails, newAssignmentId: isCopyOperation ? generateId('assign') : draggedShiftDetails.assignmentId, targetUserId, targetDateStr };
    const command = new DragDropCommand(commandDetails);
    HistoryManager.doAction(command);
    draggedShiftDetails = null;
}

function handleEmployeeRowDragStart(event) {
    const userId = event.currentTarget.dataset.userId;
    draggedEmployeeRowInfo = { id: userId };
    event.dataTransfer.setData('text/plain', userId);
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => event.currentTarget.classList.add('employee-row-dragging'), 0);
}

function handleEmployeeRowDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const targetRow = event.currentTarget;
    if (targetRow && targetRow.dataset.userId !== (draggedEmployeeRowInfo ? draggedEmployeeRowInfo.id : null)) {
        targetRow.classList.add('employee-row-drag-over');
    }
}

function handleEmployeeRowDragLeave(event) {
    event.currentTarget.classList.remove('employee-row-drag-over');
}

function handleEmployeeRowDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const targetRow = event.currentTarget;
    targetRow.classList.remove('employee-row-drag-over');
    if (!draggedEmployeeRowInfo) return;
    const droppedOnUserId = targetRow.dataset.userId;
    if (draggedEmployeeRowInfo.id === droppedOnUserId) return;
    const fromIndex = users.findIndex(u => u.id === draggedEmployeeRowInfo.id);
    const toIndex = users.findIndex(u => u.id === droppedOnUserId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [movedEmployee] = users.splice(fromIndex, 1);
    users.splice(toIndex, 0, movedEmployee);
    saveUsers();
    renderWeeklySchedule();
}

function handleEmployeeRowDragEnd(event) {
    if (event.currentTarget && typeof event.currentTarget.style !== 'undefined') {
       event.currentTarget.classList.remove('employee-row-dragging');
    }
    document.querySelectorAll('.employee-row-drag-over').forEach(row => row.classList.remove('employee-row-drag-over'));
    draggedEmployeeRowInfo = null;
}


// --- Exported Handler Functions for Scheduler Controls ---

export function handlePrevWeek() {
    currentViewDate.setDate(currentViewDate.getDate() - 7);
    saveCurrentViewDate();
    renderWeeklySchedule();
}

export function handleNextWeek() {
    currentViewDate.setDate(currentViewDate.getDate() + 7);
    saveCurrentViewDate();
    renderWeeklySchedule();
}

export function handleThisWeek() {
    const today = new Date();
    currentViewDate.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
    saveCurrentViewDate();
    renderWeeklySchedule();
}

export function handleWeekChange(e) {
    if (e.target.value) {
        const [year, month, day] = e.target.value.split('-').map(Number);
        currentViewDate.setFullYear(year, month - 1, day);
        saveCurrentViewDate();
        renderWeeklySchedule();
    }
}

export function handlePrint() {
    window.print();
}

export function handleCopyWeek() {
    // Placeholder - a full implementation requires the conflict modal logic from modals.js
    alert("Copy week logic needs to be fully wired up here.");
}
export function handleClearWeek() {
    // Placeholder - a full implementation requires the clear week modal logic from modals.js
    alert("Clear week logic needs to be fully wired up here.");
}


// --- Main Rendering Function ---

export function renderWeeklySchedule() {
    if (!scheduleGridBody) { return; }
    
    // Update the week picker alt value to match the current view
    if (weekPickerAlt) {
        weekPickerAlt.value = formatDate(currentViewDate);
    }
    
    const coverageContainer = document.getElementById('coverage-summary-container');
    scheduleGridBody.innerHTML = '';
    if (coverageContainer) {
        coverageContainer.innerHTML = '';
    }

    const week = getWeekRange(currentViewDate);
    const weekDates = getDatesOfWeek(week.start);
    
    if (currentWeekDisplay) currentWeekDisplay.textContent = `${formatDate(week.start)} - ${formatDate(week.end)}`;
    
    const dayHeaders = document.querySelectorAll('.schedule-header-row .header-day');
    dayHeaders.forEach((header, index) => {
        if (weekDates[index]) {
            const dateObj = weekDates[index];
            const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dateObj.getDay()];
            const dayInitial = getTranslatedString('day' + dayKey.charAt(0).toUpperCase() + dayKey.slice(1));
            
            let headerHTML = `${dayInitial} - ${dateObj.getDate()}`;
            
            const todaysEvents = isEventOnDate(dateObj);
            header.classList.toggle('is-event-day', todaysEvents.length > 0);
            
            if (todaysEvents.length > 0) {
                header.style.backgroundColor = todaysEvents[0].color || '';
                const eventNames = todaysEvents.map(e => e.name).join(', ');
                headerHTML += ` <span class="event-header-name">| ${eventNames}</span>`;
            } else {
                header.style.backgroundColor = '';
            }

            header.innerHTML = headerHTML;
            header.dataset.date = formatDate(dateObj);
        }
    });
    
    const selectedDepartmentIds = window.selectedDepartmentIds || ['all'];
    const visibleUsers = users.filter(user => 
        (user.status === 'Active' || user.status === undefined) && // Only show active employees
        user.isVisible !== false && 
        (selectedDepartmentIds.includes('all') || selectedDepartmentIds.includes(user.departmentId))
    );
    
    const departmentsToRender = selectedDepartmentIds.includes('all')
        ? departments
        : departments.filter(d => selectedDepartmentIds.includes(d.id));
    
    if (coverageContainer) {
        // ... (coverage rendering logic would go here)
    }

    visibleUsers.forEach(user => {
        let weeklyHours = 0;
        const userRowLabel = document.createElement('div');
        userRowLabel.className = 'employee-row-label draggable-employee-row';
        userRowLabel.draggable = true;
        userRowLabel.dataset.userId = user.id;

        userRowLabel.addEventListener('dragstart', handleEmployeeRowDragStart);
        userRowLabel.addEventListener('dragover', handleEmployeeRowDragOver);
        userRowLabel.addEventListener('dragleave', handleEmployeeRowDragLeave);
        userRowLabel.addEventListener('drop', handleEmployeeRowDrop);
        userRowLabel.addEventListener('dragend', handleEmployeeRowDragEnd);

        const nameHoursContainer = document.createElement('div');
        nameHoursContainer.className = 'employee-name-hours';
    
        const nameSpan = document.createElement('span');
        nameSpan.className = 'employee-name';
        nameSpan.textContent = user.displayName;
    
        const statsContainer = document.createElement('span');
        statsContainer.className = 'employee-stats';
    
        const hoursSpan = document.createElement('span');
        hoursSpan.className = 'total-hours';
        hoursSpan.title = 'Hours this week';
        hoursSpan.innerHTML = `<i class="fas fa-clock"></i> <span id="hours-${user.id}">0</span>h`;
    
        const vacationSpan = document.createElement('span');
        vacationSpan.className = 'vacation-counter';
        vacationSpan.title = 'Click to edit vacation days';
        vacationSpan.dataset.userId = user.id;
        vacationSpan.innerHTML = `<i class="fas fa-plane-departure"></i> ${user.vacationBalance}`;
    
        vacationSpan.addEventListener('click', handleVacationClick);
    
        statsContainer.appendChild(hoursSpan);
        statsContainer.appendChild(vacationSpan);
    
        nameHoursContainer.appendChild(nameSpan);
        nameHoursContainer.appendChild(statsContainer);
    
        userRowLabel.appendChild(nameHoursContainer);

        // (Logic for clear & copy week buttons for each employee would go here)

        scheduleGridBody.appendChild(userRowLabel);

        weekDates.forEach(date => {
            const cell = document.createElement('div');
            cell.className = 'day-cell';
            const dateStr = formatDate(date);
            const todaysEvents = isEventOnDate(date);
            cell.classList.toggle('is-event-day', todaysEvents.length > 0);
            cell.style.backgroundColor = todaysEvents.length > 0 ? todaysEvents[0].color : '';
            
            cell.dataset.date = dateStr;
            cell.dataset.userId = user.id;
            cell.addEventListener('click', () => openAssignShiftModalForNewOrCustom(user.id, dateStr));
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('dragenter', handleDragEnter);
            cell.addEventListener('dragleave', handleDragLeave);
            cell.addEventListener('drop', handleDrop);

            const shiftsContainer = document.createElement('div');
            shiftsContainer.className = 'shifts-container';

            const dayData = scheduleAssignments[`${user.id}-${dateStr}`] || { shifts: [] };

            dayData.shifts.forEach(assignment => {
                const itemDiv = document.createElement('div');
                itemDiv.dataset.assignmentId = assignment.assignmentId;
                itemDiv.draggable = true;
                itemDiv.addEventListener('dragstart', (e) => handleDragStart(e, user.id, dateStr, assignment));
                itemDiv.addEventListener('dragend', handleDragEnd);
                itemDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openModalForEdit(assignment, user.id, dateStr);
                });
                const deleteBtnHTML = `<button class="delete-assigned-shift-btn" data-assignment-id="${assignment.assignmentId}">&times;</button>`;
                if (assignment.type === 'time_off') {
                    itemDiv.className = 'shift-item time-off-item';
                    itemDiv.innerHTML = `<span class="time-off-reason">${assignment.reason.toUpperCase()}</span>` + deleteBtnHTML;
                } else {
                    const role = roles.find(r => r.id === assignment.roleId);
                    let startTime, endTime;
                    if (assignment.isCustom) {
                        startTime = assignment.customStart;
                        endTime = assignment.customEnd;
                    } 
                    else {
                        const shiftTpl = shiftTemplates.find(st => st.id === assignment.shiftTemplateId);
                        if (shiftTpl) {
                            startTime = shiftTpl.start;
                            endTime = shiftTpl.end;
                        }
                    }
                    itemDiv.className = 'shift-item';
                    if (role && role.color) {
                        itemDiv.style.backgroundColor = role.color;
                        itemDiv.style.color = getContrastColor(role.color);
                    }
                    itemDiv.innerHTML = `<span class="shift-time">${startTime ? formatTimeForDisplay(startTime) : 'N/A'} - ${endTime ? formatTimeForDisplay(endTime) : 'N/A'}</span> <span class="shift-role">| ${role ? role.name : 'No Role'}</span>` + deleteBtnHTML;
                    if (startTime && endTime) weeklyHours += calculateShiftDuration(startTime, endTime);
                }
                itemDiv.querySelector('.delete-assigned-shift-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteAssignedShift(user.id, dateStr, assignment.assignmentId);
                });
                shiftsContainer.appendChild(itemDiv);
            });
            cell.appendChild(shiftsContainer);
            
            scheduleGridBody.appendChild(cell);
        });
        
        const hoursEl = document.getElementById(`hours-${user.id}`);
        if(hoursEl) hoursEl.textContent = weeklyHours.toFixed(1);
    });
}