// NotificationContext.tsx - UPDATED VERSION
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
// REMOVE: import { useEvent } from './EventContext';

interface Notification {
  id: number;
  user_uuid: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  refreshNotifications: async () => {},
  loading: false,
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [userUuid, setUserUuid] = useState<string | null>(null); // ✅ DIRECT STATE

  // ✅ GET USER UUID DIRECTLY FROM SUPABASE
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserUuid(session.user.id);
        console.log('🎯 NotificationContext - Direct user UUID:', session.user.id);
      } else {
        setUserUuid(null);
        console.log('🔒 NotificationContext - No user session');
      }
    };

    getCurrentUser();
  }, []);

  // ✅ LISTEN FOR AUTH CHANGES
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 NotificationContext - Auth state changed:', event);
        
        if (session?.user) {
          const newUserUuid = session.user.id;
          setUserUuid(newUserUuid);
          console.log('👤 NotificationContext - New user UUID:', newUserUuid);
          
          // Refresh notifications for new user
          await refreshNotificationsWithUuid(newUserUuid);
        } else {
          // User signed out - clear everything
          setUserUuid(null);
          setNotifications([]);
          setUnreadCount(0);
          console.log('🔒 NotificationContext - User signed out, cleared data');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ✅ SEPARATE FUNCTION FOR REFRESHING WITH UUID
  const refreshNotificationsWithUuid = async (uuid: string) => {
    console.log('Fetching notifications for user UUID:', uuid);
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_uuid', uuid)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        console.log(`Found ${data?.length || 0} notifications for UUID: ${uuid}`);
        setNotifications(data || []);
        
        const unread = data?.filter(notification => !notification.is_read).length || 0;
        console.log(`Unread count: ${unread}`);
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ MAIN REFRESH FUNCTION
  const refreshNotifications = async () => {
    if (!userUuid) {
      console.log('No userUuid available for fetching notifications');
      return;
    }
    await refreshNotificationsWithUuid(userUuid);
  };

  // ✅ REAL-TIME SUBSCRIPTION
  useEffect(() => {
    if (!userUuid) {
      console.log('No userUuid for real-time subscription');
      
      // Clean up existing subscription if user logs out
      if (subscription) {
        subscription.unsubscribe();
        setSubscription(null);
      }
      return;
    }

    console.log('🎯 Setting up real-time for user UUID:', userUuid);
    refreshNotifications(); // Initial fetch

    // Clean up existing subscription
    if (subscription) {
      console.log('🧹 Cleaning up old subscription');
      subscription.unsubscribe();
    }

    const newSubscription = supabase
      .channel(`notifications-${userUuid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_uuid=eq.${userUuid}`,
        },
        (payload) => {
          console.log('🔔 REAL-TIME UPDATE:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification;
            setNotifications(prev => {
              const exists = prev.some(n => n.id === newNotification.id);
              if (exists) return prev;
              console.log('New notification received:', newNotification);
              return [newNotification, ...prev];
            });
            
            if (!newNotification.is_read) {
              setUnreadCount(prev => prev + 1);
            }
          }
          else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification;
            setNotifications(prev => 
              prev.map(notification =>
                notification.id === updatedNotification.id
                  ? updatedNotification
                  : notification
              )
            );
            
            // Recalculate unread count
            refreshNotifications();
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Supabase subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to real-time notifications for UUID:', userUuid);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error in real-time subscription');
        }
      });

    setSubscription(newSubscription);

    return () => {
      console.log('🧹 Cleaning up subscription for UUID:', userUuid);
      newSubscription.unsubscribe();
    };
  }, [userUuid]); // ✅ Only depend on userUuid

  // ✅ MARK AS READ
  const markAsRead = async (id: number) => {
    if (!userUuid) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('user_uuid', userUuid);

      if (error) {
        console.error('❌ Error updating notification:', error);
      } else {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === id 
              ? { ...notification, is_read: true, read_at: new Date().toISOString() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // ✅ MARK ALL AS READ
  const markAllAsRead = async () => {
    if (!userUuid) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_uuid', userUuid)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error marking all as read:', error);
      } else {
        setNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            is_read: true,
            read_at: new Date().toISOString()
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  console.log('🎯 NotificationContext Debug:', {
    userUuid: userUuid,
    notificationsCount: notifications.length,
    unreadCount: unreadCount
  });

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      refreshNotifications,
      loading
    }}>
      {children}
    </NotificationContext.Provider>
  );
};