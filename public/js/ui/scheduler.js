// js/ui/scheduler.js

import { users, roles, shiftTemplates, scheduleAssignments, events, currentViewDate, saveUsers, saveCurrentViewDate } from '../state.js';
import * as dom from '../dom.js';
import { getTranslatedString } from '../i18n.js';
import { formatDate, getWeekRange, getDatesOfWeek, formatTimeForDisplay, calculateShiftDuration, getContrastColor } from '../utils.js';
import { HistoryManager, DeleteAssignmentCommand } from '../features/history.js';
import { openModalForEdit, openAssignShiftModalForNewOrCustom } from './modals.js';
import { isEventOnDate } from './events.js';
import { sortKeyForEmployee, addEmployeeDragAndDropHandlers } from '../features/employee-dnd.js';
import * as ShiftDnd from '../features/shift-dnd.js';
import { calculateAndRenderCoverage } from '../features/coverage-calculator.js';

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
    alert("Copy week logic needs to be fully wired up here.");
}
export function handleClearWeek() {
    alert("Clear week logic needs to be fully wired up here.");
}

export function renderWeeklySchedule() {
    if (!dom.scheduleGridBody) { return; }
    
    if (dom.weekPickerAlt) dom.weekPickerAlt.value = formatDate(currentViewDate);
    
    dom.scheduleGridBody.innerHTML = '';
    const week = getWeekRange(currentViewDate);
    const weekDates = getDatesOfWeek(week.start);
    
    if (dom.currentWeekDisplay) dom.currentWeekDisplay.textContent = `${formatDate(week.start)} - ${formatDate(week.end)}`;
    
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
                headerHTML += ` <span class="event-header-name">| ${todaysEvents.map(e => e.name).join(', ')}</span>`;
            } else {
                header.style.backgroundColor = '';
            }
            header.innerHTML = headerHTML;
            header.dataset.date = formatDate(dateObj);
        }
    });
    
    const selectedDepartmentIds = window.selectedDepartmentIds || ['all'];
    let visibleUsers = users.filter(user => 
        (user.status === 'Active' || user.status === undefined) &&
        user.isVisible !== false && 
        (selectedDepartmentIds.includes('all') || selectedDepartmentIds.includes(user.departmentId))
    );

    visibleUsers.sort((a, b) => {
      const ak = sortKeyForEmployee(a);
      const bk = sortKeyForEmployee(b);
      if (ak !== bk) return ak - bk;
      return (a.displayName || '').localeCompare(b.displayName || '') || a.id.localeCompare(b.id);
    });

    calculateAndRenderCoverage(visibleUsers, weekDates, selectedDepartmentIds);
    
    visibleUsers.forEach(user => {
        let weeklyHours = 0;
        const userRowLabel = document.createElement('div');
        userRowLabel.className = 'employee-row-label draggable-employee-row';
        userRowLabel.draggable = true;
        userRowLabel.dataset.employeeId = user.id;

        addEmployeeDragAndDropHandlers(userRowLabel);

        userRowLabel.innerHTML = `
            <div class="employee-name-hours">
                <span class="employee-name">${user.displayName}</span>
                <span class="employee-stats">
                    <span class="total-hours" title="Hours this week"><i class="fas fa-clock"></i> <span id="hours-${user.id}">0</span>h</span>
                    <span class="vacation-counter" title="Click to edit vacation days" data-user-id="${user.id}"><i class="fas fa-plane-departure"></i> ${user.vacationBalance}</span>
                </span>
            </div>
        `;
        dom.scheduleGridBody.appendChild(userRowLabel);

        weekDates.forEach(date => {
            const cell = document.createElement('div');
            cell.className = 'day-cell';
            const dateStr = formatDate(date);
            cell.classList.toggle('is-event-day', isEventOnDate(date).length > 0);
            
            cell.dataset.date = dateStr;
            cell.dataset.userId = user.id;
            cell.addEventListener('click', () => openAssignShiftModalForNewOrCustom(user.id, dateStr));
            cell.addEventListener('dragover', ShiftDnd.handleDragOver);
            cell.addEventListener('dragenter', ShiftDnd.handleDragEnter);
            cell.addEventListener('dragleave', ShiftDnd.handleDragLeave);
            cell.addEventListener('drop', ShiftDnd.handleDrop);

            const shiftsContainer = document.createElement('div');
            shiftsContainer.className = 'shifts-container';
            const dayData = scheduleAssignments[`${user.id}-${dateStr}`] || { shifts: [] };

            dayData.shifts.forEach(assignment => {
                const itemDiv = document.createElement('div');
                itemDiv.dataset.assignmentId = assignment.assignmentId;
                itemDiv.draggable = true;
                itemDiv.addEventListener('dragstart', (e) => ShiftDnd.handleDragStart(e, user.id, dateStr, assignment));
                itemDiv.addEventListener('dragend', ShiftDnd.handleDragEnd);
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
                    } else {
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
                    itemDiv.innerHTML = `<span class="shift-time">${startTime || 'N/A'} - ${endTime || 'N/A'}</span> <span class="shift-role">| ${role ? role.name : 'No Role'}</span>` + deleteBtnHTML;
                    if (startTime && endTime) weeklyHours += calculateShiftDuration(startTime, endTime);
                }
                itemDiv.querySelector('.delete-assigned-shift-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteAssignedShift(user.id, dateStr, assignment.assignmentId);
                });
                shiftsContainer.appendChild(itemDiv);
            });
            cell.appendChild(shiftsContainer);
            dom.scheduleGridBody.appendChild(cell);
        });
        
        const hoursEl = document.getElementById(`hours-${user.id}`);
        if(hoursEl) hoursEl.textContent = weeklyHours.toFixed(1);
        
        userRowLabel.querySelector('.vacation-counter').addEventListener('click', handleVacationClick);
    });
}