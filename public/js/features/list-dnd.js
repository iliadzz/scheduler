// Generic Drag-and-Drop Module: All the repetitive drag-and-drop code from the departments, roles, and shifts tabs has been moved into a single, reusable module located at js/features/
// list-dnd.js.// js/features/list-dnd.js

let draggedItemInfo = null;

function handleDragStart(event, itemId) {
    draggedItemInfo = { id: itemId };
    event.dataTransfer.setData('text/plain', itemId);
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
        if (event.target.classList) {
            event.target.classList.add('dragging-item');
        }
    }, 0);
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const targetRow = event.currentTarget;
    if (targetRow && targetRow.dataset.itemId !== (draggedItemInfo ? draggedItemInfo.id : null)) {
        targetRow.classList.add('drag-over-item');
    }
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over-item');
}

function handleDrop(event, itemsArray, saveFunction, renderFunction) {
    event.preventDefault();
    event.stopPropagation();
    const targetRow = event.currentTarget;
    targetRow.classList.remove('drag-over-item');

    if (!draggedItemInfo) return;

    const droppedOnItemId = targetRow.dataset.itemId;
    if (draggedItemInfo.id === droppedOnItemId) return;

    const fromIndex = itemsArray.findIndex(item => item.id === draggedItemInfo.id);
    const toIndex = itemsArray.findIndex(item => item.id === droppedOnItemId);

    if (fromIndex === -1 || toIndex === -1) return;

    const [movedItem] = itemsArray.splice(fromIndex, 1);
    itemsArray.splice(toIndex, 0, movedItem);

    saveFunction();
    renderFunction();
}

function handleDragEnd(event) {
    if (event.target.classList) {
       event.target.classList.remove('dragging-item');
    }
    document.querySelectorAll('.drag-over-item').forEach(row => row.classList.remove('drag-over-item'));
    draggedItemInfo = null;
}

export function makeListSortable(listElement, itemsArray, saveFunction, renderFunction) {
    const listItems = listElement.querySelectorAll('li.draggable-item');
    listItems.forEach(item => {
        const itemId = item.dataset.itemId;
        if (!itemId) return;

        item.addEventListener('dragstart', (e) => handleDragStart(e, itemId));
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', (e) => handleDrop(e, itemsArray, saveFunction, renderFunction));
        item.addEventListener('dragend', handleDragEnd);
    });
}