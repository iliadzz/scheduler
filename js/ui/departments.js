// js/ui/departments.js
//  It no longer contains drag-and-drop logic; it just renders the list and then calls the new makeListSortable function.

import { departments, users, roles, shiftTemplates, restaurantSettings, saveDepartments, saveUsers, saveRoles, saveShiftTemplates } from '../state.js';
import * as dom from '../dom.js';
import { getTranslatedString } from '../i18n.js';
import { createItemActionButtons, generateId } from '../utils.js';
import { renderEmployees } from './employees.js';
import { renderRoles } from './roles.js';
import { renderWeeklySchedule } from './scheduler.js';
import { makeListSortable } from '../features/list-dnd.js';

export function handleSaveDepartment() {
    const name = dom.departmentNameInput.value.trim();
    const abbreviation = dom.departmentAbbreviationInput.value.trim().toUpperCase();
    const editingId = dom.editingDepartmentIdInput.value;

    if (!name || !abbreviation) {
        alert(getTranslatedString('alertDeptNameEmpty'));
        return;
    }

    if (editingId) {
        const deptIndex = departments.findIndex(d => d.id === editingId);
        if (deptIndex > -1) {
            departments[deptIndex].name = name;
            departments[deptIndex].abbreviation = abbreviation;
        }
    } else {
        if (departments.find(d => d.name.toLowerCase() === name.toLowerCase())) {
            alert('Department name already exists.');
            return;
        }
        departments.push({ id: generateId('dept'), name, abbreviation });
    }

    saveDepartments();
    renderDepartments();
    renderEmployees();
    resetDepartmentForm();
}

function populateDepartmentFilter() {
    if (!dom.departmentCheckboxesContainer) return;

    const savedStateJSON = localStorage.getItem('schedulerDepartmentFilterState');
    const savedState = savedStateJSON ? JSON.parse(savedStateJSON) : null;
    const isChecked = (value, defaultChecked = true) => {
        if (!savedState) return defaultChecked;
        const savedItem = savedState.find(s => s.value === value);
        return savedItem ? savedItem.checked : defaultChecked;
    };

    dom.departmentCheckboxesContainer.innerHTML = '';

    const allLabel = document.createElement('label');
    allLabel.innerHTML = `<input type="checkbox" value="all" ${isChecked('all') ? 'checked' : ''}> <strong data-lang-key="optAllDepts">${getTranslatedString('optAllDepts')}</strong>`;
    dom.departmentCheckboxesContainer.appendChild(allLabel);

    departments.forEach(dept => {
        const deptLabel = document.createElement('label');
        deptLabel.innerHTML = `<input type="checkbox" value="${dept.id}" ${isChecked(dept.id) ? 'checked' : ''}> ${dept.name}`;
        dom.departmentCheckboxesContainer.appendChild(deptLabel);
    });

    dom.departmentCheckboxesContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleDepartmentFilterChange);
    });
}

function handleDepartmentFilterChange(e = null) {
    const checkboxes = dom.departmentCheckboxesContainer.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length === 0) return;
    
    const allDeptsCheckbox = checkboxes[0];

    if (e && e.target.value === 'all') {
        checkboxes.forEach(cb => cb.checked = allDeptsCheckbox.checked);
    } else if (checkboxes.length > 1) {
        const allOthersChecked = Array.from(checkboxes).slice(1).every(cb => cb.checked);
        allDeptsCheckbox.checked = allOthersChecked;
    }

    if (e) {
        const checkboxState = Array.from(checkboxes).map(cb => ({ value: cb.value, checked: cb.checked }));
        localStorage.setItem('schedulerDepartmentFilterState', JSON.stringify(checkboxState));
    }

    let selectedDepartmentIds = Array.from(checkboxes).filter(cb => cb.checked && cb.value !== 'all').map(cb => cb.value);

    if (allDeptsCheckbox.checked) {
        selectedDepartmentIds = ['all'];
        dom.departmentFilterText.textContent = getTranslatedString('optAllDepts');
    } else if (selectedDepartmentIds.length === 0) {
        dom.departmentFilterText.textContent = "None selected";
        selectedDepartmentIds = ['none'];
    } else if (selectedDepartmentIds.length === 1) {
        const dept = departments.find(d => d.id === selectedDepartmentIds[0]);
        dom.departmentFilterText.textContent = dept ? dept.name : "1 selected";
    } else {
        dom.departmentFilterText.textContent = `${selectedDepartmentIds.length} departments`;
    }

    window.selectedDepartmentIds = selectedDepartmentIds;
    renderWeeklySchedule();
}

export function populateDepartmentFormForEdit(department) {
    dom.editingDepartmentIdInput.value = department.id;
    dom.departmentNameInput.value = department.name;
    dom.departmentAbbreviationInput.value = department.abbreviation || '';
    dom.addDepartmentBtn.textContent = 'Save Changes';
    dom.cancelEditDepartmentBtn.style.display = 'inline-block';
}

export function resetDepartmentForm() {
    dom.editingDepartmentIdInput.value = '';
    dom.departmentNameInput.value = '';
    dom.departmentAbbreviationInput.value = '';
    dom.addDepartmentBtn.textContent = getTranslatedString('btnAddDept');
    dom.cancelEditDepartmentBtn.style.display = 'none';
}

export async function deleteDepartment(deptId) {
    if (!confirm(getTranslatedString('confirmDeleteDept'))) return;

    const updatedDepts = departments.filter(d => d.id !== deptId);
    departments.length = 0;
    Array.prototype.push.apply(departments, updatedDepts);

    users.forEach(user => { if (user.departmentId === deptId) user.departmentId = null; });
    roles.forEach(role => { if (role.departmentId === deptId) role.departmentId = null; });
    shiftTemplates.forEach(st => { 
        if (st.departmentIds && st.departmentIds.includes(deptId)) {
            st.departmentIds = st.departmentIds.filter(id => id !== deptId);
        }
     });

    if (restaurantSettings.minCoverage && restaurantSettings.minCoverage[deptId]) {
        delete restaurantSettings.minCoverage[deptId];
    }

    saveUsers();
    saveRoles();
    saveShiftTemplates();
    saveDepartments();

    renderDepartments();
    renderEmployees();
    renderRoles();
    
    const { renderShiftTemplates } = await import('./shifts.js');
    renderShiftTemplates();

    if (dom.editingDepartmentIdInput.value === deptId) {
        resetDepartmentForm();
    }
}

export function renderDepartments() {
    if (!dom.departmentListUl) return;
    const savedEmployeeFilter = localStorage.getItem('employeeListFilterValue');
    dom.departmentListUl.innerHTML = '';
    
    const selectDeptHTML = `<option value="" disabled data-lang-key="optSelectDept">${getTranslatedString('optSelectDept')}</option>`;
    
    if (dom.roleDepartmentSelect) {
        dom.roleDepartmentSelect.innerHTML = selectDeptHTML;
    }
    
    // *** FIX IS HERE ***
    // Add a check to ensure the element exists before trying to modify it.
    if (dom.shiftTemplateDepartmentSelect) {
        dom.shiftTemplateDepartmentSelect.innerHTML = selectDeptHTML;
    }
    
    if (dom.employeeDepartmentSelect) {
        dom.employeeDepartmentSelect.innerHTML = `<option value="">-- ${getTranslatedString('optNoDept')} --</option>`;
    }
    
    const validDepartments = departments.filter(dept => dept && dept.id && dept.name);
    validDepartments.forEach(dept => {
        const li = document.createElement('li');
        li.className = 'draggable-item';
        li.draggable = true;
        li.dataset.itemId = dept.id;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${dept.name} [${dept.abbreviation || 'N/A'}]`;
        li.appendChild(nameSpan);

        li.appendChild(createItemActionButtons(() => populateDepartmentFormForEdit(dept), () => deleteDepartment(dept.id)));
        dom.departmentListUl.appendChild(li);

        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;

        if (dom.employeeDepartmentSelect) {
            dom.employeeDepartmentSelect.appendChild(option.cloneNode(true));
        }
        if (dom.shiftTemplateDepartmentSelect) {
            dom.shiftTemplateDepartmentSelect.appendChild(option.cloneNode(true));
        }
        if (dom.roleDepartmentSelect) {
            dom.roleDepartmentSelect.appendChild(option.cloneNode(true));
        }
    });

    makeListSortable(dom.departmentListUl, departments, saveDepartments, renderDepartments);

    if (savedEmployeeFilter && dom.employeeListFilter.querySelector(`option[value="${savedEmployeeFilter}"]`)) {
        dom.employeeListFilter.value = savedEmployeeFilter;
    } else if (dom.employeeListFilter) {
        dom.employeeListFilter.value = 'all';
    }

    populateDepartmentFilter();
}

export function initializeSchedulerFilter() {
    if (!dom.departmentCheckboxesContainer) return;
    handleDepartmentFilterChange();
}