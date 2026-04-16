import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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
import { auth, db } from '../../firebaseConfig';
import { CustomButton, CustomInput, isValidEmail, showAlert } from '../components/ReusableComponents';
import styles from '../style';

export default function Signup({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      return showAlert('Error', 'Please enter all fields');
    }
    if (!isValidEmail(email)) {
      return showAlert('Error', 'Please enter a valid email address');
    }
    if (password.length < 6) {
      return showAlert('Error', 'Password should be at least 6 characters');
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: role,
        permissions: {},
        canUpdateCredentials: true,
        createdAt: new Date().toISOString()
      });
      await signOut(auth);

      showAlert('Success', 'Account created successfully! Please log in to continue.');

      setLoading(false);
      onSwitchToLogin();
    } catch (error) {
      console.error("Sign up error:", error);
      showAlert('Sign Up Failed', error.message || 'Failed to sign up');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#F2F6FF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.authContainer}>
            <Animated.View entering={FadeInDown.duration(600)} style={styles.authCardSection}>
            <Text style={styles.authMainTitle}>Create Account</Text>
            <Text style={styles.authSubtitle}>Sign up to pick a role and test permissions</Text>

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
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <View style={styles.authInputRow}>
              <Text style={styles.authInputLabel}>Role:</Text>
              <View style={styles.authRoleContainer}>
                {['admin', 'manager', 'user'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.authRoleTab, role === r && styles.authRoleTabActive]}
                    onPress={() => setRole(r)}
                  >
                    <Text style={[styles.authRoleText, role === r && styles.authRoleTextActive]}>
                      {r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <CustomButton
              title="Sign Up"
              onPress={handleSignup}
              loading={loading}
              loadingText="Creating..."
              customStyle={styles.authActionBtnSignup}
            />

            <TouchableOpacity style={styles.authSwitchBtn} onPress={onSwitchToLogin}>
              <Text style={styles.authSwitchText}>Already have an account? <Text style={styles.authSwitchTextBoldSignup}>Log In</Text></Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
