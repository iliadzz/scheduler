// This file will handle the logic for showing and managing the application's modals, with a primary focus on the complex "Assign Shift / Time Off" 

// js/ui/modals.js

// 1. Import Dependencies
import {
    roles,
    shiftTemplates,
    departments,
    scheduleAssignments,
    users,
    copiedShiftDetails,
    saveScheduleAssignments,
    saveShiftTemplates
} from '../state.js';

import {
    assignShiftModal,
    assignModalTitle,
    assignModalEmployeeIdInput,
    assignModalDateInput,
    assignModalPasteOptionDiv,
    copiedShiftDetailsText,
    assignTypeChoiceDiv,
    assignTypeTemplateBtn,
    assignTypeCustomBtn,
    assignTypeTimeOffBtn,
    assignModalTemplateFieldsDiv,
    assignModalCustomFieldsDiv,
    assignModalTimeOffFieldsDiv,
    assignModalDeptFilterGroup,
    assignModalRoleGroup,
    assignModalDepartmentFilter,
    assignModalShiftTemplateSelect,
    assignModalRoleSelect,
    customShiftStartHourSelect,
    customShiftStartMinuteSelect,
    customShiftEndHourSelect,
    customShiftEndMinuteSelect,
    saveCustomAsTemplateSection,
    saveAsTemplateCheckbox,
    newTemplateFieldsDiv,
    newTemplateNameInput,
    assignModalTimeOffReasonSelect,
    employeeFormModal,
    employeeModalTitle
} from '../dom.js';

import { getTranslatedString } from '../i18n.js';
import { populateTimeSelectsForElements, generateId, formatTimeToHHMM, calculateShiftDuration, formatTimeForDisplay } from '../utils.js';
import { HistoryManager, ModifyAssignmentCommand } from '../features/history.js';
import { renderWeeklySchedule } from './scheduler.js';
import { resetEmployeeForm } from './employees.js';

// --- Private State for this Module ---
let currentAssignMode = 'template';
let editingAssignmentDetails = null;

// --- Helper Functions ---

function populateRolesForModal(departmentId) {
    if (!assignModalRoleSelect) return;
    assignModalRoleSelect.innerHTML = `<option value="">--${getTranslatedString('optSelectRole') || 'Select Role'}--</option>`;
    const relevantRoles = roles.filter(role => {
        if (!departmentId || departmentId === 'all') return true;
        return role.departmentId === departmentId;
    });
    relevantRoles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.name;
        assignModalRoleSelect.appendChild(option);
    });
}

function populateTemplatesForModal(filterDeptId) {
    if (!assignModalShiftTemplateSelect) return;
    assignModalShiftTemplateSelect.innerHTML = `<option value="">--${getTranslatedString('optSelectShift') || 'Select Shift'}--</option>`;
    const relevantTemplates = shiftTemplates.filter(st => {
        if (!filterDeptId || filterDeptId === 'all') return true;
        return st.departmentId === filterDeptId;
    });

    relevantTemplates.forEach(st => {
        const dept = departments.find(d => d.id === st.departmentId);
        const deptAbbr = dept ? `[${dept.abbreviation}]` : '[GEN]';
        const duration = calculateShiftDuration(st.start, st.end).toFixed(1);
        const displayText = `${deptAbbr} ${st.name}: ${formatTimeForDisplay(st.start)} - ${formatTimeForDisplay(st.end)} [${duration}hrs]`;
        const option = document.createElement('option');
        option.value = st.id;
        option.textContent = displayText;
        assignModalShiftTemplateSelect.appendChild(option);
    });
}

function resetCustomTemplateForm() {
    if (saveAsTemplateCheckbox) saveAsTemplateCheckbox.checked = false;
    if (newTemplateFieldsDiv) newTemplateFieldsDiv.style.display = 'none';
    if (newTemplateNameInput) newTemplateNameInput.value = '';
}


// --- Exported Functions ---

/**
 * Opens the "Add Employee" modal.
 */
export function showAddEmployeeModal() {
    if (employeeModalTitle) employeeModalTitle.textContent = getTranslatedString('hdrAddEmployee');
    resetEmployeeForm();
    if (employeeFormModal) employeeFormModal.style.display = 'block';
}


/**
 * Opens the Assign Shift modal to edit an existing assignment.
 * @param {object} assignment - The assignment object to edit.
 * @param {string} userId - The ID of the user.
 * @param {string} dateStr - The date string of the assignment.
 */
export function openModalForEdit(assignment, userId, dateStr) {
    if (saveCustomAsTemplateSection) saveCustomAsTemplateSection.style.display = 'none';
    resetCustomTemplateForm();

    let shiftDeptId = null;
    if (assignment.isCustom) {
        const role = roles.find(r => r.id === assignment.roleId);
        if (role) shiftDeptId = role.departmentId;
    } else {
        const tpl = shiftTemplates.find(st => st.id === assignment.shiftTemplateId);
        if (tpl) shiftDeptId = tpl.departmentId;
    }

    assignModalDepartmentFilter.value = shiftDeptId || 'all';
    populateRolesForModal(assignModalDepartmentFilter.value);
    populateTemplatesForModal(assignModalDepartmentFilter.value);

    editingAssignmentDetails = { originalAssignment: assignment, userId, dateStr };
    assignModalEmployeeIdInput.value = userId;
    assignModalDateInput.value = dateStr;
    assignModalTitle.textContent = "Edit Assignment";
    assignModalPasteOptionDiv.style.display = 'none';
    assignTypeChoiceDiv.style.display = 'flex';

    if (assignment.type === 'time_off') {
        assignTypeTimeOffBtn.click();
        assignModalTimeOffReasonSelect.value = assignment.reason;
    } else if (assignment.isCustom) {
        assignTypeCustomBtn.click();
        if (customShiftStartHourSelect && assignment.customStart) {
            const [startH, startM] = assignment.customStart.split(':');
            customShiftStartHourSelect.value = startH;
            customShiftStartMinuteSelect.value = startM;
        }
        if (customShiftEndHourSelect && assignment.customEnd) {
            const [endH, endM] = assignment.customEnd.split(':');
            customShiftEndHourSelect.value = endH;
            customShiftEndMinuteSelect.value = endM;
        }
        assignModalRoleSelect.value = assignment.roleId || "";
    } else {
        assignTypeTemplateBtn.click();
        assignModalShiftTemplateSelect.value = assignment.shiftTemplateId || "";
        assignModalRoleSelect.value = assignment.roleId || "";
    }
    assignShiftModal.style.display = 'block';
}


/**
 * Opens the Assign Shift modal for a new assignment.
 * @param {string} userId - The user to assign the shift to.
 * @param {string} dateStr - The date for the new assignment.
 */
export function openAssignShiftModalForNewOrCustom(userId, dateStr) {
    editingAssignmentDetails = null;
    assignModalTitle.textContent = "Assign New Shift / Time Off";
    assignModalEmployeeIdInput.value = userId;
    assignModalDateInput.value = dateStr;

    const user = users.find(u => u.id === userId);
    const userDeptId = user ? user.departmentId : null;

    assignModalDepartmentFilter.value = userDeptId !== null ? userDeptId : 'all';
    populateRolesForModal(assignModalDepartmentFilter.value);
    populateTemplatesForModal(assignModalDepartmentFilter.value);

    if (saveCustomAsTemplateSection) saveCustomAsTemplateSection.style.display = 'block';
    resetCustomTemplateForm();

    assignModalPasteOptionDiv.style.display = 'none';
    assignTypeChoiceDiv.style.display = 'flex';
    assignTypeTemplateBtn.click();
    assignModalRoleSelect.value = '';
    populateTimeSelectsForElements(customShiftStartHourSelect, customShiftStartMinuteSelect, "09", "00");
    populateTimeSelectsForElements(customShiftEndHourSelect, customShiftEndMinuteSelect, "17", "00");
    assignModalTimeOffReasonSelect.value = 'Vacation';
    assignShiftModal.style.display = 'block';
}


/**
 * Handles the logic for saving a new or edited assignment.
 */
export function handleAssignShift() {
    const userId = assignModalEmployeeIdInput.value;
    const dateStr = assignModalDateInput.value;
    const roleId = assignModalRoleSelect.value;
    let newAssignment = { assignmentId: generateId('assign') };
    let oldAssignment = null;

    if (editingAssignmentDetails) {
        newAssignment.assignmentId = editingAssignmentDetails.originalAssignment.assignmentId;
        oldAssignment = editingAssignmentDetails.originalAssignment;
    }

    if (currentAssignMode === 'time_off') {
        newAssignment.type = 'time_off';
        newAssignment.reason = assignModalTimeOffReasonSelect.value;
    } else {
        if (!roleId) {
            alert('Please assign a role for this shift.');
            return;
        }
        newAssignment.type = 'shift';
        newAssignment.roleId = roleId;

        if (currentAssignMode === 'template') {
            const shiftTemplateId = assignModalShiftTemplateSelect.value;
            if (!shiftTemplateId) {
                alert('Please select a shift template.');
                return;
            }
            newAssignment.isCustom = false;
            newAssignment.shiftTemplateId = shiftTemplateId;
        } else { // Custom Shift
            newAssignment.isCustom = true;
            newAssignment.customStart = formatTimeToHHMM(customShiftStartHourSelect.value, customShiftStartMinuteSelect.value);
            newAssignment.customEnd = formatTimeToHHMM(customShiftEndHourSelect.value, customShiftEndMinuteSelect.value);
            // Logic to save as new template
            if (saveAsTemplateCheckbox.checked && newTemplateNameInput.value.trim()) {
                const newTemplate = {
                    id: generateId('shift'),
                    name: newTemplateNameInput.value.trim(),
                    departmentId: assignModalDepartmentFilter.value,
                    start: newAssignment.customStart,
                    end: newAssignment.customEnd,
                };
                shiftTemplates.push(newTemplate);
                saveShiftTemplates();
            }
        }
    }

    const command = new ModifyAssignmentCommand(userId, dateStr, newAssignment, oldAssignment);
    HistoryManager.doAction(command);

    assignShiftModal.style.display = 'none';
}

/**
 * Initializes listeners for buttons inside the modals.
 */
export function initModalListeners() {
    const setAssignMode = (mode) => {
        currentAssignMode = mode;
        assignTypeTemplateBtn.classList.toggle('active', mode === 'template');
        assignTypeCustomBtn.classList.toggle('active', mode === 'custom');
        assignTypeTimeOffBtn.classList.toggle('active', mode === 'time_off');

        assignModalTemplateFieldsDiv.style.display = mode === 'template' ? 'block' : 'none';
        assignModalCustomFieldsDiv.style.display = mode === 'custom' ? 'block' : 'none';
        assignModalTimeOffFieldsDiv.style.display = mode === 'time_off' ? 'block' : 'none';

        const isShift = mode === 'template' || mode === 'custom';
        assignModalDeptFilterGroup.style.display = isShift ? 'flex' : 'none';
        assignModalRoleGroup.style.display = isShift ? 'flex' : 'none';
    };

    assignTypeTemplateBtn.addEventListener('click', () => setAssignMode('template'));
    assignTypeCustomBtn.addEventListener('click', () => setAssignMode('custom'));
    assignTypeTimeOffBtn.addEventListener('click', () => setAssignMode('time_off'));

    assignModalDepartmentFilter.addEventListener('change', () => {
        const selectedDeptId = assignModalDepartmentFilter.value;
        populateTemplatesForModal(selectedDeptId);
        populateRolesForModal(selectedDeptId);
    });

    saveAsTemplateCheckbox.addEventListener('change', () => {
        newTemplateFieldsDiv.style.display = saveAsTemplateCheckbox.checked ? 'block' : 'none';
    });
}