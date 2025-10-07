// A simple, non-rendering notification service.
// In a real app, this would likely integrate with a UI library (like react-toastify)
// or a browser notifications API.

type NotificationType = 'success' | 'error' | 'info';

const logNotification = (type: NotificationType, title: string, message: string) => {
    console.log(`[Notification - ${type.toUpperCase()}]`);
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);
};

export const notify = {
    success: (title: string, message: string) => {
        logNotification('success', title, message);
        // Example: alert(`${title}: ${message}`);
    },
    error: (title: string, message: string) => {
        logNotification('error', title, message);
        // Example: alert(`${title}: ${message}`);
    },
    info: (title: string, message: string) => {
        logNotification('info', title, message);
        // Example: alert(`${title}: ${message}`);
    }
};
