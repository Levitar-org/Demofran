export function initKanbanDrag({ onStatusChange } = {}) {
  initMouseDrag({ onStatusChange });
  initTouchDrag({ onStatusChange });
}

function initMouseDrag({ onStatusChange } = {}) {
  const items = document.querySelectorAll('.kanban-item[draggable]');
  const columns = document.querySelectorAll('.kanban-column');

  items.forEach(item => {
    item.addEventListener('dragstart', () => item.classList.add('dragging'));
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      const taskId = item.dataset.taskId;
      const col = item.closest('.kanban-column');
      if (col && taskId) {
        const newStatus = col.dataset.status;
        if (onStatusChange) onStatusChange(taskId, newStatus);
      }
    });
  });

  columns.forEach(col => {
    col.addEventListener('dragover', e => {
      e.preventDefault();
      const dragging = document.querySelector('.dragging');
      if (!dragging) return;
      const container = col.querySelector('.kanban-items');
      const after = getDragAfterElement(container, e.clientY);
      if (after) container.insertBefore(dragging, after);
      else container.appendChild(dragging);
    });
  });
}

function initTouchDrag({ onStatusChange } = {}) {
  let touchState = null;

  document.addEventListener('touchstart', (e) => {
    const item = e.target.closest('.kanban-item[draggable]');
    if (!item || item.dataset.swiping === 'true') return;
    if (e.target.closest('.btn, button, a, input, select, textarea, .swipe-action')) return;

    const touch = e.touches[0];
    touchState = {
      item,
      startX: touch.clientX,
      startY: touch.clientY,
      offsetX: touch.clientX - item.getBoundingClientRect().left,
      offsetY: touch.clientY - item.getBoundingClientRect().top,
      moved: false,
    };
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!touchState) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchState.startX;
    const dy = touch.clientY - touchState.startY;

    if (!touchState.moved && Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    if (!touchState.moved && Math.abs(dy) < Math.abs(dx) * 1.5) return;

    e.preventDefault();
    touchState.moved = true;

    const item = touchState.item;
    item.style.position = 'fixed';
    item.style.zIndex = '1000';
    item.style.width = `${item.offsetWidth}px`;
    item.style.pointerEvents = 'none';
    item.style.left = `${touch.clientX - touchState.offsetX}px`;
    item.style.top = `${touch.clientY - touchState.offsetY}px`;
    item.style.transform = 'rotate(2deg) scale(1.05)';
    item.style.opacity = '0.9';
    item.style.transition = 'none';
    item.classList.add('dragging');

    const targetCol = getTouchColumn(touch.clientX, touch.clientY);
    if (targetCol) {
      const container = targetCol.querySelector('.kanban-items');
      const after = getDragAfterElement(container, touch.clientY);
      if (after) container.insertBefore(item, after);
      else container.appendChild(item);
    }
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if (!touchState || !touchState.moved) { touchState = null; return; }

    const item = touchState.item;
    item.style.position = '';
    item.style.zIndex = '';
    item.style.width = '';
    item.style.pointerEvents = '';
    item.style.left = '';
    item.style.top = '';
    item.style.transform = '';
    item.style.opacity = '';
    item.style.transition = '';
    item.classList.remove('dragging');

    const col = item.closest('.kanban-column');
    if (col) {
      const newStatus = col.dataset.status;
      const taskId = item.dataset.taskId;
      if (onStatusChange && taskId) onStatusChange(taskId, newStatus);
    }

    touchState = null;
  }, { passive: true });

  document.addEventListener('touchcancel', () => {
    if (!touchState) return;
    if (touchState.item) {
      touchState.item.style.position = '';
      touchState.item.style.zIndex = '';
      touchState.item.style.width = '';
      touchState.item.style.pointerEvents = '';
      touchState.item.style.left = '';
      touchState.item.style.top = '';
      touchState.item.style.transform = '';
      touchState.item.style.opacity = '';
      touchState.item.style.transition = '';
      touchState.item.classList.remove('dragging');
    }
    touchState = null;
  }, { passive: true });
}

function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll('.kanban-item:not(.dragging)')];
  return elements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function getTouchColumn(x, y) {
  const columns = document.querySelectorAll('.kanban-column');
  for (const col of columns) {
    const rect = col.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return col;
  }
  return null;
}
