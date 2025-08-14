// js/features/employee-dnd.js
// Manages the logic for dragging, dropping, and reordering employees.// js/features/employee-dnd.js

// Corrected import paths
import { renderWeeklySchedule } from '../ui/scheduler.js';

const EMP_ORDER_KEY = 'employeeSortOrder';

let employeeSortOrder = (() => {
  try { return JSON.parse(localStorage.getItem(EMP_ORDER_KEY)) || {}; }
  catch { return {}; }
})();

function saveEmployeeSortOrder() {
  localStorage.setItem(EMP_ORDER_KEY, JSON.stringify(employeeSortOrder));
}

export function sortKeyForEmployee(emp) {
  const k = employeeSortOrder[emp.id];
  return (typeof k === 'number') ? k : Number.MAX_SAFE_INTEGER;
}

let draggingEmpId = null;

function handleEmpDragStart(e) {
  const row = e.currentTarget.closest('.employee-row-label');
  if (!row) return;
  draggingEmpId = row.dataset.employeeId;
  e.dataTransfer.setData('text/plain', draggingEmpId);
  e.dataTransfer.effectAllowed = 'move';
  row.classList.add('employee-row-dragging');
}

function handleEmpDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const targetRow = e.currentTarget.closest('.employee-row-label');
  if(targetRow) targetRow.classList.add('employee-row-drag-over');
}

function handleEmpDragLeave(e) {
    const targetRow = e.currentTarget.closest('.employee-row-label');
    if(targetRow) targetRow.classList.remove('employee-row-drag-over');
}

function handleEmpDrop(e) {
  e.preventDefault();
  const targetRow = e.currentTarget.closest('.employee-row-label');
  if (!targetRow || !draggingEmpId) return;

  const targetId = targetRow.dataset.employeeId;
  if (!targetId || targetId === draggingEmpId) return;

  const rows = Array.from(document.getElementById('schedule-grid-body').querySelectorAll('.employee-row-label'));
  const visibleIds = rows.map(r => r.dataset.employeeId);

  const fromIdx = visibleIds.indexOf(draggingEmpId);
  const toIdx   = visibleIds.indexOf(targetId);
  if (fromIdx === -1 || toIdx === -1) return;

  const newOrder = visibleIds.slice();
  const [moved] = newOrder.splice(fromIdx, 1);
  newOrder.splice(toIdx, 0, moved);

  newOrder.forEach((id, i) => { employeeSortOrder[id] = i; });

  saveEmployeeSortOrder();
  draggingEmpId = null;

  renderWeeklySchedule();
}

function handleEmpDragEnd(e) {
    const row = e.currentTarget.closest('.employee-row-label');
    if(row) row.classList.remove('employee-row-dragging');
    document.querySelectorAll('.employee-row-label.employee-row-drag-over').forEach(el => el.classList.remove('employee-row-drag-over'));
    draggingEmpId = null;
}

export function addEmployeeDragAndDropHandlers(element) {
    element.addEventListener('dragstart', handleEmpDragStart);
    element.addEventListener('dragover', handleEmpDragOver);
    element.addEventListener('dragleave', handleEmpDragLeave);
    element.addEventListener('drop', handleEmpDrop);
    element.addEventListener('dragend', handleEmpDragEnd);
}