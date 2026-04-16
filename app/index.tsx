import { StatusBar } from 'expo-status-bar';
import { signOut } from 'firebase/auth';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../firebaseConfig';

import { Ionicons } from '@expo/vector-icons';
import CrudTemplate from '../src/components/CrudTemplate';
import { useAuth } from '../src/context/AuthContext';
import Dashboard from '../src/screens/Dashboard';
import Login from '../src/screens/Login';
import ManagerDashboard from '../src/screens/ManagerDashboard';
import Profile from '../src/screens/Profile';
import Signup from '../src/screens/Signup';
import styles from '../src/style';

export default function Index() {
  const { user, role, permissions, allUsers, loading: initialLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [activeRoute, setActiveRoute] = useState<'Home' | 'Profile'>('Home');
  const insets = useSafeAreaInsets();

  // Drawer State
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const translateX = useSharedValue(-300);

  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  // Resolve a user's screen (User1/User2/...) from Firestore list
  const userScreen = useMemo(() => {
    if (!user) return null;
    return allUsers.find(u => u.id === user.uid)?.displayId || null;
  }, [allUsers, user]);

  // Effect for smart redirect on login
  useEffect(() => {
    if (!user) {
      setActiveRoute('Home');
    }
  }, [user]);

  const handleLogout = useCallback(async () => {
    try {
      setActiveRoute('Home');
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out', error);
    }
  }, []);

  const openDrawer = () => {
    setIsDrawerVisible(true);
    translateX.value = withSpring(0, { damping: 15, stiffness: 100 });
  };

  const closeDrawer = () => {
    translateX.value = withTiming(-300, { duration: 250 }, (finished) => {
      if (finished) {
        // We can't use runOnJS here directly in some cases, so we'll just handle visibility via state
      }
    });
    // Set visibility to false after animation duration
    setTimeout(() => {
      setIsDrawerVisible(false);
    }, 250);
  };

  const selectRoute = (next: 'Home' | 'Profile') => {
    setActiveRoute(next);
    closeDrawer();
  };

  if (initialLoading) {
    return (
      <View style={styles.indexLoadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
    return showLogin ? (
      <Login onSwitchToSignup={() => setShowLogin(false)} />
    ) : (
      <Signup onSwitchToLogin={() => setShowLogin(true)} />
    );
  }

  const renderContent = () => {
    if (activeRoute === 'Home') {
      const r = role?.trim().toLowerCase();
      if (r === 'admin') return <Dashboard />;
      if (r === 'manager') return <ManagerDashboard />;

      const activeScreen = userScreen;
      if (!activeScreen) {
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{ marginTop: 10, color: '#8E8E93' }}>Loading...</Text>
          </View>
        );
      }

      const screenPerms = permissions[activeScreen] || {};
      const canView = screenPerms.view || false;
      const canAdd = screenPerms.add || false;
      const canUpdate = screenPerms.update || false;
      const canDelete = screenPerms.delete || false;

      return (
        <CrudTemplate
          title={`${activeScreen.toUpperCase()} OPERATIONS`}
          collectionName={`names_${activeScreen.toLowerCase()}`}
          canView={canView}
          canAdd={canAdd}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      );
    }

    if (activeRoute === 'Profile') {
      return <Profile />;
    }
  };

  // Derive Display Email directly from DB so it updates INSTANTLY ignoring Auth sync delay
  const userProfile = allUsers.find(u => u.id === user?.uid);
  const displayEmail = userProfile?.email || user?.email || '';

  return (
    <SafeAreaView style={styles.globalContainer} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#F5F7FA" />

      {/* HEADER */}
      <View style={styles.indexHeader}>
        <View style={[styles.indexHeaderLeft, { flexDirection: 'row', alignItems: 'center' }]}>
          <TouchableOpacity style={[styles.indexIconBtn, { marginRight: 15, paddingHorizontal: 5 }]} onPress={openDrawer}>
            <Ionicons name="menu" size={28} color="#1C1C1E" />
          </TouchableOpacity>
          <View>
            <Text style={styles.indexHeaderEmail} numberOfLines={1}>{displayEmail}</Text>
            <Text style={styles.indexHeaderRole}>{role ? role.toUpperCase() : ''}</Text>
          </View>
        </View>

        <View style={styles.indexHeaderRight}>
          {/* We moved Logout to the drawer, but keeping a quick icon on header is fine too */}
        </View>
      </View>

      {/* CONTENT AREA */}
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>

      {/* CUSTOM DRAWER OVERLAY & LOGIC */}
      <Modal visible={isDrawerVisible} transparent={true} animationType="none" onRequestClose={closeDrawer}>
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <View style={styles.drawerOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.drawerContainer, drawerAnimatedStyle]}>

          {/* Drawer Top / Header */}
          <View style={[styles.drawerHeaderBlock, { paddingTop: insets.top + 20 }]}>
            <Text style={styles.drawerHeaderEmail} numberOfLines={1}>{displayEmail}</Text>
            <Text style={styles.drawerHeaderRole}>{role ? role.toUpperCase() : 'USER'}</Text>
          </View>

          {/* Drawer Middle / Menu Items */}
          <View style={styles.drawerScrollArea}>
            <TouchableOpacity
              style={[styles.drawerMenuItem, activeRoute === 'Home' && styles.drawerMenuItemActive]}
              onPress={() => selectRoute('Home')}
            >
              <Ionicons name="grid" size={20} color={activeRoute === 'Home' ? '#007AFF' : '#666'} style={styles.drawerMenuIcon} />
              <Text style={[styles.drawerMenuText, activeRoute === 'Home' && styles.drawerMenuTextActive]}>
                Dashboard
              </Text>
            </TouchableOpacity>
          </View>

          {/* Drawer Bottom / Footer */}
          <View style={[styles.drawerFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
            <TouchableOpacity
              style={[styles.drawerMenuItem, activeRoute === 'Profile' && styles.drawerMenuItemActive]}
              onPress={() => selectRoute('Profile')}
            >
              <Ionicons name="person-circle-outline" size={24} color={activeRoute === 'Profile' ? '#007AFF' : '#333'} style={styles.drawerMenuIcon} />
              <Text style={[styles.drawerMenuText, activeRoute === 'Profile' && styles.drawerMenuTextActive]}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.drawerMenuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" style={styles.drawerMenuIcon} />
              <Text style={[styles.drawerMenuText, { color: '#FF3B30' }]}>Logout</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </Modal>

    </SafeAreaView>
  );
}
