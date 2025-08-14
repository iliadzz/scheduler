// Manages the logic for dragging and dropping individual shifts between cells.
// js/features/shift-dnd.js// js/features/shift-dnd.js

// Corrected import paths
import { generateId } from '../utils.js';
import { HistoryManager, DragDropCommand } from './history.js';
import { renderWeeklySchedule } from '../ui/scheduler.js';

let draggedShiftDetails = null;

export function handleDragStart(event, originalUserId, originalDateStr, assignment) {
    event.target.classList.add('dragging');
    const isCopy = event.ctrlKey || event.altKey;
    draggedShiftDetails = { ...assignment, originalUserId, originalDateStr, isCopyOperation: isCopy };
    event.dataTransfer.effectAllowed = isCopy ? 'copy' : 'move';
    event.dataTransfer.setData('text/plain', assignment.assignmentId);
}

export function handleDragEnd(event) {
    event.target.classList.remove('dragging');
    document.querySelectorAll('.day-cell.drag-over').forEach(cell => cell.classList.remove('drag-over'));
    draggedShiftDetails = null;
}

export function handleDragOver(event) {
    event.preventDefault();
    if (event.target.closest('.day-cell')) {
        event.dataTransfer.dropEffect = (event.ctrlKey || event.altKey) ? 'copy' : 'move';
    } else {
        event.dataTransfer.dropEffect = 'none';
    }
}

export function handleDragEnter(event) {
    const cell = event.target.closest('.day-cell');
    if (cell) cell.classList.add('drag-over');
}

export function handleDragLeave(event) {
    const cell = event.target.closest('.day-cell');
    if (cell) cell.classList.remove('drag-over');
}

export function handleDrop(event) {
    event.preventDefault();
    const targetCell = event.target.closest('.day-cell');
    if (!targetCell || !draggedShiftDetails) {
        draggedShiftDetails = null;
        return;
    }
    targetCell.classList.remove('drag-over');
    const { originalUserId, originalDateStr, isCopyOperation } = draggedShiftDetails;
    const targetUserId = targetCell.dataset.userId;
    const targetDateStr = targetCell.dataset.date;
    if (!isCopyOperation && originalUserId === targetUserId && originalDateStr === targetDateStr) {
        draggedShiftDetails = null;
        return;
    }
    const commandDetails = { ...draggedShiftDetails, newAssignmentId: isCopyOperation ? generateId('assign') : draggedShiftDetails.assignmentId, targetUserId, targetDateStr };
    const command = new DragDropCommand(commandDetails);
    HistoryManager.doAction(command);
    draggedShiftDetails = null;
    renderWeeklySchedule(); // Re-render the UI after the action
}