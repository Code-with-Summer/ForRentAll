import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/blog-create.css';

export default function AdminEditBlog(){
  const { id } = useParams();
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    const fetchPost = async ()=>{
      setLoading(true);
      try{
        const res = await api.get(`/blog/${id}`);
        const p = res.data.post;
        setTitle(p.title || '');
        setBlocks(p.content || []);
      }catch(err){
        console.error(err);
        alert('Failed to load post');
      }finally{setLoading(false)}
    }
    fetchPost();
  },[id])

  const addTextBlock = () => setBlocks(prev => [...prev, { type: 'text', text: '' }]);
  const addImageBlock = async (file) => {
    if(!file) return;
    try{
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/blog/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const filename = res.data.filename;
      setBlocks(prev => [...prev, { type: 'image', image: filename }]);
    }catch(err){
      console.error(err);
      alert('Upload failed');
    }
  };

  const updateText = (idx, val) => setBlocks(prev => prev.map((b,i)=> i===idx?{...b, text: val}:b));
  const removeBlock = (idx) => setBlocks(prev => prev.filter((_,i)=>i!==idx));

  const handleSave = async (e) => {
    e.preventDefault();
    try{
      await api.put(`/blog/${id}`, { title, content: JSON.stringify(blocks) });
      nav('/admin/blogs');
    }catch(err){
      console.error(err);
      alert('Save failed');
    }
  }

  if(loading) return <div>Loading...</div>

  return (
    <div className="blog-create">
      <form className="bc-form" onSubmit={handleSave}>
        <div className="bc-header">
          <input className="bc-title" placeholder="Post title" value={title} onChange={e=>setTitle(e.target.value)} required />
          <div className="bc-actions">
            <button type="button" className="btn btn-ghost" onClick={addTextBlock}>+ Text</button>
            <label className="btn btn-ghost file-label">
              <input type="file" accept="image/*" onChange={e=>addImageBlock(e.target.files[0])} />
              + Image
            </label>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </div>

        <div className="bc-content">
          {blocks.length === 0 && <div className="bc-empty">Add content blocks using the buttons above.</div>}
          {blocks.map((b, idx)=> (
            <div className="bc-block" key={idx}>
              <div className="bc-block-header">
                <strong>{b.type === 'text' ? 'Text' : 'Image'}</strong>
                <button type="button" className="btn btn-sm" onClick={()=>removeBlock(idx)}>Remove</button>
              </div>
              {b.type === 'text' && (
                <textarea className="bc-text" value={b.text} onChange={e=>updateText(idx, e.target.value)} rows={4} />
              )}
              {b.type === 'image' && (
                <div className="bc-image-wrap">
                  <img src={`${api.defaults.baseURL}/${b.image}`} alt="uploaded" />
                  <div className="bc-filename">{b.image}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </form>
    </div>
  )
}
