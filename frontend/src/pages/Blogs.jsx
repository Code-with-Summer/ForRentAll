import React, { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";

export default function Blogs(){
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    const fetch = async ()=>{
      setLoading(true);
      try{
        const res = await api.get('/blog');
        setPosts(res.data.posts || []);
      }catch(err){
        console.error(err);
      }finally{setLoading(false)}
    }
    fetch();
  },[])

  return (
    <div className="page-container">
      <h2>Blog</h2>
      {loading && <div>Loading...</div>}
      <div style={{display:'grid', gap:16}}>
        {posts.map(p=> (
          <div key={p._id} style={{border:'1px solid #ddd', padding:12}}>
            <h3>{p.title}</h3>
            {p.cover && <img src={`${api.defaults.baseURL}${p.cover.startsWith('/')?p.cover:'/'+p.cover}`} alt="cover" style={{maxWidth:300}} />}
            <p>{p.excerpt}</p>
            <Link to={`/blogs/${p._id}`}>Read more</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
