import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Bug,
  Globe,
  Link,
  ArrowRight,
  Spinner,
  CheckCircle,
  Warning,
} from '@phosphor-icons/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Card, CardHeader, CardContent } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Progress } from './components/ui/progress'
import { fetchEventSource } from '@microsoft/fetch-event-source'

interface LogEntry {
  msg: string
  level: string
}

export default function App() {
  const [url, setUrl] = useState('')
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming()
    }
  }, [stopStreaming])

  const handleCrawl = () => {
    if (!url.trim()) return

    // Stop any existing stream first
    stopStreaming()

    setIsStreaming(true)
    setError(null)
    setMarkdown(null)
    setLogs([])

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    fetchEventSource('http://127.0.0.1:5001/crawl/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: abortController.signal,
      onmessage(ev) {
        const data = JSON.parse(ev.data)

        if (data.event === 'log') {
          setLogs((prev) => [...prev, { msg: data.msg, level: data.level }])
        } else if (data.event === 'progress') {
          // Progress events for status tracking
          console.log('Progress:', data.status)
        } else if (data.event === 'done') {
          if (data.success) {
            setMarkdown(data.markdown || '')
          } else {
            setError(data.error || 'Crawl failed')
          }
          setIsStreaming(false)
          abortControllerRef.current = null
        }
      },
      onerror(err) {
        // Don't set error if it was an abort (user-initiated stop)
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message || 'SSE connection error')
        }
        setIsStreaming(false)
        abortControllerRef.current = null
        // Throw to stop fetchEventSource from retrying indefinitely
        throw err
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCrawl()
    }
  }

  const levelColors: Record<string, string> = {
    info: 'text-blue-400',
    success: 'text-green-400',
    error: 'text-red-400',
    warn: 'text-yellow-400',
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-6">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 py-4">
          <Globe size={36} className="text-primary" weight="duotone" />
          <div>
            <h1 className="text-2xl font-bold text-primary">Crawl4ai</h1>
            <p className="text-sm text-muted-foreground">Web to Markdown</p>
          </div>
        </div>

        {/* URL Input Card */}
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-2">
              <Link size={18} className="text-muted-foreground" weight="regular" />
              <span className="text-sm font-medium text-muted-foreground">
                Enter URL to crawl
              </span>
            </div>
            <div className="flex gap-2">
               <Input
                 type="url"
                 placeholder="https://example.com"
                 value={url}
                 onChange={(e) => setUrl(e.target.value)}
                 onKeyDown={handleKeyDown}
                 disabled={isStreaming}
                 className="flex-1"
               />
              <Button
                 onClick={isStreaming ? stopStreaming : handleCrawl}
                 disabled={!isStreaming && !url.trim()}
                 variant={isStreaming ? "destructive" : "default"}
               >
                  {isStreaming ? (
                   <>
                     <Spinner size={18} weight="bold" className="animate-spin" />
                     <span>Stop</span>
                   </>
                 ) : (
                   <>
                     <Bug size={18} weight="duotone" />
                     <span>Crawl</span>
                     <ArrowRight size={16} weight="bold" />
                   </>
                 )}
               </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Status Area */}
        {isStreaming && (
          <div className="space-y-3">
            <Progress className="animate-pulse" />
            <div className="flex items-center gap-2">
              <Badge variant="default">
                <Spinner size={12} weight="bold" className="animate-spin mr-1" />
                Crawling...
              </Badge>
            </div>
          </div>
        )}

        {markdown && !isStreaming && (
          <Badge variant="success">
            <CheckCircle size={12} weight="bold" className="mr-1" />
            Complete
          </Badge>
        )}

        {error && !isStreaming && (
          <div className="space-y-2">
            <Badge variant="destructive">
              <Warning size={12} weight="bold" className="mr-1" />
              Failed
            </Badge>
            <p className="text-sm text-destructive-foreground">{error}</p>
          </div>
        )}

        {/* Markdown Output Card */}
        {markdown && !isStreaming && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bug size={18} weight="duotone" className="text-primary" />
                <span className="font-semibold">Result</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto rounded-lg bg-secondary/50 p-4 prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Log Messages - show during streaming and after */}
        {(logs.length > 0 || isStreaming) && (
          <Card>
            <CardHeader>
              <span className="font-semibold text-muted-foreground">Logs</span>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${levelColors[log.level] || 'text-muted-foreground'}`}
                    />
                    <span className="text-muted-foreground">{log.msg}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
