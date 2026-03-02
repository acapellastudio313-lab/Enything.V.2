import { useState, useEffect } from 'react';
import { User, Candidate, ElectionStatus } from '../types';
import { CheckCircle2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion'; 
import { db } from '../firebase'; 
import { collection, onSnapshot, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export default function Candidates({ user }: { user: User }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'candidates'), (snapshot) => {
      setCandidates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any);
      setLoading(false);
    });
    const checkVote = async () => {
      const snap = await getDoc(doc(db, 'users', user.id.toString()));
      if (snap.exists() && snap.data().hasVoted) setHasVoted(true);
    };
    checkVote();
    return () => unsub();
  }, [user.id]);

  const handleVote = async (id: string) => {
    setVoting(true);
    try {
      await updateDoc(doc(db, 'candidates', id), { vote_count: increment(1) });
      await updateDoc(doc(db, 'users', user.id.toString()), { hasVoted: true });
      setHasVoted(true);
      setSelectedCandidate(null);
      toast.success('Berhasil memilih!');
    } catch (e) { toast.error('Gagal memilih'); }
    finally { setVoting(false); }
  };

  if (loading) return <div className="p-8 text-center">Memuat...</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black mb-6">Pilih Kandidat</h1>
      <div className="grid gap-4">
        {candidates.map(c => (
          <div key={c.id} className="p-4 bg-white rounded-2xl border flex justify-between items-center">
            <div className="flex items-center gap-4">
               <img src={c.avatar} className="w-12 h-12 rounded-xl object-cover" />
               <span className="font-bold">{c.name}</span>
            </div>
            <button onClick={() => setSelectedCandidate(c)} className="text-emerald-600 font-bold">Detail</button>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white p-6 rounded-3xl w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4">{selectedCandidate.name}</h2>
              <button 
                disabled={hasVoted || voting} 
                onClick={() => handleVote(selectedCandidate.id)}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold disabled:bg-slate-300"
              >
                {voting ? 'Proses...' : hasVoted ? 'Sudah Memilih' : 'Pilih Sekarang'}
              </button>
              <button onClick={() => setSelectedCandidate(null)} className="w-full mt-2 text-slate-400">Tutup</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
