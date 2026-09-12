import InterviewMode from "./components/interview/InterviewMode";
import Interviewer from "./components/interview/Interviewer";
import React, { useState, useEffect, useRef } from "react";
import * as Y from "yjs";
import { motion, AnimatePresence } from "motion/react";
import { Stroke, Point, User, ActivityLog } from "./types";

import RoomSelector from "./components/RoomSelector";
import Whiteboard from "./components/Whiteboard";
import CodeEditor from "./components/CodeEditor";
import ActivityLogs from "./components/ActivityLogs";
import Login from "./components/Login";
import Register from "./components/Register";

import {
  Users,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  WifiOff,
  LogOut,
  Sparkles,
  HelpCircle,
  FileCode,
} from "lucide-react";

// Robust Uint8Array to Hex string converters for safe browser transit without Buffer
function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToUint8Array(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);

  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }

  return arr;
}

export default function App() {
  // =========================================================
  // AUTHENTICATION STATE
  // =========================================================

  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("syncspace_token");
  });

  // =========================================================
  // WORKSPACE STATE
  // =========================================================

  const [session, setSession] = useState<{
    roomId: string;
    userName: string;
    userColor: string;
  } | null>(null);

  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [connStatus, setConnStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("disconnected");

  const [copiedLink, setCopiedLink] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showInterviewMode, setShowInterviewMode] = useState(false);
  const [showWorkspaceMode, setShowWorkspaceMode] = useState(false);
  const [showInterviewer, setShowInterviewer] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);

  const currentUserIdRef = useRef<string>(
    Math.random().toString(36).substring(2, 9)
  );

  const yDocRef = useRef<Y.Doc>(new Y.Doc());

  // =========================================================
  // AUTH HANDLERS
  // =========================================================

  const handleAuthSuccess = (authToken: string, user: any) => {
    localStorage.setItem("syncspace_token", authToken);
    localStorage.setItem("syncspace_user", JSON.stringify(user));

    setToken(authToken);

    // Always show Mode Selection after authentication
    setSession(null);
    setShowInterviewMode(false);
    setShowWorkspaceMode(false);
  };

  // =========================================================
  // Detect and join room automatically if URL has a roomId already
  // =========================================================

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");

    if (roomParam) {
      // RoomSelector handles pre-loading the room ID.
      // User just supplies their name.
    }
  }, []);

  // =========================================================
  // Set up WebSocket and CRDT document when session is active
  // =========================================================

  useEffect(() => {
    if (!session) return;

    const { roomId, userName, userColor } = session;
    const userId = currentUserIdRef.current;
    const yDoc = yDocRef.current;

    const connectWebSocket = () => {
      setConnStatus("connecting");

      const wsUrl =
        import.meta.env.VITE_WS_URL ||
        "wss://project-1-syncspace-production.up.railway.app";

      console.log(
        `Connecting to real-time room websocket at ${wsUrl}...`
      );

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnStatus("connected");

        // Handshake join message
        socket.send(
          JSON.stringify({
            type: "join",
            payload: {
              roomId,
              userName,
              userColor,
              userId,
            },
          })
        );

        // Add a local notification log
        addSystemLog(
          `Successfully connected to Room ${roomId} as ${userName}.`
        );
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case "users:list": {
              setActiveUsers(msg.payload.users);
              break;
            }

            case "init:whiteboard": {
              setStrokes(msg.payload.strokes);
              break;
            }

            case "init:code": {
              // Apply Yjs document initialization chunk
              const { update } = msg.payload;

              if (update) {
                const updateBytes = hexToUint8Array(update);
                Y.applyUpdate(yDoc, updateBytes, "remote");
              }

              break;
            }

            case "whiteboard:stroke": {
              const { stroke } = msg.payload;
              setStrokes((prev) => [...prev, stroke]);
              break;
            }

            case "whiteboard:clear": {
              setStrokes([]);
              break;
            }

            case "code:update": {
              // Sync incoming Yjs byte updates
              const { update } = msg.payload;
              const updateBytes = hexToUint8Array(update);

              Y.applyUpdate(yDoc, updateBytes, "remote");
              break;
            }

            case "cursor:move": {
              // Update individual user cursor position inside state
              const {
                userId: remoteUserId,
                cursor,
              } = msg.payload;

              setActiveUsers((prev) =>
                prev.map((user) => {
                  if (user.id === remoteUserId) {
                    return { ...user, cursor };
                  }

                  return user;
                })
              );

              break;
            }

            case "message:recv": {
              const chatLog = msg.payload;
              setLogs((prev) => [...prev, chatLog]);
              break;
            }

            default:
              break;
          }
        } catch (err) {
          console.error("Error parsing incoming message:", err);
        }
      };

      socket.onclose = (event) => {
        setConnStatus("disconnected");

        console.warn(
          "WebSocket closed. Attempting auto-reconnect in 3s...",
          event.reason
        );

        setTimeout(() => {
          if (socketRef.current?.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 3000);
      };

      socket.onerror = (err) => {
        setConnStatus("disconnected");
        console.error("WebSocket connection error:", err);
      };
    };

    connectWebSocket();

    // Observe local edits on Yjs document and broadcast via WebSocket
    const handleYDocUpdate = (
      update: Uint8Array,
      origin: any
    ) => {
      // Guard sync loops: Only send local updates to server
      if (origin === "remote") return;

      const socket = socketRef.current;

      if (
        socket &&
        socket.readyState === WebSocket.OPEN
      ) {
        const updateHex = uint8ArrayToHex(update);

        socket.send(
          JSON.stringify({
            type: "code:update",
            payload: {
              update: updateHex,
            },
          })
        );
      }
    };

    yDoc.on("update", handleYDocUpdate);

    return () => {
      yDoc.off("update", handleYDocUpdate);
      socketRef.current?.close();
    };
  }, [session]);

  // =========================================================
  // SYSTEM LOG
  // =========================================================

  const addSystemLog = (text: string) => {
    const systemLog: ActivityLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      userName: "",
      userColor: "",
      text,
    };

    setLogs((prev) => [...prev, systemLog]);
  };

  // =========================================================
  // 1. Send strokes
  // =========================================================

  const handleSendStroke = (stroke: Stroke) => {
    setStrokes((prev) => [...prev, stroke]);

    const socket = socketRef.current;

    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type: "whiteboard:stroke",
          payload: { stroke },
        })
      );
    }
  };

  // =========================================================
  // 2. Clear Board
  // =========================================================

  const handleClearBoard = () => {
    setStrokes([]);

    const socket = socketRef.current;

    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type: "whiteboard:clear",
        })
      );
    }
  };

  // =========================================================
  // 3. Send cursors
  // =========================================================

  const handleSendCursor = (cursor: any) => {
    const socket = socketRef.current;

    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type: "cursor:move",
          payload: { cursor },
        })
      );
    }
  };

  // =========================================================
  // 4. Send custom messages / activity logs
  // =========================================================

  const handleSendMessage = (text: string) => {
    if (!session) return;

    const socket = socketRef.current;

    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type: "message:send",
          payload: {
            message: text,
            userName: session.userName,
            userColor: session.userColor,
          },
        })
      );
    }
  };

  const handleSendActivityLog = (message: string) => {
    if (!session) return;

    handleSendMessage(`[action] ${message}`);
  };

  // =========================================================
  // Handle URL Room Copy
  // =========================================================

  const handleCopyLink = () => {
    if (!session) return;

    const url = `${window.location.origin}${window.location.pathname}?room=${session.roomId}`;

    navigator.clipboard.writeText(url);

    setCopiedLink(true);

    setTimeout(() => setCopiedLink(false), 2000);
  };

  // =========================================================
  // Handle Leave Room
  // =========================================================

  const handleLeaveRoom = () => {
    if (
      confirm(
        "Are you sure you want to leave this workspace?"
      )
    ) {
      setSession(null);
      setStrokes([]);
      setLogs([]);
      setActiveUsers([]);

      // Reset Yjs doc
      yDocRef.current = new Y.Doc();

      // Remove query param
      window.history.pushState(
        {},
        "",
        window.location.pathname
      );
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      // Remove authentication data
      localStorage.removeItem("syncspace_token");
      localStorage.removeItem("syncspace_user");

      // Clear application state
      setToken(null);
      setSession(null);
      setStrokes([]);
      setLogs([]);
      setActiveUsers([]);

      // Reset Yjs document
      yDocRef.current = new Y.Doc();

      // Remove room query parameter
      window.history.pushState(
        {},
        "",
        window.location.pathname
      );
    }
  };

  // =========================================================
  // ROUTING / SCREEN FLOW
  // =========================================================

  const roomParam = new URLSearchParams(window.location.search).get("room");

  // ---------------------------------------------------------
  // 1. Shared Workspace Link
  // ---------------------------------------------------------
  // If someone opens ?room=ABC123, allow them to join directly.
  // They do NOT need Login/Register.
  if (roomParam && !session) {
    return (
      <RoomSelector
        onJoin={(p) => {
          window.history.pushState(
            {},
            "",
            `?room=${p.roomId}`
          );

          setSession(p);
        }}
      />
    );
  }

  // ---------------------------------------------------------
  // 2. Authentication
  // ---------------------------------------------------------
  // Normal users must login/register first.
  if (!token) {
    if (authMode === "login") {
      return (
        <Login
          onSuccess={handleAuthSuccess}
          onSwitch={() => setAuthMode("register")}
        />
      );
    }

    return (
      <Register
        onSuccess={handleAuthSuccess}
        onSwitch={() => setAuthMode("login")}
      />
    );
  }

  // ---------------------------------------------------------
  // 3. Mode Selection / Workspace / Interview
  // ---------------------------------------------------------

  if (!session) {

    // -------------------------
    // Interviewer Section
    // -------------------------
    if (showInterviewer) {
      return (
        <Interviewer
          token={token}
          onBack={() => {
            setShowInterviewer(false);
            setShowInterviewMode(true);
          }}
        />
      );
    }

    // -------------------------
    // DSA Interview Mode
    // -------------------------
    if (showInterviewMode) {
      return (
        <InterviewMode
          onBack={() => setShowInterviewMode(false)}
          onInterviewer={() => {
            setShowInterviewMode(false);
            setShowInterviewer(true);
          }}
          onCandidate={() => {
            alert("Candidate section coming next.");
          }}
        />
      );
    }

    // -------------------------
    // Workspace Mode
    // -------------------------
    if (showWorkspaceMode) {
      return (
        <RoomSelector
          onJoin={(p) => {
            window.history.pushState(
              {},
              "",
              `?room=${p.roomId}`
            );

            setSession(p);
          }}
        />
      );
    }

    // -------------------------
    // MAIN MODE SELECTION
    // -------------------------
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">

          <div className="text-center mb-8">
            <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-4" />

            <h1 className="text-3xl font-bold text-white">
              Welcome to SyncSpace
            </h1>

            <p className="text-slate-400 mt-2">
              Choose how you want to use SyncSpace
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Workspace Mode */}
            <button
              type="button"
              onClick={() => setShowWorkspaceMode(true)}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-left transition-all"
            >
              <h2 className="text-xl font-bold text-white mb-2">
                Workspace Mode
              </h2>

              <p className="text-sm text-slate-400">
                Collaborate with your team using the
                shared whiteboard and code editor.
              </p>

              <div className="mt-5 text-indigo-400 text-sm font-semibold">
                Open Workspace →
              </div>
            </button>

            {/* DSA Interview Mode */}
            <button
              type="button"
              onClick={() => setShowInterviewMode(true)}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-left transition-all"
            >
              <h2 className="text-xl font-bold text-white mb-2">
                DSA Interview Mode
              </h2>

              <p className="text-sm text-slate-400">
                Conduct technical interviews or join an
                interview as a candidate.
              </p>

              <div className="mt-5 text-emerald-400 text-sm font-semibold">
                Enter Interview Mode →
              </div>
            </button>

          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN WORKSPACE
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans antialiased text-slate-100 selection:bg-indigo-500 selection:text-white overflow-hidden h-screen">

      {/* 1. Universal Top Navigation Bar */}

      <header className="bg-slate-900 border-b border-slate-800 px-5 py-3 shrink-0 flex items-center justify-between select-none shadow-md relative z-20">

        <div className="flex items-center gap-3">

          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>

          <div>
            <h1 className="text-sm font-extrabold tracking-wide text-white">
              SHARED WORKSPACE
            </h1>

            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">

              <span>WORKSPACE ID:</span>

              <span className="text-indigo-400 font-bold bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/30">
                {session.roomId}
              </span>

            </p>
          </div>
        </div>

        {/* Sync Status Info */}

        <div className="hidden md:flex items-center gap-5">

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">

            <span
              className="w-2 h-2 rounded-full bg-slate-400"
              style={{
                backgroundColor: session.userColor,
              }}
            />

            <span>
              Editing as{" "}
              <strong
                style={{
                  color: session.userColor,
                }}
              >
                {session.userName}
              </strong>
            </span>

          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800/80 rounded-full px-3 py-1 text-xs">

            {connStatus === "connected" ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />

                <span className="text-emerald-400 font-bold">
                  LIVE SYNCED
                </span>
              </>
            ) : connStatus === "connecting" ? (
              <>
                <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />

                <span className="text-indigo-400">
                  CONNECTING...
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-500 animate-pulse" />

                <span className="text-rose-400">
                  OFFLINE
                </span>
              </>
            )}

          </div>

        </div>

        {/* Action Panel */}

        <div className="flex items-center gap-2">

          {/* Share Room Button */}

          <button
            id="share-room-btn"
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm border border-slate-700/60"
            title="Copy invitation link to clipboard"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
            )}

            <span>
              {copiedLink
                ? "Link Copied!"
                : "Share Room"}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setShowHowTo(!showHowTo)
            }
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
            title="Help / Guidelines"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-slate-800 mx-1" />

          {/* Leave Workspace Button */}

          {/* Leave Workspace Button */}

          <button
            id="leave-room-btn"
            type="button"
            onClick={handleLeaveRoom}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold"
            title="Leave Workspace"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">
              Leave
            </span>
          </button>

          {/* Logout Button */}

          <button
            id="logout-btn"
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">
              Logout
            </span>
          </button>

        </div>
      </header>

      {/* 2. Help/How-To overlay bar */}

      <AnimatePresence>

        {showHowTo && (
          <motion.div
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            className="bg-slate-900/95 backdrop-blur-md border-b border-indigo-950/80 px-6 py-4 text-xs text-slate-300 relative z-10 overflow-hidden shadow-inner"
          >

            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

              <div className="flex-1 space-y-2">

                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">

                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />

                  <span>
                    How Parallel Sync Works
                  </span>

                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">
                  When multiple people edit code or draw at
                  the same time, we don't lock your screen or
                  overwrite your work. Instead, every keystroke
                  and stroke is broken into small, individual
                  pieces of digital puzzle.
                </p>

                <p className="text-slate-400 leading-relaxed text-[11px]">
                  When these pieces arrive on other screens,
                  our intelligent sync engine automatically
                  stitches them together in the exact same
                  mathematical order. Think of it like a smart
                  highway merge where cars smoothly interlock
                  without any collisions. The result is a fully
                  synced, conflict-free workspace for everyone!
                </p>

                <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-indigo-300/80">

                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

                  <span>
                    Tip: Click "Test Parallel Sync" to open a
                    side-by-side tab and watch it auto-merge live!
                  </span>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowHowTo(false)
                }
                className="py-1.5 px-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-all self-end md:self-center shrink-0"
              >
                Close Guide
              </button>

            </div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* 3. Main Split-Screen Workspace Board Layout */}

      <main className="flex-1 min-h-0 flex flex-col md:flex-row relative">

        {/* Left Panel: Whiteboard Container */}

        <section
          className="flex-1 min-w-0 h-1/2 md:h-full flex flex-col relative"
          aria-label="Interactive Whiteboard"
        >

          <Whiteboard
            strokes={strokes}
            activeUsers={activeUsers}
            currentUserId={currentUserIdRef.current}
            userName={session.userName}
            userColor={session.userColor}
            onSendStroke={handleSendStroke}
            onClearBoard={handleClearBoard}
            onSendCursor={handleSendCursor}
          />

        </section>

        {/* Right Panel: Live Code Editor Container */}

        <section
          className="flex-1 min-w-0 h-1/2 md:h-full flex flex-col relative border-t md:border-t-0 md:border-l border-slate-800"
          aria-label="Collaborative Code Editor"
        >

          <CodeEditor
            yDoc={yDocRef.current}
            activeUsers={activeUsers}
            currentUserId={currentUserIdRef.current}
            userName={session.userName}
            userColor={session.userColor}
            onSendCursor={handleSendCursor}
            onSendActivityLog={handleSendActivityLog}
          />

        </section>

      </main>

      {/* 4. Bottom Section: Live Activity Logs and Message Stream */}

      <footer className="shrink-0 select-none">

        <ActivityLogs
          logs={logs}
          activeUsers={activeUsers}
          onSendMessage={handleSendMessage}
        />

      </footer>

    </div>
  );
}