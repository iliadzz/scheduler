// js/ui/shifts.js

import { shiftTemplates, departments, saveShiftTemplates } from '../state.js';
import * as dom from '../dom.js';
import { getTranslatedString } from '../i18n.js';
import { createItemActionButtons, calculateShiftDuration, formatTimeForDisplay, formatTimeToHHMM, generateId } from '../utils.js';
import { makeListSortable } from '../features/list-dnd.js';

const SHIFTS_FILTER_KEY = 'shiftsDepartmentFilterState';

// --- Data Migration ---
let migrationNeeded = shiftTemplates.some(st => st.departmentId && !st.departmentIds);
if (migrationNeeded) {
    shiftTemplates.forEach(st => {
        if (st.departmentId && !st.departmentIds) {
            st.departmentIds = [st.departmentId];
            delete st.departmentId;
        } else if (!st.departmentIds) {
            st.departmentIds = [];
        }
    });
    saveShiftTemplates();
    console.log("Shift templates data migrated to use departmentIds array.");
}

function populateFormDepartmentPills() {
    const container = document.getElementById('shift-form-department-pills');
    if (!container) return;
    container.innerHTML = '';
    departments.forEach(dept => {
        const pill = document.createElement('span');
        pill.className = 'dept-pill';
        pill.dataset.deptId = dept.id;
        pill.textContent = dept.abbreviation;
        pill.addEventListener('click', () => {
            pill.classList.toggle('active');
        });
        container.appendChild(pill);
    });
}

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
    const [startH, startM] = template.start.split(':');
    const [endH, endM] = template.end.split(':');
    dom.shiftTemplateStartHourSelect.value = startH;
    dom.shiftTemplateStartMinuteSelect.value = startM;
    dom.shiftTemplateEndHourSelect.value = endH;
    dom.shiftTemplateEndMinuteSelect.value = endM;
    dom.addShiftTemplateBtn.textContent = 'Save Changes';
    dom.cancelEditShiftTemplateBtn.style.display = 'inline-block';

    const formPills = document.querySelectorAll('#shift-form-department-pills .dept-pill');
    formPills.forEach(pill => {
        pill.classList.toggle('active', (template.departmentIds || []).includes(pill.dataset.deptId));
    });
}

export function resetShiftTemplateForm() {
    dom.editingShiftTemplateIdInput.value = '';
    dom.shiftTemplateNameInput.value = '';
    dom.shiftTemplateStartHourSelect.value = "09";
    dom.shiftTemplateStartMinuteSelect.value = "00";
    dom.shiftTemplateEndHourSelect.value = "17";
    dom.shiftTemplateEndMinuteSelect.value = "00";
    dom.addShiftTemplateBtn.textContent = 'Add Shift';
    dom.cancelEditShiftTemplateBtn.style.display = 'none';

    const formPills = document.querySelectorAll('#shift-form-department-pills .dept-pill');
    formPills.forEach((pill, index) => {
        pill.classList.toggle('active', index === 0);
    });
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
    const start = formatTimeToHHMM(dom.shiftTemplateStartHourSelect.value, dom.shiftTemplateStartMinuteSelect.value);
    const end = formatTimeToHHMM(dom.shiftTemplateEndHourSelect.value, dom.shiftTemplateEndMinuteSelect.value);
    const editingId = dom.editingShiftTemplateIdInput.value;

    const selectedDeptIds = Array.from(document.querySelectorAll('#shift-form-department-pills .dept-pill.active'))
                                 .map(pill => pill.dataset.deptId);

    if (selectedDeptIds.length === 0) {
        alert('A shift must belong to at least one department.');
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

    const templateData = { 
        name, 
        start, 
        end,
        departmentIds: selectedDeptIds,
        availableDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    };

    if (editingId) {
        const templateIndex = shiftTemplates.findIndex(st => st.id === editingId);
        if (templateIndex > -1) {
            const existingTemplate = shiftTemplates[templateIndex];
            shiftTemplates[templateIndex] = { 
                ...existingTemplate, 
                name: templateData.name,
                start: templateData.start,
                end: templateData.end,
                departmentIds: templateData.departmentIds
            };
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
    populateFormDepartmentPills();
    resetShiftTemplateForm();

    const selectedDeptIdsInFilter = getSelectedShiftDepartmentIds();
    const departmentsToRender = selectedDeptIdsInFilter === null 
        ? departments 
        : departments.filter(d => selectedDeptIdsInFilter.includes(d.id));

    departmentsToRender.forEach(dept => {
        let templatesForThisDept = shiftTemplates.filter(st => (st.departmentIds || []).includes(dept.id));

        if (templatesForThisDept.length === 0) return;

        templatesForThisDept.sort((a, b) => {
            if (a.start < b.start) return -1;
            if (a.start > b.start) return 1;
            if (a.end < b.end) return -1;
            if (a.end > b.end) return 1;
            return 0;
        });

        const groupWrapper = document.createElement('div');
        groupWrapper.className = 'department-group';
        groupWrapper.innerHTML = `<h3>${dept.name}</h3>`;
        
        const list = document.createElement('ul');
        list.className = 'template-list';

        templatesForThisDept.forEach(st => {
            const itemLi = document.createElement('li');
            itemLi.className = 'template-item';
            itemLi.dataset.itemId = st.id;
            const duration = calculateShiftDuration(st.start, st.end).toFixed(1);
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'template-info';
            contentDiv.innerHTML = `
                <span class="template-time">${formatTimeForDisplay(st.start)} - ${formatTimeForDisplay(st.end)}</span>
                <span class="template-name-span">${st.name}</span>
                <span class="template-duration">[${duration}]</span>
            `;

            const deptPillsContainer = document.createElement('div');
            deptPillsContainer.className = 'department-pills-container';
            departments.forEach(d => {
                const pill = document.createElement('span');
                pill.className = 'dept-pill';
                pill.dataset.deptId = d.id;
                pill.textContent = d.abbreviation;
                if ((st.departmentIds || []).includes(d.id)) {
                    pill.classList.add('active');
                }
                pill.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const template = shiftTemplates.find(t => t.id === st.id);
                    if (!template) return;
                    if (!template.departmentIds) template.departmentIds = [];
                    
                    const deptId = e.target.dataset.deptId;
                    const index = template.departmentIds.indexOf(deptId);
                    if (index > -1) {
                        template.departmentIds.splice(index, 1);
                    } else {
                        template.departmentIds.push(deptId);
                    }
                    saveShiftTemplates();
                    renderShiftTemplates();
                });
                deptPillsContainer.appendChild(pill);
            });

            const daysOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
            const dayLabels = { mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S' };
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
                pill.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const template = shiftTemplates.find(t => t.id === st.id);
                    if (!template) return;
                    if (!template.availableDays) template.availableDays = [...daysOrder];
                    
                    const dayValue = e.target.dataset.day;
                    const index = template.availableDays.indexOf(dayValue);
                    if (index > -1) {
                        template.availableDays.splice(index, 1);
                    } else {
                        template.availableDays.push(dayValue);
                    }
                    saveShiftTemplates();
                    renderShiftTemplates();
                });
                dayPillsContainer.appendChild(pill);
            });
            
            const actions = createItemActionButtons(() => populateShiftTemplateFormForEdit(st), () => deleteShiftTemplate(st.id));
            
            itemLi.appendChild(contentDiv);
            itemLi.appendChild(deptPillsContainer);
            itemLi.appendChild(dayPillsContainer);
            itemLi.appendChild(actions);
            list.appendChild(itemLi);
        });
        
        groupWrapper.appendChild(list);
        dom.shiftTemplateContainer.appendChild(groupWrapper);
    });
}