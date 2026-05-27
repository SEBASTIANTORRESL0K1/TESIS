import React, { useState, useEffect } from 'react';
import { 
  Upload, MessageSquare, BookOpen, CheckCircle, AlertCircle, Loader2, Send, 
  FileText, LogIn, UserPlus, LogOut, History, GraduationCap, User, RefreshCw,
  Sun, Moon
} from 'lucide-react';

const API_CONVERTIDOR = "/api/convertidor/convertir";
const API_INGESTA = "/api/chatbot/ingestar";
const API_CONSULTAR = "/api/chatbot/consultar";
const API_LOGIN = "/api/chatbot/auth/login";
const API_REGISTRAR = "/api/chatbot/auth/registrar";
const API_HISTORIAL = "/api/chatbot/preguntas/historial";

function AnaliticaDocente({ token }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAnalisis = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch("/api/chatbot/analisis/dudas", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Error al cargar analítica');
      setData(resData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnalisis();
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
        <p className="text-sm font-semibold text-slate-505 dark:text-slate-400">Analizando consultas de alumnos con Inteligencia Artificial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="inline-flex p-3 bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-900/30">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Error al cargar el panel de analítica</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
        <button
          onClick={fetchAnalisis}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl shadow-lg transition-all"
        >
          Reintentar Carga
        </button>
      </div>
    );
  }

  if (data && data.vacio) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500 rounded-3xl">
          <History className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Aún no hay suficientes datos</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
          {data.message || "Las consultas que realicen los alumnos registrados se agruparán y procesarán en este panel automáticamente para el docente."}
        </p>
        <button
          onClick={fetchAnalisis}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl shadow-lg transition-all flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" /> Actualizar Panel
        </button>
      </div>
    );
  }

  if (!data || !data.analisis) return null;

  const a = data.analisis;

  return (
    <div className="flex-1 space-y-8 animate-in fade-in duration-300 py-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Panel de Analítica y Detección de Dudas</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Información pedagógica obtenida mediante el análisis de las últimas {a.total_analizadas} consultas de tus alumnos.
          </p>
        </div>
        <button
          onClick={fetchAnalisis}
          className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold py-2 px-4 rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Actualizar Datos
        </button>
      </div>

      {/* Fila de Tarjetas Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Consultas Totales */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-3xs uppercase font-extrabold tracking-widest text-slate-450 dark:text-slate-500">Consultas Totales</p>
            <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{a.total_analizadas}</h4>
          </div>
        </div>

        {/* Card 2: Consultas Fuera de Tema (Basura) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${a.basura_porcentaje > 30 ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-3xs uppercase font-extrabold tracking-widest text-slate-450 dark:text-slate-500">Fuera de Tema (Ocio/Basura)</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h4 className="text-2xl font-black text-slate-800 dark:text-white">{a.basura_porcentaje}%</h4>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">de consultas</span>
            </div>
            {/* Barra de progreso */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${a.basura_porcentaje > 30 ? 'bg-red-500' : 'bg-amber-500'}`}
                style={{ width: `${a.basura_porcentaje}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Documento / Tema más dudoso */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-3xs uppercase font-extrabold tracking-widest text-slate-450 dark:text-slate-500">Material de Mayor Duda</p>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-1.5 truncate" title={a.material_dudoso}>
              {a.material_dudoso || 'Ninguno en particular'}
            </h4>
          </div>
        </div>
      </div>

      {/* Sección Doble Columnar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Columna Izquierda: Semáforo de Temas Críticos (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Semáforo de Conceptos Críticos</h3>
          </div>

          <div className="space-y-3.5">
            {(!a.conceptos_criticos || a.conceptos_criticos.length === 0) ? (
              <p className="text-xs text-slate-500 dark:text-slate-550 text-center py-8">No se identificaron conceptos relevantes.</p>
            ) : (
              a.conceptos_criticos.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Indicador de semáforo */}
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      item.nivel === 'alto' ? 'bg-red-500 animate-pulse' :
                      item.nivel === 'medio' ? 'bg-amber-400' :
                      'bg-emerald-450'
                    }`}></span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.concepto}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-3xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.consultas} dudas</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-3xs font-extrabold tracking-wider uppercase border ${
                      item.nivel === 'alto' ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30' :
                      item.nivel === 'medio' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30' :
                      'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30'
                    }`}>
                      {item.nivel}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Columna Derecha: Insights Pedagógicos (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100/50 dark:border-indigo-900/20 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-indigo-100/40 dark:border-indigo-900/30 pb-4">
              <div className="p-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-lg text-white dark:text-slate-900">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Recomendación Pedagógica IA</h3>
            </div>

            <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-350 space-y-3 whitespace-pre-wrap">
              {a.insight_pedagogico}
            </div>
          </div>

          <div className="mt-6 p-3.5 bg-indigo-600 dark:bg-indigo-500 rounded-2xl text-white flex items-center gap-3.5">
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            <div className="text-2xs">
              <span className="font-extrabold uppercase tracking-wider block">Recomendación de Tesis Bot</span>
              <span className="font-medium opacity-90 block mt-0.5">Usa estas sugerencias para iniciar la próxima clase.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function App() {
  // Estado de Autenticación
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  
  // Estado de Modo Oscuro
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  // Estados de Formularios de Auth
  const [authMode, setAuthMode] = useState('login'); // 'login' o 'registrar'
  const [authForm, setAuthForm] = useState({ nombre: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Estados Generales
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  // Estados para el flujo de dos pasos de Ingesta
  const [ingestionStep, setIngestionStep] = useState(1); // 1: Carga/Conversión, 2: Indexación
  const [convertedContent, setConvertedContent] = useState(null);

  // Estados de Historial (Solo Alumnos)
  const [historial, setHistorial] = useState([]);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);
  const [selectedHistorialItem, setSelectedHistorialItem] = useState(null);

  // Efecto para aplicar tema de modo oscuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Efecto para redirigir si el rol cambia y cargar el historial
  useEffect(() => {
    if (user) {
      if (user.role === 'alumno') {
        setActiveTab('chat'); // Forzar chat en alumnos
        fetchHistorial();
      } else {
        setActiveTab('ingestion'); // Docentes/Admins por defecto en Ingesta
      }
    }
  }, [user]);

  // Cargar historial de preguntas desde el backend
  const fetchHistorial = async () => {
    if (!token || (user && user.role !== 'alumno')) return;
    setIsLoadingHistorial(true);
    try {
      const response = await fetch(API_HISTORIAL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistorial(data.historial || []);
      }
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setIsLoadingHistorial(false);
    }
  };

  // Manejar Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      const response = await fetch(API_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email, password: authForm.password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al iniciar sesión');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      
      // Limpiar formulario
      setAuthForm({ nombre: '', email: '', password: '' });
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Manejar Registro (Alumno)
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      const response = await fetch(API_REGISTRAR, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al registrarse');

      // Auto-iniciar sesión después de registrarse con éxito
      const loginResponse = await fetch(API_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email, password: authForm.password })
      });
      const loginData = await loginResponse.json();

      localStorage.setItem('token', loginData.token);
      localStorage.setItem('user', JSON.stringify(loginData.user));
      setToken(loginData.token);
      setUser(loginData.user);

      setAuthForm({ nombre: '', email: '', password: '' });
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Manejar Cierre de Sesión (Logout)
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setMessages([]);
    setHistorial([]);
    setSelectedHistorialItem(null);
  };

  // Fase 1: Convertir PDF a Markdown (Servicio Convertidor - Público)
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

  // Fase 2: Ingestar a ChromaDB (Servicio Chatbot Consulta - Protegido, Docente/Admin)
  const handleIndexFile = async () => {
    if (!convertedContent) return;

    setIsProcessing(true);
    setStatus({ type: 'info', message: 'Fase 2: Indexando en ChromaDB...' });

    try {
      const filename = file.name;
      const response = await fetch(API_INGESTA, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          texto: convertedContent.contenido,
          nombreArchivo: filename
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error en la ingesta');

      setStatus({ type: 'success', message: `✓ Fase 2 completada: ${filename} indexado correctamente.` });
      
      setTimeout(() => {
        setIngestionStep(1);
        setFile(null);
        setConvertedContent(null);
        setStatus({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: `Error al indexar: ${error.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Enviar Pregunta al Chatbot (Protegido - Cualquier Rol, Alumno guarda en DB)
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pregunta: input }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al consultar');

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.respuesta,
        fuentes: data.fuentes 
      }]);

      // Si es alumno, actualizar el historial en segundo plano
      if (user && user.role === 'alumno') {
        fetchHistorial();
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || 'Lo siento, hubo un error al procesar tu pregunta.'}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Cargar una consulta del historial en el chat
  const handleSelectHistorial = (item) => {
    setSelectedHistorialItem(item);
  };

  // Renderizar Login / Registro si no está autenticado
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-100 to-indigo-100 dark:from-indigo-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200 relative">
        {/* Toggle de Tema en Pantalla de Login */}
        <div className="absolute top-6 right-6">
          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Cambiar Tema"
            className="p-2.5 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded-2xl border border-slate-200 dark:border-white/10 transition-all shadow-lg backdrop-blur-md"
          >
            {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
          </button>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex p-4 bg-white dark:bg-white/10 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl shadow-indigo-100 dark:shadow-indigo-500/20">
            <BookOpen className="text-indigo-600 dark:text-indigo-400 w-12 h-12 animate-pulse" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Tesis <span className="text-indigo-600 dark:text-indigo-400">Bot</span></h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">Plataforma Inteligente de Refuerzo Académico</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-white/5 py-8 px-4 shadow-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl sm:px-10 shadow-slate-200/50 dark:shadow-slate-950/50 backdrop-blur-xl transition-all duration-200">
            <div className="flex border-b border-slate-200 dark:border-slate-700/50 pb-4 mb-6">
              <button
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 text-center font-bold text-sm pb-2 transition-all ${authMode === 'login' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white'}`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setAuthMode('registrar'); setAuthError(''); }}
                className={`flex-1 text-center font-bold text-sm pb-2 transition-all ${authMode === 'registrar' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white'}`}
              >
                Registrar Alumno
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-xs font-medium">{authError}</p>
              </div>
            )}

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="mt-1 block w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="ejemplo@tesis.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="mt-1 block w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-550 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-indigo-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAuthLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-5 h-5" /> Ingresar</>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={authForm.nombre}
                    onChange={(e) => setAuthForm({ ...authForm, nombre: e.target.value })}
                    className="mt-1 block w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="mt-1 block w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="alumno@tesis.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="mt-1 block w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-550 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-indigo-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAuthLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5" /> Registrarse</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Renderizar la app completa una vez logueado
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200">
      {/* Header Premium */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-850 px-6 py-4 sticky top-0 z-10 shadow-sm shadow-slate-100/50 dark:shadow-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 dark:bg-indigo-950/50 p-2 rounded-2xl text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-none flex items-center gap-1.5">
                Tesis <span className="text-indigo-600 dark:text-indigo-400">Bot</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Asistente Virtual PSW-DSS</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Navegación según Rol */}
            <nav className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {/* Solo Admin y Docente pueden subir material */}
              {(user.role === 'admin' || user.role === 'docente') && (
                <button 
                  onClick={() => setActiveTab('ingestion')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'ingestion' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                >
                  Cargar Material
                </button>
              )}
              {/* Solo Admin y Docente pueden ver analítica */}
              {(user.role === 'admin' || user.role === 'docente') && (
                <button 
                  onClick={() => setActiveTab('analitica')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'analitica' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                >
                  Panel Analítico
                </button>
              )}
              <button 
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
              >
                Consultar Chatbot
              </button>
            </nav>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

            {/* Selector de Modo Claro/Oscuro */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Activar Modo Claro" : "Activar Modo Oscuro"}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Perfil e Identificación de Rol */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user.nombre}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-extrabold tracking-wider uppercase border mt-0.5 ${
                  user.role === 'admin' ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30' :
                  user.role === 'docente' ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/30' :
                  'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30'
                }`}>
                  {user.role === 'admin' ? 'Administrador' : user.role === 'docente' ? 'Docente' : 'Alumno'}
                </span>
              </div>

              <div className={`p-2 rounded-full border hidden sm:block ${
                user.role === 'admin' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-500' :
                user.role === 'docente' ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/30 text-purple-500' :
                'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30 text-indigo-500'
              }`}>
                {user.role === 'alumno' ? <GraduationCap className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>

              <button
                onClick={handleLogout}
                title="Cerrar Sesión"
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/30 rounded-xl transition-all border border-slate-200 dark:border-slate-700 hover:border-red-100 dark:hover:border-red-900/50"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col">
        
        {activeTab === 'ingestion' && (user.role === 'admin' || user.role === 'docente') ? (
          // Vista Ingestión (Solo disponible para Admin y Docente)
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300 w-full py-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Ingesta de Documentos de Clase</h2>
              <p className="text-slate-500 dark:text-slate-400">Convierte tus guías, reportes o diapositivas PDF e indéxalos en el motor de IA.</p>
            </div>

            {/* Pasos */}
            <div className="flex items-center justify-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${ingestionStep >= 1 ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${ingestionStep >= 1 ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-800'}`}>1</span>
                <span className="text-sm font-semibold">Conversión</span>
              </div>
              <div className="w-8 h-px bg-slate-300 dark:bg-slate-800"></div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${ingestionStep >= 2 ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${ingestionStep >= 2 ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-800'}`}>2</span>
                <span className="text-sm font-semibold">Indexación</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 p-8 space-y-6">
              {ingestionStep === 1 ? (
                <form onSubmit={handleConvertFile} className="space-y-6">
                  <div className="space-y-4">
                    <label className="block">
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer group">
                        <div className="space-y-2 text-center">
                          <Upload className="mx-auto h-12 w-12 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                          <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                            <span className="relative cursor-pointer rounded-md font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                              Subir un archivo
                              <input 
                                type="file" 
                                className="sr-only" 
                                accept=".pdf"
                                onChange={(e) => setFile(e.target.files[0])}
                              />
                            </span>
                            <p className="pl-1">o arrastra y suelta</p>
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Sólo archivos en formato PDF</p>
                        </div>
                      </div>
                    </label>

                    {file && (
                      <div className="flex items-center gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl">
                        <FileText className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 truncate flex-1">{file.name}</span>
                        <button type="button" onClick={() => setFile(null)} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Cambiar</button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!file || isProcessing}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
                  >
                    {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</> : "Paso 1: Convertir PDF a Markdown"}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      Extracción completada con éxito
                    </div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 line-clamp-3 italic">
                      "{convertedContent?.contenido?.substring(0, 200)}..."
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleIndexFile}
                      disabled={isProcessing}
                      className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                      {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando en ChromaDB...</> : "Paso 2: Generar Embeddings e Indexar"}
                    </button>
                    <button
                      onClick={() => setIngestionStep(1)}
                      disabled={isProcessing}
                      className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2.5 px-4 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 text-sm"
                    >
                      Volver y elegir otro archivo
                    </button>
                  </div>
                </div>
              )}

              {status.message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 border ${
                  status.type === 'error' ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30' :
                  status.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30' :
                  'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/30'
                }`}>
                  {status.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : 
                   status.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : 
                   <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />}
                  <p className="text-sm font-semibold">{status.message}</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'analitica' && (user.role === 'admin' || user.role === 'docente') ? (
          <AnaliticaDocente token={token} />
        ) : (
          // Vista Chatbot con Historial
          <div className="flex-1 flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] animate-in fade-in duration-300">
            
            {/* Sección Lateral: Historial de Consultas (Solo Alumnos) */}
            {user.role === 'alumno' && (
              <div className="w-full lg:w-80 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col shadow-sm overflow-hidden flex-shrink-0">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Tus Consultas Guardadas
                  </span>
                  <button 
                    onClick={fetchHistorial}
                    disabled={isLoadingHistorial}
                    title="Actualizar Historial"
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors animate-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistorial ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {isLoadingHistorial && historial.length === 0 ? (
                    <div className="h-40 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                    </div>
                  ) : historial.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-center p-4">
                      <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Aún no tienes preguntas registradas en este curso.</p>
                    </div>
                  ) : (
                    historial.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectHistorial(item)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all text-xs flex flex-col gap-1 ${
                          selectedHistorialItem && selectedHistorialItem.id === item.id 
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50 shadow-sm' 
                            : 'border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-850/50'
                        }`}
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2">{item.pregunta}</span>
                        <span className="text-3xs font-medium text-slate-400 dark:text-slate-500">
                          {new Date(item.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Panel Principal: Chatbot */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden relative">
              
              {/* Modal/Tarjeta Flotante de Detalle de Historial */}
              {selectedHistorialItem && (
                <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-20 flex justify-end transition-all animate-in fade-in">
                  <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Detalle de Consulta Histórica
                      </h3>
                      <button 
                        onClick={() => setSelectedHistorialItem(null)} 
                        className="text-xs bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg font-bold"
                      >
                        Cerrar
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="space-y-2">
                        <span className="text-3xs uppercase font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400">Pregunta realizada:</span>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-50 dark:border-indigo-900/20">{selectedHistorialItem.pregunta}</p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-3xs uppercase font-extrabold tracking-widest text-slate-500 dark:text-slate-400">Respuesta de Tesis Bot:</span>
                        <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                          {selectedHistorialItem.respuesta}
                        </div>
                      </div>

                      {selectedHistorialItem.fuentes && selectedHistorialItem.fuentes.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-3xs uppercase font-extrabold tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> Fuentes de Referencia:
                          </span>
                          <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 pl-2 space-y-1">
                            {selectedHistorialItem.fuentes.map((fuente, i) => (
                              <li key={i} className="font-medium">{fuente}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto my-12">
                    <div className="bg-indigo-50 dark:bg-indigo-950/50 p-4 rounded-3xl text-indigo-600 dark:text-indigo-450 shadow-inner">
                      <MessageSquare className="w-12 h-12" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Haz una consulta al chatbot</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        Consultaré de inmediato las guías docentes, informes y manuales académicos indexados para formular una respuesta.
                      </p>
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white font-medium shadow-indigo-100 dark:shadow-none' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      
                      {msg.fuentes && msg.fuentes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1 text-2xs opacity-85">
                          <span className="font-bold flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> Fuentes consultadas:
                          </span>
                          <ul className="list-disc list-inside pl-1">
                            {msg.fuentes.map((f, idx) => <li key={idx} className="font-medium">{f}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 flex gap-2 border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Haz una pregunta sobre las lecturas académicas..."
                    className="flex-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isProcessing}
                    className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 dark:shadow-none"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
