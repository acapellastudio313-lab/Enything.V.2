import { useState, useEffect, FormEvent, ChangeEvent, MouseEvent, TouchEvent } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { User, Post, Candidate } from '../types';
import { Settings, Edit3, MapPin, Briefcase, Info, X, Camera, MessageSquare, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import PostItem from '../components/PostItem';
import { db } from '../firebase'; // Import koneksi Firebase
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, getDocs, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion'; // PERBAIKAN: Pastikan pakai framer-motion

export default function Profile({ user: currentUser, onUpdateUser }: { user: User, onUpdateUser?: (user: User) => void }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'campaign'>('posts');
  const [candidateData, setCandidateData] = useState<Candidate | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: '', username: '', avatar: '', cover_url: '',
    bio: '', location: '',
    cover_position: '50% 50%', avatar_position: '50% 50%'
  });
  const [coverPos, setCoverPos] = useState({ x: 50, y: 50 });
  const [avatarPos, setAvatarPos] = useState({ x: 50, y: 50 });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [isEditingCampaign, setIsEditingCampaign] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ vision: '', mission: '', innovation_program: '', image_url: '' });
  const [campaignLoading, setCampaignLoading] = useState(false);

  const isOwnProfile = !userId || userId === currentUser.id.toString();
  const targetUserId = isOwnProfile ? currentUser.id.toString() : userId!;

  // 1. Sinkronisasi Data Profil dari Firebase
  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);

    const userRef = doc(db, 'users', targetUserId);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = { id: docSnap.id, ...docSnap.data() } as User;
        setProfileUser(userData);
        
        // Jika ini profil kandidat, ambil data kampanye
        if (userData.role === 'candidate') {
          const candRef = doc(db, 'candidates', targetUserId);
          getDoc(candRef).then(candSnap => {
            if (candSnap.exists()) {
              const data = candSnap.data() as Candidate;
              setCandidateData(data);
              setCampaignForm({
                vision: data.vision || '',
                mission: data.mission || '',
                innovation_program: data.innovation_program || '',
                image_url: data.image_url || ''
              });
            }
          });
        }
      }
      setLoading(false);
    });

    return () => unsubUser();
  }, [targetUserId]);

  // 2. Sinkronisasi Postingan User dari Firebase
  useEffect(() => {
    const postsQuery = query(
      collection(db, 'posts'),
      where('author_id', '==', targetUserId),
      orderBy('created_at', 'desc')
    );

    const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setPosts(fetchedPosts);
    });

    return () => unsubPosts();
  }, [targetUserId]);

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    try {
      const finalData = {
        ...editForm,
        cover_position: `${coverPos.x}% ${coverPos.y}%`,
        avatar_position: `${avatarPos.x}% ${avatarPos.y}%`
      };

      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, finalData);

      if (onUpdateUser && isOwnProfile) {
        onUpdateUser({ ...profileUser, ...finalData } as User);
      }
      
      toast.success('Profil berhasil diperbarui!');
      setShowEditModal(false);
    } catch (err: any) {
      setEditError('Gagal memperbarui profil: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCampaignSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCampaignLoading(true);
    try {
      const candRef = doc(db, 'candidates', targetUserId);
      await updateDoc(candRef, campaignForm);
      toast.success('Kampanye diperbarui!');
      setIsEditingCampaign(false);
    } catch (err: any) {
      toast.error('Gagal memperbarui kampanye');
    } finally {
      setCampaignLoading(false);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, field: 'avatar' | 'cover_url') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Limit 2MB untuk base64
        toast.error('Ukuran file maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat profil...</div>;
  if (!profileUser) return <div className="p-8 text-center text-slate-500">User tidak ditemukan.</div>;

  const canEditProfile = currentUser.role === 'admin' || isOwnProfile;

  return (
    <div className="w-full min-h-screen bg-slate-50">
      {/* Header & Cover */}
      <div 
        className="h-48 bg-emerald-600 relative bg-cover bg-center"
        style={profileUser.cover_url ? { backgroundImage: `url(${profileUser.cover_url})`, backgroundPosition: profileUser.cover_position } : {}}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="px-4 md:px-6 pb-6 relative">
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end -mt-12 sm:-mt-16 mb-4 gap-4">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-md bg-white overflow-hidden z-10">
            <img
              src={profileUser.avatar}
              alt={profileUser.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: profileUser.avatar_position }}
            />
          </div>
          {canEditProfile && (
            <button onClick={() => {
              setEditForm({
                name: profileUser.name,
                username: profileUser.username,
                avatar: profileUser.avatar,
                cover_url: profileUser.cover_url || '',
                bio: profileUser.bio || '',
                location: profileUser.location || '',
                cover_position: profileUser.cover_position || '50% 50%',
                avatar_position: profileUser.avatar_position || '50% 50%'
              });
              setShowEditModal(true);
            }} className="px-5 py-2 rounded-full bg-white border border-slate-200 font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
              <Edit3 className="w-4 h-4" /> Edit Profil
            </button>
          )}
        </div>

        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-black text-slate-900 flex items-center justify-center sm:justify-start gap-2">
            {profileUser.name}
            {profileUser.role === 'candidate' && <CheckCircle className="w-5 h-5 text-blue-500 fill-blue-500 text-white" />}
          </h1>
          <p className="text-slate-500 font-medium">@{profileUser.username}</p>
          <p className="mt-3 text-slate-600 max-w-xl leading-relaxed">{profileUser.bio || 'Belum ada bio.'}</p>
        </div>

        <div className="mt-8 flex gap-6 border-b border-slate-200">
          <button onClick={() => setActiveTab('posts')} className={clsx("pb-4 font-bold transition-all px-2", activeTab === 'posts' ? "border-b-2 border-emerald-600 text-emerald-600" : "text-slate-400")}>Postingan</button>
          {profileUser.role === 'candidate' && (
            <button onClick={() => setActiveTab('campaign')} className={clsx("pb-4 font-bold transition-all px-2", activeTab === 'campaign' ? "border-b-2 border-emerald-600 text-emerald-600" : "text-slate-400")}>Kampanye</button>
          )}
        </div>

        <div className="py-6">
          {activeTab === 'posts' ? (
            <div className="space-y-4">
              {posts.length > 0 ? posts.map(post => (
                <PostItem key={post.id} post={post} user={currentUser} />
              )) : <p className="text-center text-slate-400 py-10">Belum ada postingan.</p>}
            </div>
          ) : (
            candidateData && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                 <h4 className="font-bold text-emerald-900 uppercase text-xs mb-4">Program Inovasi</h4>
                 <p className="text-slate-700 mb-6 italic">"{candidateData.innovation_program}"</p>
                 <h4 className="font-bold text-slate-900 uppercase text-xs mb-2">Visi</h4>
                 <p className="text-slate-600 mb-6">{candidateData.vision}</p>
                 <h4 className="font-bold text-slate-900 uppercase text-xs mb-2">Misi</h4>
                 <p className="text-slate-600">{candidateData.mission}</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* MODAL EDIT PROFIL */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden">
               <div className="p-6 border-b flex justify-between items-center">
                  <h3 className="font-bold text-xl">Edit Profil</h3>
                  <X className="cursor-pointer" onClick={() => setShowEditModal(false)} />
               </div>
               <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Ganti Foto Profil</label>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} className="text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Nama</label>
                    <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-slate-50 border rounded-xl px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Bio</label>
                    <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-slate-50 border rounded-xl px-4 py-2 h-20" />
                  </div>
                  <button type="submit" disabled={editLoading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">
                    {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
