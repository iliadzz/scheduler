// js/ui/shifts.js

import { shiftTemplates, departments, saveShiftTemplates } from '../state.js';
import * as dom from '../dom.js';
import { getTranslatedString } from '../i18n.js';
import { createItemActionButtons, calculateShiftDuration, formatTimeForDisplay, formatTimeToHHMM, generateId } from '../utils.js';
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

    document.querySelectorAll('#shift-template-days-group input[type="checkbox"]').forEach(cb => {
        cb.checked = (template.availableDays || []).includes(cb.value);
    });

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

    document.querySelectorAll('#shift-template-days-group input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
    });

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

    const availableDays = Array.from(document.querySelectorAll('#shift-template-days-group input:checked'))
                               .map(cb => cb.value);

    if (availableDays.length === 0) {
        alert("A shift template must be available on at least one day.");
        return;
    }

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

    const templateData = { name, departmentId, start, end, availableDays };

    if (editingId) {
        const templateIndex = shiftTemplates.findIndex(st => st.id === editingId);
        if (templateIndex > -1) shiftTemplates[templateIndex] = { ...shiftTemplates[templateIndex], ...templateData };
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
    const templatesToDisplay = shiftTemplates.filter(st =>
        (selectedDeptIds === null) ? true : selectedDeptIds.includes(st.departmentId)
    );

    const groupedByDept = templatesToDisplay.reduce((acc, template) => {
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
    const dayNames = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

    Object.values(groupedByDept).forEach(deptGroup => {
        const deptWrapper = document.createElement('div');
        deptWrapper.className = 'department-group';
        deptWrapper.innerHTML = `<h3>${deptGroup.name}</h3>`;

        daysOrder.forEach(day => {
            const dayTemplates = deptGroup.templates.filter(t => (t.availableDays || daysOrder).includes(day));

            if (dayTemplates.length > 0) {
                const dayHeader = document.createElement('h4');
                dayHeader.textContent = dayNames[day];
                dayHeader.style.cssText = "margin-top: 15px; margin-bottom: 10px; color: #34495e; font-size: 1.1em;";
                deptWrapper.appendChild(dayHeader);

                const grid = document.createElement('div');
                grid.className = 'template-grid';

                dayTemplates.forEach(st => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'template-item draggable-item';
                    itemDiv.draggable = true;
                    itemDiv.dataset.itemId = st.id;
                    const duration = calculateShiftDuration(st.start, st.end).toFixed(1);
                    itemDiv.innerHTML = `<span class="template-name-span">${st.name}: ${formatTimeForDisplay(st.start)} - ${formatTimeForDisplay(st.end)} [${duration}hrs]</span>`;
                    itemDiv.prepend(createItemActionButtons(() => populateShiftTemplateFormForEdit(st), () => deleteShiftTemplate(st.id)));
                    grid.appendChild(itemDiv);
                });
                deptWrapper.appendChild(grid);
                makeListSortable(grid, shiftTemplates, saveShiftTemplates, renderShiftTemplates);
            }
        });
        dom.shiftTemplateContainer.appendChild(deptWrapper);
    });
}