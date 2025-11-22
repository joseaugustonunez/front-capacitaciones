import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  ThumbsUp,
  ThumbsDown,
  Reply,
  MoreVertical
} from 'lucide-react';
import { obtenerComentariosPorVideo, crearComentario } from "../../api/Comentarios";

const ForumComponent = ({ videoId, usuarioActual }) => {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [newReply, setNewReply] = useState("");
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!videoId) return;

    const fetchComments = async () => {
      try {
        const data = await obtenerComentariosPorVideo(videoId);

        // Separar comentarios padres y replies
        const parentComments = data
          .filter(c => !c.id_comentario_padre)
          .map(c => ({
            ...c,
            rol: c.rol || "estudiante",
            replies: [],
          }));

        const replies = data.filter(c => c.id_comentario_padre);

        replies.forEach(reply => {
          const parent = parentComments.find(c => c.id === reply.id_comentario_padre);
          if (parent) {
            parent.replies.push({
              ...reply,
              rol: reply.rol || "estudiante",
            });
          }
        });

        setComments(parentComments);
      } catch (error) {
        console.error("Error al obtener comentarios:", error);
      }
    };

    fetchComments();
  }, [videoId]);

  const handleSubmitComment = async (e) => {
  e.preventDefault();
  if (!newComment.trim()) return;

  const newCommentObj = {
    id_usuario: usuarioActual?.id,
    id_video: videoId,
    texto_comentario: newComment,
  };

  try {
    const savedComment = await crearComentario(newCommentObj);

    const commentForUI = {
      id: savedComment?.id || Date.now(),
      nombre_completo: `${usuarioActual?.nombre || ""} ${usuarioActual?.apellido || ""}`.trim() || "Usuario",
      rol: usuarioActual?.rol || "estudiante",
      fecha_creacion: new Date().toISOString(),
      texto_comentario: newComment,
      likes: 0,
      dislikes: 0,
      replies: [],
    };

    setComments(prev => [commentForUI, ...prev]);
    setNewComment("");
  } catch (err) {
    console.error("Error al crear comentario:", err);
  }
};

const handleSubmitReply = async (e, commentId) => {
  e.preventDefault();
  if (!newReply.trim()) return;

  const replyObj = {
    id_usuario: usuarioActual?.id,
    id_video: videoId,
    id_comentario_padre: commentId,
    texto_comentario: newReply,
  };

  try {
    const savedReply = await crearComentario(replyObj);

    const replyForUI = {
      id: savedReply?.id || Date.now(),
      nombre_completo: `${usuarioActual?.nombre || ""} ${usuarioActual?.apellido || ""}`.trim() || "Usuario",
      rol: usuarioActual?.rol || "estudiante",
      fecha_creacion: new Date().toISOString(),
      texto_comentario: newReply,
      likes: 0,
      dislikes: 0,
    };

    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? { ...comment, replies: [...(comment.replies || []), replyForUI] }
          : comment
      )
    );

    setNewReply("");
    setReplyingTo(null);
  } catch (err) {
    console.error("Error al crear respuesta:", err);
  }
}

  const updateReactions = (commentId, type, isReply = false, parentId = null) => {
    setComments(prev =>
      prev.map(comment => {
        if (isReply && comment.id === parentId) {
          return {
            ...comment,
            replies: comment.replies.map(reply =>
              reply.id === commentId ? { ...reply, [type]: reply[type] + 1 } : reply
            ),
          };
        } else if (comment.id === commentId) {
          return { ...comment, [type]: comment[type] + 1 };
        }
        return comment;
      })
    );
  };

  const totalComments = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  return (
    <div className="forum-section">
      <div className="forum-header">
        <MessageCircle className="forum-icon" />
        <h3>Foro de Discusión</h3>
        <span className="comments-count">{totalComments} comentarios</span>
      </div>

      {/* Formulario nuevo comentario */}
      <form className="new-comment-form" onSubmit={handleSubmitComment}>
        <div className="comment-input-container">
          <div className="user-avatar">
            {(usuarioActual?.nombre?.charAt(0) || 'U').toUpperCase()}
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Comparte tu opinión, pregunta o experiencia..."
            className="comment-textarea"
            rows={3}
          />
        </div>
        <div className="comment-actions">
          <button type="submit" className="submit-comment-btn" disabled={!newComment.trim()}>
            <Send size={16} /> Comentar
          </button>
        </div>
      </form>

      {/* Lista de comentarios */}
      <div className="comments-list">
        {comments.length > 0 ? (
          comments.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="comment-header">
                <div className="user-avatar">
                  {(c.nombre_completo?.charAt(0) || 'U').toUpperCase()}
                </div>
                <div className="comment-user-info">
                  <div className="user-name">
                    {c.nombre_completo} <span className="user-role">{c.rol}</span>
                  </div>
                  <div className="comment-timestamp">
                    {new Date(c.fecha_creacion).toLocaleString()}
                  </div>
                </div>
                <button className="comment-options-btn">
                  <MoreVertical size={16} />
                </button>
              </div>

              <div className="comment-content">
                <p>{c.texto_comentario}</p>
              </div>

              <div className="comment-actions">
                {/* <button className="action-btn" onClick={() => updateReactions(c.id, "likes")}>
                  <ThumbsUp size={14} /> <span>{c.likes}</span>
                </button>
                <button className="action-btn" onClick={() => updateReactions(c.id, "dislikes")}>
                  <ThumbsDown size={14} /> <span>{c.dislikes}</span>
                </button> */}
                <button
                  className="action-btn reply-btn"
                  onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                >
                  <Reply size={14} /> Responder
                </button>
              </div>

              {/* Formulario de respuesta */}
              {replyingTo === c.id && (
                <form className="reply-form" onSubmit={(e) => handleSubmitReply(e, c.id)}>
                  <div className="reply-input-container">
                    <div className="user-avatar">
                      {(usuarioActual?.nombre?.charAt(0) || 'U').toUpperCase()}
                    </div>
                    <textarea
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      placeholder={`Respondiendo a ${c.nombre_completo}...`}
                      className="reply-textarea"
                      rows={2}
                    />
                  </div>
                  <div className="reply-actions">
                    <button
                      type="button"
                      className="cancel-reply-btn"
                      onClick={() => {
                        setReplyingTo(null);
                        setNewReply("");
                      }}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="submit-reply-btn" disabled={!newReply.trim()}>
                      Responder
                    </button>
                  </div>
                </form>
              )}

              {/* Mostrar replies */}
              <div className="replies-container">
                {c.replies?.map((reply) => (
                  <div key={reply.id} className="reply-item">
                    <div className="comment-header">
                      <div className="user-avatar small">
                        {(reply.nombre_completo?.charAt(0) || 'U').toUpperCase()}
                      </div>
                      <div className="comment-user-info">
                        <div className="user-name">
                          {reply.nombre_completo} <span className="user-role">{reply.rol}</span>
                        </div>
                        <div className="comment-timestamp">
                          {new Date(reply.fecha_creacion).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="comment-content">
                      <p>{reply.texto_comentario}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No hay comentarios aún.</p>
        )}
      </div>
    </div>
  );
};

export default ForumComponent;
