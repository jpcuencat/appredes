import { useState } from 'react'
import { Plus, Trash2, Save, FileText, Sparkles } from 'lucide-react'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api'

export default function ScriptEditor({ onScriptSave }) {
  const [title, setTitle] = useState('')
  const [scenes, setScenes] = useState([
    { text: '', imagePrompt: '', duration: 5 }
  ])
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiStyle, setAiStyle] = useState('informativo')
  const [aiDuration, setAiDuration] = useState(30)

  const addScene = () => {
    setScenes([...scenes, { text: '', imagePrompt: '', duration: 5 }])
  }

  const removeScene = (index) => {
    if (scenes.length > 1) {
      setScenes(scenes.filter((_, i) => i !== index))
    }
  }

  const updateScene = (index, field, value) => {
    const newScenes = [...scenes]
    newScenes[index][field] = value
    setScenes(newScenes)
  }

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      setMessage({ type: 'error', text: 'El tema es requerido' })
      return
    }

    setGenerating(true)
    setMessage(null)

    try {
      console.log('📝 Enviando solicitud de generación de guión con IA...')
      const response = await axios.post(`${API_URL}/scripts/generate`, {
        topic: aiTopic,
        style: aiStyle,
        duration: aiDuration
      })

      console.log('✅ Respuesta recibida:', response.data)
      const { title: generatedTitle, scenes: generatedScenes } = response.data.data
      
      if (!generatedTitle || !Array.isArray(generatedScenes) || generatedScenes.length === 0) {
        throw new Error('Respuesta del servidor con estructura inválida')
      }
      
      setTitle(generatedTitle)
      setScenes(generatedScenes)
      setShowAiModal(false)
      setMessage({ type: 'success', text: 'Guión generado exitosamente con IA' })
    } catch (error) {
      console.error('❌ Error al generar guión:', error)
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Error al generar el guión con IA. Por favor, intenta de nuevo.'
      setMessage({
        type: 'error',
        text: errorMessage
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'El título es requerido' })
      return
    }

    if (scenes.some(s => !s.text.trim())) {
      setMessage({ type: 'error', text: 'Todas las escenas deben tener texto' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const response = await axios.post(`${API_URL}/scripts`, {
        title,
        scenes,
        settings: {
          videoWidth: 1080,
          videoHeight: 1920,
          fps: 30,
          voice: 'es'
        }
      })

      setMessage({ type: 'success', text: 'Guion guardado exitosamente' })

      if (onScriptSave) {
        onScriptSave(response.data.data)
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error guardando el guion'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <h2 className="card-title">
        <FileText size={24} />
        Editor de Guiones
      </h2>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ flex: 1, margin: 0 }}>
          <label>Título del Video</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Mi primer video corto"
          />
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => setShowAiModal(true)}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Sparkles size={20} />
          Generar con IA
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
            Escenas ({scenes.length})
          </h3>
          <button className="btn btn-secondary" onClick={addScene}>
            <Plus size={20} />
            Agregar Escena
          </button>
        </div>

        {scenes.map((scene, index) => (
          <div
            key={index}
            style={{
              background: 'var(--bg-main)',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--primary)' }}>
                Escena {index + 1}
              </h4>
              {scenes.length > 1 && (
                <button
                  className="btn btn-danger"
                  onClick={() => removeScene(index)}
                  style={{ padding: '0.5rem' }}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="form-group">
              <label>Narración / Texto (lo que se dirá en el video)</label>
              <textarea
                value={scene.text}
                onChange={(e) => updateScene(index, 'text', e.target.value)}
                placeholder="Escribe el texto que se narrará en esta escena..."
                rows={3}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Descripción de Imagen (opcional)</label>
              <input
                type="text"
                value={scene.imagePrompt}
                onChange={(e) => updateScene(index, 'imagePrompt', e.target.value)}
                placeholder="Ej: Paisaje de montaña al atardecer, estilo cinematográfico"
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Si no se especifica, se usará el texto de la narración
              </small>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={20} />
          {saving ? 'Guardando...' : 'Guardar y Continuar'}
        </button>
      </div>

      {/* Modal de Generación con IA */}
      {showAiModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            border: '1px solid var(--border)'
          }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={24} style={{ color: 'var(--primary)' }} />
              Generar Guión con IA
            </h3>
            
            <div className="form-group">
              <label>Tema del Video</label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Ej: Beneficios del ejercicio, Historia del café, etc."
              />
            </div>
            
            <div className="form-group">
              <label>Estilo de Contenido</label>
              <select
                value={aiStyle}
                onChange={(e) => setAiStyle(e.target.value)}
              >
                <option value="informativo">Informativo</option>
                <option value="entretenido">Entretenido</option>
                <option value="educativo">Educativo</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Duración Aproximada (segundos)</label>
              <select
                value={aiDuration}
                onChange={(e) => setAiDuration(parseInt(e.target.value))}
              >
                <option value={15}>15 segundos</option>
                <option value={30}>30 segundos</option>
                <option value={60}>60 segundos</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAiModal(false)}
                disabled={generating}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGenerateAI}
                disabled={generating || !aiTopic.trim()}
              >
                <Sparkles size={20} />
                {generating ? 'Generando...' : 'Generar Guión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
