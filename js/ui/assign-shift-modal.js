// js/ui/assign-shift-modal.js

import { roles, shiftTemplates, departments, users, saveShiftTemplates } from '../state.js';
import * as dom from '../dom.js';
import { getTranslatedString } from '../i18n.js';
import { populateTimeSelectsForElements, generateId, formatTimeToHHMM, calculateShiftDuration, formatTimeForDisplay } from '../utils.js';
import { HistoryManager, ModifyAssignmentCommand } from '../features/history.js';

let currentAssignMode = 'template';
let editingAssignmentDetails = null;

function populateDepartmentsForModal() {
    if (!dom.assignModalDepartmentFilter) return;
    dom.assignModalDepartmentFilter.innerHTML = `<option value="all">${getTranslatedString('optAllDepts')}</option>`;
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        dom.assignModalDepartmentFilter.appendChild(option);
    });
}

function populateRolesForModal(departmentId) {
    if (!dom.assignModalRoleSelect) return;
    dom.assignModalRoleSelect.innerHTML = `<option value="">--${getTranslatedString('optSelectRole') || 'Select Role'}--</option>`;
    const relevantRoles = roles.filter(role => {
        if (!departmentId || departmentId === 'all') return true;
        return role.departmentId === departmentId;
    });
    relevantRoles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.name;
        dom.assignModalRoleSelect.appendChild(option);
    });
}

function populateTemplatesForModal(filterDeptId, dateStr) {
    if (!dom.assignModalShiftTemplateSelect || !dateStr) return;

    const dayIndex = new Date(dateStr + 'T00:00:00').getDay();
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const targetDay = dayKeys[dayIndex];

    dom.assignModalShiftTemplateSelect.innerHTML = `<option value="">--${getTranslatedString('optSelectShift') || 'Select Shift'}--</option>`;

    const relevantTemplates = shiftTemplates.filter(st => {
        const deptMatch = (filterDeptId === 'all') || (st.departmentIds || []).includes(filterDeptId);
        const dayMatch = !st.availableDays || st.availableDays.length === 0 || st.availableDays.includes(targetDay);
        return deptMatch && dayMatch;
    });

    relevantTemplates.forEach(st => {
        const mainDept = departments.find(d => (st.departmentIds || []).includes(d.id));
        const deptAbbr = mainDept ? `[${mainDept.abbreviation}]` : '[GEN]';
        const duration = calculateShiftDuration(st.start, st.end).toFixed(1);
        const displayText = `${st.start} - ${st.end} | ${st.name} [${duration}]`;
        const option = document.createElement('option');
        option.value = st.id;
        option.textContent = displayText;
        dom.assignModalShiftTemplateSelect.appendChild(option);
    });
}

// ... the rest of the file remains the same ...

export function resetCustomTemplateForm() {
    if (dom.saveAsTemplateCheckbox) dom.saveAsTemplateCheckbox.checked = false;
    if (dom.newTemplateFieldsDiv) dom.newTemplateFieldsDiv.style.display = 'none';
    if (dom.newTemplateNameInput) dom.newTemplateNameInput.value = '';
}

export function openModalForEdit(assignment, userId, dateStr) {
    if (dom.saveCustomAsTemplateSection) dom.saveCustomAsTemplateSection.style.display = 'block';
    resetCustomTemplateForm();

    let shiftDeptId = null;
    let startTime = null;
    let endTime = null;

    if (assignment.isCustom) {
        const role = roles.find(r => r.id === assignment.roleId);
        if (role) shiftDeptId = role.departmentId;
        startTime = assignment.customStart;
        endTime = assignment.customEnd;
    } else if (assignment.shiftTemplateId) {
        const tpl = shiftTemplates.find(st => st.id === assignment.shiftTemplateId);
        if (tpl) {
            // Use the first department ID for filtering purposes
            shiftDeptId = tpl.departmentIds ? tpl.departmentIds[0] : null; 
            startTime = tpl.start;
            endTime = tpl.end;
        }
    }

    populateDepartmentsForModal(); 

    dom.assignModalDepartmentFilter.value = shiftDeptId || 'all';
    populateRolesForModal(dom.assignModalDepartmentFilter.value);
    populateTemplatesForModal(dom.assignModalDepartmentFilter.value, dateStr);

    if (startTime) {
        const [startH, startM] = startTime.split(':');
        populateTimeSelectsForElements(dom.customShiftStartHourSelect, dom.customShiftStartMinuteSelect, startH, startM);
    }
    if (endTime) {
        const [endH, endM] = endTime.split(':');
        populateTimeSelectsForElements(dom.customShiftEndHourSelect, dom.customShiftEndMinuteSelect, endH, endM);
    }

    editingAssignmentDetails = { originalAssignment: assignment, userId, dateStr };
    dom.assignModalEmployeeIdInput.value = userId;
    dom.assignModalDateInput.value = dateStr;
    dom.assignModalTitle.textContent = "Edit Assignment";
    dom.assignModalPasteOptionDiv.style.display = 'none';
    dom.assignTypeChoiceDiv.style.display = 'flex';

    if (assignment.type === 'time_off') {
        dom.assignTypeTimeOffBtn.click();
        dom.assignModalTimeOffReasonSelect.value = assignment.reason;
    } else if (assignment.isCustom) {
        dom.assignTypeCustomBtn.click();
        dom.assignModalRoleSelect.value = assignment.roleId || "";
    } else {
        dom.assignTypeTemplateBtn.click();
        dom.assignModalShiftTemplateSelect.value = assignment.shiftTemplateId || "";
        dom.assignModalRoleSelect.value = assignment.roleId || "";
    }
    dom.assignShiftModal.style.display = 'block';
}

export function openAssignShiftModalForNewOrCustom(userId, dateStr) {
    editingAssignmentDetails = null;
    dom.assignModalTitle.textContent = "Assign New Shift / Time Off";
    dom.assignModalEmployeeIdInput.value = userId;
    dom.assignModalDateInput.value = dateStr;

    const user = users.find(u => u.id === userId);
    const userDeptId = user ? user.departmentId : null;

    populateDepartmentsForModal(); 

    dom.assignModalDepartmentFilter.value = userDeptId !== null ? userDeptId : 'all';
    populateRolesForModal(dom.assignModalDepartmentFilter.value);
    populateTemplatesForModal(dom.assignModalDepartmentFilter.value, dateStr);

    if (dom.saveCustomAsTemplateSection) dom.saveCustomAsTemplateSection.style.display = 'block';
    resetCustomTemplateForm();

    dom.assignModalPasteOptionDiv.style.display = 'none';
    dom.assignTypeChoiceDiv.style.display = 'flex';
    dom.assignTypeTemplateBtn.click();
    dom.assignModalRoleSelect.value = '';
    populateTimeSelectsForElements(dom.customShiftStartHourSelect, dom.customShiftStartMinuteSelect, "09", "00");
    populateTimeSelectsForElements(dom.customShiftEndHourSelect, dom.customShiftEndMinuteSelect, "17", "00");
    dom.assignModalTimeOffReasonSelect.value = 'Vacation';
    dom.assignShiftModal.style.display = 'block';
}

export function handleAssignShift() {
    const userId = dom.assignModalEmployeeIdInput.value;
    const dateStr = dom.assignModalDateInput.value;
    const roleId = dom.assignModalRoleSelect.value;
    let newAssignment = { assignmentId: generateId('assign') };
    let oldAssignment = null;

    if (editingAssignmentDetails) {
        newAssignment.assignmentId = editingAssignmentDetails.originalAssignment.assignmentId;
        oldAssignment = editingAssignmentDetails.originalAssignment;
    }

    if (currentAssignMode === 'time_off') {
        newAssignment.type = 'time_off';
        newAssignment.reason = dom.assignModalTimeOffReasonSelect.value;
    } else {
        if (!roleId) {
            alert('Please assign a role for this shift.');
            return;
        }
        newAssignment.type = 'shift';
        newAssignment.roleId = roleId;

        if (currentAssignMode === 'template') {
            const shiftTemplateId = dom.assignModalShiftTemplateSelect.value;
            if (!shiftTemplateId) {
                alert('Please select a shift template.');
                return;
            }
            newAssignment.isCustom = false;
            newAssignment.shiftTemplateId = shiftTemplateId;
        } else { // Custom Shift
            newAssignment.isCustom = true;
            newAssignment.customStart = formatTimeToHHMM(dom.customShiftStartHourSelect.value, dom.customShiftStartMinuteSelect.value);
            newAssignment.customEnd = formatTimeToHHMM(dom.customShiftEndHourSelect.value, dom.customShiftEndMinuteSelect.value);
            
            if (dom.saveAsTemplateCheckbox.checked && dom.newTemplateNameInput.value.trim()) {
                const newTemplate = {
                    id: generateId('shift'),
                    name: dom.newTemplateNameInput.value.trim(),
                    departmentIds: [dom.assignModalDepartmentFilter.value], // Use an array
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

    dom.assignShiftModal.style.display = 'none';
}

export function initAssignShiftModalListeners() {
    const setAssignMode = (mode) => {
        currentAssignMode = mode;
        dom.assignTypeTemplateBtn.classList.toggle('active', mode === 'template');
        dom.assignTypeCustomBtn.classList.toggle('active', mode === 'custom');
        dom.assignTypeTimeOffBtn.classList.toggle('active', mode === 'time_off');

        dom.assignModalTemplateFieldsDiv.style.display = mode === 'template' ? 'block' : 'none';
        dom.assignModalCustomFieldsDiv.style.display = mode === 'custom' ? 'block' : 'none';
        dom.assignModalTimeOffFieldsDiv.style.display = mode === 'time_off' ? 'block' : 'none';

        const isShift = mode === 'template' || mode === 'custom';
        dom.assignModalDeptFilterGroup.style.display = isShift ? 'flex' : 'none';
        dom.assignModalRoleGroup.style.display = isShift ? 'flex' : 'none';
    };

    dom.assignTypeTemplateBtn.addEventListener('click', () => setAssignMode('template'));
    dom.assignTypeCustomBtn.addEventListener('click', () => setAssignMode('custom'));
    dom.assignTypeTimeOffBtn.addEventListener('click', () => setAssignMode('time_off'));

    dom.assignModalDepartmentFilter.addEventListener('change', () => {
        const selectedDeptId = dom.assignModalDepartmentFilter.value;
        const dateStr = dom.assignModalDateInput.value;
        populateTemplatesForModal(selectedDeptId, dateStr);
        populateRolesForModal(selectedDeptId);
    });

    dom.saveAsTemplateCheckbox.addEventListener('change', () => {
        dom.newTemplateFieldsDiv.style.display = dom.saveAsTemplateCheckbox.checked ? 'block' : 'none';
    });
}