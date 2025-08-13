// js/ui/roles.js

import { roles, departments, scheduleAssignments, saveRoles, saveScheduleAssignments } from '../state.js';
import * as dom from '../dom.js';
import { getTranslatedString } from '../i18n.js';
import { createItemActionButtons, generateId } from '../utils.js';
import { renderWeeklySchedule } from './scheduler.js';
import { makeListSortable } from '../features/list-dnd.js';

// ===== Roles Department Multiselect =====
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
    const headerActions = rolesTab?.querySelector('.section-header .header-actions');
    if (headerActions) {
        headerActions.insertAdjacentElement('beforebegin', wrapper);
        wrapper.style.marginBottom = '20px';
    }
    const button = wrapper.querySelector('#role-dept-button');
    const checks = wrapper.querySelector('#role-dept-checkboxes');
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

// ... (Rest of the roles.js file remains the same, but the renderRoles function is updated)

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