import React, { useState } from 'react';
import { Upload, MessageSquare, BookOpen, CheckCircle, AlertCircle, Loader2, Send, FileText } from 'lucide-react';

const API_CONVERTIDOR = "/api/convertidor/convertir";
const API_INGESTA = "/api/chatbot/ingestar";
const API_CONSULTAR = "/api/chatbot/consultar";

function App() {
  const [activeTab, setActiveTab] = useState('ingestion');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  // Estados para el flujo de dos pasos
  const [ingestionStep, setIngestionStep] = useState(1); // 1: Carga/Conversión, 2: Indexación
  const [convertedContent, setConvertedContent] = useState(null);

  const handleConvertFile = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsProcessing(true);
    setStatus({ type: 'info', message: 'Fase 1: Convirtiendo PDF a Markdown...' });

    try {
      const formData = new FormData();
      formData.append('archivo', file);

      const response = await fetch(API_CONVERTIDOR, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error en la conversión');
      const data = await response.json();

      setConvertedContent(data);
      setIngestionStep(2);
      setStatus({ type: 'success', message: '✓ Fase 1 completada: Archivo convertido a Markdown.' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Error en la conversión del archivo.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIndexFile = async () => {
    if (!convertedContent) return;

    setIsProcessing(true);
    setStatus({ type: 'info', message: 'Fase 2: Indexando en ChromaDB...' });

    try {
      const filename = file.name;
      const response = await fetch(API_INGESTA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto: convertedContent.contenido,
          nombreArchivo: filename
        }),
      });

      if (!response.ok) throw new Error('Error en la ingesta');

      setStatus({ type: 'success', message: `✓ Fase 2 completada: ${filename} indexado correctamente.` });
      // Resetear después de un éxito completo
      setTimeout(() => {
        setIngestionStep(1);
        setFile(null);
        setConvertedContent(null);
        setStatus({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Error al indexar el documento.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await fetch(API_CONSULTAR, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: input }),
      });

      if (!response.ok) throw new Error('Error al consultar');
      const data = await response.json();

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.respuesta,
        fuentes: data.fuentes 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, hubo un error al procesar tu pregunta.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="text-indigo-600 w-8 h-8" />
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Tesis <span className="text-indigo-600">Bot</span></h1>
          </div>
          <nav className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('ingestion')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'ingestion' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Cargar Material
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Consultar Chatbot
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        {activeTab === 'ingestion' ? (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">Ingesta de Documentos</h2>
              <p className="text-slate-500">Sigue los pasos para alimentar el cerebro de la IA.</p>
            </div>

            {/* Indicador de Pasos */}
            <div className="flex items-center justify-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${ingestionStep >= 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200 shadow-sm'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${ingestionStep >= 1 ? 'bg-indigo-500' : 'bg-slate-100'}`}>1</span>
                <span className="text-sm font-medium">Conversión</span>
              </div>
              <div className="w-8 h-px bg-slate-300"></div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${ingestionStep >= 2 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200 shadow-sm'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${ingestionStep >= 2 ? 'bg-indigo-500' : 'bg-slate-100'}`}>2</span>
                <span className="text-sm font-medium">Indexación</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 space-y-6">
              {ingestionStep === 1 ? (
                <form onSubmit={handleConvertFile} className="space-y-6">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="sr-only">Seleccionar PDF</span>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-indigo-400 transition-colors cursor-pointer group">
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                          <div className="flex text-sm text-slate-600">
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                              <span>Subir un archivo</span>
                              <input 
                                type="file" 
                                className="sr-only" 
                                accept=".pdf"
                                onChange={(e) => setFile(e.target.files[0])}
                              />
                            </label>
                            <p className="pl-1">o arrastra y suelta</p>
                          </div>
                          <p className="text-xs text-slate-500">Sólo archivos PDF</p>
                        </div>
                      </div>
                    </label>

                    {file && (
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                        <FileText className="text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-900 truncate flex-1">{file.name}</span>
                        <button type="button" onClick={() => setFile(null)} className="text-xs text-indigo-600 hover:underline">Cambiar</button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!file || isProcessing}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                  >
                    {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Convirtiendo...</> : "Paso 1: Convertir a Markdown"}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <CheckCircle className="w-5 h-5" />
                      Texto extraído correctamente
                    </div>
                    <p className="text-xs text-emerald-600 line-clamp-3 italic">
                      "{convertedContent?.contenido?.substring(0, 150)}..."
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleIndexFile}
                      disabled={isProcessing}
                      className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                    >
                      {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Indexando...</> : "Paso 2: Subir a ChromaDB"}
                    </button>
                    <button
                      onClick={() => setIngestionStep(1)}
                      disabled={isProcessing}
                      className="w-full bg-slate-100 text-slate-600 py-2 px-4 rounded-xl font-medium hover:bg-slate-200 transition-all disabled:opacity-50"
                    >
                      Volver a Paso 1
                    </button>
                  </div>
                </div>
              )}

              {status.message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                  status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
                  status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                  {status.type === 'error' ? <AlertCircle className="w-5 h-5" /> : 
                   status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : 
                   <Loader2 className="w-5 h-5 animate-spin" />}
                  <p className="text-sm font-medium">{status.message}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-[calc(100vh-10rem)] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto">
                  <div className="bg-indigo-50 p-4 rounded-full text-indigo-600">
                    <MessageSquare className="w-12 h-12" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-800">Pregunta lo que quieras</h3>
                    <p className="text-sm text-slate-500">Consultaré los materiales que has subido para darte la mejor respuesta.</p>
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    {msg.fuentes && msg.fuentes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-1 text-xs opacity-80">
                        <span className="font-bold flex items-center gap-1"><BookOpen className="w-3 h-3" /> Fuentes:</span>
                        <ul className="list-disc list-inside">
                          {msg.fuentes.map((f, idx) => <li key={idx}>{f}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-slate-100 rounded-2xl p-4 flex gap-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu duda académica aquí..."
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
