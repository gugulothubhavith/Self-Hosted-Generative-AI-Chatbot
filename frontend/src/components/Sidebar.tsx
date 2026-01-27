import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import {
  MessageSquarePlus,
  Search,
  Image as ImageIcon,
  Flower2,
  Settings,
  LogOut,
  User as UserIcon,
  PanelLeft,
  MessageSquare,
  Code,
  Briefcase,
  Layers,
  Archive,
  ArchiveRestore,
  Trash2,
  MoreHorizontal,
  Plus,
  Star,
  Info
} from "lucide-react";

// ... [skipping unchanged code] ...


import { cn } from "../lib/utils";
import { Button } from "./ui/Button";

interface ChatSession {
  id: string;
  title: string;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export default function Sidebar() {
  const { logout, user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId: currentSessionId } = useParams<{ sessionId?: string }>();

  // Layout State
  const [isExpanded, setIsExpanded] = useState(false);

  // Data State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Menus & Workspaces
  const [showArchived, setShowArchived] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [workspace, setWorkspace] = useState<"personal" | "work" | "dev">(() => {
    return (localStorage.getItem("activeWorkspace") as "personal" | "work" | "dev") || "personal";
  });
  const [persona, setPersona] = useState<"default" | "coder" | "writer">("default");
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  useEffect(() => {
    localStorage.setItem("activeWorkspace", workspace);
  }, [workspace]);

  // --- Effects & Data Loading ---

  useEffect(() => {
    const handleClickOutside = () => {
      setShowProfileMenu(false);
      setShowWorkspaceMenu(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const loadSessions = async () => {
    if (!token) return;
    try {
      const res = await axios.get("/api/chat/sessions", {
        headers: { Authorization: `Bearer ${token}` },
        params: { workspace }
      });
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to load sessions", err);
    }
  };

  const handleArchiveSession = async (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await axios.patch(`/api/chat/sessions/${session.id}`,
        { is_archived: !session.is_archived },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Optimistic update or reload
      loadSessions();
      if (currentSessionId === session.id) {
        navigate("/");
      }
    } catch (err) {
      console.error("Failed to archive session", err);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this chat? This cannot be undone.")) return;

    try {
      await axios.delete(`/api/chat/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadSessions();
      if (currentSessionId === sessionId) {
        navigate("/");
      }
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [token, location.pathname, workspace]);

  // --- Actions ---

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // --- Navigation Items ---
  const minimalNavItems = [
    { name: "New Chat", path: "/", icon: MessageSquarePlus },
    { name: "Chat", path: "/", icon: MessageSquare },
    { name: "Code Agent", path: "/code", icon: Code },
    { name: "Image Gen", path: "/image", icon: ImageIcon },
    { name: "Snippets", path: "/snippets", icon: Star },
    { name: "Search", path: "/search", icon: Search },
    { name: "About", path: "/about", icon: Info },
  ];

  const fullNavItems = [
    { name: "Chat", path: "/", icon: MessageSquare },
    { name: "Code Agent", path: "/code", icon: Code },
    { name: "Image Gen", path: "/image", icon: ImageIcon },
    { name: "Snippets", path: "/snippets", icon: Star },
    { name: "About", path: "/about", icon: Info },
  ];

  const activeModule = fullNavItems.find(item => item.path !== "/" && location.pathname.startsWith(item.path))?.path || "/";

  // Helper for workspace
  const getWorkspaceDetails = () => {
    switch (workspace) {
      case "work": return { name: "WorkSpace", icon: Briefcase, color: "text-orange-500", bg: "bg-orange-500/10" };
      case "dev": return { name: "DevZone", icon: Code, color: "text-green-500", bg: "bg-green-500/10" };
      default: return { name: "Personal", icon: UserIcon, color: "text-blue-500", bg: "bg-blue-500/10" };
    }
  };
  const ws = getWorkspaceDetails();


  return (
    <div
      className={cn(
        "flex flex-col h-screen transition-all duration-300 z-50 border-r border-gray-100 dark:border-gray-800",
        isExpanded
          ? "w-72 bg-white dark:bg-[#0B1120]"
          : "w-[72px] bg-[#0B1120] items-center py-6"
      )}
    >

      {/* --- MINIMAL MODE HEADER --- */}
      {!isExpanded && (
        <div className="mb-8 flex flex-col items-center gap-6">
          {/* Merged Brand / Toggle Button */}
          <button
            onClick={() => setIsExpanded(true)}
            className="group h-10 w-10 text-white flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors relative"
            title="Expand Menu"
          >
            <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-100 group-hover:opacity-0">
              <Flower2 className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-100">
              <PanelLeft className="h-6 w-6 text-gray-400" strokeWidth={1.5} />
            </div>
          </button>
        </div>
      )}


      {/* --- EXPANDED MODE HEADER --- */}
      {isExpanded && (
        <div className="p-4 flex-shrink-0">
          <div className="flex items-start justify-between mb-4 gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <Flower2 className="h-6 w-6 text-indigo-500 flex-shrink-0" />
              <span className="font-bold text-xs leading-tight dark:text-white break-words">Self Hosted Generative AI Chatbot</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0 mt-0.5"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
          </div>

          {/* Workspace Selector */}
          <div
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors relative"
            onClick={(e) => { e.stopPropagation(); setShowWorkspaceMenu(!showWorkspaceMenu); }}
          >
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm", ws.bg)}>
              <ws.icon className={cn("h-5 w-5", ws.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                {ws.name}
              </h1>
              <p className="text-xs text-gray-500 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
              </p>
            </div>
            <Layers className="h-4 w-4 text-gray-400" />

            {/* Workspace Dropdown */}
            {showWorkspaceMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-2 space-y-1">
                  <button onClick={() => setWorkspace("personal")} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><UserIcon className="h-4 w-4 text-blue-500" /></div>
                    <div className="text-left"><div className="font-medium text-gray-900 dark:text-white">Personal</div><div className="text-[10px] text-gray-500">Private knowledge base</div></div>
                  </button>
                  <button onClick={() => setWorkspace("work")} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center"><Briefcase className="h-4 w-4 text-orange-500" /></div>
                    <div className="text-left"><div className="font-medium text-gray-900 dark:text-white">WorkSpace</div><div className="text-[10px] text-gray-500">Isolated environment</div></div>
                  </button>
                  <button onClick={() => setWorkspace("dev")} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center"><Code className="h-4 w-4 text-green-500" /></div>
                    <div className="text-left"><div className="font-medium text-gray-900 dark:text-white">DevZone</div><div className="text-[10px] text-gray-500">Code-heavy tools</div></div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Persona Switcher */}
          <div className="mt-4 flex bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg">
            {(['default', 'coder', 'writer'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPersona(p)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                  persona === p ? "bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}


      {/* --- CONTENT AREA --- */}

      {/* 1. Minimal Nav (Only visible when collapsed) */}
      {!isExpanded && (
        <nav className="flex-1 flex flex-col gap-4 w-full px-3">
          {minimalNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "h-10 w-10 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "text-white bg-white/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
                title={item.name}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <div className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      )}


      {/* 2. Expanded Nav & History (Only visible when expanded) */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4">
            <nav className="space-y-1 mb-6">
              {fullNavItems.map((item) => {
                const isActive = activeModule === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-indigo-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white text-gray-600 dark:text-gray-400"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-indigo-500")} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <Button
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2 h-9 shadow text-xs font-medium mb-4"
              onClick={() => navigate("/")}
            >
              <Plus className="h-3.5 w-3.5" /> Start New Chat
            </Button>

            <div className="flex items-center justify-between h-6 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">History</h3>
              <div className="flex gap-1">
                <button onClick={() => setShowArchived(!showArchived)} className={cn("p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors", showArchived ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "text-gray-400 hover:text-gray-600")}>
                  <Archive className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={cn("p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors", showSearch ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "text-gray-400 hover:text-gray-600")}
                >
                  <Search className="h-3 w-3" />
                </button>
              </div>
            </div>
            {showSearch && (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="w-full mb-2 bg-transparent text-xs text-gray-900 dark:text-white placeholder-gray-500 outline-none"
                autoFocus
              />
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 px-4 pb-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
            {sessions
              .filter(s => showArchived ? s.is_archived : !s.is_archived)
              .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(session => (
                <div
                  key={session.id}
                  className={cn(
                    "group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all border border-transparent pr-16", // Added padding-right for buttons
                    currentSessionId === session.id
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:hover:text-white"
                  )}
                  onClick={() => navigate(`/${session.id}`)}
                >
                  <MessageSquare className="h-3.5 w-3.5 opacity-70 flex-shrink-0" />
                  <div className="flex-1 truncate text-xs font-medium">
                    {session.title}
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-gradient-to-l from-white via-white to-transparent dark:from-[#151b2b] dark:via-[#151b2b] pl-2">
                    <button
                      onClick={(e) => handleArchiveSession(e, session)}
                      className="p-1 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded"
                      title={session.is_archived ? "Unarchive" : "Archive"}
                    >
                      {session.is_archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* --- FOOTER / PROFILE --- */}
      <div className="mt-auto flex flex-col items-center w-full pb-4 relative bg-inherit">

        {/* Expanded Profile */}
        {isExpanded ? (
          <div
            className="w-full p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors relative"
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileMenu(!showProfileMenu);
            }}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white text-xs overflow-hidden">
                {user?.picture ? (
                  <img src={user.picture} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  user?.email?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.email}</p>
              </div>
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </div>

            {/* Popup Menu */}
            {showProfileMenu && (
              <div className="absolute bottom-full left-2 right-2 mb-2 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-1 z-[100] animate-in fade-in slide-in-from-bottom-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <Settings className="h-4 w-4" /> Settings
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Minimal Profile */
          <div className="relative pt-4 w-full flex justify-center">
            {showProfileMenu && (
              <div className="absolute bottom-12 left-14 w-48 bg-[#1a1f2e] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-bottom-2 min-w-[12rem]">
                <div className="p-3 border-b border-gray-700">
                  <p className="text-sm font-medium text-white truncate px-1">{user?.email}</p>
                </div>
                <div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-left"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu(!showProfileMenu);
              }}
              className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-xs border-2 border-[#0B1120] hover:ring-2 hover:ring-orange-500/50 transition-all overflow-hidden flex-shrink-0"
            >
              {user?.picture ? (
                <img src={user.picture} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                user?.email?.substring(0, 2).toUpperCase() || <UserIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}