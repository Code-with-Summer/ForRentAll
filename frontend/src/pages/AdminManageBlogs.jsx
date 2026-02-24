import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminManageBlogs(){
  const nav = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    fetchPosts();
  },[])

  const fetchPosts = async ()=>{
    setLoading(true);
    try{
      const res = await api.get('/blog');
      setPosts(res.data.posts || []);
    }catch(err){
      console.error(err);
      alert('Failed to load posts');
    }finally{setLoading(false)}
  }

  const handleDelete = async (id)=>{
    if(!window.confirm('Delete this post?')) return;
    try{
      await api.delete(`/blog/${id}`);
      setPosts(prev => prev.filter(p=>p._id !== id));
    }catch(err){
      console.error(err);
      alert('Delete failed');
    }
  }

  return (
    <div className="page-container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Manage Blogs</h2>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>nav('/admin/blogs/new')} className="btn">Create New</button>
        </div>
      </div>

      {loading && <div>Loading...</div>}
      <div style={{display:'grid',gap:12,marginTop:12}}>
        {posts.map(p=> (
          <div key={p._id} style={{border:'1px solid #e6e7ea',padding:12,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <strong>{p.title}</strong>
              <div style={{fontSize:12,color:'#6b7280'}}>{new Date(p.createdAt).toLocaleString()}</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <Link to={`/admin/blogs/${p._id}/edit`} className="btn">Edit</Link>
              <button onClick={()=>handleDelete(p._id)} className="btn btn-danger">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
