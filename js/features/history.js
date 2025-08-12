// This module will exclusively manage the undo/redo functionality. It will contain the HistoryManager object and its methods (doAction, undo, redo). 
// The command classes (ModifyAssignmentCommand, etc.) defined in scheduler.js will also be moved here.

// js/features/history.js

// --- 1. Import Dependencies ---
import { scheduleAssignments, saveScheduleAssignments } from '../state.js';
import { generateId } from '../utils.js';
import { renderWeeklySchedule } from '../ui/scheduler.js';

// DOM elements for the buttons
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');


// --- 2. Module's Private State ---
let historyStack = [];
let historyPointer = -1;


// --- 3. Command Class Definitions ---
// These objects represent a single, reversible action.

/**
 * Command for adding or modifying a shift assignment.
 */
export function ModifyAssignmentCommand(userId, dateStr, newAssignment, oldAssignment = null) {
    this.userId = userId;
    this.dateStr = dateStr;
    this.newAssignment = { ...newAssignment };
    this.oldAssignment = oldAssignment ? { ...oldAssignment } : null;
    this.assignmentKey = `${userId}-${dateStr}`;

    this.execute = function() {
        const dayData = scheduleAssignments[this.assignmentKey] || { shifts: [] };
        scheduleAssignments[this.assignmentKey] = dayData;
        const index = this.oldAssignment ? dayData.shifts.findIndex(a => a.assignmentId === this.oldAssignment.assignmentId) : -1;

        if (index > -1) {
            dayData.shifts[index] = this.newAssignment;
        } else {
            dayData.shifts.push(this.newAssignment);
        }
        saveScheduleAssignments();
        renderWeeklySchedule();
    };

    this.undo = function() {
        const dayData = scheduleAssignments[this.assignmentKey];
        const index = dayData.shifts.findIndex(a => a.assignmentId === this.newAssignment.assignmentId);

        if (index > -1) {
            if (this.oldAssignment) {
                dayData.shifts[index] = this.oldAssignment;
            } else {
                dayData.shifts.splice(index, 1);
            }
        }
        saveScheduleAssignments();
        renderWeeklySchedule();
    };
}

/**
 * Command for deleting a shift assignment.
 */
export function DeleteAssignmentCommand(userId, dateStr, assignmentId) {
    this.userId = userId;
    this.dateStr = dateStr;
    this.assignmentId = assignmentId;
    this.assignmentKey = `${userId}-${dateStr}`;
    this.deletedAssignment = null;

    this.execute = function() {
        const dayData = scheduleAssignments[this.assignmentKey];
        if (dayData && dayData.shifts) {
            const index = dayData.shifts.findIndex(a => a.assignmentId === this.assignmentId);
            if (index > -1) {
                this.deletedAssignment = dayData.shifts.splice(index, 1)[0];
            }
        }
        saveScheduleAssignments();
        renderWeeklySchedule();
    };

    this.undo = function() {
        if (!this.deletedAssignment) return;
        const dayData = scheduleAssignments[this.assignmentKey] || { shifts: [] };
        scheduleAssignments[this.assignmentKey] = dayData;
        dayData.shifts.push(this.deletedAssignment);
        saveScheduleAssignments();
        renderWeeklySchedule();
    };
}

/**
 * Command for a drag-and-drop shift operation.
 */
export function DragDropCommand(dragDetails) {
    this.assignment = { ...dragDetails, assignmentId: dragDetails.newAssignmentId || generateId('assign') };
    // Clean up properties that are only needed for the drag operation itself
    delete this.assignment.originalUserId;
    delete this.assignment.originalDateStr;
    delete this.assignment.isCopyOperation;
    delete this.assignment.targetUserId;
    delete this.assignment.targetDateStr;
    delete this.assignment.newAssignmentId;

    this.sourceUserId = dragDetails.originalUserId;
    this.sourceDateStr = dragDetails.originalDateStr;
    this.sourceKey = `${this.sourceUserId}-${this.sourceDateStr}`;

    this.targetUserId = dragDetails.targetUserId;
    this.targetDateStr = dragDetails.targetDateStr;
    this.targetKey = `${this.targetUserId}-${this.targetDateStr}`;

    this.isCopy = dragDetails.isCopyOperation;

    this.execute = function() {
        if (!scheduleAssignments[this.targetKey]) {
            scheduleAssignments[this.targetKey] = { shifts: [] };
        }
        scheduleAssignments[this.targetKey].shifts.push(this.assignment);

        if (!this.isCopy) {
            const sourceDay = scheduleAssignments[this.sourceKey];
            const index = sourceDay.shifts.findIndex(a => a.assignmentId === dragDetails.assignmentId);
            if (index > -1) sourceDay.shifts.splice(index, 1);
        }
        saveScheduleAssignments();
        renderWeeklySchedule();
    };

    this.undo = function() {
        const targetDay = scheduleAssignments[this.targetKey];
        const index = targetDay.shifts.findIndex(a => a.assignmentId === this.assignment.assignmentId);
        if (index > -1) targetDay.shifts.splice(index, 1);

        if (!this.isCopy) {
            const sourceDay = scheduleAssignments[this.sourceKey];
            const originalAssignment = { ...this.assignment, assignmentId: dragDetails.assignmentId };
            sourceDay.shifts.push(originalAssignment);
        }
        saveScheduleAssignments();
        renderWeeklySchedule();
    };
}


// --- 4. The History Manager Object ---

export const HistoryManager = {
    /**
     * Executes a command and adds it to the history stack.
     * @param {object} command - An instance of a command class (e.g., ModifyAssignmentCommand).
     */
    doAction: function(command) {
        // If we've undone actions, new actions should clear the "redo" stack.
        if (historyPointer < historyStack.length - 1) {
            historyStack = historyStack.slice(0, historyPointer + 1);
        }
        historyStack.push(command);
        historyPointer++;
        command.execute();
        this.updateUndoRedoButtons();
    },

    /**
     * Undoes the last action.
     */
    undo: function() {
        if (historyPointer >= 0) {
            const command = historyStack[historyPointer];
            command.undo();
            historyPointer--;
            this.updateUndoRedoButtons();
        }
    },

    /**
     * Redoes the last undone action.
     */
    redo: function() {
        if (historyPointer < historyStack.length - 1) {
            historyPointer++;
            const command = historyStack[historyPointer];
            command.execute();
            this.updateUndoRedoButtons();
        }
    },

    /**
     * Updates the enabled/disabled state of the undo/redo buttons.
     */
    updateUndoRedoButtons: function() {
        if (undoBtn && redoBtn) {
            undoBtn.disabled = historyPointer < 0;
            redoBtn.disabled = historyPointer >= historyStack.length - 1;
        }
    },

    /**
     * Clears the entire history stack.
     */
    clear: function() {
        historyStack = [];
        historyPointer = -1;
        this.updateUndoRedoButtons();
    }
};