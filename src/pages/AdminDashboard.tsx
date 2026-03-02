import { useState, useEffect } from 'react';
import { User, Candidate } from '../types';
import { motion } from 'framer-motion'; 
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Users, Vote, Trash2, ShieldCheck } from 'lucide-react';

export default function AdminDashboard({ user }: { user: User }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  if (user.role !== 'admin') return <div className="p-10 text-center">Akses Ditolak</div>;

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'candidates'), (snapshot) => {
      setCandidates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any);
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-emerald-600"/> Panel Admin
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {candidates.map(c => (
          <motion.div key={c.id} layout className="bg-white p-6 rounded-3xl border shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src={c.avatar} className="w-14 h-14 rounded-2xl object-cover" />
              <div>
                <h3 className="font-bold text-lg">{c.name}</h3>
                <p className="text-emerald-600 font-bold flex items-center gap-1"><Vote className="w-4 h-4"/> {c.vote_count} Suara</p>
              </div>
            </div>
            <button className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-colors"><Trash2 className="w-5 h-5"/></button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
