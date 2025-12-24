function withTimeout(element: HTMLElement, timeout: number = 3000) {
  setTimeout(() => {
    element.remove();
  }, timeout);
}

export function notify(message: string, type: string = 'gray', persistent: boolean = false) {
  const notifications = document.getElementById('notifications');
  if (notifications) {
    const single = notifications.dataset.single === 'true';

    if (single) {
      // Удаляем все существующие уведомления
      notifications.innerHTML = '';
    } else if (persistent) {
      // Удаляем предыдущие постоянные уведомления
      const existingPersistent = notifications.querySelectorAll('.persistent-notification');
      existingPersistent.forEach(el => el.remove());
    }

    const notification = document.createElement('div');
    if (persistent) {
      notification.className = 'persistent-notification';
    }
    notification.innerHTML = message;
    notification.style.color = 'white';
    notification.style.backgroundColor = type;
    notification.style.padding = '10px';
    notification.style.marginBottom = '2px';
    notification.style.borderRadius = '5px';
    notifications.appendChild(notification);

    if (!persistent) {
      withTimeout(notification);
    }
  }
}

export function attention(message: string, type: string = 'gold', persistent: boolean = false) {
  notify(message, type, persistent);
}

export function warn(message: string, type: string = 'red', persistent: boolean = false) {
  notify(message, type, persistent);
}

export function success(message: string, type: string = 'green', persistent: boolean = false) {
  notify(message, type, persistent);
}

export function Container({ single = false }: { readonly single?: boolean }) {
  return (
    <div id="notifications" data-single={single.toString()}></div>
  );
}
