import { Ionicons } from '@expo/vector-icons';
import { doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { db, functions } from '../../firebaseConfig';
import styles from '../style';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../constants/permissions';
import { RoleBadge, showAlert, showConfirm, showRoleSelector } from '../components/ReusableComponents';

export default function Dashboard() {
  const { user: currentUser, allUsers, loading } = useAuth();
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);
  // Permissions are saved immediately to Firestore (no staged/pending state)

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return allUsers.filter(u => {
      const email = (u.email || '').toLowerCase();
      const dId = (u.displayId || '').toLowerCase();
      const role = (u.role || '').toLowerCase();
      return email.includes(q) || dId.includes(q) || role.includes(q);
    });
  }, [allUsers, search]);

  const togglePermission = async (userId, screenKey, perm) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    setSavingId(userId);
    try {
      const currentPerms = user.permissions || {};
      const screenPerms = currentPerms[screenKey] || {};
      
      const newPerms = {
        ...currentPerms,
        [screenKey]: { ...screenPerms, [perm]: !screenPerms[perm] }
      };
      await updateDoc(doc(db, 'users', userId), { permissions: newPerms });
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to update permission');
    }
    setSavingId(null);
  };

  const toggleCreds = async (userId) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    setSavingId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { canUpdateCredentials: !user.canUpdateCredentials });
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to update access');
    }
    setSavingId(null);
  };

  const handleRoleChange = (userId) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user || user.id === currentUser?.uid) {
       showAlert('Restricted', 'You cannot change your own role.');
       return;
    }
    
    showRoleSelector(['user', 'manager', 'admin'], async (nextRole) => {
      setSavingId(userId);
      try {
        const updateData = { role: nextRole };
        // Promote => enable credential updates, Demote => disable
        if (nextRole === 'admin' || nextRole === 'manager') {
          updateData.canUpdateCredentials = true;
        } else if (nextRole === 'user') {
          updateData.canUpdateCredentials = false;
        }
        await updateDoc(doc(db, 'users', userId), updateData);
        showAlert('Success', `Role updated to ${nextRole.toUpperCase()}`);
      } catch (e) {
        console.error(e);
        showAlert('Error', 'Failed to update role');
      }
      setSavingId(null);
    });
  };

  const toggleAll = async (userId, screenKey) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    setSavingId(userId);
    try {
      const currentPerms = user.permissions || {};
      const screenPerms = currentPerms[screenKey] || {};
      
      const allOn = PERMISSIONS.every(p => screenPerms[p]);
      const newScreenPerms = Object.fromEntries(PERMISSIONS.map(p => [p, !allOn]));
      
      const newPerms = { ...currentPerms, [screenKey]: newScreenPerms };
      await updateDoc(doc(db, 'users', userId), { permissions: newPerms });
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to update all permissions');
    }
    setSavingId(null);
  };

  const handleDeleteUser = useCallback((userId, role) => {
    if (userId === currentUser?.uid) {
      showAlert('Restricted', 'You cannot delete your own account.');
      return;
    }
    showConfirm(
      'Confirm Delete',
      'Are you sure you want to permanently delete this user? (Auth + Firestore)',
      async () => {
        try {
          // Prefer Cloud Function so Authentication user is removed too.
          const callDelete = httpsCallable(functions, 'deleteUserAuthAndProfile');
          await callDelete({ uid: userId });
          showAlert('Success', 'User deleted (Auth + Firestore).');
        } catch (error) {
          console.error(error);
          // Fallback: try removing Firestore profile (Auth deletion requires server).
          try {
            const ref = doc(db, 'users', userId);
            await deleteDoc(ref);
            const verify = await getDoc(ref);
            if (verify.exists()) {
              showAlert('Error', 'Delete failed. Please deploy Cloud Functions and check Firestore rules.');
            } else {
              showAlert('Partial', 'Deleted Firestore profile only. Auth user still exists (needs Cloud Function).');
            }
          } catch (fallbackErr) {
            console.error(fallbackErr);
            showAlert('Error', 'Failed to delete user.');
          }
        }
      }
    );
  }, [currentUser]);

  if (loading && allUsers.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.dashContainer} contentContainerStyle={{ paddingBottom: 40, alignItems: 'center' }}>
      {savingId && (
        <View style={{position: 'absolute', top: 10, right: 10}}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
      <View style={styles.dashSearchWrapper}>
        <View style={{ width: '100%', marginBottom: 15 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#1C1C1E', letterSpacing: 0.5 }}>Admin permission management</Text>
        </View>

        <View style={styles.dashSearchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.dashSearchInput}
            placeholder="Search users..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#8E8E93"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          )}
        </View>

        {/* Screen selector intentionally hidden */}
        </View>
      <View style={{ marginBottom: 10 }} />
      <View style={[styles.dashGridCard, { paddingVertical: 10 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.dashTable}>
            <View style={[styles.dashTableRow, styles.dashTableHeader]}>
              <Text style={[styles.dashHeaderCell, { width: 100 }]}>USER ID</Text>
              <Text style={[styles.dashHeaderCell, { width: 160 }]}>EMAIL</Text>
              <Text style={[styles.dashHeaderCell, { width: 90 }]}>ROLE</Text>
              <Text style={[styles.dashHeaderCell, { width: 70 }]}>CREDS</Text>
              <Text style={[styles.dashHeaderCell, { width: 60 }]}>ALL</Text>
              {PERMISSIONS.map(p => (
                <Text key={p} style={[styles.dashHeaderCell, { width: 60 }]}>{p.toUpperCase()}</Text>
              ))}
              <Text style={[styles.dashHeaderCell, { width: 60 }]}>DEL</Text>
            </View>

            {filteredUsers.length === 0 ? (
              <View style={styles.dashNoResults}>
                <Text style={styles.dashNoResultsText}>No users found.</Text>
              </View>
            ) : (
              filteredUsers.map((u, index) => {
                const uPerms = u.permissions || {};
                const screenKey = u.displayId;
                const screenPerms = uPerms[screenKey] || {};
                const allChecked = PERMISSIONS.every(p => screenPerms[p]);
                const userRoleClean = (u.role || '').toLowerCase();
                const isAdmin = userRoleClean === 'admin';
                
                return (
                  <Animated.View 
                    entering={FadeInDown.delay(index * 50).duration(400)}
                    key={u.id} 
                    style={[styles.dashTableRow, index % 2 === 1 && styles.dashRowAlt]}
                  >
                    <Text style={[styles.dashCell, { width: 100, fontWeight: 'bold' }]}>{u.displayId}</Text>
                    <Text style={[styles.dashCell, { width: 160, fontSize: 12 }]} numberOfLines={1}>{u.email}</Text>

                    <TouchableOpacity
                      style={{ width: 90, justifyContent: 'center', alignItems: 'center' }}
                      onPress={() => handleRoleChange(u.id)}
                      disabled={u.id === currentUser?.uid}
                      activeOpacity={u.id === currentUser?.uid ? 1 : 0.7}
                    >
                      <RoleBadge role={u.role} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.dashCell, { width: 70, alignItems: 'center' }]}
                      onPress={() => toggleCreds(u.id)}
                      disabled={isAdmin}
                      activeOpacity={isAdmin ? 1 : 0.7}
                    >
                      <Ionicons
                        name={u.canUpdateCredentials ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={isAdmin ? '#E5E5EA' : u.canUpdateCredentials ? '#FF9500' : '#D1D1D6'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.dashCell, { width: 60, alignItems: 'center' }]}
                      onPress={() => toggleAll(u.id, screenKey)}
                      disabled={isAdmin}
                      activeOpacity={isAdmin ? 1 : 0.7}
                    >
                      <Ionicons
                        name={allChecked ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={isAdmin ? '#E5E5EA' : allChecked ? '#007AFF' : '#D1D1D6'}
                      />
                    </TouchableOpacity>

                    {PERMISSIONS.map(perm => {
                      const checked = screenPerms[perm];
                      return (
                        <TouchableOpacity
                          key={perm}
                          style={[styles.dashCell, { width: 60, alignItems: 'center' }]}
                          onPress={() => togglePermission(u.id, screenKey, perm)}
                          disabled={isAdmin}
                          activeOpacity={isAdmin ? 1 : 0.7}
                        >
                          <Ionicons
                            name={checked ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={isAdmin ? '#E5E5EA' : checked ? '#34C759' : '#D1D1D6'}
                          />
                        </TouchableOpacity>
                      );
                    })}

                    <TouchableOpacity
                      style={[styles.dashCell, { width: 60, alignItems: 'center' }]}
                      onPress={() => handleDeleteUser(u.id, u.role)}
                      disabled={u.id === currentUser?.uid}
                      activeOpacity={u.id === currentUser?.uid ? 1 : 0.7}
                    >
                      <Ionicons
                        name="trash"
                        size={24}
                        color={u.id === currentUser?.uid ? '#E5E5EA' : '#FF3B30'}
                      />
                    </TouchableOpacity>

                  </Animated.View>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>

    </ScrollView>
  );
}
