import { Sound } from '../sound.js';

let touch = null;

export function showModal(title, bodyHtml, buttons = []) {
  const isMobile = window.innerWidth < 768;
  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('modal');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  const footerEl = document.getElementById('modalFooter');

  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;

  footerEl.innerHTML = buttons.map((btn, i) => {
    return `<button class="btn ${btn.class || 'btn-secondary'}" data-modal-btn="${i}">${btn.label}</button>`;
  }).join('');

  const closeModal = () => {
    if (isMobile) {
      modal.style.transition = 'transform 0.3s ease';
      modal.style.transform = 'translateY(100%)';
      cleanup();
      setTimeout(() => {
        overlay.classList.remove('open');
        modal.classList.remove('bottom-sheet');
        modal.style.transform = '';
        modal.style.transition = '';
      }, 300);
    } else {
      overlay.classList.remove('open');
      cleanup();
    }
  };

  const cleanup = () => {
    document.removeEventListener('keydown', handleKeydown);
  };

  const handleKeydown = (e) => {
    if (e.key === 'Escape') closeModal();
  };

  document.addEventListener('keydown', handleKeydown);

  document.getElementById('modalClose').addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  footerEl.querySelectorAll('[data-modal-btn]').forEach(el => {
    const idx = parseInt(el.dataset.modalBtn);
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      Sound.click();
      buttons[idx].action(closeModal);
      cleanup();
    });
  });

  overlay.classList.add('open');

  if (isMobile) {
    modal.classList.add('bottom-sheet');

    if (!modal.querySelector('.bottom-sheet-handle')) {
      const handle = document.createElement('div');
      handle.className = 'bottom-sheet-handle';
      modal.querySelector('.modal-header').prepend(handle);
    }

    requestAnimationFrame(() => {
      modal.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
      modal.style.transform = 'translateY(0)';
    });

    initSheetDrag(modal, closeModal);
  }
}

function initSheetDrag(modal, closeSheet) {
  const handle = modal.querySelector('.bottom-sheet-handle');
  if (!handle) return;

  handle.addEventListener('touchstart', (e) => {
    touch = { startY: e.touches[0].clientY, startX: e.touches[0].clientX, moved: false };
  }, { passive: true });

  handle.addEventListener('touchmove', (e) => {
    if (!touch) return;
    const dy = e.touches[0].clientY - touch.startY;
    if (dy < 0) return;

    touch.moved = true;
    modal.style.transition = 'none';
    modal.style.transform = `translateY(${dy}px)`;
  }, { passive: true });

  handle.addEventListener('touchend', () => {
    if (!touch || !touch.moved) { touch = null; return; }
    const dy = parseFloat((modal.style.transform || '').replace('translateY(', '').replace('px)', '') || '0');
    if (dy > modal.offsetHeight * 0.3) closeSheet();
    else {
      modal.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      modal.style.transform = 'translateY(0)';
    }
    touch = null;
  }, { passive: true });
}
