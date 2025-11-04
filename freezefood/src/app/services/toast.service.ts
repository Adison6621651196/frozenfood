import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private containerSelector = '.ff-toast-container';

  show(message: string, type: 'success'|'info'|'error' = 'info', duration = 3500) {
    try {
      let container = document.querySelector(this.containerSelector);
      if (!container) {
        container = document.createElement('div');
        container.className = this.containerSelector.replace('.', '');
        document.body.appendChild(container);
      }
      const toast = document.createElement('div');
      toast.className = 'ff-toast';
      if (type === 'success') toast.classList.add('success');
      if (type === 'info') toast.classList.add('info');
      if (type === 'error') toast.classList.add('error');
      toast.setAttribute('role', 'status');
      toast.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="ff-icon">✓</div>
          <div class="ff-msg">${message}</div>
        </div>
      `;
      const closeBtn = document.createElement('button');
      closeBtn.className = 'ff-close';
      closeBtn.innerText = '✕';
      closeBtn.addEventListener('click', () => { if (toast.parentElement) toast.parentElement.removeChild(toast); });
      toast.appendChild(closeBtn);
      container.appendChild(toast);
      setTimeout(() => { if (toast.parentElement) toast.parentElement.removeChild(toast); }, duration);
    } catch (e) {
      try { alert(message); } catch { /* ignore */ }
    }
  }

  success(message: string, duration = 3500) { this.show(message, 'success', duration); }
  info(message: string, duration = 3500) { this.show(message, 'info', duration); }
  error(message: string, duration = 3500) { this.show(message, 'error', duration); }

  /**
   * Show a simple confirm modal. Returns a Promise resolved with true if confirmed, false if cancelled.
   */
  confirm(message: string, title = 'ยืนยันการทำรายการ'): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      try {
        const overlay = document.createElement('div');
        overlay.className = 'ff-confirm-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'ff-confirm-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.innerHTML = `
          <div class="ff-confirm-title">${title}</div>
          <div class="ff-confirm-message">${message}</div>
          <div class="ff-confirm-actions">
            <button class="ff-confirm-btn ff-confirm-cancel">ยกเลิก</button>
            <button class="ff-confirm-btn ff-confirm-ok">ตกลง</button>
          </div>
        `;

        const onRemove = (result: boolean) => {
          try {
            if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
          } catch (e) { /* ignore */ }
          resolve(result);
        };

        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) onRemove(false);
        });

        const cancelBtn = dialog.querySelector('.ff-confirm-cancel') as HTMLButtonElement;
        const okBtn = dialog.querySelector('.ff-confirm-ok') as HTMLButtonElement;
        cancelBtn?.addEventListener('click', () => onRemove(false));
        okBtn?.addEventListener('click', () => onRemove(true));

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        // focus OK for quick keyboard action
        setTimeout(() => okBtn?.focus(), 50);
      } catch (e) {
        // Fallback to native confirm if anything goes wrong
        try { resolve(confirm(message)); } catch { resolve(false); }
      }
    });
  }
}
