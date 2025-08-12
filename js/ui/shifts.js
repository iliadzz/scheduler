// This file handles all logic for the "Shift Templates" tab, including rendering the list of templates grouped by department, 
// handling the add/edit form, and managing drag-and-drop reordering.

// js/ui/shifts.js

// 1. Import Dependencies
import {
    shiftTemplates,
    departments,
    saveShiftTemplates
} from '../state.js';

import {
    shiftTemplateContainer,
    shiftTemplateListFilter,
    editingShiftTemplateIdInput,
    shiftTemplateNameInput,
    shiftTemplateDepartmentSelect,
    shiftTemplateStartHourSelect,
    shiftTemplateStartMinuteSelect,
    shiftTemplateEndHourSelect,
    shiftTemplateEndMinuteSelect,
    addShiftTemplateBtn,
    cancelEditShiftTemplateBtn
} from '../dom.js';

import { getTranslatedString } from '../i18n.js';
import { createItemActionButtons, calculateShiftDuration, formatTimeForDisplay, formatTimeToHHMM, generateId } from '../utils.js';

// --- Private State for this Module ---
let draggedShiftTemplateInfo = null;

// --- Form Management Functions ---

/**
 * Fills the shift template form with data for editing.
 * @param {object} template - The shift template object to edit.
 */
export function populateShiftTemplateFormForEdit(template) {
    editingShiftTemplateIdInput.value = template.id;
    shiftTemplateNameInput.value = template.name;
    shiftTemplateDepartmentSelect.value = template.departmentId || "";

    const [startH, startM] = template.start.split(':');
    const [endH, endM] = template.end.split(':');
    shiftTemplateStartHourSelect.value = startH;
    shiftTemplateStartMinuteSelect.value = startM;
    shiftTemplateEndHourSelect.value = endH;
    shiftTemplateEndMinuteSelect.value = endM;

    addShiftTemplateBtn.textContent = 'Save Changes'; // Should be translated
    cancelEditShiftTemplateBtn.style.display = 'inline-block';
}

/**
 * Resets the shift template form to its default state.
 */
export function resetShiftTemplateForm() {
    editingShiftTemplateIdInput.value = '';
    shiftTemplateNameInput.value = '';
    shiftTemplateDepartmentSelect.value = "";
    shiftTemplateStartHourSelect.value = "09";
    shiftTemplateStartMinuteSelect.value = "00";
    shiftTemplateEndHourSelect.value = "17";
    shiftTemplateEndMinuteSelect.value = "00";
    addShiftTemplateBtn.textContent = getTranslatedString('btnAddShiftTemplate');
    cancelEditShiftTemplateBtn.style.display = 'none';
}

/**
 * Deletes a shift template after confirmation.
 * @param {string} stId - The ID of the shift template to delete.
 */
export function deleteShiftTemplate(stId) {
    if (!confirm(`Are you sure you want to delete this shift template?`)) return;

    // In a more complex app, you might check if this template is in use.
    const updatedTemplates = shiftTemplates.filter(st => st.id !== stId);
    shiftTemplates.length = 0;
    Array.prototype.push.apply(shiftTemplates, updatedTemplates);

    saveShiftTemplates();
    renderShiftTemplates();

    if (editingShiftTemplateIdInput.value === stId) {
        resetShiftTemplateForm();
    }
}

/**
 * Handles the logic for saving a new or edited shift template.
 */
export function handleSaveShiftTemplate() {
    const name = shiftTemplateNameInput.value.trim();
    const departmentId = shiftTemplateDepartmentSelect.value;
    const start = formatTimeToHHMM(shiftTemplateStartHourSelect.value, shiftTemplateStartMinuteSelect.value);
    const end = formatTimeToHHMM(shiftTemplateEndHourSelect.value, shiftTemplateEndMinuteSelect.value);
    const editingId = editingShiftTemplateIdInput.value;

    if (!departmentId) {
        alert('Please select a department for the shift template.');
        return;
    }
    if (!name || !start || !end) {
        alert('Please fill in all shift template details.');
        return;
    }
    if (start === end) {
        alert("Shift start and end times cannot be the same.");
        return;
    }

    const templateData = { name, departmentId, start, end };

    if (editingId) {
        const templateIndex = shiftTemplates.findIndex(st => st.id === editingId);
        if (templateIndex > -1) {
            shiftTemplates[templateIndex] = { ...shiftTemplates[templateIndex], ...templateData };
        }
    } else {
        shiftTemplates.push({ id: generateId('shift'), ...templateData });
    }

    saveShiftTemplates();
    renderShiftTemplates();
    resetShiftTemplateForm();
}


// --- Drag and Drop Handlers ---

function handleShiftTemplateDragStart(event) {
    const templateId = event.currentTarget.dataset.templateId;
    draggedShiftTemplateInfo = { id: templateId };
    event.dataTransfer.setData('text/plain', templateId);
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => event.currentTarget.classList.add('template-dragging'), 0);
}

function handleShiftTemplateDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const targetRow = event.currentTarget;
    if (targetRow && targetRow.dataset.templateId !== (draggedShiftTemplateInfo ? draggedShiftTemplateInfo.id : null)) {
        targetRow.classList.add('template-drag-over');
    }
}

function handleShiftTemplateDragLeave(event) {
    event.currentTarget.classList.remove('template-drag-over');
}

function handleShiftTemplateDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const targetRow = event.currentTarget;
    targetRow.classList.remove('template-drag-over');
    if (!draggedShiftTemplateInfo) return;

    const droppedOnTemplateId = targetRow.dataset.templateId;
    if (draggedShiftTemplateInfo.id === droppedOnTemplateId) return;

    const fromIndex = shiftTemplates.findIndex(st => st.id === draggedShiftTemplateInfo.id);
    const toIndex = shiftTemplates.findIndex(st => st.id === droppedOnTemplateId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [movedTemplate] = shiftTemplates.splice(fromIndex, 1);
    shiftTemplates.splice(toIndex, 0, movedTemplate);
    saveShiftTemplates();
    renderShiftTemplates();
}

function handleShiftTemplateDragEnd(event) {
    if (event.currentTarget) {
        event.currentTarget.classList.remove('template-dragging');
    }
    document.querySelectorAll('.template-drag-over').forEach(row => row.classList.remove('template-drag-over'));
    draggedShiftTemplateInfo = null;
}


/**
 * Renders the shift templates, grouped by department.
 */
export function renderShiftTemplates() {
    if (!shiftTemplateContainer) return;
    shiftTemplateContainer.innerHTML = '';

    const filterValue = shiftTemplateListFilter.value;

    const templatesToDisplay = shiftTemplates.filter(st => {
        if (filterValue === 'all') return true;
        return st.departmentId === filterValue;
    });

    const groupedTemplates = templatesToDisplay.reduce((acc, template) => {
        const deptId = template.departmentId || 'general';
        if (!acc[deptId]) {
            acc[deptId] = [];
        }
        acc[deptId].push(template);
        return acc;
    }, {});

    const departmentOrder = departments.map(d => d.id);
    if (groupedTemplates['general']) {
        departmentOrder.push('general');
    }

    departmentOrder.forEach(deptId => {
        if (groupedTemplates[deptId]) {
            const templatesInGroup = groupedTemplates[deptId];
            const groupWrapper = document.createElement('div');
            groupWrapper.className = 'department-group';

            const title = document.createElement('h3');
            const dept = departments.find(d => d.id === deptId);
            title.textContent = dept ? dept.name : getTranslatedString('optGeneral');
            groupWrapper.appendChild(title);

            const grid = document.createElement('div');
            grid.className = 'template-grid';

            templatesInGroup.forEach(st => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'template-item draggable-template-item';
                itemDiv.draggable = true;
                itemDiv.dataset.templateId = st.id;

                const nameSpan = document.createElement('span');
                nameSpan.className = 'template-name-span';
                const duration = calculateShiftDuration(st.start, st.end).toFixed(1);
                const displayText = `${st.name}: ${formatTimeForDisplay(st.start)} - ${formatTimeForDisplay(st.end)} [${duration}hrs]`;
                nameSpan.textContent = displayText;

                itemDiv.appendChild(createItemActionButtons(() => populateShiftTemplateFormForEdit(st), () => deleteShiftTemplate(st.id)));
                itemDiv.appendChild(nameSpan);

                grid.appendChild(itemDiv);
                itemDiv.addEventListener('dragstart', handleShiftTemplateDragStart);
                itemDiv.addEventListener('dragover', handleShiftTemplateDragOver);
                itemDiv.addEventListener('dragleave', handleShiftTemplateDragLeave);
                itemDiv.addEventListener('drop', handleShiftTemplateDrop);
                itemDiv.addEventListener('dragend', handleShiftTemplateDragEnd);
            });

            groupWrapper.appendChild(grid);
            shiftTemplateContainer.appendChild(groupWrapper);
        }
    });
}