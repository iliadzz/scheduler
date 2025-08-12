// js/firebase/firestore.js

// 1. Import dependencies
import {
    departments,
    roles,
    users,
    shiftTemplates,
    events,
    scheduleAssignments,
    restaurantSettings
} from '../state.js';
import { renderDepartments } from '../ui/departments.js';
import { renderRoles } from '../ui/roles.js';
import { renderEmployees } from '../ui/employees.js';
import { renderShiftTemplates } from '../ui/shifts.js';
import { renderWeeklySchedule } from '../ui/scheduler.js';
import { initSettingsTab } from '../ui/settings.js';

// --- Module-level variable ---
// By declaring this here, it's accessible to all functions in this file. THIS IS THE FIX.
const originalSetItem = window.localStorage.setItem.bind(window.localStorage);


// --- Private Helper Function ---
async function syncCollectionToFirestore(collectionName, localData) {
    if (!window.db) return;

    const collectionRef = window.db.collection(collectionName);
    const batch = window.db.batch();

    const snapshot = await collectionRef.get();
    const firestoreIds = new Set(snapshot.docs.map(doc => doc.id));
    const localIds = new Set(localData.map(item => String(item.id)));

    firestoreIds.forEach(id => {
        if (!localIds.has(id)) {
            batch.delete(collectionRef.doc(id));
        }
    });

    localData.forEach(item => {
        const docId = String(item.id);
        const docRef = collectionRef.doc(docId);
        batch.set(docRef, item);
    });

    await batch.commit();
}


// --- Exported Main Functions ---

export function initializeSync() {
    // Define which keys should trigger a sync to Firestore
    const syncableKeys = ['users', 'departments', 'roles', 'events', 'shiftTemplates', 'scheduleAssignments', 'restaurantSettings'];

    window.localStorage.setItem = function(key, value) {
        originalSetItem(key, value); // Always save to local storage first

        if (!syncableKeys.includes(key) || !window.db) {
            return;
        }

        try {
            const data = JSON.parse(value);

            if (key === 'restaurantSettings') {
                window.db.collection('settings').doc('main').set(data || {}, { merge: true });
            } else if (key === 'scheduleAssignments' && data && typeof data === 'object') {
                const batch = window.db.batch();
                Object.keys(data).forEach(docId => {
                    batch.set(window.db.collection('scheduleAssignments').doc(docId), data[docId] || {});
                });
                batch.commit();
            } else if (Array.isArray(data)) {
                syncCollectionToFirestore(key, data);
            }
        } catch (e) {
            console.error(`Error syncing to Firestore for key "${key}":`, e);
        }
    };
}

/**
 * Sets up real-time listeners on all Firestore collections.
 */
export function initializeDataListeners() {
    if (!window.db) return;

    const renderAll = () => {
        renderDepartments();
        renderRoles();
        renderShiftTemplates();
        renderEmployees();
        initSettingsTab();
        renderWeeklySchedule();
    };

    window.db.collection('departments').onSnapshot(snapshot => {
        console.log("Firestore: Departments updated.");
        const updatedData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        departments.length = 0;
        Array.prototype.push.apply(departments, updatedData);
        originalSetItem('departments', JSON.stringify(departments));
        renderAll();
    });

    window.db.collection('roles').onSnapshot(snapshot => {
        console.log("Firestore: Roles updated.");
        const updatedData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        roles.length = 0;
        Array.prototype.push.apply(roles, updatedData);
        originalSetItem('roles', JSON.stringify(roles));
        renderAll();
    });

    window.db.collection('users').onSnapshot(snapshot => {
        console.log("Firestore: Users updated.");
        const updatedData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        users.length = 0;
        Array.prototype.push.apply(users, updatedData);
        originalSetItem('users', JSON.stringify(users));
        renderAll();
    });

    window.db.collection('shiftTemplates').onSnapshot(snapshot => {
        console.log("Firestore: Shift Templates updated.");
        const updatedData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        shiftTemplates.length = 0;
        Array.prototype.push.apply(shiftTemplates, updatedData);
        originalSetItem('shiftTemplates', JSON.stringify(shiftTemplates));
        renderAll();
    });

    window.db.collection('events').onSnapshot(snapshot => {
        console.log("Firestore: Events updated.");
        const updatedData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        events.length = 0;
        Array.prototype.push.apply(events, updatedData);
        originalSetItem('events', JSON.stringify(events));
        renderWeeklySchedule();
    });

    window.db.collection('scheduleAssignments').onSnapshot(snapshot => {
        console.log("Firestore: Schedule updated.");
        Object.keys(scheduleAssignments).forEach(key => delete scheduleAssignments[key]);
        snapshot.forEach(doc => { scheduleAssignments[doc.id] = doc.data() });
        originalSetItem('scheduleAssignments', JSON.stringify(scheduleAssignments));
        renderWeeklySchedule();
    });

    window.db.collection('settings').doc('main').onSnapshot(doc => {
        console.log("Firestore: Settings updated.");
        const newSettings = doc.exists ? doc.data() : {};
        Object.keys(restaurantSettings).forEach(key => delete restaurantSettings[key]);
        Object.assign(restaurantSettings, newSettings);
        originalSetItem('restaurantSettings', JSON.stringify(restaurantSettings));
        initSettingsTab();
        renderWeeklySchedule();
    });
}