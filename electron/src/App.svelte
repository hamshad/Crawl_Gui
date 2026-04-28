<script>
  let url = '';
  let isLoading = false;
  let status = 'Ready';
  let markdown = '';
  let logs = [];
  let error = '';
  let copyText = 'Copy';

  async function crawl() {
    if (!url.trim()) {
      status = 'Enter a URL first';
      return;
    }

    isLoading = true;
    status = 'Crawling...';
    logs = [];
    error = '';
    addLog('Initializing crawler...', 'info');

    try {
      addLog('Connecting to backend...', 'info');
      const response = await fetch('http://127.0.0.1:5001/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      const data = await response.json();
      
      if (data.success) {
        markdown = data.markdown;
        logs = data.logs || [];
        status = 'Done!';
        addLog('Complete!', 'success');
      } else {
        error = data.error || 'Unknown error';
        status = 'Failed';
        addLog(error, 'error');
      }
    } catch (e) {
      error = e.message;
      status = 'Connection failed';
      addLog(e.message, 'error');
    } finally {
      isLoading = false;
    }
  }

  function addLog(msg, type) {
    const time = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    logs = [...logs, { msg, type, time }];
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(markdown);
      copyText = 'Copied!';
      setTimeout(() => copyText = 'Copy', 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  }

  function clearLogs() {
    logs = [];
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !isLoading) {
      crawl();
    }
  }

  function formatMarkdown(text) {
    if (!text) return '';
    // Simple syntax highlighting
    return text
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  }
</script>

<main>
  <div class="header">
    <div class="logo">
      <div class="logo-icon">⬡</div>
      <div class="logo-text">
        <h1>Crawl4ai</h1>
        <span class="tagline">Transform any URL into clean Markdown</span>
      </div>
    </div>
  </div>

  <div class="input-section">
    <div class="input-wrapper">
      <div class="input-icon">🔗</div>
      <input 
        type="text" 
        bind:value={url} 
        on:keydown={handleKeydown}
        placeholder="Paste URL here (e.g., https://example.com)"
        disabled={isLoading}
      />
      <button class="crawl-btn" on:click={crawl} disabled={isLoading || !url.trim()}>
        {#if isLoading}
          <span class="spinner"></span>
          <span>Crawling</span>
        {:else}
          <span class="btn-icon">⚡</span>
          <span>Crawl</span>
        {/if}
      </button>
    </div>
    <div class="status-bar">
      <span class="status-indicator" class:loading={isLoading} class:success={status === 'Done!'}></span>
      <span class="status-text">{status}</span>
    </div>
  </div>

  <div class="content">
    <div class="panel result-panel">
      <div class="panel-header">
        <div class="panel-title">
          <span class="panel-icon">📄</span>
          <span>Markdown</span>
        </div>
        <button class="action-btn" on:click={copyToClipboard} disabled={!markdown}>
          {copyText}
        </button>
      </div>
      <div class="panel-content">
        {#if markdown}
          <pre class="markdown-content">{markdown}</pre>
        {:else if error}
          <div class="error-state">
            <span class="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        {:else}
          <div class="empty-state">
            <span class="empty-icon">🕷️</span>
            <span>Enter a URL and click Crawl</span>
            <span class="empty-hint">Results will appear here</span>
          </div>
        {/if}
      </div>
    </div>

    <div class="panel logs-panel">
      <div class="panel-header">
        <div class="panel-title">
          <span class="panel-icon">📜</span>
          <span>Activity Log</span>
        </div>
        <button class="action-btn" on:click={clearLogs}>Clear</button>
      </div>
      <div class="panel-content logs-content">
        {#if logs.length === 0}
          <div class="empty-logs">
            <span>Waiting for activity...</span>
          </div>
        {:else}
          {#each logs as log}
            <div class="log-entry {log.type}">
              <span class="log-time">{log.time}</span>
              <span class="log-dot"></span>
              <span class="log-msg">{log.msg}</span>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</main>

<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #0a0a0f;
    color: #e4e4e7;
    min-height: 100vh;
    overflow: hidden;
  }

  main {
    max-width: 1600px;
    margin: 0 auto;
    padding: 24px 32px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* Header */
  .header {
    flex-shrink: 0;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .logo-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
  }

  .logo-text h1 {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  .tagline {
    font-size: 13px;
    color: #71717a;
    display: block;
    margin-top: 2px;
  }

  /* Input Section */
  .input-section {
    background: linear-gradient(135deg, #18181b, #09090b);
    padding: 20px 24px;
    border-radius: 16px;
    border: 1px solid #27272a;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #0a0a0f;
    border-radius: 12px;
    padding: 6px 6px 6px 16px;
    border: 1px solid #27272a;
    transition: border-color 0.2s;
  }

  .input-wrapper:focus-within {
    border-color: #6366f1;
  }

  .input-icon {
    font-size: 18px;
    opacity: 0.5;
  }

  input {
    flex: 1;
    background: transparent;
    border: none;
    color: #e4e4e7;
    font-size: 15px;
    outline: none;
  }

  input::placeholder {
    color: #52525b;
  }

  input:disabled {
    opacity: 0.5;
  }

  .crawl-btn {
    padding: 12px 24px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .crawl-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  }

  .crawl-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-icon {
    font-size: 16px;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .status-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 14px;
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #52525b;
  }

  .status-indicator.loading {
    background: #fbbf24;
    animation: pulse 1s infinite;
  }

  .status-indicator.success {
    background: #22c55e;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .status-text {
    font-size: 13px;
    color: #a1a1aa;
  }

  /* Content */
  .content {
    flex: 1;
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 20px;
    min-height: 0;
  }

  .panel {
    background: #18181b;
    border-radius: 16px;
    border: 1px solid #27272a;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    border-bottom: 1px solid #27272a;
    background: linear-gradient(180deg, #1f1f23, #18181b);
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #a1a1aa;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .panel-icon {
    font-size: 14px;
  }

  .action-btn {
    padding: 6px 14px;
    background: #27272a;
    color: #a1a1aa;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover:not(:disabled) {
    background: #3f3f46;
    color: #e4e4e7;
  }

  .action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .panel-content {
    flex: 1;
    padding: 16px;
    overflow: auto;
  }

  /* Result Panel */
  .result-panel .panel-content {
    background: #0a0a0f;
  }

  .markdown-content {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
    color: #d4d4d8;
  }

  .empty-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    color: #52525b;
  }

  .empty-icon, .error-icon {
    font-size: 48px;
    opacity: 0.3;
  }

  .empty-hint {
    font-size: 12px;
    opacity: 0.6;
  }

  .error-state {
    color: #f87171;
  }

  /* Logs Panel */
  .logs-content {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    background: #0a0a0f;
  }

  .empty-logs {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #52525b;
    font-size: 13px;
  }

  .log-entry {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 4px;
    background: #18181b;
  }

  .log-time {
    color: #52525b;
    font-size: 11px;
    flex-shrink: 0;
  }

  .log-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .log-msg {
    color: #a1a1aa;
    flex: 1;
  }

  .log-entry.info .log-dot { background: #60a5fa; }
  .log-entry.info .log-msg { color: #60a5fa; }
  
  .log-entry.success .log-dot { background: #22c55e; }
  .log-entry.success .log-msg { color: #22c55e; }
  
  .log-entry.error .log-dot { background: #f87171; }
  .log-entry.error .log-msg { color: #f87171; }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #0a0a0f;
  }

  ::-webkit-scrollbar-thumb {
    background: #3f3f46;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #52525b;
  }
</style>