// js/ui/roles.js

import { roles, departments, scheduleAssignments, saveRoles, saveScheduleAssignments } from '../state.js';
import * as dom from '../dom.js';
import { getTranslatedString } from '../i18n.js';
import { createItemActionButtons, generateId } from '../utils.js';
import { makeListSortable } from '../features/list-dnd.js';

const ROLES_FILTER_KEY = 'rolesDepartmentFilterState';

export function ensureRoleDeptMultiselect() {
  if (document.getElementById('role-dept-multiselect')) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'multiselect';
  wrapper.id = 'role-dept-multiselect';
  wrapper.innerHTML = `
    <div class="select-box" id="role-dept-button">
        <span id="role-dept-text">All Departments</span>
        <i class="fas fa-chevron-down"></i>
    </div>
    <div class="checkboxes-container" id="role-dept-checkboxes"></div>
  `;
  const rolesTab = document.getElementById('roles-tab');
  const existingFormGroup = rolesTab?.querySelector('.form-group');
  if (existingFormGroup) {
      existingFormGroup.insertAdjacentElement('beforebegin', wrapper);
      wrapper.style.marginBottom = '20px';
  }
}

export function populateRoleDeptCheckboxes() {
  const checks = document.getElementById('role-dept-checkboxes');
  if (!checks) return;
  checks.innerHTML = '';
  const savedJSON = localStorage.getItem(ROLES_FILTER_KEY);
  const saved = savedJSON ? JSON.parse(savedJSON) : null;
  const isChecked = (value, def = true) => {
    if (!saved) return def;
    const rec = saved.find(s => s.value === value);
    return rec ? !!rec.checked : def;
  };
  const allChecked = isChecked('all', true);
  let allLabel = document.createElement('label');
  allLabel.innerHTML = `<input type="checkbox" value="all" ${allChecked ? 'checked' : ''}> <strong>All Departments</strong>`;
  checks.appendChild(allLabel);
  departments.forEach(d => {
    let lab = document.createElement('label');
    let checked = isChecked(d.id, true);
    lab.innerHTML = `<input type="checkbox" value="${d.id}" ${checked ? 'checked' : ''}> ${d.name}`;
    checks.appendChild(lab);
  });
  checks.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.addEventListener('change', (e) => {
    const all = checks.querySelector('input[value="all"]');
    const boxes = [...checks.querySelectorAll('input[type="checkbox"]')];
    if (e && e.target.value === 'all') {
      boxes.forEach(cb => cb.checked = all.checked);
    } else {
      all.checked = boxes.slice(1).every(cb => cb.checked);
    }
    const state = boxes.map(cb => ({ value: cb.value, checked: cb.checked }));
    localStorage.setItem(ROLES_FILTER_KEY, JSON.stringify(state));
    updateRoleDeptLabel();
    renderRoles();
  }));
  updateRoleDeptLabel();
}

function getSelectedRoleDepartmentIds() {
  const savedJSON = localStorage.getItem(ROLES_FILTER_KEY);
  if (!savedJSON) return null;
  const saved = JSON.parse(savedJSON);
  const selected = saved.filter(s => s.value !== 'all' && s.checked).map(s => s.value);
  const all = saved.find(s => s.value === 'all');
  return (all && all.checked) ? null : selected;
}

function updateRoleDeptLabel() {
  const labelSpan = document.getElementById('role-dept-text');
  if (!labelSpan) return;
  const selected = getSelectedRoleDepartmentIds();
  if (selected === null) {
    labelSpan.textContent = 'All Departments';
  } else if (selected.length === 0) {
    labelSpan.textContent = 'None selected';
  } else {
    const names = departments.filter(d => selected.includes(d.id)).map(d => d.name);
    labelSpan.textContent = names.length > 2 ? `${names.length} selected` : names.join(', ');
  }
}

const ROLE_COLORS_PALETTE = [
    '#2E86C1', '#5DADE2', '#85C1E9', '#AED6F1', '#F1C40F', '#F4D03F', '#F7DC6F', '#F9E79F',
    '#239B56', '#2ECC71', '#58D68D', '#82E0AA', '#D68910', '#F39C12', '#F5B041', '#F8C471',
    '#B03A2E', '#E74C3C', '#EC7063', '#F1948A', '#7D3C98', '#9B59B6', '#AF7AC5', '#C39BD3'
];

export function populateRoleColorPalette() {
    if (!dom.roleColorPalette) return;
    const popup = document.getElementById('role-color-popup');
    dom.roleColorPalette.innerHTML = '';
    ROLE_COLORS_PALETTE.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;
        swatch.addEventListener('click', () => {
            dom.roleColorInput.value = color;
            dom.roleColorPreview.style.backgroundColor = color;
            if (popup) popup.style.display = 'none';
            dom.roleColorPalette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
        });
        dom.roleColorPalette.appendChild(swatch);
    });
    if (dom.roleColorPreview && popup) {
        dom.roleColorPreview.addEventListener('click', (e) => {
            e.stopPropagation();
            popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
        });
    }
}

export function handleSaveRole() {
    const name = dom.roleNameInput.value.trim();
    const color = dom.roleColorInput.value;
    const departmentId = dom.roleDepartmentSelect.value;
    const editingId = dom.editingRoleIdInput.value;

    if (!departmentId) { alert('Please select a department for the role.'); return; }
    if (!name) { alert('Role name cannot be empty.'); return; }
    if (!color) { alert('Please select a color for the role.'); return; }

    const roleData = { name, color, departmentId };

    if (editingId) {
        const roleIndex = roles.findIndex(r => r.id === editingId);
        if (roleIndex > -1) roles[roleIndex] = { ...roles[roleIndex], ...roleData };
    } else {
        if (roles.find(r => r.name.toLowerCase() === name.toLowerCase() && r.departmentId === departmentId)) {
            alert('A role with this name already exists in this department.');
            return;
        }
        roles.push({ id: generateId('role'), ...roleData });
    }
    saveRoles();
    renderRoles();
    resetRoleForm();
}

export function populateRoleFormForEdit(role) {
    dom.editingRoleIdInput.value = role.id;
    dom.roleNameInput.value = role.name;
    dom.roleDepartmentSelect.value = role.departmentId || "";
    dom.roleColorInput.value = role.color;
    dom.roleColorPreview.style.backgroundColor = role.color;
    dom.roleColorPalette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    const swatchToSelect = dom.roleColorPalette.querySelector(`.color-swatch[data-color="${role.color}"]`);
    if (swatchToSelect) swatchToSelect.classList.add('selected');
    dom.addRoleBtn.textContent = 'Save Changes';
    dom.cancelEditRoleBtn.style.display = 'inline-block';
}

export function resetRoleForm() {
    dom.editingRoleIdInput.value = '';
    dom.roleNameInput.value = '';
    dom.roleDepartmentSelect.value = "";
    const firstColor = ROLE_COLORS_PALETTE[0];
    dom.roleColorInput.value = firstColor;
    dom.roleColorPreview.style.backgroundColor = firstColor;
    dom.roleColorPalette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    if (dom.roleColorPalette.firstChild) dom.roleColorPalette.firstChild.classList.add('selected');
    dom.addRoleBtn.textContent = getTranslatedString('btnAddRole');
    dom.cancelEditRoleBtn.style.display = 'none';
}

export async function deleteRole(roleId) {
    let usageCount = 0;
    for (const key in scheduleAssignments) {
        const dayData = scheduleAssignments[key];
        if (dayData?.shifts?.length) {
            dayData.shifts.forEach(shift => {
                if (shift.roleId === roleId) usageCount++;
            });
        }
    }
    let proceed = usageCount > 0 ? confirm(`Warning: This role is currently assigned to ${usageCount} shift(s). Deleting it will also remove these assignments. Proceed?`) : confirm(`Are you sure you want to delete this role?`);
    if (!proceed) return;

    const updatedRoles = roles.filter(r => r.id !== roleId);
    roles.length = 0;
    Array.prototype.push.apply(roles, updatedRoles);

    for (const key in scheduleAssignments) {
        const dayData = scheduleAssignments[key];
        if (dayData?.shifts) {
            dayData.shifts = dayData.shifts.filter(a => a.roleId !== roleId);
            if (dayData.shifts.length === 0) delete scheduleAssignments[key];
        }
    }
    saveScheduleAssignments();
    saveRoles();
    renderRoles();
    const { renderWeeklySchedule } = await import('./scheduler.js');
    renderWeeklySchedule();
    if (dom.editingRoleIdInput.value === roleId) resetRoleForm();
}

export function renderRoles() {
    if (!dom.roleListUl) return;
    dom.roleListUl.innerHTML = '';
    const selectedDeptIds = getSelectedRoleDepartmentIds();
    const rolesToDisplay = roles.filter(r => 
        (selectedDeptIds === null) ? true : selectedDeptIds.includes(r.departmentId)
    );
    rolesToDisplay.forEach(role => {
        const li = document.createElement('li');
        li.className = 'draggable-item';
        li.draggable = true;
        li.dataset.itemId = role.id;
        const dept = departments.find(d => d.id === role.departmentId);
        const deptAbbr = dept ? `[${dept.abbreviation}]` : '[GEN]';
        li.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span class="role-color-swatch" style="background-color: ${role.color};"></span>
                <span> ${deptAbbr} ${role.name}</span>
            </div>
        `;
        li.appendChild(createItemActionButtons(() => populateRoleFormForEdit(role), () => deleteRole(role.id)));
        dom.roleListUl.appendChild(li);
    });
    makeListSortable(dom.roleListUl, roles, saveRoles, renderRoles);
}