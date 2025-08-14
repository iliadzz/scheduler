// js/ui/shifts.js

import { shiftTemplates, departments, saveShiftTemplates } from '../state.js';
import * as dom from '../dom.js';
import { getTranslatedString } from '../i18n.js';
import { createItemActionButtons, calculateShiftDuration, formatTimeForDisplay, formatTimeToHHMM, generateId } from '../utils.js';
import { makeListSortable } from '../features/list-dnd.js';

const SHIFTS_FILTER_KEY = 'shiftsDepartmentFilterState';

let tempSelectedDeptIds = [];
const daysOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const dayNames = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };


function renderPills(container, items, selectedIds, key, nameProp, activeClass) {
    container.innerHTML = '';
    items.forEach(item => {
        const pill = document.createElement('div');
        pill.className = `pill ${key}-pill`;
        pill.dataset.id = item.id;
        pill.textContent = item[nameProp];
        if (selectedIds.includes(item.id)) {
            pill.classList.add(activeClass);
        }
        pill.addEventListener('click', () => {
            pill.classList.toggle(activeClass);
        });
        container.appendChild(pill);
    });
}

function getSelectedPillIds(container, activeClass) {
    const selected = [];
    container.querySelectorAll(`.pill.${activeClass}`).forEach(pill => {
        selected.push(pill.dataset.id);
    });
    return selected;
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

    renderPills(dom.shiftFormDepartmentPills, departments, template.departmentIds || [], 'dept', 'abbreviation', 'active');
    renderPills(dom.shiftFormDayPills, daysOrder.map(d => ({id: d, name: dayNames[d]})), template.availableDays || [], 'day', 'name', 'active');
    
    dom.addShiftTemplateBtn.textContent = 'Save Changes';
    dom.cancelEditShiftTemplateBtn.style.display = 'inline-block';
}

export function resetShiftTemplateForm() {
    dom.editingShiftTemplateIdInput.value = '';
    dom.shiftTemplateNameInput.value = '';
    dom.shiftTemplateStartHourSelect.value = "09";
    dom.shiftTemplateStartMinuteSelect.value = "00";
    dom.shiftTemplateEndHourSelect.value = "17";
    dom.shiftTemplateEndMinuteSelect.value = "00";

    renderPills(dom.shiftFormDepartmentPills, departments, [], 'dept', 'abbreviation', 'active');
    renderPills(dom.shiftFormDayPills, daysOrder.map(d => ({id: d, name: dayNames[d]})), daysOrder, 'day', 'name', 'active');

    dom.addShiftTemplateBtn.textContent = getTranslatedString('btnAddShift');
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
    const start = formatTimeToHHMM(dom.shiftTemplateStartHourSelect.value, dom.shiftTemplateStartMinuteSelect.value);
    const end = formatTimeToHHMM(dom.shiftTemplateEndHourSelect.value, dom.shiftTemplateEndMinuteSelect.value);
    const editingId = dom.editingShiftTemplateIdInput.value;

    const departmentIds = getSelectedPillIds(dom.shiftFormDepartmentPills, 'active');
    const availableDays = getSelectedPillIds(dom.shiftFormDayPills, 'active');

    if (departmentIds.length === 0) {
        alert("A shift must belong to at least one department.");
        return;
    }
    if (availableDays.length === 0) {
        alert("A shift must be available on at least one day.");
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

    const templateData = { name, start, end, departmentIds, availableDays };

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

export function renderShiftTemplates() {
    if (!dom.shiftTemplateContainer) return;
    dom.shiftTemplateContainer.innerHTML = '';
    
    resetShiftTemplateForm(); // Also initializes the form pills

    const selectedDeptIds = getSelectedShiftDepartmentIds();
    
    let filteredTemplates = shiftTemplates;
    if (selectedDeptIds !== null) {
        filteredTemplates = shiftTemplates.filter(st => {
            return (st.departmentIds || []).some(deptId => selectedDeptIds.includes(deptId));
        });
    }

    const groupedByDept = filteredTemplates.reduce((acc, template) => {
        (template.departmentIds || []).forEach(deptId => {
            if (!acc[deptId]) {
                acc[deptId] = {
                    name: departments.find(d => d.id === deptId)?.name || 'Unassigned',
                    templates: []
                };
            }
            acc[deptId].templates.push(template);
        });
        return acc;
    }, {});

    Object.values(groupedByDept).forEach(deptGroup => {
        deptGroup.templates.sort((a, b) => {
            if (a.start < b.start) return -1;
            if (a.start > b.start) return 1;
            if (a.end < b.end) return 1;
            if (a.end > b.end) return -1;
            return a.name.localeCompare(b.name);
        });
    });

    const deptOrder = departments.map(d => d.id);
    const sortedDeptGroups = Object.keys(groupedByDept).sort((a,b) => deptOrder.indexOf(a) - deptOrder.indexOf(b));

    sortedDeptGroups.forEach(deptId => {
        const deptGroup = groupedByDept[deptId];
        const deptWrapper = document.createElement('div');
        deptWrapper.className = 'department-group';
        deptWrapper.innerHTML = `<h3>${deptGroup.name}</h3>`;

        const grid = document.createElement('div');
        grid.className = 'template-grid';

        deptGroup.templates.forEach(st => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'template-item';
            
            const duration = calculateShiftDuration(st.start, st.end).toFixed(1);
            
            itemDiv.innerHTML = `
                <div class="template-info">
                    <span class="template-time">${formatTimeForDisplay(st.start)} - ${formatTimeForDisplay(st.end)}</span>
                    <span class="template-name-span">| ${st.name}</span>
                    <span class="template-duration">[${duration}]</span>
                </div>
            `;

            const pillsContainer = document.createElement('div');
            pillsContainer.className = 'pills-container';

            const deptPills = document.createElement('div');
            deptPills.className = 'department-pills-container';
            departments.forEach(dept => {
                const pill = document.createElement('div');
                pill.className = 'pill dept-pill';
                pill.textContent = dept.abbreviation;
                pill.dataset.deptId = dept.id;
                if ((st.departmentIds || []).includes(dept.id)) {
                    pill.classList.add('active');
                }
                pill.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const currentDeptIds = st.departmentIds || [];
                    const index = currentDeptIds.indexOf(dept.id);
                    if (index > -1) {
                        currentDeptIds.splice(index, 1);
                    } else {
                        currentDeptIds.push(dept.id);
                    }
                    st.departmentIds = currentDeptIds;
                    saveShiftTemplates();
                    renderShiftTemplates();
                });
                deptPills.appendChild(pill);
            });

            pillsContainer.appendChild(deptPills);
            itemDiv.appendChild(pillsContainer);
            itemDiv.appendChild(createItemActionButtons(() => populateShiftTemplateFormForEdit(st), () => deleteShiftTemplate(st.id)));
            
            grid.appendChild(itemDiv);
        });
        
        deptWrapper.appendChild(grid);
        dom.shiftTemplateContainer.appendChild(deptWrapper);
    });
}