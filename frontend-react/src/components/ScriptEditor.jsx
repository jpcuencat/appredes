import { useState } from 'react'
import { Plus, Trash2, Save, FileText } from 'lucide-react'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api'

export default function ScriptEditor({ onScriptSave }) {
  const [title, setTitle] = useState('')
  const [scenes, setScenes] = useState([
    { text: '', imagePrompt: '', duration: 5 }
  ])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

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

      <div className="form-group">
        <label>Título del Video</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Mi primer video corto"
        />
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
    </div>
  )
}
