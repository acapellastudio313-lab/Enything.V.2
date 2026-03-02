import { useState, useEffect } from 'react';
import { User, Post } from '../types';
import { motion, AnimatePresence } from 'framer-motion'; 
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import PostItem from '../components/PostItem';
import { Send, Image as ImageIcon } from 'lucide-react';

export default function Home({ user }: { user: User }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    await addDoc(collection(db, 'posts'), {
      content: newPost,
      author_id: user.id,
      author_name: user.name,
      author_avatar: user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name,
      created_at: serverTimestamp(),
      likes: []
    });
    setNewPost('');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-3xl border shadow-sm">
        <textarea 
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Apa yang Anda pikirkan?"
          className="w-full p-2 border-none focus:ring-0 resize-none h-24 text-lg"
        />
        <div className="flex justify-between items-center border-t pt-3">
          <button type="button" className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><ImageIcon className="w-5 h-5"/></button>
          <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2">
            Kirim <Send className="w-4 h-4"/>
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {loading ? <p className="text-center text-slate-500">Memuat postingan...</p> : 
          posts.map(post => <PostItem key={post.id} post={post} user={user} />)
        }
      </div>
    </div>
  );
}
