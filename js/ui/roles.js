// js/ui/roles.js

import {
    roles,
    departments,
    scheduleAssignments,
    saveRoles,
    saveScheduleAssignments
} from '../state.js';

import {
    roleListUl,
    editingRoleIdInput,
    roleNameInput,
    roleColorInput,
    roleDepartmentSelect,
    addRoleBtn,
    cancelEditRoleBtn,
    roleColorPalette,
    roleColorPreview
} from '../dom.js';

import { getTranslatedString } from '../i18n.js';
import { createItemActionButtons, generateId } from '../utils.js';
import { renderWeeklySchedule } from './scheduler.js';


// --- Color Palette Definition (Teals replaced with Yellows) ---
const ROLE_COLORS_PALETTE = [
    '#2E86C1', '#5DADE2', '#85C1E9', '#AED6F1', '#F1C40F', '#F4D03F', '#F7DC6F', '#F9E79F',
    '#239B56', '#2ECC71', '#58D68D', '#82E0AA', '#D68910', '#F39C12', '#F5B041', '#F8C471',
    '#B03A2E', '#E74C3C', '#EC7063', '#F1948A', '#7D3C98', '#9B59B6', '#AF7AC5', '#C39BD3'
];

let draggedRoleInfo = null;

// --- Main Exported Functions ---

/**
 * Creates the color swatch elements and sets up the popup logic.
 */
export function populateRoleColorPalette() {
    if (!roleColorPalette) return;
    const popup = document.getElementById('role-color-popup');
    roleColorPalette.innerHTML = ''; // Clear existing swatches

    ROLE_COLORS_PALETTE.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;

        swatch.addEventListener('click', () => {
            roleColorInput.value = color;
            roleColorPreview.style.backgroundColor = color;
            if (popup) popup.style.display = 'none';
            roleColorPalette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
        });
        roleColorPalette.appendChild(swatch);
    });

    // Toggle popup visibility
    if (roleColorPreview && popup) {
        roleColorPreview.addEventListener('click', (e) => {
            e.stopPropagation();
            popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
        });
    }
    
    // Close popup if clicking elsewhere
    document.addEventListener('click', (e) => {
        if (popup && !popup.contains(e.target) && e.target !== roleColorPreview) {
            popup.style.display = 'none';
        }
    });
}

/**
 * Handles the logic for saving a new or edited role.
 */
export function handleSaveRole() {
    const name = roleNameInput.value.trim();
    const color = roleColorInput.value;
    const departmentId = roleDepartmentSelect.value;
    const editingId = editingRoleIdInput.value;

    if (!departmentId) { alert('Please select a department for the role.'); return; }
    if (!name) { alert('Role name cannot be empty.'); return; }
    if (!color) { alert('Please select a color for the role.'); return; }

    const roleData = { name, color, departmentId };

    if (editingId) {
        const roleIndex = roles.findIndex(r => r.id === editingId);
        if (roleIndex > -1) {
            roles[roleIndex] = { ...roles[roleIndex], ...roleData };
        }
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

/**
 * Fills the role form with data for editing.
 * @param {object} role - The role object to edit.
 */
export function populateRoleFormForEdit(role) {
    editingRoleIdInput.value = role.id;
    roleNameInput.value = role.name;
    roleDepartmentSelect.value = role.departmentId || "";
    
    roleColorInput.value = role.color;
    roleColorPreview.style.backgroundColor = role.color;
    
    roleColorPalette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    const swatchToSelect = roleColorPalette.querySelector(`.color-swatch[data-color="${role.color}"]`);
    if (swatchToSelect) {
        swatchToSelect.classList.add('selected');
    }

    addRoleBtn.textContent = 'Save Changes';
    cancelEditRoleBtn.style.display = 'inline-block';
}

/**
 * Resets the role form to its default state for adding a new role.
 */
export function resetRoleForm() {
    editingRoleIdInput.value = '';
    roleNameInput.value = '';
    roleDepartmentSelect.value = "";
    
    const firstColor = ROLE_COLORS_PALETTE[0];
    roleColorInput.value = firstColor;
    roleColorPreview.style.backgroundColor = firstColor;
    
    roleColorPalette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    if (roleColorPalette.firstChild) {
        roleColorPalette.firstChild.classList.add('selected');
    }

    addRoleBtn.textContent = getTranslatedString('btnAddRole');
    cancelEditRoleBtn.style.display = 'none';
}

/**
 * Deletes a role after confirmation.
 * @param {string} roleId - The ID of the role to delete.
 */
export function deleteRole(roleId) {
    let usageCount = 0;
    for (const key in scheduleAssignments) {
        const dayData = scheduleAssignments[key];
        if (dayData?.shifts?.length) {
            dayData.shifts.forEach(shift => {
                if (shift.roleId === roleId) {
                    usageCount++;
                }
            });
        }
    }

    let proceed = false;
    if (usageCount > 0) {
        const confirmMessage = `Warning: This role is currently assigned to ${usageCount} shift(s) on the schedule. Deleting it will also remove these assignments.\n\nAre you sure you want to proceed?`;
        proceed = confirm(confirmMessage);
    } else {
        proceed = confirm(`Are you sure you want to delete this role?`);
    }

    if (!proceed) return;

    const updatedRoles = roles.filter(r => r.id !== roleId);
    roles.length = 0;
    Array.prototype.push.apply(roles, updatedRoles);

    for (const key in scheduleAssignments) {
        const dayData = scheduleAssignments[key];
        if (dayData?.shifts) {
            dayData.shifts = dayData.shifts.filter(a => a.roleId !== roleId);
            if (dayData.shifts.length === 0) {
                delete scheduleAssignments[key];
            }
        }
    }

    saveScheduleAssignments();
    saveRoles();
    renderRoles();
    renderWeeklySchedule();

    if (editingRoleIdInput.value === roleId) {
        resetRoleForm();
    }
}

// --- Drag and Drop Handlers ---

function handleRoleDragStart(event) {
    const roleId = event.currentTarget.dataset.roleId;
    draggedRoleInfo = { id: roleId };
    event.dataTransfer.setData('text/plain', roleId);
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => event.currentTarget.classList.add('role-dragging'), 0);
}

function handleRoleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const targetRow = event.currentTarget;
    if (targetRow && targetRow.dataset.roleId !== (draggedRoleInfo ? draggedRoleInfo.id : null)) {
        targetRow.classList.add('role-drag-over');
    }
}

function handleRoleDragLeave(event) {
    event.currentTarget.classList.remove('role-drag-over');
}

function handleRoleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const targetRow = event.currentTarget;
    targetRow.classList.remove('role-drag-over');
    if (!draggedRoleInfo) return;

    const droppedOnRoleId = targetRow.dataset.roleId;
    if (draggedRoleInfo.id === droppedOnRoleId) return;

    const fromIndex = roles.findIndex(r => r.id === draggedRoleInfo.id);
    const toIndex = roles.findIndex(r => r.id === droppedOnRoleId);

    if (fromIndex === -1 || toIndex === -1) return;

    const [movedRole] = roles.splice(fromIndex, 1);
    roles.splice(toIndex, 0, movedRole);

    saveRoles();
    renderRoles();
}

function handleRoleDragEnd(event) {
    if (event.currentTarget) {
        event.currentTarget.classList.remove('role-dragging');
    }
    document.querySelectorAll('.role-drag-over').forEach(row => row.classList.remove('role-drag-over'));
    draggedRoleInfo = null;
}

/**
 * Renders the list of roles in the 'Roles' tab.
 */
export function renderRoles() {
    if (!roleListUl) return;
    roleListUl.innerHTML = '';

    roles.forEach(role => {
        const li = document.createElement('li');
        li.className = 'draggable-role-item';
        li.draggable = true;
        li.dataset.roleId = role.id;

        const dept = departments.find(d => d.id === role.departmentId);
        const deptAbbr = dept ? `[${dept.abbreviation}]` : '[GEN]';

        const contentDiv = document.createElement('div');
        contentDiv.style.display = 'flex';
        contentDiv.style.alignItems = 'center';

        const colorSwatch = document.createElement('span');
        colorSwatch.className = 'role-color-swatch';
        colorSwatch.style.backgroundColor = role.color;
        contentDiv.appendChild(colorSwatch);
        contentDiv.appendChild(document.createTextNode(` ${deptAbbr} ${role.name}`));
        li.appendChild(contentDiv);

        li.appendChild(createItemActionButtons(() => populateRoleFormForEdit(role), () => deleteRole(role.id)));
        roleListUl.appendChild(li);

        li.addEventListener('dragstart', handleRoleDragStart);
        li.addEventListener('dragover', handleRoleDragOver);
        li.addEventListener('dragleave', handleRoleDragLeave);
        li.addEventListener('drop', handleRoleDrop);
        li.addEventListener('dragend', handleRoleDragEnd);
    });
}