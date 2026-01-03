import { supabase } from './supabase';

// Get user notifications
export const getNotifications = async (userId: string, limit: number = 50) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// Create notification
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any
) => {
  const { error } = await supabase.from('notifications').insert([
    {
      user_id: userId,
      type,
      title,
      message,
      data,
      read: false,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) throw error;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw error;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
};

// Delete notification
export const deleteNotification = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
};

// Send match notification
export const notifyMatch = async (userId: string, matcherName: string, matcherId: string) => {
  await createNotification(userId, 'match', `Nouveau match !`, `${matcherName} vous a liké ! 😍`, {
    matcherId,
  });
};

// Send message notification
export const notifyNewMessage = async (userId: string, senderName: string, message: string) => {
  await createNotification(userId, 'message', `Nouveau message`, `${senderName}: ${message}`, {
    senderName,
  });
};

// Send session notification
export const notifySessionUpdate = async (userId: string, sessionTitle: string, message: string) => {
  await createNotification(userId, 'session', `Session: ${sessionTitle}`, message);
};
