import { useState, useEffect } from "react";
import {
    Settings as SettingsIcon,
    Database,
    Moon,
    Sun,
    Download,
    Trash2,
    Save,
    Check,
    Monitor,
    LogOut,
    Mic,
    Volume2,
    FileText,
    Brain,
    BarChart3,
    Sliders,
    Hammer,
    Shield,
    Music,
    Globe,
    Code,
    Plus,
    UploadCloud,
    Key,
    Eye,
    RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";

export default function Settings() {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState("general");
    const [saved, setSaved] = useState(false);
    const [documents, setDocuments] = useState<string[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    // Initial state from localStorage or default
    const [settings, setSettings] = useState({
        systemPrompt: "You are a helpful AI assistant.",
        temperature: 0.7,
        maxTokens: 2048,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        historyLimit: 0,
        activeModel: "llama-3.1-8b-instant", // Default model
        autoSendVoice: false,
        textToSpeech: false,
    });

    useEffect(() => {
        const storedSettings = localStorage.getItem("chatSettings");
        if (storedSettings) {
            setSettings({ ...settings, ...JSON.parse(storedSettings) });
        }
    }, []);

    // Fetch documents on load (lazy load when tab is clicked could be better, but simple is fine)
    useEffect(() => {
        if (activeTab === "knowledge") {
            fetchDocuments();
        }
    }, [activeTab]);

    const fetchDocuments = async () => {
        setLoadingDocs(true);
        try {
            const res = await axios.get("/api/rag/documents");
            setDocuments(res.data.documents || []);
        } catch (error) {
            console.error("Failed to fetch documents", error);
        } finally {
            setLoadingDocs(false);
        }
    };

    const handleSave = () => {
        localStorage.setItem("chatSettings", JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleExport = async () => {
        try {
            const res = await axios.get("/api/chat/export");
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export data.");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete ALL chat history? This cannot be undone.")) return;

        try {
            await axios.delete("/api/chat/history");
            alert("All chat history deleted.");
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete history.");
        }
    };

    const deleteDocument = async (filename: string) => {
        if (!confirm(`Are you sure you want to delete ${filename} from the knowledge base?`)) return;
        try {
            await axios.delete(`/api/rag/documents/${filename}`);
            setDocuments(prev => prev.filter(d => d !== filename));
        } catch (error) {
            console.error("Delete document failed:", error);
            alert("Failed to delete document.");
        }
    };

    const tabs = [
        { id: "general", label: "General", icon: SettingsIcon },
        { id: "model", label: "Models", icon: Brain },
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "finetune", label: "Fine-Tuning", icon: Sliders },
        { id: "tools", label: "Tools & Plugins", icon: Hammer },
        { id: "privacy", label: "Privacy & Security", icon: Shield },
        { id: "knowledge", label: "Knowledge Base", icon: Database },
        { id: "voice", label: "Voice Studio", icon: Music },
        { id: "data", label: "Data Management", icon: Download },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] text-gray-900 dark:text-gray-100 p-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <SettingsIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                            Settings
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your preferences and AI configuration</p>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="col-span-12 md:col-span-3 space-y-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                                        activeTab === tab.id
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="col-span-12 md:col-span-9 space-y-6">

                        {/* General Tab */}
                        {activeTab === "general" && (
                            <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-gray-900 dark:text-white">Appearance & Account</CardTitle>
                                    <CardDescription className="text-gray-500 dark:text-gray-400">Customize how the interface looks.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme Preference</label>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div
                                                className={cn(
                                                    "cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all hover:bg-gray-100 dark:hover:bg-white/5",
                                                    theme === "light"
                                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-white ring-1 ring-indigo-500"
                                                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                                                )}
                                                onClick={() => setTheme("light")}
                                            >
                                                <Sun className="h-5 w-5" /> Light
                                            </div>
                                            <div
                                                className={cn(
                                                    "cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all hover:bg-gray-100 dark:hover:bg-white/5",
                                                    theme === "dark"
                                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-white ring-1 ring-indigo-500"
                                                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                                                )}
                                                onClick={() => setTheme("dark")}
                                            >
                                                <Moon className="h-5 w-5" /> Dark
                                            </div>
                                            <div
                                                className={cn(
                                                    "cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all hover:bg-gray-100 dark:hover:bg-white/5",
                                                    theme === "system"
                                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-white ring-1 ring-indigo-500"
                                                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                                                )}
                                                onClick={() => setTheme("system")}
                                            >
                                                <Monitor className="h-5 w-5" /> Auto
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-4">
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Info</h3>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg flex items-center gap-4 border border-gray-200 dark:border-gray-700">
                                            {user?.picture ? (
                                                <img
                                                    src={user.picture}
                                                    alt="Profile"
                                                    className="h-12 w-12 rounded-full border border-gray-200 dark:border-gray-700 object-cover"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                                    {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">{user?.email || "Guest User"}</p>
                                                <p className="text-xs text-gray-500">ID: {user?.user_id || "N/A"}</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="border-gray-200 dark:border-gray-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400"
                                                onClick={logout}
                                            >
                                                <LogOut className="h-4 w-4 mr-2" /> Sign Out
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Model Tab (Updated) */}
                        {activeTab === "model" && (
                            <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-gray-900 dark:text-white">Model Configuration</CardTitle>
                                    <CardDescription className="text-gray-500 dark:text-gray-400">Select the AI brain and fine-tune its behavior.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Model</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { id: "llama-3.3-70b-versatile", name: "Llama 3.3 (70B) - Groq", desc: "Ultra Fast & Intelligent (Recommended)" },
                                                { id: "planner_agent", name: "Multi-Agent Squad", desc: "Planner -> Coder -> Reviewer logic" },
                                                { id: "gemini-3-flash-preview", name: "Gemini 3 (Flash) - Google", desc: "Latest Vision & Reasoning" },
                                                { id: "deepseek/deepseek-chat", name: "DeepSeek V3", desc: "High-intelligence Coding & Chat" },
                                                { id: "llama-3.1-8b-instant", name: "Llama 3.1 (8B)", desc: "Instant & Lightweight" },
                                            ].map((model) => (
                                                <div
                                                    key={model.id}
                                                    onClick={() => setSettings({ ...settings, activeModel: model.id })}
                                                    className={cn(
                                                        "cursor-pointer p-4 rounded-lg border transition-all",
                                                        settings.activeModel === model.id
                                                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500"
                                                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                                    )}
                                                >
                                                    <div className="font-medium text-gray-900 dark:text-white">{model.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{model.desc}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">System Prompt</label>
                                        <textarea
                                            className="w-full h-32 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                            placeholder="Enter a custom system prompt..."
                                            value={settings.systemPrompt}
                                            onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                                        />
                                        <p className="text-xs text-gray-500">The core instruction set that defines the AI's persona.</p>
                                    </div>


                                </CardContent>
                            </Card>
                        )}

                        {/* Knowledge Base Tab (New) */}
                        {activeTab === "knowledge" && (
                            <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-gray-900 dark:text-white">Knowledge Base</CardTitle>
                                    <CardDescription className="text-gray-500 dark:text-gray-400">Manage uploaded documents for RAG.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        {loadingDocs ? (
                                            <div className="text-center py-8 text-gray-500">Loading documents...</div>
                                        ) : documents.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 italic border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                                No documents uploaded yet.
                                            </div>
                                        ) : (
                                            <div className="grid gap-3">
                                                {documents.map((doc, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                                                                <FileText className="h-5 w-5" />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[200px] md:max-w-md">{doc}</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                            onClick={() => deleteDocument(doc)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500">Upload new documents directly from the chat interface to add them here.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Voice Tab (New) */}
                        {activeTab === "voice" && (
                            <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-gray-900 dark:text-white">Voice & Audio</CardTitle>
                                    <CardDescription className="text-gray-500 dark:text-gray-400">Configure speech-to-text and interactions.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/20">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-green-500/10 text-green-600 rounded-lg">
                                                <Mic className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-gray-200">Auto-Send on Silence</h4>
                                                <p className="text-sm text-gray-500">Automatically send message when you stop speaking.</p>
                                            </div>
                                        </div>
                                        <div
                                            className={cn(
                                                "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300",
                                                settings.autoSendVoice ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
                                            )}
                                            onClick={() => setSettings({ ...settings, autoSendVoice: !settings.autoSendVoice })}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300",
                                                settings.autoSendVoice ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/20">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg">
                                                <Volume2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-gray-200">Text-to-Speech (Beta)</h4>
                                                <p className="text-sm text-gray-500">Read the AI response aloud.</p>
                                            </div>
                                        </div>
                                        <div
                                            className={cn(
                                                "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300",
                                                settings.textToSpeech ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
                                            )}
                                            onClick={() => setSettings({ ...settings, textToSpeech: !settings.textToSpeech })}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300",
                                                settings.textToSpeech ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}




                        {/* Analytics Tab (New) */}
                        {activeTab === "analytics" && (
                            <AnalyticsTab />
                        )}


                        {/* Fine-Tuning Tab (New) */}
                        {activeTab === "finetune" && (
                            <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-gray-900 dark:text-white">Fine-Tuning Studio</CardTitle>
                                    <CardDescription className="text-gray-500 dark:text-gray-400">Train custom models on your own data.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3">
                                        <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
                                            <UploadCloud className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">Upload Training Data (JSONL)</h3>
                                        <p className="text-xs text-gray-500 max-w-sm">Upload a dataset of conversation pairs to teach the model a specific style or knowledge domain.</p>
                                        <Button variant="outline" className="mt-2">Select Dataset</Button>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Active Jobs</h4>
                                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">finance-bot-v1</span>
                                                <span className="text-[10px] bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full">Training</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-yellow-500 h-full w-[45%]"></div>
                                            </div>
                                            <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                                                <span>Epoch 2/5</span>
                                                <span>Est. 14m remaining</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}


                        {/* Tools Tab (New) */}
                        {activeTab === "tools" && (
                            <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-gray-900 dark:text-white">Tools & Integrations</CardTitle>
                                    <CardDescription className="text-gray-500 dark:text-gray-400">Connect external services and enable agent capabilities.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-blue-500/10 flex items-center justify-center rounded-lg text-blue-500"><Globe className="h-5 w-5" /></div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">Web Search</div>
                                                <div className="text-xs text-gray-500">Allow agent to search the internet via DuckDuckGo.</div>
                                            </div>
                                        </div>
                                        <div className="h-6 w-11 bg-indigo-600 rounded-full cursor-pointer relative"><div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full"></div></div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-green-500/10 flex items-center justify-center rounded-lg text-green-500"><Code className="h-5 w-5" /></div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">Code Sandbox (Docker)</div>
                                                <div className="text-xs text-gray-500">Execute Python code in an isolated container.</div>
                                            </div>
                                        </div>
                                        <div className="h-6 w-11 bg-indigo-600 rounded-full cursor-pointer relative"><div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full"></div></div>
                                    </div>

                                    <div className="pt-4">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Custom Webhooks</h4>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                            <Plus className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                                            <span className="text-xs text-gray-500">Add New Webhook</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Privacy Tab (New) */}
                        {activeTab === "privacy" && (
                            <PrivacyTab settings={settings} setSettings={setSettings} />
                        )}

                        {/* Data Tab */}
                        {activeTab === "data" && (
                            <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-gray-900 dark:text-white">Data Management</CardTitle>
                                    <CardDescription className="text-gray-500 dark:text-gray-400">Control your personal data and chat history.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/20">
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-gray-200">Export All Data</h4>
                                            <p className="text-sm text-gray-500">Download your chat history as JSON.</p>
                                        </div>
                                        <Button variant="outline" className="gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={handleExport}>
                                            <Download className="h-4 w-4" /> Export
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-500/20 rounded-lg bg-red-50 dark:bg-red-500/5">
                                        <div>
                                            <h4 className="font-medium text-red-700 dark:text-red-200">Delete All Chats</h4>
                                            <p className="text-sm text-red-600/70 dark:text-red-400/70">Permanently remove all your conversation history.</p>
                                        </div>
                                        <Button variant="destructive" className="gap-2 bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
                                            <Trash2 className="h-4 w-4" /> Delete All
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Global Save Button */}
                <div className="fixed bottom-8 right-8">
                    <Button
                        onClick={handleSave}
                        className={cn(
                            "h-12 px-6 rounded-full shadow-2xl transition-all duration-300 gap-2 font-semibold",
                            saved ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700"
                        )}
                    >
                        {saved ? <Check className="h-5 w-5" /> : <Save className="h-5 w-5" />}
                        {saved ? "Saved Changes" : "Save Configuration"}
                    </Button>
                </div>

            </div>
        </div >
    );
}

function AnalyticsTab() {
    const [stats, setStats] = useState<{
        total_users: number;
        total_messages: number;
        total_tokens: number;
        daily_stats: Array<{ date: string; count: number }>;
    }>({
        total_users: 0,
        total_messages: 0,
        total_tokens: 0,
        daily_stats: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get("/api/admin/stats");
            setStats(res.data);
        } catch (error) {
            console.error("Failed to fetch stats", error);
        } finally {
            setLoading(false);
        }
    };

    const maxCount = Math.max(...stats.daily_stats.map((s) => s.count), 1);

    return (
        <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-sm">
            <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Analytics & Usage</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">Track token consumption and activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                        <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider">Total Tokens (Est.)</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {loading ? "..." : (stats.total_tokens / 1000).toFixed(1) + "k"}
                        </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-100 dark:border-purple-500/20">
                        <p className="text-xs text-purple-500 font-semibold uppercase tracking-wider">Messages</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {loading ? "..." : stats.total_messages.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Usage Chart */}
                <div className="h-64 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-end">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading chart...</div>
                    ) : stats.daily_stats.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">No recent activity</div>
                    ) : (
                        <div className="flex items-end justify-between h-48 gap-2">
                            {stats.daily_stats.map((day, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                                    <div
                                        className="w-full bg-indigo-500/20 dark:bg-indigo-500/40 rounded-t-sm relative transition-all duration-500 group-hover:bg-indigo-500/40 dark:group-hover:bg-indigo-500/60"
                                        style={{ height: `${(day.count / maxCount) * 100}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            {day.count} msgs
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-medium">{day.date}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function PrivacyTab({ settings, setSettings }: { settings: any, setSettings: any }) {
    const [piiEnabled, setPiiEnabled] = useState(false);

    // In a real app we would fetch the PII status from backend
    // useEffect(() => { ... }, []);

    const togglePii = async () => {
        const newState = !piiEnabled;
        setPiiEnabled(newState);
        try {
            await axios.post("/api/admin/privacy/pii", { enabled: newState });
        } catch (error) {
            console.error("Failed to toggle PII", error);
            // setPiiEnabled(!newState); // Revert on failure if needed
        }
    };

    const rotateKey = async () => {
        if (!confirm("Are you sure you want to rotate the encryption key? ensure you have a backup.")) return;
        try {
            await axios.post("/api/admin/privacy/key/rotate");
            alert("Encryption key rotated successfully.");
        } catch (error) {
            console.error("Failed to rotate key", error);
            alert("Failed to rotate key.");
        }
    };

    return (
        <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-sm">
            <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Privacy & Security</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">Manage data protection and retention policies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* PII Scrubbing */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/20">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                            <Eye className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-200">PII Scrubbing</h4>
                            <p className="text-sm text-gray-500">Automatically redact emails and phone numbers from inputs.</p>
                        </div>
                    </div>
                    <div
                        className={cn(
                            "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300",
                            piiEnabled ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
                        )}
                        onClick={togglePii}
                    >
                        <div className={cn(
                            "w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300",
                            piiEnabled ? "translate-x-6" : "translate-x-0"
                        )} />
                    </div>
                </div>

                {/* Key Rotation */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/20">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-yellow-500/10 text-yellow-600 rounded-lg">
                            <Key className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-200">Encryption Key Rotation</h4>
                            <p className="text-sm text-gray-500">Rotate the database encryption key. (Advanced)</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={rotateKey} className="gap-2">
                        <RefreshCw className="h-4 w-4" /> Rotate
                    </Button>
                </div>

                {/* History Limit */}
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Chat History Retention</label>
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {settings.historyLimit === 0 ? "Unlimited" : `${settings.historyLimit} messages`}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1000"
                        step="10"
                        className="w-full"
                        value={settings.historyLimit}
                        onChange={(e) => setSettings({ ...settings, historyLimit: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-gray-500">Set to 0 for unlimited history. Older messages will be auto-archived/deleted.</p>
                </div>

            </CardContent>
        </Card>
    );
}
