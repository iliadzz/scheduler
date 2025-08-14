// js/features/coverage-calculator.js
// handles the business logic for calculating the coverage summary.// js/features/coverage-calculator.js

import { departments, restaurantSettings, scheduleAssignments, shiftTemplates } from '../state.js';
import { getTranslatedString } from '../i18n.js';
import { isEventOnDate } from '../ui/events.js';
import { calculateOverlap } from '../utils.js';

export function calculateAndRenderCoverage(visibleUsers, weekDates, selectedDepartmentIds) {
    const coverageContainer = document.getElementById('coverage-summary-container');
    if (!coverageContainer) return;
    coverageContainer.innerHTML = '';

    const visibleDepartments = departments.filter(dept =>
        selectedDepartmentIds.includes('all') || selectedDepartmentIds.includes(dept.id)
    );

    visibleDepartments.forEach(dept => {
        let isRowDeficient = false;
        const summaryCells = [];

        const deptLabelCell = document.createElement('div');
        deptLabelCell.className = 'header-coverage-summary-label';
        deptLabelCell.textContent = `${dept.name} Coverage`;
        summaryCells.push(deptLabelCell);

        weekDates.forEach(date => {
            const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
            const daySettings = restaurantSettings[dayOfWeek] || {};

            const coverageSettings = restaurantSettings.minCoverage?.[dept.id]?.[dayOfWeek] || restaurantSettings.minCoverage?._default?.[dayOfWeek] || {};

            let coverage = { open: 0, lunch: 0, dinner: 0, close: 0 };
            const deptUsers = visibleUsers.filter(u => u.departmentId === dept.id);

            deptUsers.forEach(user => {
                const dayData = scheduleAssignments[`${user.id}-${dateStr}`];
                if (dayData && dayData.shifts) {
                    dayData.shifts.forEach(shift => {
                        if (shift.type === 'shift') {
                            const tpl = shift.isCustom ? null : shiftTemplates.find(st => st.id === shift.shiftTemplateId);
                            const start = shift.isCustom ? shift.customStart : tpl?.start;
                            const end = shift.isCustom ? shift.customEnd : tpl?.end;

                            if (start && end) {
                                if (calculateOverlap(start, end, daySettings.open, daySettings.lunchStart) > 0) coverage.open++;
                                if (calculateOverlap(start, end, daySettings.lunchStart, daySettings.lunchEnd) >= 60) coverage.lunch++;
                                if (calculateOverlap(start, end, daySettings.dinnerStart, daySettings.dinnerEnd) >= 60) coverage.dinner++;
                                if (calculateOverlap(start, end, daySettings.dinnerEnd, daySettings.close) > 0) coverage.close++;
                            }
                        }
                    });
                }
            });

            const summaryCell = document.createElement('div');
            summaryCell.className = 'header-coverage-summary';
            summaryCell.classList.toggle('is-event-day', isEventOnDate(date).length > 0);

            const periods = [
                { key: 'open', label: 'OP', minKey: 'minOp' },
                { key: 'lunch', label: 'AL', minKey: 'minAl' },
                { key: 'dinner', label: 'CE', minKey: 'minCe' },
                { key: 'close', label: 'CL', minKey: 'minCl' }
            ];

            let cellHTML = '';
            periods.forEach(p => {
                const count = coverage[p.key];
                const min = coverageSettings[p.minKey];
                let statusClass = '';

                if (min !== undefined && min > 0) {
                    if (count < min) { statusClass = 'coverage-danger'; isRowDeficient = true; } 
                    else if (count > min) { statusClass = 'coverage-over'; } 
                    else { statusClass = 'coverage-success'; }
                }
                cellHTML += `<span class="coverage-item ${statusClass}">${p.label}: ${count}</span>`;
            });
            summaryCell.innerHTML = cellHTML;
            summaryCells.push(summaryCell);
        });

        if (isRowDeficient) {
            summaryCells.forEach(cell => cell.classList.add('coverage-row-deficient'));
        }

        summaryCells.forEach(cell => coverageContainer.appendChild(cell));
    });
}