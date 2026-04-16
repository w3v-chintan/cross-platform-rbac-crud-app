import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../../firebaseConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [displayId, setDisplayId] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser = null;
    let unsubscribeAllUsers = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Listen to all users (for admin/manager dashboards)
        // BUG FIX: orderBy('createdAt') ensures User1, User2... are stable across reloads
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'asc'));
        unsubscribeAllUsers = onSnapshot(q, (snapshot) => {
          const usersData = snapshot.docs.map((doc, index) => ({
            id: doc.id,
            ...doc.data(),
            displayId: `User${index + 1}`
          }));
          console.log(`[Firestore] Fetched ${usersData.length} users`);
          setAllUsers(usersData);
        }, (error) => {
          console.error("[Firestore] allUsers snapshot error:", error);
        });

        // Listen to current user profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const cleanRole = (data.role || 'user').toString().trim().toLowerCase();
            setRole(cleanRole);
            setPermissions(data.permissions || {});
            // displayId is computed from allUsers array order, not stored in Firestore
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setRole(null);
        setPermissions({});
        setDisplayId(null);
        setAllUsers([]);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeAllUsers) unsubscribeAllUsers();
    };
  }, []);

  // Derive current user's displayId from allUsers array (it's index-based, not stored in Firestore)
  const currentDisplayId = user
    ? (allUsers.find(u => u.id === user.uid)?.displayId || displayId)
    : null;

  return (
    <AuthContext.Provider value={{
      user,
      role,
      permissions,
      displayId: currentDisplayId,
      allUsers,
      loading,
      isAdmin: role?.toLowerCase() === 'admin',
      isManager: role?.toLowerCase() === 'manager'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
