import React, { useEffect, useRef, useState } from "react";
import api from "../api";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/blog-create.css";

function normalizePostHtml(content) {
  if (!Array.isArray(content) || !content.length) return "";
  return content
    .map((block) => {
      if (block?.type === "text") return String(block.text || "");
      if (block?.type === "image" && block.image) {
        const src = String(block.image).startsWith("http")
          ? block.image
          : `${api.defaults.baseURL}/${String(block.image).replace(/^\//, "")}`;
        return `<img src="${src}" alt="blog-image" />`;
      }
      return "";
    })
    .join("");
}

export default function AdminEditBlog() {
  const { id } = useParams();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState("#111827");
  const [highlightColor, setHighlightColor] = useState("#fde68a");
  const [toolbarState, setToolbarState] = useState({
    bold: false,
    italic: false,
    underline: false,
    fontSize: false,
    blockquote: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef(null);
  const textColorInputRef = useRef(null);
  const highlightColorInputRef = useRef(null);
  const savedRangeRef = useRef(null);

  const focusEditor = () => editorRef.current?.focus();

  const isSelectionFontSized = () => {
    const root = editorRef.current;
    const sel = window.getSelection();
    if (!root || !sel || sel.rangeCount === 0) return false;
    const node = sel.anchorNode;
    if (!node || !root.contains(node)) return false;

    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    while (el && el !== root) {
      if (el.style && el.style.fontSize) return true;
      el = el.parentElement;
    }
    return false;
  };

  const applyCommand = (command, value = null) => {
    focusEditor();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, value);
    setContentHtml(editorRef.current?.innerHTML || "");
    setToolbarState({
      bold: !!document.queryCommandState("bold"),
      italic: !!document.queryCommandState("italic"),
      underline: !!document.queryCommandState("underline"),
      fontSize: isSelectionFontSized(),
      blockquote: document.queryCommandValue("formatBlock").toLowerCase() === "blockquote",
      alignLeft: !!document.queryCommandState("justifyLeft"),
      alignCenter: !!document.queryCommandState("justifyCenter"),
      alignRight: !!document.queryCommandState("justifyRight"),
    });
  };

  const toggleBlockquote = () => {
    focusEditor();
    const current = document.queryCommandValue("formatBlock").toLowerCase();
    document.execCommand("formatBlock", false, current === "blockquote" ? "p" : "blockquote");
    setContentHtml(editorRef.current?.innerHTML || "");
    setToolbarState((s) => ({
      ...s,
      fontSize: isSelectionFontSized(),
      blockquote: document.queryCommandValue("formatBlock").toLowerCase() === "blockquote",
    }));
  };

  const applyAlignment = (cmd) => {
    focusEditor();
    if (document.queryCommandState(cmd)) {
      document.execCommand("justifyLeft", false, null);
    } else {
      document.execCommand(cmd, false, null);
    }
    setContentHtml(editorRef.current?.innerHTML || "");
    setToolbarState((s) => ({
      ...s,
      fontSize: isSelectionFontSized(),
      alignLeft: !!document.queryCommandState("justifyLeft"),
      alignCenter: !!document.queryCommandState("justifyCenter"),
      alignRight: !!document.queryCommandState("justifyRight"),
    }));
  };

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/blog/${id}`);
        const p = res.data.post;
        setTitle(p.title || "");
        setContentHtml(normalizePostHtml(p.content || []));
      } catch (err) {
        console.error(err);
        alert("Failed to load post");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== contentHtml) {
      editorRef.current.innerHTML = contentHtml || "";
    }
  }, [contentHtml]);

  useEffect(() => {
    const syncToolbarState = () => {
      setToolbarState({
        bold: !!document.queryCommandState("bold"),
        italic: !!document.queryCommandState("italic"),
        underline: !!document.queryCommandState("underline"),
        fontSize: isSelectionFontSized(),
        blockquote: document.queryCommandValue("formatBlock").toLowerCase() === "blockquote",
        alignLeft: !!document.queryCommandState("justifyLeft"),
        alignCenter: !!document.queryCommandState("justifyCenter"),
        alignRight: !!document.queryCommandState("justifyRight"),
      });
    };
    document.addEventListener("selectionchange", syncToolbarState);
    return () => document.removeEventListener("selectionchange", syncToolbarState);
  }, []);

  const toEscapedHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const getSelectedText = () => {
    const selection = window.getSelection();
    return selection && selection.rangeCount ? selection.toString() : "";
  };

  const insertCodeBlock = () => {
    const selected = getSelectedText();
    const safe = toEscapedHtml(selected || "\n\n");
    focusEditor();
    document.execCommand("insertHTML", false, `<pre><code>${safe}</code></pre><p><br/></p>`);
    setContentHtml(editorRef.current?.innerHTML || "");
  };

  const applyTypingFontSize = (sizePx) => {
    const normalized = Math.max(8, Math.min(96, Number(sizePx) || 16));
    const root = editorRef.current;
    if (!root) return;

    root.focus();
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) return;

    if (range.collapsed) {
      // Create a styled insertion point so following typing uses this size.
      const marker = document.createElement("span");
      marker.style.fontSize = `${normalized}px`;
      const zwsp = document.createTextNode("\u200B");
      marker.appendChild(zwsp);
      range.insertNode(marker);

      const nextRange = document.createRange();
      nextRange.setStart(zwsp, 1);
      nextRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(nextRange);
    } else {
      const selected = range.extractContents();
      const wrapper = document.createElement("span");
      wrapper.style.fontSize = `${normalized}px`;
      wrapper.appendChild(selected);
      range.insertNode(wrapper);

      const nextRange = document.createRange();
      nextRange.selectNodeContents(wrapper);
      sel.removeAllRanges();
      sel.addRange(nextRange);
    }

    setContentHtml(editorRef.current?.innerHTML || "");
    setToolbarState((s) => ({ ...s, fontSize: true }));
    if (sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const addImage = async (files) => {
    const pickedFiles = Array.from(files || []).filter(Boolean);
    if (!pickedFiles.length) return;
    setUploading(true);
    try {
      editorRef.current?.focus();
      if (savedRangeRef.current) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedRangeRef.current);
        }
      }

      for (const file of pickedFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await api.post("/blog/upload-image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const filename = res.data.filename;
        const imageUrl = `${api.defaults.baseURL}/${filename}`;
        document.execCommand("insertHTML", false, `<img src="${imageUrl}" alt="blog-image" />`);
      }

      setContentHtml(editorRef.current?.innerHTML || "");
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const blocks = [];
      if (contentHtml.trim()) {
        blocks.push({ type: "text", text: contentHtml });
      }
      await api.put(`/blog/${id}`, { title, content: JSON.stringify(blocks) });
      nav("/admin/blogs");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="blog-create">
      <form className="bc-form" onSubmit={handleSave}>
        <div className="bc-header">
          <input className="bc-title" placeholder="Post title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="bc-actions">
            <label className="btn btn-ghost file-label">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  addImage(e.target.files);
                  e.target.value = "";
                }}
              />
              +Image
            </label>
            <button type="submit" className="btn btn-primary" disabled={uploading}>{uploading ? "Uploading..." : "Save"}</button>
          </div>
        </div>

        <div className="bc-content">
          <div className="bc-block">
            <div className="bc-toolbar">
              <button type="button" title="Bold" className={toolbarState.bold ? "active" : ""} onClick={() => applyCommand("bold")}>B</button>
              <button type="button" title="Italic" className={toolbarState.italic ? "active" : ""} onClick={() => applyCommand("italic")}>I</button>
              <button type="button" title="Underline" className={toolbarState.underline ? "active" : ""} onClick={() => applyCommand("underline")}>U</button>
              <div className="bc-toolbar-fsz-group">
                <button type="button" title="Apply Font Size" className={toolbarState.fontSize ? "active" : ""} onClick={() => applyTypingFontSize(fontSize)}>F</button>
                <input
                  type="number"
                  className="bc-toolbar-size"
                  title="Font Size"
                  min={8}
                  max={96}
                  value={fontSize}
                  onChange={(e) => {
                    const next = Math.max(8, Math.min(96, Number(e.target.value || 16)));
                    setFontSize(next);
                    applyTypingFontSize(next);
                  }}
                />
              </div>
              <button
                type="button"
                title="Text Color"
                style={{ color: textColor }}
                onClick={() => textColorInputRef.current?.click()}
              >
                T
              </button>
              <input
                ref={textColorInputRef}
                className="bc-toolbar-color-input"
                type="color"
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value);
                  applyCommand("foreColor", e.target.value);
                }}
              />
              <button
                type="button"
                title="Highlight Color"
                style={{ background: highlightColor }}
                onClick={() => highlightColorInputRef.current?.click()}
              >
                H
              </button>
              <input
                ref={highlightColorInputRef}
                className="bc-toolbar-color-input"
                type="color"
                value={highlightColor}
                onChange={(e) => {
                  setHighlightColor(e.target.value);
                  applyCommand("hiliteColor", e.target.value);
                }}
              />
              <button type="button" title="Blockquote" className={toolbarState.blockquote ? "active" : ""} onClick={toggleBlockquote}>
                "
              </button>
              <button type="button" title="Code Block" onClick={insertCodeBlock}>&lt;&gt;</button>
              <button type="button" title="Align Left" className={toolbarState.alignLeft ? "active" : ""} onClick={() => applyAlignment("justifyLeft")}>⬅</button>
              <button type="button" title="Align Center" className={toolbarState.alignCenter ? "active" : ""} onClick={() => applyAlignment("justifyCenter")}>⬛</button>
              <button type="button" title="Align Right" className={toolbarState.alignRight ? "active" : ""} onClick={() => applyAlignment("justifyRight")}>➡</button>
            </div>

            <div
              ref={editorRef}
              className="bc-editor"
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setContentHtml(e.currentTarget.innerHTML)}
              onBlur={() => {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                  savedRangeRef.current = sel.getRangeAt(0).cloneRange();
                }
              }}
            />
          </div>

          {!contentHtml.trim() && (
            <div className="bc-empty">Use the toolbar above to format content and add images if needed.</div>
          )}
        </div>
      </form>
    </div>
  );
}
