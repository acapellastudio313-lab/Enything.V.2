/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { User } from './types';
import { auth, db } from './firebase'; // Menggunakan Firebase yang sudah kita set
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import Layout from './components/Layout';
import Home from './pages/Home';
import Candidates from './pages/Candidates';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import PostDetail from './pages/PostDetail';
import Login from './pages/Login';
import Messages from './pages/Messages';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    // Listener otomatis dari Firebase untuk mengecek status login
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Ambil data tambahan (role, bio, dll) dari Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        
        setUser({
          id: firebaseUser.uid as any,
          name: userData?.name || firebaseUser.displayName || 'User',
          username: userData?.username || firebaseUser.email?.split('@')[0] || '',
          role: userData?.role || 'user'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setShowLogoutConfirm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Jika belum login, tampilkan halaman Login
  if (!user) {
    return <Login onLogin={(u: User) => setUser(u)} />;
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Layout user={user} onLogout={() => setShowLogoutConfirm(true)}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/candidates" element={<Candidates user={user} />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/leaderboard" element={<Leaderboard user={user} />} />
          <Route path="/profile" element={<Profile user={user} onUpdateUser={setUser} />} />
          <Route path="/profile/:userId" element={<Profile user={user} onUpdateUser={setUser} />} />
          <Route path="/messages" element={<Messages user={user} />} />
          <Route path="/admin" element={<AdminDashboard user={user} />} />
          <Route path="/post/:postId" element={<PostDetail user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {/* Modal Konfirmasi Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold mb-2">Keluar Akun?</h2>
            <p className="text-sm text-slate-600 dark:text-neutral-300 mb-6">Anda yakin ingin keluar dari sistem pemilihan?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-neutral-700 font-semibold text-slate-700 dark:text-white transition-colors">Batal</button>
              <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors shadow-lg shadow-red-200">Keluar</button>
            </div>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}