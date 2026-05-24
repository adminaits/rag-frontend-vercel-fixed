import React, { useEffect, useRef, useState } from "react";
import { Upload, Send, FileText, Bot, User, AlertCircle, CheckCircle2, Server } from "lucide-react";
import { checkBackendHealth, queryKnowledgeBase, uploadDocument } from "./api";

export default function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Welcome. Upload a document, then ask questions from your knowledge base.", sources: [] }
  ]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAsking, setIsAsking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [backendOnline, setBackendOnline] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function runHealthCheck() {
      const online = await checkBackendHealth();
      setBackendOnline(online);
    }
    runHealthCheck();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleUpload() {
    if (!selectedFile) {
      setUploadMessage("Please select a file first.");
      return;
    }

    setIsUploading(true);
    setUploadMessage("");

    try {
      const result = await uploadDocument(selectedFile);
      setUploadMessage(result.message || "File uploaded successfully.");
      setSelectedFile(null);
    } catch (error) {
      setUploadMessage(error.message || "Upload failed. Please check your backend.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAsk() {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || isAsking) return;

    setMessages((previous) => [...previous, { role: "user", content: cleanQuestion, sources: [] }]);
    setQuestion("");
    setIsAsking(true);

    try {
      const result = await queryKnowledgeBase(cleanQuestion);
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: result.answer || "No answer was returned from the backend.",
          sources: Array.isArray(result.sources) ? result.sources : []
        }
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: error.message || "Something went wrong while contacting the backend API.",
          sources: [],
          error: true
        }
      ]);
    } finally {
      setIsAsking(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAsk();
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AITS LLM - RAG Knowledge Assistant</h1>
            <p className="mt-1 text-sm text-slate-500">Upload documents, query your backend, and show retrieved sources.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm">
            <Server size={16} />
            {backendOnline === null && <span>Checking backend...</span>}
            {backendOnline === true && <span className="text-emerald-700">Backend online</span>}
            {backendOnline === false && <span className="text-red-700">Backend offline</span>}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Upload size={20} />
              <h2 className="text-lg font-semibold">Upload Document</h2>
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:bg-slate-100">
              <FileText className="mb-3 text-slate-500" size={32} />
              <span className="text-sm font-medium text-slate-700">{selectedFile ? selectedFile.name : "Choose a file"}</span>
              <span className="mt-1 text-xs text-slate-500">PDF, DOCX, TXT, CSV, and MD supported if your backend supports them</span>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.csv,.md" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
            </label>
            <button onClick={handleUpload} disabled={!selectedFile || isUploading} className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
              {isUploading ? "Uploading..." : "Upload to Knowledge Base"}
            </button>
            {uploadMessage && (
              <div className="mt-4 flex gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                {uploadMessage.toLowerCase().includes("fail") || uploadMessage.toLowerCase().includes("error") ? <AlertCircle size={18} className="shrink-0 text-red-600" /> : <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />}
                <p>{uploadMessage}</p>
              </div>
            )}
          </section>
        </aside>

        <section className="flex h-[76vh] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-8">
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-5">
              {messages.map((message, index) => <ChatMessage key={index} message={message} />)}
              {isAsking && (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white"><Bot size={18} /></div>
                  <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">Thinking...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-slate-200 p-4">
            <div className="flex gap-3">
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={handleKeyDown} placeholder="Ask a question from your uploaded knowledge base..." rows={2} className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200" />
              <button onClick={handleAsk} disabled={!question.trim() || isAsking} className="flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"><Send size={18} />Ask</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white"><Bot size={18} /></div>}
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900"}`}>
        <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>
       // {!isUser && message.sources && message.sources.length > 0 && (
          //<div className="mt-4 border-t border-slate-300 pt-3">
          //  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Sources</p>
          //  <div className="space-y-2">
          //    {message.sources.map((source, index) => (
            //    <div key={index} className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
             //     <p className="font-semibold text-slate-900">{source.title || source.filename || source.documentName || `Source ${index + 1}`}</p>
              //    {source.text && <p className="mt-1 leading-5">{source.text}</p>}
               //   {source.page && <p className="mt-1 text-slate-500">Page: {source.page}</p>}
                 // {source.score !== undefined && <p className="mt-1 text-slate-500">Score: {Number(source.score).toFixed(3)}</p>}
               // </div>
             // ))}
        //    </div>
        //  </div>
     //   )}
      </div>
      {isUser && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700"><User size={18} /></div>}
    </div>
  );
}
