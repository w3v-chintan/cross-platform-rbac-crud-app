import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
  ScrollView
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../../firebaseConfig';
import { CustomButton, CustomInput, isValidEmail, showAlert } from '../components/ReusableComponents';
import styles from '../style';

export default function Login({ onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return showAlert('Error', 'Please enter both email and password');
    }
    if (!isValidEmail(email)) {
      return showAlert('Error', 'Please enter a valid email address');
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setLoading(false);
    } catch (error) {
      console.error(error);
      showAlert('Login Failed', error.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#F2F6FF" />
      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.authContainer}>
            <Animated.View entering={FadeInDown.duration(600)} style={styles.authCardSection}>
            <Text style={styles.authMainTitle}>Welcome Back</Text>
            <Text style={styles.authSubtitle}>Log in to access your dashboard</Text>

            <CustomInput
              label="Email:"
              styleType="auth"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <CustomInput
              label="Password:"
              styleType="auth"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <CustomButton
              title="Log In"
              onPress={handleLogin}
              loading={loading}
              loadingText="Logging in..."
              customStyle={styles.authActionBtn}
            />

            <TouchableOpacity style={styles.authSwitchBtn} onPress={onSwitchToSignup}>
              <Text style={styles.authSwitchText}>Don't have an account? <Text style={styles.authSwitchTextBold}>Sign Up</Text></Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
