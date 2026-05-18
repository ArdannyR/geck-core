import axios from 'axios';

export const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) return;

  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high'
  };

  try {
    await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error enviando push notification:', error.message);
  }
};
