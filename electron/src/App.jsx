import { useState } from 'react'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('Ready')
  const [markdown, setMarkdown] = useState('')
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  const [copyText, setCopyText] = useState('Copy')

  const addLog = (msg, type) => {
    const time = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
    setLogs(prev => [...prev, { msg, type, time }])
  }

  const crawl = async () => {
    if (!url.trim()) {
      setStatus('Enter a URL first')
      return
    }

    setIsLoading(true)
    setStatus('Crawling...')
    setLogs([])
    setError('')
    addLog('Initializing crawler...', 'info')

    try {
      addLog('Connecting to backend...', 'info')
      const response = await fetch('http://127.0.0.1:5001/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })

      const data = await response.json()
      
      if (data.success) {
        setMarkdown(data.markdown)
        setLogs(data.logs || [])
        setStatus('Done!')
        addLog('Complete!', 'success')
      } else {
        setError(data.error || 'Unknown error')
        setStatus('Failed')
        addLog(data.error || 'Unknown error', 'error')
      }
    } catch (e) {
      setError(e.message)
      setStatus('Connection failed')
      addLog(e.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopyText('Copied!')
      setTimeout(() => setCopyText('Copy'), 2000)
    } catch (e) {
      console.error('Copy failed:', e)
    }
  }

  const clearLogs = () => setLogs([])

  const handleKeydown = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      crawl()
    }
  }

  return (
    <main>
      <div className="header">
        <div className="logo">
          <div className="logo-icon">⬡</div>
          <div className="logo-text">
            <h1>Crawl4ai</h1>
            <span className="tagline">Transform any URL into clean Markdown</span>
          </div>
        </div>
      </div>

      <div className="input-section">
        <div className="input-wrapper">
          <span className="input-icon">🔗</span>
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeydown}
            placeholder="Paste URL here (e.g., https://example.com)"
            disabled={isLoading}
          />
          <button className="crawl-btn" onClick={crawl} disabled={isLoading || !url.trim()}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Crawling</span>
              </>
            ) : (
              <>
                <span className="btn-icon">⚡</span>
                <span>Crawl</span>
              </>
            )}
          </button>
        </div>
        <div className="status-bar">
          <span className={`status-indicator ${isLoading ? 'loading' : ''} ${status === 'Done!' ? 'success' : ''}`}></span>
          <span className="status-text">{status}</span>
        </div>
      </div>

      <div className="content">
        <div className="panel result-panel">
          <div className="panel-header">
            <div className="panel-title">
              <span>📄</span>
              <span>Markdown</span>
            </div>
            <button className="action-btn" onClick={copyToClipboard} disabled={!markdown}>
              {copyText}
            </button>
          </div>
          <div className="panel-content">
            {markdown ? (
              <pre className="markdown-content">{markdown}</pre>
            ) : error ? (
              <div className="error-state">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">🕷️</span>
                <span>Enter a URL and click Crawl</span>
                <span className="empty-hint">Results will appear here</span>
              </div>
            )}
          </div>
        </div>

        <div className="panel logs-panel">
          <div className="panel-header">
            <div className="panel-title">
              <span>📜</span>
              <span>Activity Log</span>
            </div>
            <button className="action-btn" onClick={clearLogs}>Clear</button>
          </div>
          <div className="panel-content logs-content">
            {logs.length === 0 ? (
              <div className="empty-logs">
                <span>Waiting for activity...</span>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`log-entry ${log.type}`}>
                  <span className="log-time">{log.time}</span>
                  <span className="log-dot"></span>
                  <span className="log-msg">{log.msg}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default App