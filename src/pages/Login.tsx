import { useState, FormEvent } from 'react';
import { auth, db } from '../firebase'; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function Login({ onLogin }: any) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({ name: '', user: '', pass: '' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const email = `${data.user}@enything.com`;

    try {
      if (isRegister) {
        const res = await createUserWithEmailAndPassword(auth, email, data.pass);
        await setDoc(doc(db, 'users', res.user.uid), { name: data.name, role: 'user' });
        alert("Berhasil daftar! Silakan Login.");
        setIsRegister(false);
      } else {
        const res = await signInWithEmailAndPassword(auth, email, data.pass);
        onLogin({ id: res.user.uid, username: data.user });
      }
    } catch (err: any) {
      setError("Gagal: Periksa kembali data Anda.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isRegister ? 'Daftar Akun' : 'Masuk Enything'}
        </h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input type="text" placeholder="Nama Lengkap" className="w-full border p-2 rounded" 
            onChange={e => setData({...data, name: e.target.value})} required />
          )}
          <input type="text" placeholder="Username" className="w-full border p-2 rounded" 
          onChange={e => setData({...data, user: e.target.value})} required />
          <input type="password" placeholder="Password" className="w-full border p-2 rounded" 
          onChange={e => setData({...data, pass: e.target.value})} required />
          <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : (isRegister ? 'Daftar' : 'Masuk')}
          </button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} className="w-full mt-4 text-sm text-gray-500 underline">
          {isRegister ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
        </button>
      </div>
    </div>
  );
}