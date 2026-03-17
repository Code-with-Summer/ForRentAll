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

  const words = (post?.content || [])
    .filter(c => c.type === "text" && c.text)
    .map(c => c.text.trim())
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  const readMins = Math.max(1, Math.ceil(words / 200));
  const published = post?.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "-";
  const author = post?.createdBy?.name || "Admin";

  if(!post) return <div className="page-container">Loading...</div>

  return (
    <div className="page-container blog-detail-page">
      <div className="bd-hero">
        <h1 className="bd-title">{post.title}</h1>
        <div className="bd-meta">
          <span><strong>Author:</strong> {author}</span>
          <span><strong>Read:</strong> {readMins} min</span>
          <span><strong>Published:</strong> {published}</span>
        </div>
      </div>

      <article className="bd-content">
        {post.content && post.content.map((c, idx)=>{
          if(c.type === 'text') {
            return (
              <div
                key={idx}
                className="bd-richtext"
                dangerouslySetInnerHTML={{ __html: c.text || "" }}
              />
            );
          }
          if(c.type === 'image') return <img key={idx} src={`${api.defaults.baseURL}${c.image.startsWith('/')?c.image:'/'+c.image}`} alt="blog-image" className="bd-image" />
          return null;
        })}
      </article>
    </div>
  )
}
