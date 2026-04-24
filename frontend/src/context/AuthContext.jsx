import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get, update } from 'firebase/database';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const PRIMARY_ADMINS = [
  'gantannagarisrinath123@gmail.com',
  'gajulasahithi2006@gmail.com'
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'Admin', 'Manager', 'Analyst', 'Driver', 'Viewer'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // 1. Determine Role (Security Logic)
        const userEmail = user.email?.toLowerCase().trim();
        let assignedRole = 'Viewer';
        
        // Priority 1: Hardcoded Super-Admins (Case-Insensitive)
        const isPrimaryAdmin = PRIMARY_ADMINS.map(e => e.toLowerCase().trim()).includes(userEmail);
        
        if (isPrimaryAdmin) {
          assignedRole = 'Admin';
          console.log(`[AUTH] Primary Admin Verified: ${userEmail}`);
        } else {
          // Priority 2: Database lookup for other roles
          try {
            const roleRef = ref(db, `users/${user.uid}/role`);
            const snapshot = await get(roleRef);
            if (snapshot.exists()) {
              const dbRole = snapshot.val();
              // Safety: Non-primary emails cannot be 'Admin' in DB
              assignedRole = (dbRole === 'Admin') ? 'Viewer' : dbRole;
              console.log(`[AUTH] DB Role for ${userEmail}: ${assignedRole}`);
            }
          } catch (err) {
            console.error("[AUTH] Role fetch failed, defaulting to Viewer:", err);
            assignedRole = 'Viewer';
          }
        }

        // 2. Register/Update User Profile in DB
        const userRef = ref(db, `users/${user.uid}`);
        try {
          await update(userRef, {
            email: user.email,
            displayName: user.displayName || userEmail.split('@')[0],
            photoURL: user.photoURL,
            role: assignedRole,
            lastLogin: new Date().toISOString(),
            status: 'Active'
          });
        } catch (dbErr) {
          console.error("[AUTH] DB Sync failed:", dbErr);
        }

        setRole(assignedRole);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
  
  const loginWithEmail = async (email, password) => {
    const normalizedEmail = email.toLowerCase().trim();
    const isPrimary = PRIMARY_ADMINS.map(e => e.toLowerCase().trim()).includes(normalizedEmail);

    // Admin bypass for demo with password 'sahithi'
    if (isPrimary && password === 'sahithi') {
      console.log(`[AUTH] Admin bypass triggered for ${normalizedEmail}`);
      try {
        // Try Firebase auth first
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result;
      } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          console.warn("[AUTH] Admin credentials verified locally. Creating mock session and syncing to DB.");
          
          // Create mock user
          const mockUid = `admin-${normalizedEmail.split('@')[0]}-${Date.now()}`;
          const mockUser = {
            email: normalizedEmail,
            uid: mockUid,
            displayName: normalizedEmail.split('@')[0],
            photoURL: null,
            isAnonymous: false
          };
          
          // Sync mock admin to database immediately
          const userRef = ref(db, `users/${mockUid}`);
          await update(userRef, {
            email: mockUser.email,
            displayName: mockUser.displayName,
            photoURL: mockUser.photoURL,
            role: 'Admin',
            lastLogin: new Date().toISOString(),
            status: 'Active',
            isMockUser: true
          });
          
          console.log(`[AUTH] Mock admin synced to DB: ${mockUid}`);
          setUser(mockUser);
          setRole('Admin');
          return { user: mockUser };
        }
        throw error;
      }
    }
    
    // Regular email login for non-admin users
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  };

  const logout = () => signOut(auth);

  const value = {
    user,
    role,
    loginWithGoogle,
    loginWithEmail,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

