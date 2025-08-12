// js/main.js

// --- 1. IMPORT MODULES ---
import { setLanguage } from './i18n.js';
import { HistoryManager } from './features/history.js';
import { restaurantSettings, saveRestaurantSettings } from './state.js';
import { populateTimeSelectsForElements } from './utils.js';

import * as dom from './dom.js';

import { setupAuthListeners } from './firebase/auth.js';
import { initializeSync, initializeDataListeners } from './firebase/firestore.js';

import { renderDepartments, resetDepartmentForm, handleSaveDepartment } from './ui/departments.js';
// CORRECTED: Merged all imports from roles.js into a single line
import { renderRoles, resetRoleForm, handleSaveRole, populateRoleColorPalette } from './ui/roles.js';
import { renderEmployees, populateTerminationReasons, resetEmployeeForm, handleSaveEmployee, initEmployeeModalListeners } from './ui/employees.js';
import { renderShiftTemplates, resetShiftTemplateForm, handleSaveShiftTemplate } from './ui/shifts.js';
import {
    renderWeeklySchedule,
    handlePrevWeek,
    handleNextWeek,
    handleThisWeek,
    handleWeekChange,
    handlePrint,
    handleCopyWeek,
    handleClearWeek
} from './ui/scheduler.js';
import { initSettingsTab, handleSaveSettings, handleFullBackup, handleRestoreFile } from './ui/settings.js';
import { showEventsModal, handleSaveEvent, populateEventColorPalette, initEventListeners as initEventModalListeners } from './ui/events.js';
import { showAddEmployeeModal, handleAssignShift, initModalListeners } from './ui/modals.js';


// --- 2. DEFINE THE APPLICATION ENTRY POINT ---
window.__startApp = function() {
    console.log("DOM and Auth ready. Initializing application...");

    initializeSync();
    initializeDataListeners();

    // --- Initial Render & Setup ---
    populateRoleColorPalette();
    populateTimeSelectsForElements(dom.shiftTemplateStartHourSelect, dom.shiftTemplateStartMinuteSelect, "09", "00");
    populateTimeSelectsForElements(dom.shiftTemplateEndHourSelect, dom.shiftTemplateEndMinuteSelect, "17", "00");
    populateTimeSelectsForElements(dom.customShiftStartHourSelect, dom.customShiftStartMinuteSelect);
    populateTimeSelectsForElements(dom.customShiftEndHourSelect, dom.customShiftEndMinuteSelect);

    populateTerminationReasons();
    populateEventColorPalette();
    initEventModalListeners();
    initModalListeners();
    initEmployeeModalListeners();
    renderDepartments();
    renderRoles();
    renderEmployees();
    renderShiftTemplates();
    initSettingsTab();
    renderWeeklySchedule();

    HistoryManager.updateUndoRedoButtons();

    // --- Event Listener Setup ---
    dom.languageSelect.addEventListener('change', (e) => {
        setLanguage(e.target.value);
        renderDepartments();
        renderRoles();
        renderEmployees();
        renderShiftTemplates();
        initSettingsTab();
        renderWeeklySchedule();
    });
    
    dom.tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (link.hasAttribute('data-tab')) {
                dom.tabLinks.forEach(l => l.classList.remove('active'));
                dom.tabContents.forEach(c => c.classList.remove('active'));
                link.classList.add('active');
                const tabId = link.dataset.tab;
                document.getElementById(tabId)?.classList.add('active');
                HistoryManager.clear();
            }
        });
    });

    dom.addDepartmentBtn.addEventListener('click', handleSaveDepartment);
    dom.cancelEditDepartmentBtn.addEventListener('click', resetDepartmentForm);
    
    dom.addRoleBtn.addEventListener('click', handleSaveRole);
    dom.cancelEditRoleBtn.addEventListener('click', resetRoleForm);

    dom.showAddEmployeeModalBtn.addEventListener('click', showAddEmployeeModal);
    dom.addEmployeeBtn.addEventListener('click', handleSaveEmployee);
    dom.cancelEditEmployeeBtn.addEventListener('click', () => {
        resetEmployeeForm();
        if(dom.employeeFormModal) dom.employeeFormModal.style.display = 'none';
    });
    dom.employeeListFilter.addEventListener('change', renderEmployees);

    dom.addShiftTemplateBtn.addEventListener('click', handleSaveShiftTemplate);
    dom.cancelEditShiftTemplateBtn.addEventListener('click', resetShiftTemplateForm);
    dom.shiftTemplateListFilter.addEventListener('change', renderShiftTemplates);

    dom.prevWeekBtn.addEventListener('click', handlePrevWeek);
    dom.nextWeekBtn.addEventListener('click', handleNextWeek);
    dom.thisWeekBtn.addEventListener('click', handleThisWeek);
    dom.weekPickerAlt.addEventListener('change', handleWeekChange);
    dom.printScheduleBtn.addEventListener('click', handlePrint);
    dom.executeCopyWeekBtn.addEventListener('click', handleCopyWeek);
    dom.clearCurrentWeekBtn.addEventListener('click', handleClearWeek);
    dom.manageEventsBtn.addEventListener('click', showEventsModal);
    if(dom.departmentFilterButton) {
        dom.departmentFilterButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dom.departmentCheckboxesContainer.classList.toggle('visible');
            dom.departmentFilterButton.classList.toggle('expanded');
        });
    }

    dom.saveRestaurantSettingsBtn.addEventListener('click', handleSaveSettings);
    dom.backupAllDataBtn.addEventListener('click', handleFullBackup);
    dom.restoreDataInput.addEventListener('change', handleRestoreFile);

    dom.saveAssignedShiftBtn.addEventListener('click', handleAssignShift);
    dom.addEventBtn.addEventListener('click', handleSaveEvent);

    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) undoBtn.addEventListener('click', () => HistoryManager.undo());
    if (redoBtn) redoBtn.addEventListener('click', () => HistoryManager.redo());

    window.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            if (event.shiftKey) { HistoryManager.redo(); } else { HistoryManager.undo(); }
        }
        if ((event.ctrlKey) && event.key.toLowerCase() === 'y') {
            event.preventDefault();
            HistoryManager.redo();
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
        if (dom.departmentFilterMultiselect && !dom.departmentFilterMultiselect.contains(event.target)) {
            dom.departmentCheckboxesContainer.classList.remove('visible');
            dom.departmentFilterButton.classList.remove('expanded');
        }
    });
    document.querySelectorAll('.modal .close-modal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    const initialTabButton = document.querySelector('.tab-link[data-tab="scheduler-tab"]');
    if (initialTabButton) {
        initialTabButton.click();
    }
    window.addEventListener('click', (event) => {
    // This part handles closing modals, leave it as is
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }

    // This part handles the department filter, leave it as is
    if (dom.departmentFilterMultiselect && !dom.departmentFilterMultiselect.contains(event.target)) {
        dom.departmentCheckboxesContainer.classList.remove('visible');
        dom.departmentFilterButton.classList.remove('expanded');
    }

    // ADD THIS LOGIC: This now handles the role color picker
    const roleColorPopup = document.getElementById('role-color-popup');
    if (roleColorPopup && !roleColorPopup.contains(event.target) && event.target !== dom.roleColorPreview) {
        roleColorPopup.style.display = 'none';
    }
};


// --- 3. INITIALIZE AUTH ---
setupAuthListeners();
