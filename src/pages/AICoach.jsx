import { useState, useEffect, useRef } from 'react';
import { useActivitiesContext } from '../contexts/ActivitiesContext';
import { aiService } from '../services/ai.service';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Send, Bot, User, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';

export const AICoach = () => {
  const { activities, loading: loadingActivities, fetchActivities } = useActivitiesContext();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu **JNSIX AI Coach**. Estoy conectado a tu historial deportivo reciente de la plataforma.\n\n¿En qué te gustaría enfocar el análisis de hoy? Puedes preguntarme sobre tu nivel de fatiga actual, la progresión del volumen semanal, consejos para mejorar el ritmo de carrera o pautas de recuperación específicas.'
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);

  const suggestions = [
    { text: '¿Cómo está mi fatiga actual?', prompt: '¿Cuál es mi nivel de fatiga actual según mis actividades recientes y qué me recomiendas?' },
    { text: 'Análisis de última semana', prompt: 'Haz un resumen detallado de mi volumen de entrenamiento, intensidad y rendimiento físico en la última semana.' },
    { text: 'Consejos de recuperación', prompt: 'Dadas mis últimas sesiones de entrenamiento, ¿qué protocolo de recuperación y nutrición me aconsejas implementar hoy?' },
    { text: 'Cómo mejorar mi ritmo', prompt: 'Revisa mis entrenamientos y dime qué tipo de intervalos o series debería incorporar para mejorar mi velocidad y ritmo en carrera.' }
  ];

  useEffect(() => {
    // Solo fetch si no hay actividades cargadas
    if (activities.length === 0 && !loadingActivities) {
      fetchActivities(1, 50);
    }
  }, [activities.length, loadingActivities, fetchActivities]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSendMessage = async (textToSend) => {
    const userMessage = textToSend.trim();
    if (!userMessage) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setSending(true);

    try {
      // Formatear mensajes para la API (roles: user, assistant)
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const data = await aiService.chatWithCoach(apiMessages);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }]);
    } catch (error) {
      console.error('Error talking to AI coach:', error);
      toast.error('Error al conectar con el Coach IA. Inténtalo de nuevo.');
      
      // Mostrar mensaje de error en el chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ *Lo siento, ocurrió un error al procesar tu solicitud. Por favor comprueba tu conexión y vuelve a intentarlo.*'
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const clearChat = () => {
    if (window.confirm('¿Quieres reiniciar la conversación con tu coach?')) {
      setMessages([
        {
          role: 'assistant',
          content: '¡Hola de nuevo! Conversación reiniciada. ¿Qué consultas tienes sobre tu volumen, fatiga o rendimiento hoy?'
        }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-100px)] animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-primary">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              COACH IA DEPORTIVO
            </h1>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-lime opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-lime"></span>
            </span>
          </div>
          <p className="text-text-secondary text-xs font-mono uppercase mt-0.5">
            JNSIX Assistant - Groq Llama 3 70B
          </p>
        </div>
        <button
          onClick={clearChat}
          className="p-2 bg-panel-bg-solid border border-border-primary hover:border-accent-cyan transition-all rounded-lg text-text-secondary hover:text-accent-cyan"
          title="Reiniciar chat"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Main Chat Panel Container */}
      <div className="flex-1 flex flex-col min-h-0 bg-panel-bg-solid border border-border-primary rounded-xl overflow-hidden relative">
        
        {/* Messages Feed Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {messages.map((m, idx) => {
            const isCoach = m.role === 'assistant';
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${isCoach ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
                  isCoach 
                    ? 'bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan' 
                    : 'bg-accent-lime/10 border-accent-lime/20 text-accent-lime'
                }`}>
                  {isCoach ? <Bot size={16} /> : <User size={16} />}
                </div>

                {/* Message Bubble */}
                <div className={`p-3 rounded-xl text-sm leading-relaxed border ${
                  isCoach 
                    ? 'bg-panel-bg border-border-primary text-text-primary' 
                    : 'bg-[#1e2e38] border-accent-cyan/20 text-[#e2f3fc] shadow-[0_0_15px_rgba(0,212,255,0.05)]'
                }`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="text-xs sm:text-sm text-text-secondary inline-block">{children}</li>,
                      strong: ({ children }) => <strong className="text-accent-cyan font-semibold">{children}</strong>,
                      code: ({ children }) => <code className="bg-panel-bg-solid px-1.5 py-0.5 rounded text-xs text-accent-lime font-mono">{children}</code>,
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            );
          })}

          {/* Typing state */}
          {sending && (
            <div className="flex gap-3 max-w-[75%] mr-auto items-center">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan">
                <Bot size={16} />
              </div>
              <div className="bg-panel-bg border border-border-primary p-3 rounded-xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips - Touch optimized for Mobile */}
        <div className="px-3 sm:px-4 py-2 border-t border-border-secondary bg-panel-bg flex gap-2 overflow-x-auto scrollbar-none whitespace-nowrap">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              disabled={sending}
              onClick={() => handleSendMessage(s.prompt)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-medium rounded-full bg-panel-bg-solid border border-border-primary hover:border-accent-cyan text-text-secondary hover:text-text-primary transition-all active:scale-95 whitespace-nowrap"
            >
              <Sparkles size={11} className="text-accent-cyan" />
              {s.text}
            </button>
          ))}
        </div>

        {/* Bottom Input Area - Fixed at bottom */}
        <form onSubmit={handleFormSubmit} className="p-3 border-t border-border-primary bg-panel-bg-solid flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            placeholder="Pregúntale a tu JNSIX AI Coach..."
            className="flex-1 bg-panel-bg border border-border-primary focus:border-accent-cyan rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none placeholder-text-muted"
          />
          <Button
            type="submit"
            disabled={sending || !input.trim()}
            className="p-2 sm:px-4 flex items-center justify-center"
          >
            <Send size={15} className="sm:mr-1.5" />
            <span className="hidden sm:inline">ENVIAR</span>
          </Button>
        </form>

      </div>
    </div>
  );
};
