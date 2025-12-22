export function notify(message: string, type: string = 'gray') {
  const notifications = document.getElementById('notifications');
  if (notifications) {
    const notification = document.createElement('div');
    notification.innerHTML = message;
    notification.style.color = 'white';
    notification.style.backgroundColor = type;
    notification.style.padding = '10px';
    notification.style.marginBottom = '2px';
    notification.style.borderRadius = '5px';
    notifications.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

export function attention(message: string, type: string = 'gold') {
  notify(message, type);
}

export function warn(message: string, type: string = 'red') {
  notify(message, type);
}

export function success(message: string, type: string = 'green') {
  notify(message, type);
}

export function Notifications() {
  return (
    <div id="notifications"></div>
  );
}
