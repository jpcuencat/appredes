import { useState, useEffect } from 'react'
import { Film, Loader, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api'

export default function VideoGenerator({ script, onVideoGenerated }) {
  const [generating, setGenerating] = useState(false)
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)

  useEffect(() => {
    if (!jobId) return

    const checkStatus = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/videos/status/${jobId}`)
        const job = response.data.data

        setStatus(job.status)
        setProgress(job.progress || 0)

        if (job.status === 'completed') {
          setVideoUrl(job.videoUrl)
          setGenerating(false)
          clearInterval(checkStatus)
          if (onVideoGenerated) {
            onVideoGenerated()
          }
        } else if (job.status === 'failed') {
          setError(job.error || 'Error desconocido')
          setGenerating(false)
          clearInterval(checkStatus)
        }
      } catch (err) {
        console.error('Error checking status:', err)
      }
    }, 2000)

    return () => clearInterval(checkStatus)
  }, [jobId, onVideoGenerated])

  const handleGenerate = async () => {
    if (!script) {
      setError('No hay guion seleccionado')
      return
    }

    setGenerating(true)
    setError(null)
    setProgress(0)
    setStatus('pending')
    setVideoUrl(null)

    try {
      const response = await axios.post(`${API_URL}/videos/generate`, {
        scriptId: script.id,
        script: {
          title: script.title,
          scenes: script.scenes
        },
        settings: script.settings || {
          videoWidth: 1080,
          videoHeight: 1920,
          fps: 30,
          voice: 'es'
        }
      })

      setJobId(response.data.data.jobId)
    } catch (err) {
      setError(err.response?.data?.error || 'Error iniciando la generación')
      setGenerating(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={24} color="var(--success)" />
      case 'failed':
        return <XCircle size={24} color="var(--danger)" />
      case 'processing':
        return <Loader size={24} className="spinner" />
      default:
        return <AlertCircle size={24} color="var(--warning)" />
    }
  }

  const getStatusText = () => {
    if (progress <= 10) return 'Iniciando proceso...'
    if (progress <= 33) return 'Generando audios con IA...'
    if (progress <= 66) return 'Creando imágenes con IA...'
    if (progress <= 90) return 'Componiendo video final...'
    if (progress < 100) return 'Finalizando...'
    
    switch (status) {
      case 'pending':
        return 'En cola...'
      case 'processing':
        return 'Procesando video...'
      case 'completed':
        return '¡Video completado con éxito!'
      case 'failed':
        return 'Error en la generación'
      default:
        return 'Listo para generar'
    }
  }

  return (
    <div className="card">
      <h2 className="card-title">
        <Film size={24} />
        Generar Video
      </h2>

      {!script ? (
        <div className="alert alert-info">
          <AlertCircle size={20} />
          Primero crea un guion en el editor
        </div>
      ) : (
        <>
          <div style={{
            background: 'var(--bg-main)',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid var(--border)'
          }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              {script.title}
            </h3>
            <div style={{ color: 'var(--text-secondary)' }}>
              <p>Escenas: {script.scenes?.length || 0}</p>
              <p>Resolución: {script.settings?.videoWidth || 1080} x {script.settings?.videoHeight || 1920}</p>
              <p>FPS: {script.settings?.fps || 30}</p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <XCircle size={20} />
              {error}
            </div>
          )}

          {generating && (
            <div style={{
              background: 'var(--bg-main)',
              padding: '2rem',
              borderRadius: '8px',
              marginBottom: '2rem',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                {getStatusIcon()}
                <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                  {getStatusText()}
                </span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <p style={{
                textAlign: 'center',
                color: 'var(--text-secondary)',
                marginTop: '0.5rem'
              }}>
                {progress}%
              </p>

              {progress > 0 && progress < 33 && (
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
                  Generando audios con Text-to-Speech...
                </p>
              )}
              {progress >= 33 && progress < 66 && (
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
                  Creando imágenes para cada escena...
                </p>
              )}
              {progress >= 66 && progress < 100 && (
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
                  Componiendo video final...
                </p>
              )}
            </div>
          )}

          {videoUrl && (
            <div style={{
              background: 'var(--bg-main)',
              padding: '2rem',
              borderRadius: '8px',
              marginBottom: '2rem',
              border: '1px solid var(--success)'
            }}>
              <div className="alert alert-success">
                <CheckCircle size={20} />
                Video generado exitosamente
              </div>

              <video
                controls
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  margin: '1rem auto',
                  display: 'block',
                  borderRadius: '8px'
                }}
                src={`http://localhost:3000${videoUrl}`}
              />

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                <a
                  href={`http://localhost:3000${videoUrl}`}
                  download
                  className="btn btn-success"
                >
                  Descargar Video
                </a>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={generating}
            >
              <Film size={20} />
              {generating ? 'Generando...' : 'Generar Video'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
