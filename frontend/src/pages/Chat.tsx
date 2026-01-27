import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Send, Bot, User, RefreshCw, Sparkles, Mic, Globe, FileText, CheckCircle2, Database, Square } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { TypingIndicator } from "../components/ui/TypingIndicator";

import { cn } from "../lib/utils";

interface Message {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  timestamp: Date;
  image?: string;
}

const MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 (70B) - Groq", description: "Ultra-fast general intelligence" },
  { id: "planner_agent", name: "Multi-Agent Squad", description: "Planner -> Coder -> Reviewer workflow" },
  { id: "gemini-3-flash-preview", name: "Gemini 3 (Flash) - Google", description: "Latest Vision-capable model" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3", description: "Advanced reasoning and coding" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 (8B)", description: "Instant responses" },
];

export default function Chat() {
  const { token, user } = useAuth();
  const { sessionId } = useParams();
  const navigate = useNavigate();

  console.log("DEBUG: Chat component user data:", user);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [webSearch, setWebSearch] = useState(false);
  const [useRag, setUseRag] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [chatTitle, setChatTitle] = useState("Enterprise AI");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const loadedSessionIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Sync with URL sessionId
  useEffect(() => {
    if (sessionId) {
      if (sessionId !== loadedSessionIdRef.current) {
        loadMessages(sessionId);
      }
    } else {
      setMessages([]);
      setChatTitle("Enterprise AI");
      loadedSessionIdRef.current = null;
    }
  }, [sessionId]);

  const loadMessages = async (sid: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/chat/sessions/${sid}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.map((m: any) => ({
        ...m,
        timestamp: new Date(m.created_at)
      })));

      loadedSessionIdRef.current = sid;

      // Also fetch session info for title
      const sessionRes = await axios.get("/api/chat/sessions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const session = sessionRes.data.find((s: any) => s.id === sid);
      if (session) setChatTitle(session.title);

    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: "audio/wav" });
          const formData = new FormData();
          formData.append("file", blob, "recording.wav");

          setLoading(true);
          try {
            const res = await axios.post("/api/voice/transcribe", formData, {
              headers: { Authorization: `Bearer ${token}` }
            });

            const text = res.data.text;
            const storedSettings = localStorage.getItem("chatSettings");
            const settings = storedSettings ? JSON.parse(storedSettings) : {};

            if (settings.autoSendVoice) {
              // If auto-send is on, send immediately without updating input field state (avoid conflict)
              // Use current input state + transcribed text
              handleSendMessage({ overrideText: input ? input + " " + text : text });
            } else {
              setInput((prev) => (prev ? prev + " " + text : text));
            }

          } catch (err: any) {
            console.error("Transcription failed", err);
          } finally {
            setLoading(false);
            stream.getTracks().forEach(track => track.stop());
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone access denied", err);
        alert("Could not access microphone.");
      }
    }
  };

  const handleSendMessage = async (customConfig?: { overrideModel?: string, overrideText?: string }) => {
    // Stop any ongoing TTS before sending new message
    stopTts();

    const textToSend = customConfig?.overrideText || input;

    if ((!textToSend.trim() && !selectedImage) || loading) return;

    const storedSettings = localStorage.getItem("chatSettings");
    const settings = storedSettings ? JSON.parse(storedSettings) : {};

    // Explicit model from UI selector or Settings
    const activeModel = customConfig?.overrideModel || selectedModel || settings.activeModel || "llama-3.1-8b-instant";

    const userMessage: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date(),
      image: selectedImage || undefined
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: messages.concat(userMessage).map(m => ({
            role: m.role,
            content: m.content,
            image: m.image
          })),
          conversation_id: sessionId && sessionId !== "undefined" ? sessionId : null,
          web_search: webSearch,
          system_prompt: settings.systemPrompt,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          top_p: settings.topP,
          frequency_penalty: settings.frequencyPenalty,
          presence_penalty: settings.presencePenalty,
          history_limit: settings.historyLimit === 0 ? null : settings.historyLimit,

          model: activeModel, // Pass the selected model
          use_rag: useRag,
          workspace: localStorage.getItem("activeWorkspace") || "personal"
        })
      });

      // Clear RAG flag after one use if it was active
      if (useRag) setUseRag(false);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Stream request failed: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage += ` - ${JSON.stringify(errorJson, null, 2)}`;
        } catch {
          errorMessage += ` - ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      // Get session ID from header (important for first message)
      const newSid = response.headers.get("X-Chat-Session-ID");
      if (newSid && newSid !== sessionId) {
        loadedSessionIdRef.current = newSid;
        navigate(`/${newSid}`, { replace: true });
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        model: activeModel,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const decoder = new TextDecoder();
      let fullContent = "";
      let streamBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines (\n\n)
        const parts = streamBuffer.split("\n\n");
        // Keep the last partial event in the buffer
        streamBuffer = parts.pop() || "";

        for (const line of parts) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("data: ")) {
            const text = trimmedLine.slice(6);
            try {
              const data = JSON.parse(text);
              if (data && typeof data.content === 'string') {
                fullContent += data.content;
              } else if (typeof data === 'string') {
                fullContent += data;
              }
            } catch (e) {
              // Fallback for non-JSON or partial JSON (though buffer should prevent this)
              console.warn("Failed to parse SSE chunk", text);
            }

            setMessages((prev) => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1].content = fullContent;
              return newMsgs;
            });
          }
        }
      }

      // Final flush for any remaining data in the buffer
      if (streamBuffer.trim().startsWith("data: ")) {
        const text = streamBuffer.trim().slice(6);
        try {
          const data = JSON.parse(text);
          if (data && typeof data.content === 'string') {
            fullContent += data.content;
          } else if (typeof data === 'string') {
            fullContent += data;
          }
        } catch (e) {
          console.warn("Dangling stream buffer failed to parse", text);
        }

        setMessages((prev) => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = fullContent;
          return newMsgs;
        });
      }

      // Text-to-Speech (Unreal Speech V8 Backend)
      if (settings.textToSpeech && fullContent) {
        try {
          const ttsRes = await axios.post("/api/voice/tts",
            { text: fullContent, voice_id: "Sierra" },
            {
              headers: { Authorization: `Bearer ${token}` },
              responseType: 'blob'
            }
          );
          const audioUrl = URL.createObjectURL(ttsRes.data);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          setIsTtsPlaying(true);

          audio.onended = () => {
            setIsTtsPlaying(false);
            audioRef.current = null;
          };

          audio.onerror = () => {
            setIsTtsPlaying(false);
            audioRef.current = null;
          };

          audio.play();
        } catch (ttsErr) {
          console.error("Backend TTS failed, falling back to browser...", ttsErr);
          const utterance = new SpeechSynthesisUtterance(fullContent);
          utteranceRef.current = utterance;
          setIsTtsPlaying(true);

          utterance.onend = () => {
            setIsTtsPlaying(false);
            utteranceRef.current = null;
          };

          utterance.onerror = () => {
            setIsTtsPlaying(false);
            utteranceRef.current = null;
          };

          window.speechSynthesis.speak(utterance);
        }
      }

    } catch (err: any) {
      console.error("Chat error", err);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Error: " + err.message,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const stopTts = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    setIsTtsPlaying(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0B1120] text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-[#0B1120]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">
              {chatTitle}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isTtsPlaying && (
            <Button
              variant="outline"
              size="sm"
              onClick={stopTts}
              className="flex items-center gap-2 text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <Square className="h-3 w-3 fill-current" />
              Stop Reading
            </Button>
          )}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm rounded-lg block px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 dark:text-white outline-none"
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards" style={{ animationDelay: '0.1s', opacity: 1 }}>
            <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-gray-200 dark:ring-gray-700">
              <Sparkles className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">How can I help you today?</h2>
            <p className="text-gray-400 max-w-md mb-8">
              I'm ready to assist with coding, debugging, analysis, or creative writing.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            msg.role === "system" ? (
              <div key={idx} className="flex justify-center w-full my-4 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center justify-center py-4 px-8 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl max-w-lg w-full space-y-3 shadow-sm backdrop-blur-sm">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shadow-inner">
                    <FileText className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="text-sm text-gray-300 text-center leading-relaxed">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-0">{children}</p>,
                        strong: ({ children }) => <span className="text-emerald-400 font-semibold">{children}</span>,
                        code: ({ children }) => <code className="bg-gray-800/50 px-1.5 py-0.5 rounded text-xs text-white border border-gray-700">{children}</code>
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-500/50 font-medium uppercase tracking-widest pt-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Knowledge Indexed
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={idx}
                className={cn(
                  "flex gap-4 max-w-4xl mx-auto group animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-md overflow-hidden",
                  msg.role === "user"
                    ? "bg-gradient-to-tr from-cyan-500 to-blue-600"
                    : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                )}>
                  {msg.role === "user" ? (
                    user?.picture ? (
                      <img src={user.picture} alt="User" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )
                  ) : (
                    <Bot className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  )}
                </div>

                <div className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === "user" ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed relative",
                    msg.role === "user"
                      ? "bg-[#2563EB] text-white rounded-tr-none"
                      : "bg-white dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700/50 rounded-tl-none shadow-sm"
                  )}>
                    {msg.image && (
                      <div className="mb-3">
                        <img src={msg.image} alt="Uploaded" className="rounded-lg max-h-60 border border-gray-200 dark:border-gray-700" />
                      </div>
                    )}
                    {msg.content ? (
                      <ReactMarkdown
                        components={{
                          code(props) {
                            const { children, className, node, ...rest } = props;
                            const match = /language-(\w+)/.exec(className || "");
                            return match ? (
                              <div className="rounded-md overflow-hidden my-3 border border-gray-700/50 bg-[#1e1e1e]">
                                <div className="bg-[#2d2d2d] px-3 py-1 text-xs text-gray-400 border-b border-gray-700/50 flex justify-between items-center">
                                  <span>{match[1]}</span>
                                </div>
                                <SyntaxHighlighter
                                  style={atomDark}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                                  {...(rest as any)}
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              <code className={cn("bg-gray-700/50 px-1.5 py-0.5 rounded text-xs font-mono text-cyan-200", className)} {...rest}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <TypingIndicator />
                    )}
                  </div>
                </div>
              </div>
            )
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-[#0B1120]">
        <div className="max-w-4xl mx-auto relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Send a message..."
            className="w-full pl-60 pr-16 py-6 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-base shadow-inner rounded-xl focus:ring-cyan-500/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />

          <div className="absolute left-2 top-2 bottom-2 flex items-center gap-1">
            <input
              type="file"
              id="chat-upload"
              className="hidden"
              accept="image/*,.pdf,.txt,.doc,.docx"
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];

                  // 1. Handle Image Upload (Vision)
                  if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => setSelectedImage(reader.result as string);
                    reader.readAsDataURL(file);
                    e.target.value = "";
                    return;
                  }

                  // 2. Handle Document Upload (RAG)
                  setLoading(true);
                  let activeSid = sessionId;

                  if (!activeSid || activeSid === "undefined") {
                    try {
                      const sessRes = await axios.post("/api/chat/sessions", {}, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      activeSid = sessRes.data.id;
                      navigate(`/${activeSid}`, { replace: true });
                      loadedSessionIdRef.current = activeSid ?? null;
                    } catch (err) {
                      console.error("Failed to create session for document upload", err);
                    }
                  }

                  const formData = new FormData();
                  formData.append("file", file);
                  if (activeSid) formData.append("conversation_id", activeSid);

                  try {
                    await axios.post("/api/rag/upload", formData, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    setUseRag(true);
                    if (activeSid) await loadMessages(activeSid);
                  } catch (err: any) {
                    console.error("Upload failed", err);
                    alert(`Failed to upload document: ${err.response?.data?.detail || err.message}`);
                  } finally {
                    setLoading(true); // Keep loading while refreshing
                    setTimeout(() => setLoading(false), 500);
                    e.target.value = "";
                  }
                }
              }}
            />
            <label htmlFor="chat-upload" className={cn(
              "h-9 w-9 flex items-center justify-center rounded-lg cursor-pointer transition-all",
              selectedImage ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800'
            )}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
            </label>

            <button onClick={toggleRecording} className={cn("h-9 w-9 flex items-center justify-center rounded-lg", isRecording ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-gray-400 hover:bg-gray-800')}>
              <Mic className="h-4 w-4" />
            </button>

            <button onClick={() => setWebSearch(!webSearch)} className={cn("h-9 w-9 flex items-center justify-center rounded-lg", webSearch ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:bg-gray-800')}>
              <Globe className="h-4 w-4" />
            </button>

            <button onClick={() => setUseRag(!useRag)} className={cn("h-9 w-9 flex items-center justify-center rounded-lg", useRag ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-400 hover:bg-gray-800')} title="Query Document (RAG)">
              <Database className="h-4 w-4" />
            </button>
          </div>

          <div className="absolute right-2 top-2 bottom-2 flex items-center">
            <Button
              size="icon"
              variant={input.trim() || selectedImage ? "premium" : "ghost"}
              className="h-10 w-10 rounded-lg"
              disabled={(!input.trim() && !selectedImage) || loading}
              onClick={() => handleSendMessage()}
            >
              {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {selectedImage && (
          <div className="relative mt-2 inline-block">
            <img src={selectedImage} alt="Preview" className="h-20 w-auto rounded-lg border border-gray-700" />
            <button onClick={() => setSelectedImage(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}