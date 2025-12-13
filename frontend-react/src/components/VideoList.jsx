import { useState, useEffect } from 'react'
import { Video, Download, Loader, Film } from 'lucide-react'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api'

export default function VideoList() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadVideos()
  }, [])

  const loadVideos = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get(`${API_URL}/videos`)
      setVideos(response.data.data || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Error cargando videos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <Loader className="spinner" size={32} />
          <span>Cargando videos...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="card-title">
        <Video size={24} />
        Mis Videos
      </h2>

      {videos.length === 0 ? (
        <div className="empty-state">
          <Film size={64} />
          <h3>No hay videos todavía</h3>
          <p>Crea un guion y genera tu primer video</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {videos.map((video) => (
            <div
              key={video.id}
              style={{
                background: 'var(--bg-main)',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid var(--border)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <video
                controls
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  background: '#000'
                }}
                src={`http://localhost:3000${video.videoUrl}`}
              />

              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{
                  fontSize: '1rem',
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)'
                }}>
                  {video.script?.title || 'Sin título'}
                </h4>
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)'
                }}>
                  {new Date(video.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <a
                href={`http://localhost:3000${video.videoUrl}`}
                download
                className="btn btn-success"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Download size={18} />
                Descargar
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
