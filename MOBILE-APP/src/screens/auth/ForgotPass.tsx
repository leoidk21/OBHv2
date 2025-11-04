import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, Image, Dimensions, TextInput , Button, TouchableOpacity, ActivityIndicator} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../config/colors';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Alert } from 'react-native';

import { forgotPassword } from '../auth/user-auth';

const ForgotPass = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation: NavigationProp<ParamListBase> = useNavigation();

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const result = await forgotPassword(email);
      
      // Show the code in alert for testing
      Alert.alert(
        "Verification Code Generated", 
        `Your verification code is: ${result.code}\n\nUse this code on the next screen to reset your password.`,
        [{ 
          text: "Continue", 
          onPress: () => navigation.navigate('SendCode', { email }) 
        }]
      );
      
    } catch (error: any) {
      console.error('Forgot password error:', error);
      const errorMessage = error?.message || 'Failed to generate verification code. Please try again.';
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const forgotText = "Enter your email address and we'll send you a link to reset your password.";
  
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient
            colors={['#FFFFFF', '#f2e8e2ff']}
            style={styles.container}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('SignIn')}
          >
            <FontAwesomeIcon icon={faChevronLeft} size={24} color="#343131" />
            <Text>Back</Text>
          </TouchableOpacity>
          <View style={styles.centeredContent}> 
            <Image 
              source={require('../../assets/forgotpassIcon.png')}
              style={{
                width: wp('25%'),
                height: wp('25%'),
              }} 
              resizeMode='contain'
            />
            <Text style={[{ fontSize: wp('5.5%'), marginTop: hp('2.5%'), fontFamily: 'Poppins' }]}>Forgot Password?</Text>
            <Text style={[{ fontSize: wp('3.5%'), marginTop: hp('1%'), textAlign: 'center', paddingHorizontal: wp('10%'), fontFamily: 'Poppins'}]}>{forgotText}</Text>
          </View>

          <View style={styles.formContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
                placeholderTextColor="#999"
              />
              
              <TouchableOpacity 
                style={[styles.submitBtn, loading && styles.buttonDisabled]}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
          </View>

          <View style={styles.noteText}>
            <Text style={{textAlign: 'center', fontFamily: "Poppins" }}>
              Code not received? Try again in a few minutes.
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  backBtn: {
    gap: 5,
    top: hp('3%'),
    left: wp('5%'),
    flexDirection: 'row',
    alignItems: 'center',
  },

  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp('6%'),
  },  


  formContainer: {
    gap: 14,
    marginTop: hp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
  },

  textInput: {
    color: colors.black,
    borderWidth: 1,
    width: wp('80%'),
    fontSize: wp('4%'),
    borderRadius: wp('10%'),
    borderColor: colors.border,
    paddingHorizontal: wp('5%'),
    backgroundColor: colors.white,
  },

  submitBtn: {
    alignItems: 'center',
    width: wp('80%'),
    fontSize: wp('4%'),
    marginTop: hp('0.7%'),
    borderRadius: wp('50%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.6%'),
    backgroundColor: colors.button,
  },

  submitText: {
    textAlign: 'center',
    color: colors.white,
    fontFamily: "Poppins",
  },

  noteText: {
    marginTop: hp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('25%'),
  },
  
  buttonDisabled: {
    backgroundColor: '#ccc',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

});

export default ForgotPass;