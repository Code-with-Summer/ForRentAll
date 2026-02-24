import React, { useEffect, useState } from "react";
import api from "../api";
import "../styles/blog.css";
import { useParams } from "react-router-dom";

export default function BlogDetail(){
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(()=>{
    const fetch = async ()=>{
      try{
        const res = await api.get(`/blog/${id}`);
        setPost(res.data.post);
      }catch(err){
        console.error(err);
      }
    }
    fetch();
  },[id])

  if(!post) return <div>Loading...</div>

  return (
    <div className="page-container">
      <h2>{post.title}</h2>
      <div>
        {post.content && post.content.map((c, idx)=>{
          if(c.type === 'text') return <p key={idx}>{c.text}</p>
          if(c.type === 'image') return <img key={idx} src={`${api.defaults.baseURL}${c.image.startsWith('/')?c.image:'/'+c.image}`} alt="blog-image" className="bd-image" />
          return null;
        })}
      </div>
    </div>
  )
}
