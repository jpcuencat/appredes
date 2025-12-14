import { useState, useEffect } from 'react'
import './App.css'
import ScriptEditor from './components/ScriptEditor'
import VideoGenerator from './components/VideoGenerator'
import VideoList from './components/VideoList'
import { Film, FileText, Video } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('editor')
  const [currentScript, setCurrentScript] = useState(null)

  const tabs = [
    { id: 'editor', label: 'Editor de Guiones', icon: FileText },
    { id: 'generate', label: 'Generar Video', icon: Film },
    { id: 'videos', label: 'Mis Videos', icon: Video }
  ]

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <Film size={32} />
            <h1>Creador de Videos Cortos</h1>
          </div>
          <p className="subtitle">Genera videos increíbles basados en tus guiones</p>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      <main className="app-main">
        {activeTab === 'editor' && (
          <ScriptEditor
            onScriptSave={(script) => {
              setCurrentScript(script)
              setActiveTab('generate')
            }}
          />
        )}

        {activeTab === 'generate' && (
          <VideoGenerator
            script={currentScript}
            onVideoGenerated={() => setActiveTab('videos')}
          />
        )}

        {activeTab === 'videos' && (
          <VideoList />
        )}
      </main>
    </div>
  )
}

export default App
