import React, { useState, useEffect  } from 'react'
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../config/colors';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import { Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';

import { resetPassword } from '../auth/user-auth';

type ResetPassRouteParams = {
  email: string;
};

const ResetPass: React.FC = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute<RouteProp<{ ResetPass: ResetPassRouteParams }, 'ResetPass'>>();
  
  const { email } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Starting password reset...');
      await resetPassword(email, newPassword);
      console.log('✅ Password reset successful');
      
      // Use setTimeout to ensure UI is ready for Alert
      setTimeout(() => {
        Alert.alert(
          "Success", 
          "Password reset successfully!", 
          [
            { 
              text: "OK", 
              onPress: () => {
                console.log('🔄 Navigating to SignIn');
                navigation.navigate('SignIn');
              }
            }
          ]
        );
      }, 300);
      
    } catch (error: any) {
      console.error('❌ Error resetting password:', error);
      const errorMessage = error?.message || 'Failed to reset password. Please try again.';
      
      // Show error alert instead of navigating
      setTimeout(() => {
        Alert.alert("Error", errorMessage);
      }, 300);
      
    } finally {
      setLoading(false);
    }
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient
          colors={['#FFFFFF', '#f2e8e2ff']}
          style={styles.container}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('SendCode')}
          >
            <FontAwesomeIcon icon={faChevronLeft} size={24} color="#343131" />
            <Text>Back</Text>
          </TouchableOpacity>
          <View style={styles.centeredContent}>
            <Image
              source={require('../../assets/resetIcon.png')}
              style={{
                width: wp('25%'),
                height: wp('25%'),
              }}
              resizeMode='contain'
            />
            <Text style={[{ fontSize: wp('5.5%'), marginTop: hp('2.5%'), fontFamily: "Poppins" }]}>Reset Password</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.passwordInputContainer}>
              <TextInput
                placeholder='New Password'
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.textInput}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={toggleNewPasswordVisibility}
              >
                <FontAwesomeIcon 
                  icon={showNewPassword ? faEyeSlash : faEye} 
                  size={20} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordInputContainer}>
              <TextInput
                placeholderTextColor="#999"
                placeholder='Confirm Password' 
                value={confirmPassword}
                onChangeText={setConfirmPassword}       
                style={styles.textInput}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={toggleConfirmPasswordVisibility}
              >
                <FontAwesomeIcon 
                  icon={showConfirmPassword ? faEyeSlash : faEye} 
                  size={20} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.submitBtn}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.submitText}>
                {loading ? 'RESETTING...' : 'RESET PASSWORD'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.noteText}>
            <Text style={{ textAlign: 'center', fontFamily: "Poppins" }}>
              Kindly remember and save your password.
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

  passwordInputContainer: {
    position: 'relative',
    width: wp('80%'),
  },

  textInput: {
    borderWidth: 1,
    width: '100%',
    fontSize: wp('4%'),
    color: colors.black,
    borderRadius: wp('10%'),
    borderColor: colors.border,
    paddingHorizontal: wp('5%'),
    paddingVertical: wp("3%"),
    backgroundColor: colors.white,
    paddingRight: wp('12%'), // Add padding for the eye icon
  },

  eyeIcon: {
    position: 'absolute',
    right: wp('4%'),
    top: hp('2%'),
    transform: [{ translateY: -10 }],
    padding: wp('2%'),
  },

  submitBtn: {
    width: wp('80%'),
    fontSize: wp('4%'),
    marginTop: hp('0.7%'),
    borderRadius: wp('50%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.6%'),
    backgroundColor: colors.button,
  },

  submitText: {
    fontFamily: "Poppins",
    textAlign: 'center',
    color: colors.white,
  },

  noteText: {
    marginTop: hp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('25%'),
  },
});

export default ResetPass;