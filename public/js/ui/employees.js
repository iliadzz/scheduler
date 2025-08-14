// js/ui/employees.js

import {
    users,
    departments,
    scheduleAssignments,
    terminationReasons,
    DEFAULT_VACATION_DAYS,
    saveUsers,
    saveScheduleAssignments
} from '../state.js';

import {
    employeeListUl,
    employeeListFilter,
    editingEmployeeIdInput,
    employeeFormModal,
    employeeModalTitle,
    employeeFirstNameInput,
    employeeLastNameInput,
    employeeDisplayNameInput,
    employeeDobInput,
    employeePhoneCodeInput,
    employeePhoneNumberInput,
    employeeEmailInput,
    employeeAddress1Input,
    employeeAddress2Input,
    employeeCityInput,
    employeeDepartmentAddressInput,
    employeeCountryInput,
    employeeDepartmentSelect,
    employeeStartDateInput,
    employeeTerminationDateInput,
    employeeTerminationReasonInput,
    employeeVacationBalanceInput,
    addEmployeeBtn,
    cancelEditEmployeeBtn,
    employeeStatusSelect,
    terminationDetails,
    showInactiveEmployeesCheckbox
} from '../dom.js';

import { getTranslatedString } from '../i18n.js';
import { createItemActionButtons, generateId } from '../utils.js';

// ---- Employees Department Multiselect (mirrors Scheduler) ----
const EMP_FILTER_KEY = 'employeesDepartmentFilterState';

export function ensureEmployeeDeptMultiselect() {
  if (document.getElementById('employee-dept-multiselect')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'multiselect';
  wrapper.id = 'employee-dept-multiselect';

  const button = document.createElement('div');
  button.className = 'select-box';
  button.id = 'employee-dept-button';
  button.innerHTML = `<span id="employee-dept-text">All Departments</span><i class="fas fa-chevron-down"></i>`;

  const checks = document.createElement('div');
  checks.className = 'checkboxes-container';
  checks.id = 'employee-dept-checkboxes';

  wrapper.appendChild(button);
  wrapper.appendChild(checks);

  if (employeeListFilter && employeeListFilter.parentElement) {
    employeeListFilter.style.display = 'none';
    employeeListFilter.parentElement.insertBefore(wrapper, employeeListFilter.nextSibling);
  }

  button.addEventListener('click', () => {
    checks.classList.toggle('visible');
    button.classList.toggle('expanded');
  });

  window.addEventListener('click', (ev) => {
    if (!wrapper.contains(ev.target)) {
      checks.classList.remove('visible');
      button.classList.remove('expanded');
    }
  });
}

export function populateEmployeeDeptCheckboxes() {
  const checks = document.getElementById('employee-dept-checkboxes');
  const labelSpan = document.getElementById('employee-dept-text');
  if (!checks || !labelSpan) return;

  checks.innerHTML = '';

  const savedJSON = localStorage.getItem(EMP_FILTER_KEY);
  const saved = savedJSON ? JSON.parse(savedJSON) : null;

  const isChecked = (value, def = true) => {
    if (!saved) return def;
    const rec = saved.find(s => s.value === value);
    return rec ? !!rec.checked : def;
  };

  const allChecked = isChecked('all', true);
  const allLabel = document.createElement('label');
  allLabel.innerHTML = `<input type="checkbox" value="all" ${allChecked ? 'checked' : ''}> <strong>All Departments</strong>`;
  checks.appendChild(allLabel);

  departments.forEach(d => {
    const lab = document.createElement('label');
    const checked = isChecked(d.id, true);
    lab.innerHTML = `<input type="checkbox" value="${d.id}" ${checked ? 'checked' : ''}> ${d.name}`;
    checks.appendChild(lab);
  });

  const onChange = (e) => {
    const all = checks.querySelector('input[value="all"]');
    const boxes = [...checks.querySelectorAll('input[type="checkbox"]')];

    if (e && e.target.value === 'all') {
      boxes.forEach(cb => cb.checked = all.checked);
    } else {
      const allOthersChecked = boxes.slice(1).every(cb => cb.checked);
      all.checked = allOthersChecked;
    }

    const state = boxes.map(cb => ({ value: cb.value, checked: cb.checked }));
    localStorage.setItem(EMP_FILTER_KEY, JSON.stringify(state));
    updateEmployeeDeptLabel();
    renderEmployees();
  };

  checks.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.addEventListener('change', onChange));
  updateEmployeeDeptLabel();
}

function getSelectedEmployeeDepartmentIds() {
  const savedJSON = localStorage.getItem(EMP_FILTER_KEY);
  if (!savedJSON) return null;
  const saved = JSON.parse(savedJSON);
  const selected = saved.filter(s => s.value !== 'all' && s.checked).map(s => s.value);
  const all = saved.find(s => s.value === 'all');
  if (all && all.checked) return null;
  return selected;
}

function updateEmployeeDeptLabel() {
  const labelSpan = document.getElementById('employee-dept-text');
  if (!labelSpan) return;

  const selected = getSelectedEmployeeDepartmentIds();
  if (selected === null) {
    labelSpan.textContent = 'All Departments';
  } else if (selected.length === 0) {
    labelSpan.textContent = 'None selected';
  } else {
    const names = departments.filter(d => selected.includes(d.id)).map(d => d.name);
    labelSpan.textContent = names.length > 3 ? `${names.length} selected` : names.join(', ');
  }
}

async function toggleEmployeeVisibility(userId) {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        users[userIndex].isVisible = !(users[userIndex].isVisible === true);
        saveUsers();
        renderEmployees();
        const { renderWeeklySchedule } = await import('./scheduler.js');
        renderWeeklySchedule();
    }
}

function createVisibilityToggle(user) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'visibility-toggle-btn';
    toggleBtn.title = user.isVisible !== false ? 'Hide from schedule' : 'Show on schedule';
    const icon = document.createElement('i');
    icon.className = 'fas';
    if (user.isVisible === false) {
        icon.classList.add('fa-eye-slash');
        toggleBtn.classList.add('inactive');
    } else {
        icon.classList.add('fa-eye');
    }
    toggleBtn.appendChild(icon);
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleEmployeeVisibility(user.id);
    });
    return toggleBtn;
}

export function populateEmployeeFormForEdit(user) {
    editingEmployeeIdInput.value = user.id;
    employeeFirstNameInput.value = user.firstName || '';
    employeeLastNameInput.value = user.lastName || '';
    employeeDisplayNameInput.value = user.displayName || '';
    employeeDobInput.value = user.dob || '';
    employeePhoneCodeInput.value = user.phone?.code || '+502';
    employeePhoneNumberInput.value = user.phone?.number || '';
    employeeEmailInput.value = user.email || '';
    employeeAddress1Input.value = user.address?.line1 || '';
    employeeAddress2Input.value = user.address?.line2 || '';
    employeeCityInput.value = user.address?.city || '';
    employeeDepartmentAddressInput.value = user.address?.department || '';
    employeeCountryInput.value = user.address?.country || '';
    employeeDepartmentSelect.value = user.departmentId || "";
    employeeStartDateInput.value = user.startDate || '';
    employeeVacationBalanceInput.value = user.vacationBalance ?? DEFAULT_VACATION_DAYS;
    if (user.status === 'Terminated') {
        employeeStatusSelect.value = 'Terminated';
        terminationDetails.style.display = 'block';
        employeeTerminationDateInput.value = user.terminationDate || '';
        employeeTerminationReasonInput.value = user.terminationReason || '';
    } else {
        employeeStatusSelect.value = 'Active';
        terminationDetails.style.display = 'none';
        employeeTerminationDateInput.value = '';
        employeeTerminationReasonInput.value = '';
    }
    addEmployeeBtn.textContent = 'Save Changes';
    cancelEditEmployeeBtn.style.display = 'inline-block';
}

export function resetEmployeeForm() {
    editingEmployeeIdInput.value = '';
    employeeFirstNameInput.value = '';
    employeeLastNameInput.value = '';
    employeeDisplayNameInput.value = '';
    employeeDobInput.value = '';
    employeePhoneCodeInput.value = '+502';
    employeePhoneNumberInput.value = '';
    employeeEmailInput.value = '';
    employeeAddress1Input.value = '';
    employeeAddress2Input.value = '';
    employeeCityInput.value = '';
    employeeDepartmentAddressInput.value = '';
    employeeCountryInput.value = '';
    employeeDepartmentSelect.value = "";
    employeeStartDateInput.value = '';
    employeeVacationBalanceInput.value = DEFAULT_VACATION_DAYS;
    employeeStatusSelect.value = 'Active';
    terminationDetails.style.display = 'none';
    employeeTerminationDateInput.value = '';
    employeeTerminationReasonInput.value = '';
    addEmployeeBtn.textContent = getTranslatedString('btnAddEmployee');
    cancelEditEmployeeBtn.style.display = 'none';
}

export async function handleSaveEmployee() {
    const editingId = editingEmployeeIdInput.value;
    if (!employeeFirstNameInput.value.trim() || !employeeLastNameInput.value.trim()) {
        alert('First Name and Last Name are required.');
        return;
    }
    const employeeData = {
        firstName: employeeFirstNameInput.value.trim(),
        lastName: employeeLastNameInput.value.trim(),
        displayName: employeeDisplayNameInput.value.trim() || `${employeeFirstNameInput.value.trim()} ${employeeLastNameInput.value.trim()}`,
        dob: employeeDobInput.value,
        phone: { code: employeePhoneCodeInput.value, number: employeePhoneNumberInput.value.trim() },
        email: employeeEmailInput.value.trim(),
        address: { line1: employeeAddress1Input.value.trim(), line2: employeeAddress2Input.value.trim(), city: employeeCityInput.value.trim(), department: employeeDepartmentAddressInput.value.trim(), country: employeeCountryInput.value.trim() },
        startDate: employeeStartDateInput.value,
        departmentId: employeeDepartmentSelect.value || null,
        vacationBalance: parseInt(employeeVacationBalanceInput.value, 10) || 0,
        status: employeeStatusSelect.value,
    };
    if (employeeData.status === 'Terminated') {
        employeeData.terminationDate = employeeTerminationDateInput.value || null;
        employeeData.terminationReason = employeeTerminationReasonInput.value || null;
    } else {
        employeeData.terminationDate = null;
        employeeData.terminationReason = null;
    }
    if (editingId) {
        const userIndex = users.findIndex(u => u.id === editingId);
        if (userIndex > -1) users[userIndex] = { ...users[userIndex], ...employeeData };
    } else {
        users.push({ id: generateId('user'), ...employeeData, isVisible: true });
    }
    saveUsers();
    renderEmployees();
    const { renderWeeklySchedule } = await import('./scheduler.js');
    renderWeeklySchedule();
    resetEmployeeForm();
    if (employeeFormModal) employeeFormModal.style.display = 'none';
}

export async function deleteEmployee(userId) {
    if (!confirm(`Are you sure you want to delete this employee? This will also remove all their scheduled shifts.`)) return;
    const updatedUsers = users.filter(u => u.id !== userId);
    users.length = 0;
    Array.prototype.push.apply(users, updatedUsers);
    for (const key in scheduleAssignments) {
        if (key.startsWith(userId + '-')) delete scheduleAssignments[key];
    }
    saveScheduleAssignments();
    saveUsers();
    renderEmployees();
    const { renderWeeklySchedule } = await import('./scheduler.js');
    renderWeeklySchedule();
    if (editingEmployeeIdInput.value === userId) {
        if (employeeFormModal) employeeFormModal.style.display = 'none';
        resetEmployeeForm();
    }
}

export function populateTerminationReasons() {
    if (!employeeTerminationReasonInput) return;
    employeeTerminationReasonInput.innerHTML = '<option value="">-- Select a Reason --</option>';
    terminationReasons.forEach(reason => {
        const option = document.createElement('option');
        option.value = reason;
        option.textContent = reason;
        employeeTerminationReasonInput.appendChild(option);
    });
}

export function renderEmployees() {
    if (!employeeListUl) return;
    employeeListUl.innerHTML = '';
    
    const showInactive = showInactiveEmployeesCheckbox.checked;
    const selectedDeptIds = getSelectedEmployeeDepartmentIds();
    
    const employeesToDisplay = users.filter(user => {
        const statusMatch = showInactive ? true : (user.status === 'Active' || user.status === undefined);
        const deptMatch = (selectedDeptIds === null) ? true : selectedDeptIds.includes(user.departmentId);
        return statusMatch && deptMatch;
    });

    employeesToDisplay.forEach(user => {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        const dept = departments.find(d => d.id === user.departmentId);
        const deptName = dept ? dept.name : getTranslatedString('optNoDept');
        const statusIndicator = (user.status === 'Terminated') ? ' (Inactive)' : '';
        const employeeName = user.displayName || `${user.firstName} ${user.lastName}`;
        nameSpan.textContent = `${employeeName.trim()} (${deptName})${statusIndicator}`;
        if (user.status === 'Terminated') li.style.opacity = '0.6';
        li.appendChild(nameSpan);
        const editHandler = () => {
            if (employeeModalTitle) employeeModalTitle.textContent = getTranslatedString('hdrEditEmployee');
            populateEmployeeFormForEdit(user);
            if (employeeFormModal) employeeFormModal.style.display = 'block';
        };
        const deleteHandler = () => deleteEmployee(user.id);
        const actionButtonsDiv = createItemActionButtons(editHandler, deleteHandler);
        actionButtonsDiv.prepend(createVisibilityToggle(user));
        li.appendChild(actionButtonsDiv);
        employeeListUl.appendChild(li);
    });
}

export function initEmployeeModalListeners() {
    if (employeeStatusSelect) {
        employeeStatusSelect.addEventListener('change', () => {
            terminationDetails.style.display = employeeStatusSelect.value === 'Terminated' ? 'block' : 'none';
        });
    }
    if (showInactiveEmployeesCheckbox) {
        showInactiveEmployeesCheckbox.addEventListener('change', renderEmployees);
    }
}