// js/ui/modals.js

import { employeeFormModal, employeeModalTitle } from '../dom.js';
import { getTranslatedString } from '../i18n.js';
// --- THIS IS THE FIX ---
// The static import that creates the circular dependency is removed.
// import { resetEmployeeForm } from './employees.js';

// Re-export functions from the new, specialized modal module
export { 
    openModalForEdit, 
    openAssignShiftModalForNewOrCustom, 
    handleAssignShift,
    initAssignShiftModalListeners 
} from './assign-shift-modal.js';

/**
 * Opens the "Add Employee" modal.
 */
// --- THIS IS THE FIX ---
// The function is now async to allow for a dynamic import.
export async function showAddEmployeeModal() {
    if (employeeModalTitle) employeeModalTitle.textContent = getTranslatedString('hdrAddEmployee');
    
    // Dynamically import the function when needed to break the import cycle.
    const { resetEmployeeForm } = await import('./employees.js');
    resetEmployeeForm();

    if (employeeFormModal) employeeFormModal.style.display = 'block';
}

/**
 * Initializes generic listeners for all modals, like closing them.
 */
export function initModalListeners() {
    // This function can be expanded if there are other generic modal behaviors.
}