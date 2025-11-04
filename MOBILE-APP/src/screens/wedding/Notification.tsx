// Notification.tsx - FIXED VERSION
import React, { useState, useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Alert } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp} from "react-native-responsive-screen";
import colors from "../config/colors";

import NavigationSlider from './ReusableComponents/NavigationSlider';
import MenuBar from "./ReusableComponents/MenuBar";
import { useNotifications } from '../../context/NotificationContext';
import { useEvent } from '../../context/EventContext';
import { supabase } from "../../lib/supabase";

const Notification = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications, loading } = useNotifications();
  const eventContext = useEvent();

  useEffect(() => {
    console.log('🎯 NOTIFICATION SCREEN - CLEAN DEBUG:');
    console.log('   User ID from context:', eventContext.userId);
    console.log('   Notifications count:', notifications.length);
    console.log('   Unread count:', unreadCount);
    console.log('   Loading:', loading);
    
    // Safe log of eventContext without large data
    if (eventContext.eventData) {
      console.log('   Event Data (clean):', {
        event_type: eventContext.eventData.event_type,
        client_name: eventContext.eventData.client_name,
        event_date: eventContext.eventData.eventDate,
        budget_length: eventContext.eventData.budget?.length || 0,
        guests_length: eventContext.eventData.guests?.length || 0,
        has_eSignature: !!eventContext.eventData.eSignature,
        eSignature_length: eventContext.eventData.eSignature?.length || 0
      });
    }
    
    notifications.forEach((notif, index) => {
      console.log(`Notification ${index + 1}:`, {
        id: notif.id,
        user_uuid: notif.user_uuid,
        type: notif.type,
        title: notif.title,
        is_read: notif.is_read
      });
    });
  }, [notifications, unreadCount, loading, eventContext]);

  // Test function
  const testNotificationConnection = () => {
    console.log('Testing notification connection...');
    console.log('Current User ID:', eventContext.userId);
    refreshNotifications();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups: any, notification) => {
    const date = formatDate(notification.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {});

  const testDatabaseQuery = async () => {
  try {
    console.log('Testing direct database query...');
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_uuid', 'ab171470-b862-41cf-a3a6-1c63165836d4')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Direct query error:', error);
    } else {
      console.log(`Direct query found ${data.length} notifications`);
      data.forEach((notif, index) => {
        console.log(`   Notification ${index + 1}:`, {
          id: notif.id,
          type: notif.type,
          title: notif.title,
          created_at: notif.created_at,
          is_read: notif.is_read
        });
      });
    }
  } catch (error) {
    console.error('Test query error:', error);
  }
};

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient colors={["#FFFFFF", "#f2e8e2ff"]} style={{ flex: 1 }}>
          {/* HEADER */}
          <View>
            <NavigationSlider headerTitle="Notification" />
          </View>

          {/* CONTENT */}
            <ScrollView 
              style={styles.container}
              contentContainerStyle={styles.scrollViewContent}
            >
            {Object.keys(groupedNotifications).map((date) => (
              <View key={date}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationHeaderText}>{date}</Text>
                </View>

                {groupedNotifications[date].map((notification: any) => (
                  <TouchableOpacity 
                    key={notification.id}
                    style={[
                      styles.notifCard,
                      !notification.is_read && styles.unreadCard
                    ]}
                    onPress={() => markAsRead(notification.id)}
                  >
                    <View style={styles.notifCardImageContainer}>
                      <Image
                        source={require("../../assets/notif.png")}
                        style={styles.notifCardImage}
                        resizeMode="contain"
                      />
                      {!notification.is_read && <View style={styles.unreadDot} />}
                    </View>
                    <View style={styles.notifContent}>
                      <Text style={styles.notifCardText}>{notification.title}</Text>
                      <Text style={styles.notifCardSubText}>{notification.message}</Text>
                      
                      {notification.type === 'PAYMENT_REMINDER' && notification.data && (
                        <View style={styles.paymentDetails}>
                          <Text style={styles.paymentText}>
                            Due: {notification.data.formattedDueDate}
                          </Text>
                          {notification.data.gcashName && (
                            <Text style={styles.paymentText}>
                              GCash: {notification.data.gcashName} ({notification.data.gcashNumber})
                            </Text>
                          )}
                          {notification.data.notes && (
                            <Text style={styles.remarksText}>
                              Note: {notification.data.notes}
                            </Text>
                          )}
                        </View>
                      )}
                      {notification.type === 'EVENT_STATUS_UPDATE' && notification.data?.remarks && (
                        <Text style={styles.remarksText}>
                          Remarks: {notification.data.remarks}
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>
                        {formatTime(notification.created_at)}
                      </Text>
                    </View>
                    
                    
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {notifications.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No notifications yet</Text>
                <Text style={styles.emptyStateSubText}>
                  You'll see notifications here when your event status changes
                </Text>
              </View>
            )}

            {loading && (
              <View style={styles.loadingState}>
                <Text style={styles.loadingText}>Loading notifications...</Text>
              </View>
            )}
            {unreadCount > 0 && (
              <TouchableOpacity 
                style={styles.markAllButton}
                onPress={markAllAsRead}
              >
                <Text style={styles.markAllText}>Mark all as read</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </LinearGradient>
        <MenuBar activeScreen={"Notification"} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  markAllButton: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: colors.brown,
  },

  markAllText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },

  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  notificationHeader: {
    marginTop: 16,
    paddingVertical: 8,
  },

  notificationHeaderText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },

  notifCard: {
    padding: 16,
    elevation: 3,
    shadowRadius: 3,
    borderRadius: 12,
    marginBottom: 12,
    shadowOpacity: 0.1,
    flexDirection: 'row',
    shadowColor: '#000',
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: 2 },
  },

  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.brown,
  },

  notifCardImageContainer: {
    marginRight: 12,
    position: 'relative',
  },

  notifCardImage: {
    width: 40,
    height: 40,
  },

  unreadDot: {
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    backgroundColor: '#FF3B30',
  },

  notifContent: {
    flex: 1,
  },

  notifCardText: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: 'bold',
  },

  notifCardSubText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },

  paymentDetails: {
    padding: 8,
    marginTop: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },

  paymentText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },

  remarksText: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
    fontStyle: 'italic',
  },

  timeContainer: {
    justifyContent: 'center',
  },

  timeText: {
    fontSize: 12,
    color: '#999',
  },

  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    fontWeight: 'bold',
  },

  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  loadingState: {
    alignItems: 'center',
    paddingVertical: 40,
    justifyContent: 'center',
  },

  loadingText: {
    fontSize: 16,
    color: '#666',
  },

  scrollViewContent: {
    paddingBottom: 60,
  },
});

export default Notification;