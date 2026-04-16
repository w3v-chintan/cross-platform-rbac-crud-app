import React, { useMemo, useState } from 'react';
import { Alert, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../style';

// GLOBALLY REUSABLE FUNCTIONS

export const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    alert(message || title);
  } else {
    Alert.alert(title, message || title);
  }
};

export const showConfirm = (title, message, onConfirm) => {
  if (Platform.OS === 'web') {
    const result = window.confirm(message || title);
    if (result) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: onConfirm }
    ]);
  }
};

export const showRoleSelector = (options, onSelect) => {
  if (Platform.OS === 'web') {
    const choices = options.join(', ');
    const result = window.prompt(`Select Role (${choices}):`, options[0]);
    if (result && options.includes(result.toLowerCase())) {
      onSelect(result.toLowerCase());
    }
  } else {
    const buttons = options.map(opt => ({
      text: opt.toUpperCase(),
      onPress: () => onSelect(opt.toLowerCase())
    }));
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Select Role', 'Choose a role for this user:', buttons);
  }
};

export const showScreenSelector = (screens, currentScreen, onSelect) => {
  if (Platform.OS === 'web') {
    const choices = screens.join(', ');
    const result = window.prompt(`Select Screen to Manage (${choices}):`, currentScreen);
    if (result && screens.includes(result)) {
      onSelect(result);
    }
  } else {
    const buttons = screens.map(s => ({
      text: s.toUpperCase(),
      onPress: () => onSelect(s)
    }));
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Select Screen', 'Choose which screen to manage permissions for:', buttons);
  }
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email?.trim());
};

// GLOBALLY REUSABLE UI COMPONENTS

export const CustomInput = ({ label, styleType = 'auth', secureTextEntry, ...props }) => {
  const rowStyle = styleType === 'auth' ? styles.authInputRow : styles.crudInputRow;
  const labelStyle = styleType === 'auth' ? styles.authInputLabel : styles.crudInputLabel;
  const inputStyle = styleType === 'auth' ? styles.authInput : styles.crudInput;
  const [isSecure, setIsSecure] = useState(!!secureTextEntry);
  const showEye = useMemo(() => !!secureTextEntry, [secureTextEntry]);

  return (
    <View style={rowStyle}>
      <Text style={labelStyle}>{label}</Text>
      <View style={{ position: 'relative', width: '100%' }}>
        <TextInput
          style={[inputStyle, showEye && { paddingRight: 44 }]}
          placeholderTextColor="#999"
          secureTextEntry={showEye ? isSecure : secureTextEntry}
          {...props}
        />
        {showEye && (
          <TouchableOpacity
            onPress={() => setIsSecure(v => !v)}
            style={{ position: 'absolute', right: 12, top: 12, height: 24, width: 24, alignItems: 'center', justifyContent: 'center' }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={isSecure ? 'eye-off-outline' : 'eye-outline'} size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const CustomButton = ({ title, onPress, loading, loadingText, customStyle, textStyle }) => {
  return (
    <TouchableOpacity
      style={[customStyle || styles.authActionBtn, loading && { opacity: 0.7 }]}
      onPress={onPress}
      disabled={loading}
    >
      <Text style={textStyle || styles.authBtnText}>{loading ? loadingText : title}</Text>
    </TouchableOpacity>
  );
};

export const RoleBadge = ({ role }) => {
  return (
    <View style={[
      styles.dashRoleBadge,
      role === 'admin' ? styles.dashAdminBadge : role === 'manager' ? styles.dashManagerBadge : styles.dashUserBadge
    ]}>
      <Text style={styles.dashRoleText}>{role?.toUpperCase() || 'USER'}</Text>
    </View>
  );
};
