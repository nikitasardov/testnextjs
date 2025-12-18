
import { useState } from 'react';

export function addNotification(message: string, type: string = 'info') {
  const notifications = document.getElementById('notifications');
  if (notifications) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.color = 'white';
    notification.style.backgroundColor = type === 'info' ? 'gray' : 'red';
    notification.style.padding = '10px';
    notification.style.marginBottom = '2px';
    notification.style.borderRadius = '5px';
    notifications.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

export function addWarning(message: string, type: string = 'warning') {
  addNotification(message, type);
}

export function Notifications() {
  return (
    <div id="notifications"></div>
  );
}
