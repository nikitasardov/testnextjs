function withTimeout(element: HTMLElement, timeout: number = 3000) {
  setTimeout(() => {
    element.remove();
  }, timeout);
}

export function notify(message: string, type: string = 'gray', persistent: boolean = false, timeout: number = 3000) {
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
      withTimeout(notification, timeout);
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

export function inProgress(message: string, timeout: number = 20000) {
  const notifications = document.getElementById('notifications');
  if (notifications) {
    const single = notifications.dataset.single === 'true';

    if (single) {
      // Удаляем все существующие уведомления
      notifications.innerHTML = '';
    }

    const notification = document.createElement('div');
    notification.innerHTML = message;
    notification.style.color = 'white';
    notification.style.padding = '10px';
    notification.style.marginBottom = '2px';
    notification.style.borderRadius = '5px';
    notification.style.background = 'linear-gradient(90deg, #808080 0%, #a0a0a0 25%, #808080 50%, #a0a0a0 75%, #808080 100%)';
    notification.style.backgroundSize = '300% 100%';
    notification.style.animation = 'shimmer-gray 5s linear infinite';

    notifications.appendChild(notification);
    withTimeout(notification, timeout);
  }
}

export function Container({ single = false }: { readonly single?: boolean }) {
  return (
    <div id="notifications" data-single={single.toString()}></div>
  );
}
