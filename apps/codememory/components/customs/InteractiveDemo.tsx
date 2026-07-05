"use client"

import * as React from "react"
import { Disc, FileCode2, MessagesSquare, Play, Send } from "lucide-react"

const DEMO_FILES = [
  {
    name: "user-profile.tsx",
    path: "components/customs/user-profile.tsx",
    additions: 12,
    deletions: 4,
    diff: [
      { type: "header", text: "@@ -58,6 +58,14 @@ export function UserProfile() {" },
      { type: "normal", text: "            <SidebarMenuButton" },
      { type: "deletion", text: "-              className=\"bg-gray-50 hover:bg-gray-200\"" },
      { type: "addition", text: "+              className=\"border-zinc-800 bg-zinc-900/50 text-white hover:bg-zinc-800\"" },
      { type: "normal", text: "            >" },
      { type: "addition", text: "+                  <span className=\"text-white font-medium\">Piyush Mudgal</span>" },
    ]
  },
  {
    name: "main.py",
    path: "cognee-setup/main.py",
    additions: 8,
    deletions: 2,
    diff: [
      { type: "header", text: "@@ -24,4 +24,10 @@ def sync_data():" },
      { type: "normal", text: "    cognee.add(documents)" },
      { type: "deletion", text: "-   cognee.cognitize()" },
      { type: "addition", text: "+   # Run Cognee index framework utilizing Gemini" },
      { type: "addition", text: "+   await cognee.cognitize()" },
    ]
  }
]

const DEMO_CHAT_MESSAGES = [
  {
    q: "How does Cognee store the commits?",
    a: "Cognee maps commits as nodes linked to modified files. It indexes the patch content using Gemini vector embeddings and builds a queryable semantic dependency graph."
  },
  {
    q: "Show me the diff of the sidebar profile card",
    a: "Sure! In `user-profile.tsx`, standard gray backgrounds (`bg-gray-50`) were replaced with dark, high-contrast zinc parameters (`bg-zinc-900/50`) to fix white-on-white text contrast issues."
  }
]

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = React.useState<"diff" | "chat">("diff")
  const [selectedFileIdx, setSelectedFileIdx] = React.useState(0)
  const [chatInput, setChatInput] = React.useState("")
  const [messages, setMessages] = React.useState<Array<{ role: "user" | "assistant", content: string }>>([
    { role: "assistant", content: "Ask me anything about this repository's commits and changes." }
  ])
  const [isTyping, setIsTyping] = React.useState(false)

  const selectedFile = DEMO_FILES[selectedFileIdx]

  function handleSendChat(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const query = chatInput.trim()
    if (!query) return

    const newMessages = [...messages, { role: "user" as const, content: query }]
    setMessages(newMessages)
    setChatInput("")
    setIsTyping(true)

    // Find custom answer or default reply
    const match = DEMO_CHAT_MESSAGES.find(m => m.q.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes(m.q.toLowerCase()))
    const replyText = match ? match.a : "Using Cognee memory, I scanned the commit patch and found matching dependencies on recent repository changes."

    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", content: replyText }])
      setIsTyping(false)
    }, 1200)
  }

  function handleQuickQuestion(q: string) {
    setChatInput(q)
  }

  return (
    <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr] min-h-[420px] bg-zinc-900/30">
      
      {/* Left panel - File explorer & selectors */}
      <div className="border-b border-white/5 bg-zinc-950/40 p-4 lg:border-b-0 lg:border-r">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Workspace Index</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 block px-2 uppercase font-mono tracking-wider">Changes</span>
            {DEMO_FILES.map((file, idx) => (
              <button
                key={file.name}
                onClick={() => {
                  setSelectedFileIdx(idx)
                  setActiveTab("diff")
                }}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-colors text-left cursor-pointer ${
                  selectedFileIdx === idx && activeTab === "diff"
                    ? "bg-[#BC9BFF]/10 text-white border border-[#BC9BFF]/20"
                    : "border border-transparent text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode2 className="h-4 w-4 shrink-0 text-zinc-500" />
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono font-medium">
                  <span className="text-emerald-450">+{file.additions}</span>
                  <span className="text-rose-455">-{file.deletions}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-white/5">
            <span className="text-[11px] font-semibold text-zinc-400 block px-2 uppercase font-mono tracking-wider">AI Assistant</span>
            <button
              onClick={() => setActiveTab("chat")}
              className={`w-full mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs transition-colors text-left cursor-pointer ${
                activeTab === "chat"
                  ? "bg-[#BC9BFF]/10 text-white border border-[#BC9BFF]/20"
                  : "border border-transparent text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
              }`}
            >
              <MessagesSquare className="h-4 w-4 text-zinc-500" />
              <span>Ask Cognee Graph</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right panel - Viewport */}
      <div className="flex flex-col min-h-0">
        
        {/* Viewport header tabs */}
        <div className="flex items-center justify-between border-b border-white/5 bg-zinc-950/20 px-4 py-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("diff")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === "diff" ? "text-white bg-zinc-800" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Code Diff
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === "chat" ? "text-white bg-zinc-800" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              AI Chat
            </button>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            {activeTab === "diff" ? selectedFile.path : "Cognee recall"}
          </span>
        </div>

        {/* Viewport body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {activeTab === "diff" ? (
            <div className="rounded-xl border border-white/5 bg-black p-3 font-mono text-[11px] leading-5 overflow-x-auto h-full">
              {selectedFile.diff.map((line, idx) => {
                let colorClass = "text-zinc-400"
                if (line.type === "addition") colorClass = "bg-emerald-950/30 text-emerald-450 px-1 rounded-sm"
                if (line.type === "deletion") colorClass = "bg-rose-955/20 text-rose-450 px-1 rounded-sm"
                if (line.type === "header") colorClass = "text-[#BC9BFF] font-semibold"

                return (
                  <div key={idx} className={colorClass}>
                    {line.text}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs max-h-[220px]">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] rounded-2xl px-3 py-2 ${
                      msg.role === "user"
                        ? "bg-[#BC9BFF]/10 text-white border border-[#BC9BFF]/25 self-end"
                        : "bg-zinc-950/45 text-zinc-300 border border-white/5 self-start"
                    }`}
                  >
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-0.5">
                      {msg.role === "user" ? "Developer" : "AI Agent"}
                    </span>
                    <p className="leading-5">{msg.content}</p>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-1.5 bg-zinc-950/45 text-zinc-300 border border-white/5 rounded-2xl px-3 py-2 self-start w-fit">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                {DEMO_CHAT_MESSAGES.map((msg, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(msg.q)}
                    className="rounded-full border border-white/5 bg-zinc-950/50 px-2.5 py-1 text-[10px] text-zinc-450 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
                  >
                    {msg.q}
                  </button>
                ))}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendChat} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                />
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-zinc-950 hover:bg-zinc-250 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      
    </div>
  )
}
