import { useState, useEffect } from 'react';
import { User, LeaderboardEntry, ElectionStatus } from '../types';
import { Trophy, Medal, ArrowUpRight } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion'; // Diganti ke framer-motion agar sinkron dengan package.json
import { db } from '../firebase'; // Import koneksi Firebase
import { collection, query, getDocs, orderBy, onSnapshot, doc } from 'firebase/firestore';

export default function Leaderboard({ user }: { user: User }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [nonVoters, setNonVoters] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [electionStatus, setElectionStatus] = useState<ElectionStatus>('in_progress');
  const [showNonVoters, setShowNonVoters] = useState(false);

  useEffect(() => {
    // 1. Ambil Data Kandidat & Hitung Suara dari Firestore
    const unsubscribe = onSnapshot(query(collection(db, 'candidates'), orderBy('vote_count', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any;
      setLeaderboard(data);
      setLoading(false);
    });

    // 2. Ambil Data User yang Belum Memilih
    const fetchNonVoters = async () => {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      // Filter user yang belum memiliki field 'hasVoted'
      setNonVoters(allUsers.filter((u: any) => !u.hasVoted));
    };

    fetchNonVoters();
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat klasemen real-time...</div>;

  const totalVotes = leaderboard.reduce((acc, curr) => acc + (curr.vote_count || 0), 0);

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="p-4 md:p-8 bg-emerald-600 text-white sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3 md:gap-4 mb-2">
          <div className="p-2 md:p-3 bg-white/20 rounded-xl md:rounded-2xl backdrop-blur-sm shrink-0">
            <Trophy className="w-5 h-5 md:w-8 md:h-8 text-yellow-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg md:text-3xl font-extrabold tracking-tight truncate">Klasemen Sementara</h2>
            <p className="text-emerald-100 text-[10px] md:text-base font-medium truncate opacity-90">Pemilihan Agen Perubahan Prabumulih</p>
          </div>
        </div>
        
        <div className="mt-3 md:mt-6 flex flex-col gap-3 md:gap-6 bg-emerald-700/50 p-2.5 md:p-4 rounded-xl md:rounded-2xl backdrop-blur-sm border border-emerald-500/30">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex-1">
              <p className="text-emerald-200 text-[9px] md:text-sm font-medium uppercase tracking-wider mb-0.5 md:mb-1">Total Suara</p>
              <p className="text-lg md:text-3xl font-bold leading-none">{totalVotes}</p>
            </div>
            <div className="w-px h-6 md:h-12 bg-emerald-500/50"></div>
            <div className="flex-1">
              <p className="text-emerald-200 text-[9px] md:text-sm font-medium uppercase tracking-wider mb-0.5 md:mb-1">Belum Memilih</p>
              <button 
                onClick={() => setShowNonVoters(!showNonVoters)}
                className="text-lg md:text-3xl font-bold leading-none hover:text-yellow-300 transition-colors flex items-center gap-2"
              >
                {nonVoters.length}
                <ArrowUpRight className={clsx("w-4 h-4 transition-transform", showNonVoters && "rotate-90")} />
              </button>
            </div>
            <div className="w-px h-6 md:h-12 bg-emerald-500/50"></div>
            <div className="flex-1">
              <p className="text-emerald-200 text-[9px] md:text-sm font-medium uppercase tracking-wider mb-0.5 md:mb-1">Status</p>
              <p className="text-xs md:text-lg font-bold flex items-center gap-1.5 md:gap-2 leading-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Berlangsung</span>
              </p>
            </div>
          </div>

          {showNonVoters && nonVoters.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="pt-3 border-t border-emerald-500/30"
            >
              <p className="text-[10px] md:text-xs font-bold text-emerald-200 uppercase tracking-widest mb-2">Daftar Akun Belum Memilih</p>
              <div className="flex flex-wrap gap-2">
                {nonVoters.map(voter => (
                  <div key={voter.id} className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg border border-white/5">
                    <span className="text-[10px] md:text-xs font-medium">{voter.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-3 md:p-6 max-w-3xl mx-auto">
        <div className="space-y-2.5 md:space-y-4">
          {leaderboard.map((entry, index) => {
            const percentage = totalVotes > 0 ? Math.round(((entry.vote_count || 0) / totalVotes) * 100) : 0;
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={entry.id}
                className={clsx(
                  "bg-white rounded-xl md:rounded-3xl p-3 md:p-6 flex items-center gap-3 md:gap-6 shadow-sm border transition-all",
                  index === 0 ? "border-yellow-400 ring-1 ring-yellow-400/50" : "border-slate-200"
                )}
              >
                <div className="flex flex-col items-center justify-center w-7 md:w-12 shrink-0">
                  {index === 0 ? (
                    <Medal className="w-7 h-7 md:w-10 md:h-10 text-yellow-500" />
                  ) : (
                    <span className="text-base md:text-2xl font-bold text-slate-400">#{index + 1}</span>
                  )}
                </div>

                <img src={entry.avatar} alt={entry.name} className="w-12 h-12 md:w-20 md:h-20 rounded-full object-cover border-2 border-slate-100" />

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-end mb-2">
                    <div className="min-w-0">
                      <h3 className="font-bold truncate text-sm md:text-xl">{entry.name}</h3>
                      <p className="text-slate-500 text-[10px] md:text-sm">@{entry.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg md:text-2xl font-black text-emerald-600">{percentage}%</p>
                      <p className="text-[9px] md:text-xs text-slate-400">{entry.vote_count || 0} suara</p>
                    </div>
                  </div>
                  <div className="h-2 md:h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={clsx("h-full", index === 0 ? "bg-yellow-400" : "bg-emerald-500")}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}