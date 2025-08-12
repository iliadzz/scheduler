// js/ui/departments.js

// 1. Import dependencies
import {
    departments,
    users,
    roles,
    shiftTemplates,
    restaurantSettings,
    saveDepartments,
    saveUsers,
    saveRoles,
    saveShiftTemplates
} from '../state.js';

import {
    departmentListUl,
    employeeListFilter,
    employeeDepartmentSelect,
    roleDepartmentSelect,
    shiftTemplateDepartmentSelect,
    shiftTemplateListFilter,
    assignModalDepartmentFilter,
    departmentCheckboxesContainer,
    editingDepartmentIdInput,
    departmentNameInput,
    departmentAbbreviationInput,
    addDepartmentBtn,
    cancelEditDepartmentBtn,
    departmentFilterText
} from '../dom.js';

import { getTranslatedString } from '../i18n.js';
import { createItemActionButtons, generateId } from '../utils.js';
import { renderEmployees } from './employees.js';
import { renderRoles } from './roles.js';
import { renderShiftTemplates } from './shifts.js';
import { renderWeeklySchedule } from './scheduler.js';

// --- Private State for this Module ---
let draggedDepartmentInfo = null;

// --- Functions ---

/**
 * Handles the logic for saving a new or edited department.
 */
export function handleSaveDepartment() {
    const name = departmentNameInput.value.trim();
    const abbreviation = departmentAbbreviationInput.value.trim().toUpperCase();
    const editingId = editingDepartmentIdInput.value;

    if (!name || !abbreviation) {
        alert(getTranslatedString('alertDeptNameEmpty'));
        return;
    }

    if (editingId) {
        // Find and update the existing department
        const deptIndex = departments.findIndex(d => d.id === editingId);
        if (deptIndex > -1) {
            departments[deptIndex].name = name;
            departments[deptIndex].abbreviation = abbreviation;
        }
    } else {
        // Add a new department, checking for duplicates first
        if (departments.find(d => d.name.toLowerCase() === name.toLowerCase())) {
            alert('Department name already exists.');
            return;
        }
        departments.push({ id: generateId('dept'), name, abbreviation });
    }

    saveDepartments();
    renderDepartments();
    renderEmployees(); // Re-render employees in case department names changed in dropdowns
    resetDepartmentForm();
}


/**
 * Populates the multi-select filter in the scheduler header.
 */
function populateDepartmentFilter() {
    if (!departmentCheckboxesContainer) return;
    departmentCheckboxesContainer.innerHTML = '';

    let allLabel = document.createElement('label');
    allLabel.innerHTML = `<input type="checkbox" value="all" checked> <strong data-lang-key="optAllDepts">${getTranslatedString('optAllDepts')}</strong>`;
    departmentCheckboxesContainer.appendChild(allLabel);

    departments.forEach(dept => {
        let deptLabel = document.createElement('label');
        deptLabel.innerHTML = `<input type="checkbox" value="${dept.id}" checked> ${dept.name}`;
        departmentCheckboxesContainer.appendChild(deptLabel);
    });

    departmentCheckboxesContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleDepartmentFilterChange);
    });
}

/**
 * Handles changes in the department filter checkboxes and updates the schedule view.
 */
function handleDepartmentFilterChange(e) {
    const checkboxes = departmentCheckboxesContainer.querySelectorAll('input[type="checkbox"]');
    const allDeptsCheckbox = checkboxes[0];

    if (e && e.target.value === 'all') {
        checkboxes.forEach(cb => cb.checked = allDeptsCheckbox.checked);
    } else {
        const allChecked = Array.from(checkboxes).slice(1).every(cb => cb.checked);
        allDeptsCheckbox.checked = allChecked;
    }

    let selectedDepartmentIds = Array.from(checkboxes)
        .filter(cb => cb.checked && cb.value !== 'all')
        .map(cb => cb.value);

    if (allDeptsCheckbox.checked) {
        selectedDepartmentIds = ['all'];
        departmentFilterText.textContent = getTranslatedString('optAllDepts');
    } else if (selectedDepartmentIds.length === 0) {
        departmentFilterText.textContent = "None selected";
        selectedDepartmentIds = ['none']; // Use 'none' to show nothing
    } else if (selectedDepartmentIds.length === 1) {
        const dept = departments.find(d => d.id === selectedDepartmentIds[0]);
        departmentFilterText.textContent = dept ? dept.name : "1 selected";
    } else {
        departmentFilterText.textContent = `${selectedDepartmentIds.length} departments`;
    }

    // This is a temporary solution for cross-module state.
    window.selectedDepartmentIds = selectedDepartmentIds;
    renderWeeklySchedule();
}

/**
 * Fills the department form with data for editing.
 * @param {object} department - The department object to edit.
 */
export function populateDepartmentFormForEdit(department) {
    editingDepartmentIdInput.value = department.id;
    departmentNameInput.value = department.name;
    departmentAbbreviationInput.value = department.abbreviation || '';
    addDepartmentBtn.textContent = 'Save Changes'; // This should be translated
    cancelEditDepartmentBtn.style.display = 'inline-block';
}

/**
 * Resets the department form to its default state for adding a new department.
 */
export function resetDepartmentForm() {
    editingDepartmentIdInput.value = '';
    departmentNameInput.value = '';
    departmentAbbreviationInput.value = '';
    addDepartmentBtn.textContent = getTranslatedString('btnAddDept');
    cancelEditDepartmentBtn.style.display = 'none';
}

/**
 * Deletes a department after confirmation and updates all related data.
 * @param {string} deptId - The ID of the department to delete.
 */
export function deleteDepartment(deptId) {
    if (!confirm(getTranslatedString('confirmDeleteDept'))) return;

    // Filter out the department
    const updatedDepts = departments.filter(d => d.id !== deptId);
    departments.length = 0;
    Array.prototype.push.apply(departments, updatedDepts);


    // Update users, roles, and shift templates that were assigned to this department
    users.forEach(user => { if (user.departmentId === deptId) user.departmentId = null; });
    roles.forEach(role => { if (role.departmentId === deptId) role.departmentId = null; });
    shiftTemplates.forEach(st => { if (st.departmentId === deptId) st.departmentId = null; });

    // Remove department-specific settings
    if (restaurantSettings.minCoverage && restaurantSettings.minCoverage[deptId]) {
        delete restaurantSettings.minCoverage[deptId];
        localStorage.setItem('restaurantSettings', JSON.stringify(restaurantSettings));
    }

    saveUsers();
    saveRoles();
    saveShiftTemplates();
    saveDepartments();

    renderDepartments();
    renderEmployees();
    renderRoles();
    renderShiftTemplates();

    if (editingDepartmentIdInput.value === deptId) {
        resetDepartmentForm();
    }
}

// --- Drag and Drop Handlers ---

function handleDepartmentDragStart(event) {
    const departmentId = event.currentTarget.dataset.departmentId;
    draggedDepartmentInfo = { id: departmentId };
    event.dataTransfer.setData('text/plain', departmentId);
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => event.currentTarget.classList.add('department-dragging'), 0);
}

function handleDepartmentDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const targetRow = event.currentTarget;
    if (targetRow && targetRow.dataset.departmentId !== (draggedDepartmentInfo ? draggedDepartmentInfo.id : null)) {
        targetRow.classList.add('department-drag-over');
    }
}

function handleDepartmentDragLeave(event) {
    event.currentTarget.classList.remove('department-drag-over');
}

function handleDepartmentDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const targetRow = event.currentTarget;
    targetRow.classList.remove('department-drag-over');

    if (!draggedDepartmentInfo) return;

    const droppedOnDepartmentId = targetRow.dataset.departmentId;
    if (draggedDepartmentInfo.id === droppedOnDepartmentId) return;

    const fromIndex = departments.findIndex(d => d.id === draggedDepartmentInfo.id);
    const toIndex = departments.findIndex(d => d.id === droppedOnDepartmentId);

    if (fromIndex === -1 || toIndex === -1) return;

    const [movedDepartment] = departments.splice(fromIndex, 1);
    departments.splice(toIndex, 0, movedDepartment);

    saveDepartments();
    renderDepartments();
}

function handleDepartmentDragEnd(event) {
    if (event.currentTarget) {
        event.currentTarget.classList.remove('department-dragging');
    }
    document.querySelectorAll('.department-drag-over').forEach(row => row.classList.remove('department-drag-over'));
    draggedDepartmentInfo = null;
}


/**
 * Renders the list of departments in the 'Departments' tab and populates various dropdowns across the app.
 */
export function renderDepartments() {
    if (!departmentListUl) return;

    departmentListUl.innerHTML = '';
    const selectDeptHTML = `<option value="" disabled selected data-lang-key="optSelectDept">${getTranslatedString('optSelectDept')}</option>`;
    const allDeptsOptionHTML = `<option value="all" data-lang-key="optAllDepts">${getTranslatedString('optAllDepts')}</option>`;

    roleDepartmentSelect.innerHTML = selectDeptHTML;
    shiftTemplateDepartmentSelect.innerHTML = selectDeptHTML;
    employeeListFilter.innerHTML = selectDeptHTML + allDeptsOptionHTML;
    employeeDepartmentSelect.innerHTML = `<option value="">-- ${getTranslatedString('optNoDept')} --</option>`;
    shiftTemplateListFilter.innerHTML = allDeptsOptionHTML;
    assignModalDepartmentFilter.innerHTML = allDeptsOptionHTML;

    const validDepartments = departments.filter(dept => dept && dept.id && dept.name);

    validDepartments.forEach(dept => {
        const li = document.createElement('li');
        li.className = 'draggable-department-item';
        li.draggable = true;
        li.dataset.departmentId = dept.id;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${dept.name} [${dept.abbreviation || 'N/A'}]`;
        li.appendChild(nameSpan);

        li.appendChild(createItemActionButtons(() => populateDepartmentFormForEdit(dept), () => deleteDepartment(dept.id)));
        departmentListUl.appendChild(li);

        li.addEventListener('dragstart', handleDepartmentDragStart);
        li.addEventListener('dragover', handleDepartmentDragOver);
        li.addEventListener('dragleave', handleDepartmentDragLeave);
        li.addEventListener('drop', handleDepartmentDrop);
        li.addEventListener('dragend', handleDepartmentDragEnd);

        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;

        employeeListFilter.appendChild(option.cloneNode(true));
        employeeDepartmentSelect.appendChild(option.cloneNode(true));
        shiftTemplateDepartmentSelect.appendChild(option.cloneNode(true));
        roleDepartmentSelect.appendChild(option.cloneNode(true));
        shiftTemplateListFilter.appendChild(option.cloneNode(true));
        assignModalDepartmentFilter.appendChild(option.cloneNode(true));
    });

    populateDepartmentFilter();
}