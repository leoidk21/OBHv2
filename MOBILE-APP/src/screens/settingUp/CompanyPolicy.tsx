import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, StatusBar, Alert, Button, Modal } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp, ParamListBase, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import colors from "../config/colors";
import { useFonts } from 'expo-font';
import CheckBox from "react-native-check-box";
import * as SecureStore from 'expo-secure-store';
import { useEvent } from '../../context/EventContext';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

type PolicyItem = {
  title: string;
  content: string;
};

const policies: PolicyItem[] = [
  {
    title: "Cancellation",  
    content: "If the client cancels the contracted event, the Event-Coordination Service will retain the 20% retainer fee as liquidated damages. Date of event can only be postponed and move to another date.",
  },
];

const CompanyPolicy = () => {
  const [fontsLoaded] = useFonts({
    'Poppins': require('../../assets/fonts/Poppins-Regular.ttf'),
    'Loviena': require('../../assets/fonts/lovienapersonaluseonlyregular-yy4pq.ttf'),
    'Canela': require('../../assets/fonts/CanelaCondensed-Regular-Trial.otf'),
    'Senbatsu': require('../../assets/fonts/Senbatsu.otf'),
    'Velista': require('../../assets/fonts/VELISTA.ttf'),
  });

  const [accepted, setAccepted] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { eventData, saveEventToBackend, debugStorageKeys } = useEvent();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  // DIAGNOSTIC: Check data when screen loads
  useEffect(() => {
    const checkDataOnMount = async () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('COMPANY POLICY SCREEN MOUNTED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const userId = await SecureStore.getItemAsync("userId");
      console.log('UserId:', userId);
      
      // Check memory
      console.log('EventData in memory:');
      console.log('   Keys:', Object.keys(eventData));
      console.log('   Client:', eventData.client_name);
      console.log('   Partner:', eventData.partner_name);
      console.log('   Date:', eventData.event_date);
      console.log('   Type:', eventData.event_type);
      console.log('   Price:', eventData.package_price);
      
      // Check storage
      if (userId) {
        const stored = await AsyncStorage.getItem(`eventData_${userId}`);
        console.log('Storage status:', !!stored);
        
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('Stored data keys:', Object.keys(parsed));
          console.log('Stored client:', parsed.client_name);
        } else {
          console.warn('NO DATA IN STORAGE!');
        }
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    };
    
    checkDataOnMount();
  }, []);

  const handleContinue = () => {
    if (!accepted) {
      Alert.alert("Please accept the Company Policy to proceed.");
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('REVIEW MODAL - Data Check:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Package:', eventData.selected_package);
    console.log('Price:', eventData.package_price);
    console.log('Guest Range:', eventData.guest_range);
    console.log('Clients:', eventData.client_name, '&', eventData.partner_name);
    console.log('Event Date:', eventData.event_date);
    console.log('Formatted Date:', eventData.formatted_event_date);
    console.log('Event Type:', eventData.event_type);
    console.log('Wedding Type:', eventData.wedding_type);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    setShowReviewModal(true);
  };

  const handleConfirmAndContinue = async () => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('CONFIRMING AND NAVIGATING');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const userId = await SecureStore.getItemAsync("userId");
      console.log('UserId:', userId);

      console.log('Memory keys:', Object.keys(eventData));
      console.log('Client:', eventData.client_name);

      if (!userId) {
        Alert.alert('Error', 'User ID missing. Please log in again.');
        return;
      }

      // Check and fix missing storage
      let stored = await AsyncStorage.getItem(`eventData_${userId}`);
      if (!stored) {
        console.warn('No stored data found — saving now...');
        await AsyncStorage.setItem(`eventData_${userId}`, JSON.stringify(eventData));
        stored = JSON.stringify(eventData);
        console.log('Data saved successfully to AsyncStorage!');
      } else {
        console.log('Storage already exists');
      }

      // Validate essential fields
      if (!eventData.client_name || !eventData.event_date) {
        Alert.alert('Error', 'Missing required event details.');
        return;
      }

      // Save to Supabase or backend
      await debugStorageKeys();
      await saveEventToBackend();

      console.log('Navigating to Home...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      setShowReviewModal(false);
      navigation.navigate("Home");

    } catch (error) {
      console.error('Error in handleConfirmAndContinue:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const toggleSection = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#FFFFFF", "#f2e8e2ff"]}
        style={styles.container}
      >
        <ScrollView>
          <View style={styles.topContainer}>
            <View style={styles.top}>
              <View>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => navigation.navigate("EventDate")}
                >
                  <FontAwesomeIcon
                    size={18}
                    color="#FFFFFF"
                    icon={faChevronLeft}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.policies}>
              <Text style={styles.policiesText}>
                Please review our company policies{"\n"}before continuing with your event.
              </Text>
            </View>
          </View>

          <View>
            <Text style={styles.topContentText}>
              Orchestrated By HIStory Contract Agreement
            </Text>
          </View>

          {policies.map((policy, index) => (
            <View key={index} style={styles.section}>
              <TouchableOpacity 
                onPress={() => toggleSection(index)} 
                style={styles.sectionHeader}
              >
                <Text style={styles.sectionTitle}>{policy.title}</Text>
              </TouchableOpacity>
              <Text style={styles.sectionContent}>• {policy.content}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.bottomSection}>
          <View style={styles.termsCondition}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: wp('4%') }}>
              <CheckBox isChecked={accepted} onClick={() => setAccepted(!accepted)} />
              <Text style={{ fontFamily: 'Poppins' }}>
                I hereby understand and agreed on these terms and conditions upon signing this contract.
              </Text>
            </View>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              style={[styles.continueBtn, !accepted && styles.continueBtnDisabled]}
              onPress={handleContinue}
              disabled={!accepted}
            >
              <Text style={styles.continue}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Review Modal */}
        <Modal
          visible={showReviewModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowReviewModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ready for Part 2?</Text>
                <Text style={styles.modalSubtitle}>Please review your event details</Text>
              </View>

              <ScrollView style={styles.reviewContent}>
                {/* Event Summary */}
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Event Summary</Text>
                  
                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewLabel}>Couple:</Text>
                    <Text style={styles.reviewValue}>
                      {eventData.client_name} & {eventData.partner_name}
                    </Text>
                  </View>

                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewLabel}>Wedding Type:</Text>
                    <Text style={styles.reviewValue}>{eventData.wedding_type}</Text>
                  </View>

                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewLabel}>Event Date:</Text>
                    <Text style={styles.reviewValue}>
                      {eventData.formatted_event_date || eventData.event_date}
                    </Text>
                  </View>

                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewLabel}>Package:</Text>
                    <Text style={styles.reviewValue}>
                      {eventData.guest_range} Pax {eventData.event_price}
                    </Text>
                  </View>

                  {eventData.selected_package?.coordinators && (
                    <View style={styles.reviewItem}>
                      <Text style={styles.reviewLabel}>Coordinators:</Text>
                      <View style={styles.coordinatorsList}>
                        {eventData.selected_package.coordinators.map((coordinator: string, index: number) => (
                          <Text key={index} style={styles.coordinatorText}>• {coordinator}</Text>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* Next Steps */}
                <View style={styles.nextStepsSection}>
                  <Text style={styles.nextStepsTitle}>What's Next?</Text>
                  <Text style={styles.nextStepsText}>
                    Get ready for Part 2! You'll now access advanced planning tools for:
                  </Text>
                  <View style={styles.nextStepsList}>
                    <Text style={styles.nextStepsItem}>• Budget Management</Text>
                    <Text style={styles.nextStepsItem}>• Guest List & RSVPs</Text>
                    <Text style={styles.nextStepsItem}>• Venue Selection</Text>
                    <Text style={styles.nextStepsItem}>• Payment Tracking</Text>
                    <Text style={styles.nextStepsItem}>• And much more!</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => setShowReviewModal(false)}
                >
                  <Text style={styles.modalButtonSecondaryText}>Go Back</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalButtonPrimary}
                  onPress={handleConfirmAndContinue}
                >
                  <Text style={styles.modalButtonPrimaryText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },

    continueBtnDisabled: {},

    backBtn: {
      gap: 5,
      left: wp("5%"),
      flexDirection: "row",
      alignItems: "center",
    },

    topContainer: {
      paddingVertical: hp("1.5%"),
      backgroundColor: colors.button,
    },

    top: {
      gap: 30,
      alignItems: "center",
      flexDirection: "row",
    },

    topContentText: {
      textAlign: "left",
      fontSize: wp("6%"),
      color: colors.black,
      marginTop: hp("2%"),
      fontFamily: "Loviena",
      marginHorizontal: wp("5%"),

      borderBottomWidth: 1,
      paddingBottom: hp("2%"),
      borderColor: colors.borderv1,
    },

    policies: {
      marginTop: hp("3%"),
      marginBottom: hp("1%"),
      marginHorizontal: wp("5%"),
    },

    policiesText: {
      fontSize: wp("4%"),
      color: colors.white,
      fontFamily: 'Poppins',
    },

    step: {
      gap: wp("3%"),
      flexDirection: "row",
      marginTop: hp("3.2%"),
    },
  
    stepDot: {
      alignItems: "center",
      justifyContent: "center",
      width: wp("15%"),
      height: hp("0.8%"),
      borderRadius: 50,
    },

    stepText: {
      top: hp("2%"), 
      right: wp("6%"), 
      fontSize: wp("4%"), 
      color: colors.brown,
    },

    section: {
      marginTop: hp("1%"),
      marginHorizontal: wp("5%"),
    },

    sectionTitle: {
      color: colors.black,
      fontSize: wp("4.5%"),
      fontFamily: 'Poppins',
      marginVertical: hp("0.5%"),
    },

    sectionContent: {
      textAlign: "justify",
      fontFamily: 'Poppins',
      marginHorizontal: wp("5%"),
    },

    sectionHeader: {},

    bottomSection: {
      borderTopWidth: 1,
      paddingVertical: hp('2%'),
      paddingHorizontal: wp('5%'),
      borderTopColor: colors.borderv1,
    },

    termsCondition: {
      gap: 5,
      alignItems: 'center',
      marginBottom: hp('2%'),
      borderColor: colors.borderv1,
    },

    continueBtn: {
      width: wp('88%'),
      alignItems: 'center',
      borderRadius: wp('50%'),
      paddingVertical: hp('1.4%'),
      backgroundColor: colors.button,
    },

    continue: {
      fontSize: 15,
      color: colors.white,
      fontFamily: 'Poppins',
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    modalContainer: {
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 25,
      margin: 20,
      maxHeight: '80%',
      width: '90%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    
    modalHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    
    modalTitle: {
      fontSize: 24,
      textAlign: 'center',
    },
    
    modalSubtitle: {
      fontSize: 16,
      color: '#666',
      marginTop: hp("1%"),
      textAlign: 'center',
      fontFamily: "Poppins",
    },
    
    reviewContent: {
      maxHeight: 400,
    },
    
    reviewSection: {
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border, 
      backgroundColor: '#f8f9fa',
    },
    
    reviewSectionTitle: {
      fontSize: 18,
      color: '#333',
      marginBottom: 15,
      paddingBottom: 5,
      borderBottomWidth: 1,
      fontFamily: "Poppins",
      borderBottomColor: '#ddd',
    },
    
    reviewItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
      flexWrap: 'wrap',
    },
    
    reviewLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#555',
      flex: 1,
      fontFamily: "Poppins",
    },
    
    reviewValue: {
      fontSize: 14,
      fontWeight: '500',
      flex: 1,
      textAlign: 'right',
    },
    
    coordinatorsList: {
      marginTop: 5,
    },
    
    coordinatorText: {
      fontSize: 12,
      color: '#666',
      marginBottom: 2,
      fontFamily: "Poppins",
    },
    
    nextStepsSection: {
      padding: 15,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,     
      backgroundColor: '#f8f9fa',
    },
    
    nextStepsTitle: {
      fontSize: 18,
      fontFamily: "Poppins",
    },
    
    nextStepsText: {
      fontSize: 14,
      color: '#333',
      marginBottom: 10,
      lineHeight: 20,
      fontFamily: "Poppins",
    },
    
    nextStepsList: {
      marginLeft: 10,
    },
    
    nextStepsItem: {
      fontSize: 13,
      color: '#555',
      marginBottom: 5,
      fontFamily: "Poppins",
    },
    
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
      gap: 10,
    },
    
    modalButtonSecondary: {
      flex: 1,
      padding: 12,
      borderRadius: 10,
      backgroundColor: '#f0f0f0',
      alignItems: 'center',
    },
    
    modalButtonSecondaryText: {
      color: '#666',
      fontFamily: 'Poppins',
      fontWeight: '600',
    },
    
    modalButtonPrimary: {
      flex: 1,
      padding: 12,
      borderRadius: 10,
      backgroundColor: colors.brown,
      alignItems: 'center',
    },
    
    modalButtonPrimaryText: {
      color: '#ffffff',
      fontFamily: 'Poppins',
    },
});

export default CompanyPolicy;
