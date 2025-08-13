// js/ui/shifts.js

import { shiftTemplates, departments, saveShiftTemplates } from '../state.js';
import * as dom from '../dom.js';
import { getTranslatedString } from '../i18n.js';
import { createItemActionButtons, calculateShiftDuration, formatTimeForDisplay, formatTimeToHHMM, generateId } from '../utils.js';
import { makeListSortable } from '../features/list-dnd.js';

// ===== Shifts Department Multiselect =====
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

// ... (Rest of the shifts.js file remains the same, but the renderShiftTemplates function is updated)

export function renderShiftTemplates() {
    if (!dom.shiftTemplateContainer) return;
    dom.shiftTemplateContainer.innerHTML = '';

    const selectedDeptIds = getSelectedShiftDepartmentIds();
    const templatesToDisplay = shiftTemplates.filter(st => 
        (selectedDeptIds === null) ? true : selectedDeptIds.includes(st.departmentId)
    );

    const groupedTemplates = templatesToDisplay.reduce((acc, template) => {
        const deptId = template.departmentId || 'general';
        if (!acc[deptId]) {
            acc[deptId] = { name: departments.find(d => d.id === deptId)?.name || getTranslatedString('optGeneral'), templates: [] };
        }
        acc[deptId].templates.push(template);
        return acc;
    }, {});
    
    Object.values(groupedTemplates).forEach(group => {
        const groupWrapper = document.createElement('div');
        groupWrapper.className = 'department-group';
        groupWrapper.innerHTML = `<h3>${group.name}</h3>`;
        const grid = document.createElement('div');
        grid.className = 'template-grid';
        group.templates.forEach(st => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'template-item draggable-item';
            itemDiv.draggable = true;
            itemDiv.dataset.itemId = st.id;

            const duration = calculateShiftDuration(st.start, st.end).toFixed(1);
            itemDiv.innerHTML = `
                <span class="template-name-span">${st.name}: ${formatTimeForDisplay(st.start)} - ${formatTimeForDisplay(st.end)} [${duration}hrs]</span>
            `;
            itemDiv.prepend(createItemActionButtons(() => populateShiftTemplateFormForEdit(st), () => deleteShiftTemplate(st.id)));
            grid.appendChild(itemDiv);
        });
        groupWrapper.appendChild(grid);
        dom.shiftTemplateContainer.appendChild(groupWrapper);
        makeListSortable(grid, shiftTemplates, saveShiftTemplates, renderShiftTemplates);
    });
}