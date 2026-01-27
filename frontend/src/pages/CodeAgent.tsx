import React, { useState, useEffect, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { Button } from "../components/ui/Button";
import { Play, Code2, Terminal, Loader2, Sparkles } from "lucide-react";

export default function CodeAgentWorkspace() {
  const { token } = useAuth();
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [task, setTask] = useState("generate");
  const [loading, setLoading] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [inputBuffer, setInputBuffer] = useState("");
  const [useMultiAgent, setUseMultiAgent] = useState(false);
  const [leftWidth, setLeftWidth] = useState(30);
  const [isResizing, setIsResizing] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Constraints
      if (newWidth > 15 && newWidth < 85) {
        setLeftWidth(newWidth);
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const handleExecute = async () => {
    // 1. Interactive Execution Mode
    if (task === "execute") {
      if (ws) ws.close();
      setOutput("");
      setLoading(true);

      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = window.location.hostname;
      const socket = new WebSocket(`${wsProtocol}//${wsHost}:8000/ws/code/execute`);
      socket.onopen = () => {
        setLoading(false);
        setOutput(">>> Connected to Interactive Session\n");
        socket.send(JSON.stringify({ code: code, language: language }));
      };
      socket.onmessage = (event) => setOutput((prev) => prev + event.data);
      socket.onclose = () => {
        setOutput((prev) => prev + "\n>>> Session Closed");
        setWs(null);
        setLoading(false);
      };
      setWs(socket);
      return;
    }

    // 2. Multi-Agent Squad Mode (WS Streaming)
    if (useMultiAgent && task === "generate") {
      if (ws) ws.close();
      setOutput("");
      setLoading(true);

      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = window.location.hostname;
      const socket = new WebSocket(`${wsProtocol}//${wsHost}:8000/ws/code/squad`);
      socket.onopen = () => {
        socket.send(JSON.stringify({ prompt: code }));
      };
      socket.onmessage = (event) => {
        // If message contains #### (file header), we clear the status and append
        if (event.data.includes("####")) {
          setOutput((prev) => prev + "\n" + event.data);
        } else {
          // Otherwise just append as a status line
          setOutput((prev) => prev + "\n" + event.data);
        }
      };
      socket.onclose = () => {
        setWs(null);
        setLoading(false);
      };
      socket.onerror = (err) => {
        setOutput((prev) => prev + "\n❌ Connection Error: " + err);
        setLoading(false);
      };
      setWs(socket);
      return;
    }

    // 3. Standard HTTP tasks (Refactor, Explain, Test)
    setLoading(true);
    try {
      const endpoint = task === "generate" ? "/api/code/generate" : `/api/code/${task}`;
      const payload =
        task === "generate"
          ? { language, prompt: code, use_agents: useMultiAgent }
          : task === "refactor"
            ? { language, code, goal: "improve" }
            : { language, code };

      const res = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOutput(res.data.result);
    } catch (err: any) {
      setOutput(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminalInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && ws && ws.readyState === WebSocket.OPEN) {
      const text = inputBuffer + "\n";
      ws.send(text);
      setOutput((prev) => prev + text); // Echo locally
      setInputBuffer("");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0B1120] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-[#0B1120] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
            <Code2 className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Code Agent</h1>
            <p className="text-xs text-gray-400">AI-powered code generation & execution | Powered by Meta Llama 3.3 70B</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          {task === "generate" && (
            <label className="flex items-center gap-2 cursor-pointer bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg hover:border-indigo-500 transition-all select-none">
              <input
                type="checkbox"
                checked={useMultiAgent}
                onChange={(e) => setUseMultiAgent(e.target.checked)}
                className="accent-indigo-500 h-4 w-4"
              />
              <span className="text-sm text-gray-300">Multi-Agent Squad</span>
            </label>
          )}

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 hover:bg-gray-800 transition-colors cursor-pointer"
          >
            {["python", "javascript", "typescript", "java", "cpp", "go", "rust", "php", "bash"].map(
              (lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              )
            )}
          </select>

          <div className="h-6 w-px bg-gray-800" />

          <select
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <option value="generate">Generate Code</option>
            <option value="refactor">Refactor / Optimize</option>
            <option value="explain">Explain Code</option>
            <option value="test">Generate Tests</option>
            <option value="execute">Execute (Interactive)</option>
          </select>

          <Button
            onClick={handleExecute}
            disabled={loading && task !== "execute"} // Allow restarting WS
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 ml-2"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
            {loading ? "Running..." : "Run Agent"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div
        ref={containerRef}
        className={`flex-1 flex gap-0 overflow-hidden ${isResizing ? 'cursor-col-resize select-none' : ''}`}
      >
        {/* Editor Panel */}
        <div
          style={{ width: `${leftWidth}%` }}
          className="flex flex-col border-r border-gray-800"
        >
          <div className="bg-gray-900/50 px-4 py-2 border-b border-gray-800 text-xs font-mono text-gray-400 flex justify-between items-center whitespace-nowrap overflow-hidden">
            <span>INPUT ({language})</span>
            <span className="text-gray-600 hidden md:inline">Monaco Editor</span>
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                automaticLayout: true,
              }}
            />
          </div>
        </div>

        {/* Resizer Divider */}
        <div
          onMouseDown={startResizing}
          className={`w-1.5 flex-shrink-0 cursor-col-resize hover:bg-indigo-500/30 transition-colors relative group ${isResizing ? 'bg-indigo-500/50' : 'bg-gray-800/20'}`}
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gray-700 group-hover:bg-indigo-400 transition-colors" />
        </div>

        {/* Output Panel (Interactive Terminal) */}
        <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col bg-[#0f1623]">
          <div className={`px-4 py-2 border-b border-gray-800 text-xs font-mono flex items-center gap-2 ${ws ? 'bg-indigo-900/20 text-indigo-400' : 'bg-gray-900/50 text-gray-400'}`}>
            <Terminal className="h-3 w-3" />
            <span>{task === "execute" ? "INTERACTIVE TERMINAL" : "OUTPUT / CONSOLE"}</span>
            {ws && <span className="ml-auto text-[10px] uppercase tracking-wider text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> LIVE</span>}
          </div>

          <div
            ref={terminalRef}
            className="flex-1 p-4 font-mono text-sm overflow-auto custom-scrollbar"
          >
            {output ? (
              <pre className="whitespace-pre-wrap text-emerald-400 break-words">{output}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-600">
                <Sparkles className="h-8 w-8 mb-3 opacity-20" />
                <p>Output will appear here...</p>
              </div>
            )}
          </div>

          {/* Input Area (Only for Exec mode) */}
          {task === "execute" && (
            <div className="px-4 py-3 border-t border-gray-800 bg-[#0f1623]">
              <div className="flex items-center gap-2">
                <span className="text-indigo-500 font-bold">{">"}</span>
                <input
                  type="text"
                  value={inputBuffer}
                  onChange={(e) => setInputBuffer(e.target.value)}
                  onKeyDown={handleTerminalInput}
                  placeholder={ws ? "Type input..." : "Connect first..."}
                  className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder-gray-600"
                  autoComplete="off"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}