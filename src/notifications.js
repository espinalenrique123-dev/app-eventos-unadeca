export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;

  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.error('No se pudo solicitar permiso para notificaciones:', error);
    return 'denied';
  }
}

export async function showEnrollmentNotification(event) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;

  const title = 'Inscripción confirmada';
  const options = {
    body: `Te inscribiste en "${event.title}". Te esperamos el ${event.detailDate || event.date}.`,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `inscripcion-${event.id}`
  };

  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
    return true;
  } catch (error) {
    console.error('No se pudo mostrar la notificación:', error);
    return false;
  }
}
