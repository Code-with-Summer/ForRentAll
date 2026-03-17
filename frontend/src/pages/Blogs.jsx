import React, { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import "../styles/blogs.css";

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
      <h2 className="home-section__eyebrow home-section__title" style={{margin: "20px"}}>Blogs</h2>
      {loading && <div>Loading...</div>}
      <div className="blogs-grid">
        {posts.map(p=> (
          <div key={p._id} className="blog-card">
            {p.cover && <img src={`${api.defaults.baseURL}${p.cover.startsWith('/')?p.cover:'/'+p.cover}`} alt="cover" />}
            <h3>{p.title}</h3>
            <p>{p.excerpt}</p>
            <Link to={`/blogs/${p._id}`}>Read more</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
