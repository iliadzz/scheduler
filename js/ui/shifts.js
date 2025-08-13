// js/ui/shifts.js

import { shiftTemplates, departments, saveShiftTemplates } from '../state.js';
import * as dom from '../dom.js';
import { getTranslatedString } from '../i18n.js';
import { createItemActionButtons, calculateShiftDuration, formatTimeForDisplay, formatTimeToHHMM, generateId } from '../utils.js';
// makeListSortable is no longer used here, but we keep the import in case it's used elsewhere.
import { makeListSortable } from '../features/list-dnd.js';

const SHIFTS_FILTER_KEY = 'shiftsDepartmentFilterState';

export function ensureShiftDeptMultiselect() {
  if (document.getElementById('shift-dept-multiselect')) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'multiselect';
  wrapper.id = 'shift-dept-multiselect';
  wrapper.innerHTML = `
    <div class="select-box" id="shift-dept-button">
        <span id="shift-dept-text">All Departments</span>
        <i class="fas fa-chevron-down"></i>
    </div>
    <div class="checkboxes-container" id="shift-dept-checkboxes"></div>
  `;
  if (dom.shiftTemplateListFilter && dom.shiftTemplateListFilter.parentElement) {
    dom.shiftTemplateListFilter.style.display = 'none';
    dom.shiftTemplateListFilter.parentElement.insertBefore(wrapper, dom.shiftTemplateListFilter);
  }
  const button = wrapper.querySelector('#shift-dept-button');
  const checks = wrapper.querySelector('#shift-dept-checkboxes');
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

export function populateShiftDeptCheckboxes() {
  const checks = document.getElementById('shift-dept-checkboxes');
  if (!checks) return;
  checks.innerHTML = '';
  const savedJSON = localStorage.getItem(SHIFTS_FILTER_KEY);
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
    localStorage.setItem(SHIFTS_FILTER_KEY, JSON.stringify(state));
    updateShiftDeptLabel();
    renderShiftTemplates();
  }));
  updateShiftDeptLabel();
}

function getSelectedShiftDepartmentIds() {
  const savedJSON = localStorage.getItem(SHIFTS_FILTER_KEY);
  if (!savedJSON) return null;
  const saved = JSON.parse(savedJSON);
  const selected = saved.filter(s => s.value !== 'all' && s.checked).map(s => s.value);
  const all = saved.find(s => s.value === 'all');
  return (all && all.checked) ? null : selected;
}

function updateShiftDeptLabel() {
  const labelSpan = document.getElementById('shift-dept-text');
  if (!labelSpan) return;
  const selected = getSelectedShiftDepartmentIds();
  if (selected === null) {
    labelSpan.textContent = 'All Departments';
  } else if (selected.length === 0) {
    labelSpan.textContent = 'None selected';
  } else {
    const names = departments.filter(d => selected.includes(d.id)).map(d => d.name);
    labelSpan.textContent = names.length > 2 ? `${names.length} selected` : names.join(', ');
  }
}

export function populateShiftTemplateFormForEdit(template) {
    dom.editingShiftTemplateIdInput.value = template.id;
    dom.shiftTemplateNameInput.value = template.name;
    dom.shiftTemplateDepartmentSelect.value = template.departmentId || "";
    const [startH, startM] = template.start.split(':');
    const [endH, endM] = template.end.split(':');
    dom.shiftTemplateStartHourSelect.value = startH;
    dom.shiftTemplateStartMinuteSelect.value = startM;
    dom.shiftTemplateEndHourSelect.value = endH;
    dom.shiftTemplateEndMinuteSelect.value = endM;
    dom.addShiftTemplateBtn.textContent = 'Save Changes';
    dom.cancelEditShiftTemplateBtn.style.display = 'inline-block';
}

export function resetShiftTemplateForm() {
    dom.editingShiftTemplateIdInput.value = '';
    dom.shiftTemplateNameInput.value = '';
    dom.shiftTemplateDepartmentSelect.value = "";
    dom.shiftTemplateStartHourSelect.value = "09";
    dom.shiftTemplateStartMinuteSelect.value = "00";
    dom.shiftTemplateEndHourSelect.value = "17";
    dom.shiftTemplateEndMinuteSelect.value = "00";
    dom.addShiftTemplateBtn.textContent = getTranslatedString('btnAddShiftTemplate');
    dom.cancelEditShiftTemplateBtn.style.display = 'none';
}

export function deleteShiftTemplate(stId) {
    if (!confirm(`Are you sure you want to delete this shift template?`)) return;
    const updatedTemplates = shiftTemplates.filter(st => st.id !== stId);
    shiftTemplates.length = 0;
    Array.prototype.push.apply(shiftTemplates, updatedTemplates);
    saveShiftTemplates();
    renderShiftTemplates();
    if (dom.editingShiftTemplateIdInput.value === stId) {
        resetShiftTemplateForm();
    }
}

export function handleSaveShiftTemplate() {
    const name = dom.shiftTemplateNameInput.value.trim();
    const departmentId = dom.shiftTemplateDepartmentSelect.value;
    const start = formatTimeToHHMM(dom.shiftTemplateStartHourSelect.value, dom.shiftTemplateStartMinuteSelect.value);
    const end = formatTimeToHHMM(dom.shiftTemplateEndHourSelect.value, dom.shiftTemplateEndMinuteSelect.value);
    const editingId = dom.editingShiftTemplateIdInput.value;

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

    // New templates are available on all days by default. Edited via pills.
    const availableDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const templateData = { name, departmentId, start, end, availableDays };

    if (editingId) {
        const templateIndex = shiftTemplates.findIndex(st => st.id === editingId);
        if (templateIndex > -1) {
            // Preserve existing availableDays when editing, unless it's a new property
            const existingDays = shiftTemplates[templateIndex].availableDays;
            shiftTemplates[templateIndex] = { ...shiftTemplates[templateIndex], ...templateData, availableDays: existingDays || availableDays };
        }
    } else {
        shiftTemplates.push({ id: generateId('shift'), ...templateData });
    }
    saveShiftTemplates();
    renderShiftTemplates();
    resetShiftTemplateForm();
}

export function renderShiftTemplates() {
    if (!dom.shiftTemplateContainer) return;
    dom.shiftTemplateContainer.innerHTML = '';

    const selectedDeptIds = getSelectedShiftDepartmentIds();
    let templatesToDisplay = shiftTemplates.filter(st =>
        (selectedDeptIds === null) ? true : selectedDeptIds.includes(st.departmentId)
    );

    // Sort templates by start time, then end time
    templatesToDisplay.sort((a, b) => {
        if (a.start < b.start) return -1;
        if (a.start > b.start) return 1;
        if (a.end < b.end) return -1;
        if (a.end > b.end) return 1;
        return 0;
    });

    const groupedTemplates = templatesToDisplay.reduce((acc, template) => {
        const deptId = template.departmentId || 'general';
        if (!acc[deptId]) {
            acc[deptId] = {
                name: departments.find(d => d.id === deptId)?.name || getTranslatedString('optGeneral'),
                templates: []
            };
        }
        acc[deptId].templates.push(template);
        return acc;
    }, {});
    
    const daysOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayLabels = { mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S' };

    Object.values(groupedTemplates).forEach(group => {
        const groupWrapper = document.createElement('div');
        groupWrapper.className = 'department-group';
        groupWrapper.innerHTML = `<h3>${group.name}</h3>`;
        
        const list = document.createElement('ul'); // Use a list for semantics
        list.className = 'template-list';

        group.templates.forEach(st => {
            const itemLi = document.createElement('li');
            itemLi.className = 'template-item'; // No longer draggable
            itemLi.dataset.itemId = st.id;

            const duration = calculateShiftDuration(st.start, st.end).toFixed(1);
            
            let contentHTML = `
                <div class="template-info">
                    <span class="template-time">${formatTimeForDisplay(st.start)} - ${formatTimeForDisplay(st.end)}</span>
                    <span class="template-name-span">${st.name}</span>
                    <span class="template-duration">[${duration}]</span>
                </div>
            `;
            itemLi.innerHTML = contentHTML;

            const dayPillsContainer = document.createElement('div');
            dayPillsContainer.className = 'day-pills-container';
            daysOrder.forEach(day => {
                const pill = document.createElement('span');
                pill.className = 'day-pill';
                pill.dataset.day = day;
                pill.textContent = dayLabels[day];
                if ((st.availableDays || []).includes(day)) {
                    pill.classList.add('active');
                }
                pill.addEventListener('click', () => {
                    const template = shiftTemplates.find(t => t.id === st.id);
                    if (!template) return;
                    if (!template.availableDays) {
                        template.availableDays = [...daysOrder];
                    }
                    const dayIndex = template.availableDays.indexOf(day);
                    if (dayIndex > -1) {
                        template.availableDays.splice(dayIndex, 1);
                    } else {
                        template.availableDays.push(day);
                    }
                    saveShiftTemplates();
                    renderShiftTemplates(); // Re-render to show the change
                });
                dayPillsContainer.appendChild(pill);
            });
            
            const actions = createItemActionButtons(() => populateShiftTemplateFormForEdit(st), () => deleteShiftTemplate(st.id));
            
            itemLi.appendChild(dayPillsContainer);
            itemLi.appendChild(actions);
            list.appendChild(itemLi);
        });
        
        groupWrapper.appendChild(list);
        dom.shiftTemplateContainer.appendChild(groupWrapper);
    });
}