import React, { useState, useEffect } from 'react';
import { View, Text, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateEmail, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { CustomInput, CustomButton, showAlert, isValidEmail } from '../components/ReusableComponents';
import styles from '../style';

export default function Profile() {
  const { user, allUsers, isAdmin, isManager } = useAuth();
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Default true for management roles. Otherwise check `canUpdateCredentials` in user document
  const currentUserDoc = allUsers.find(u => u.id === user?.uid);
  const canUpdate = isAdmin || isManager || currentUserDoc?.canUpdateCredentials;

  useEffect(() => {
    if (user?.email) {
      setNewEmail(user.email);
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!canUpdate) {
      return showAlert('Restricted', 'You do not have permission to update your credentials.');
    }
    if (newEmail.trim() === user.email && !newPassword) {
      return showAlert('Info', 'No changes detected.');
    }
    if (!isValidEmail(newEmail)) {
      return showAlert('Error', 'Please enter a valid email address.');
    }
    if (newPassword && newPassword.length < 6) {
      return showAlert('Error', 'New Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      let successCount = 0;
      let errorMsgs = [];

      // UPDATE PASSWORD
      if (newPassword) {
        try {
          await updatePassword(auth.currentUser, newPassword);
          setNewPassword('');
          successCount++;
        } catch (err) {
          if (err?.code === 'auth/requires-recent-login') {
            errorMsgs.push('Password Update: Please logout and login again, then retry updating password.');
          } else {
          errorMsgs.push(`Password Update: ${err.message}`);
          }
        }
      }

      // UPDATE EMAIL
      if (newEmail.trim() !== user.email) {
        try {
          await updateEmail(auth.currentUser, newEmail.trim());
          await updateDoc(doc(db, 'users', user.uid), { email: newEmail.trim() });
          successCount++;
        } catch (err) {
          if (err?.code === 'auth/requires-recent-login') {
            errorMsgs.push('Email Update: Please logout and login again, then retry updating email.');
          } else {
            errorMsgs.push(`Email Update: ${err.message}`);
          }
        }
      }

      if (errorMsgs.length > 0) {
        showAlert(successCount > 0 ? 'Partial Success' : 'Update Failed', errorMsgs.join('\n\n'));
      } else if (successCount > 0) {
        showAlert('Success', 'Profile credentials updated successfully!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.profileContainer}>
            <View style={styles.profileCard}>
              <Text style={styles.profileMainTitle}>My Profile</Text>
              <Text style={styles.profileSubtitle}>
                {canUpdate 
                  ? 'Update your email address or password below' 
                  : 'You do not have permission to update your credentials. Ask your manager/admin.'}
              </Text>

              <CustomInput
                label="Email:"
                styleType="auth"
                placeholder="New email"
                value={newEmail}
                onChangeText={setNewEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={canUpdate}
              />

              <CustomInput
                label="New Password:"
                styleType="auth"
                placeholder="Leave blank to keep current"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                editable={canUpdate}
              />

              <CustomButton
                title="Update email id and password"
                onPress={handleUpdate}
                loading={loading}
                loadingText="Updating..."
                customStyle={[styles.authActionBtn, { opacity: canUpdate ? 1 : 0.5, marginTop: 20 }]}
              />
            </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
