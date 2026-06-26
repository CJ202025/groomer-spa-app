// src/components/ui/ChatbotWidget.tsx
// Widget de chatbot flotante con árbol de decisiones — RF-24, RF-25 — Fase 8
// Botón flotante en esquina inferior derecha disponible en toda la app
// Árbol: (1) Servicios y precios, (2) Estado de pedido, (3) Cancelar cita, (4) Reclamo
// Opciones 1 y 2 → respuestas automáticas predefinidas
// Opciones 3 y 4 → escalado a humano via /api/support

"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ChevronLeft, Headphones } from "lucide-react";

// ── Tipos del árbol de decisiones ─────────────────────────────────────────────

type MotivoEscalado = "cancelacion_compleja" | "reclamo" | "otro";

interface Message {
  id: string;
  from: "bot" | "user";
  text: string;
  timestamp: Date;
}

interface ChatOption {
  id: string;
  label: string;
  /** Si es true, activa el flujo de escalado a humano */
  escalar?: boolean;
  motivoEscalado?: MotivoEscalado;
  /** Respuesta automática del bot */
  autoRespuesta?: string;
}

// ── Opciones del menú principal ───────────────────────────────────────────────

const OPCIONES_PRINCIPALES: ChatOption[] = [
  {
    id: "servicios",
    label: "💈 Consultar servicios y precios",
    autoRespuesta:
      "Contamos con dos variantes de servicio:\n\n• **Senior**: Barbero con experiencia sólida, precio base desde S/35.\n• **Master**: Barbero experto y especializado, precio base desde S/55.\n\nPuedes explorar el catálogo completo de servicios en nuestra sección de reservas. ¿Hay algo más en lo que te pueda ayudar?",
  },
  {
    id: "estado_pedido",
    label: "📦 Estado de mi pedido",
    autoRespuesta:
      "Puedes revisar el estado actualizado de todos tus pedidos en tu **Panel de Usuario → Mis Pedidos**.\n\nEstados posibles:\n• **Confirmado**: Pedido recibido y pago procesado.\n• **En Preparación**: Nuestro equipo está preparando tu envío.\n• **Completado**: Pedido entregado.\n\nSi tienes un problema específico con tu pedido, selecciona la opción de Reclamos.",
  },
  {
    id: "cancelar_cita",
    label: "✂️ Cancelar una cita",
    escalar: true,
    motivoEscalado: "cancelacion_compleja",
    autoRespuesta:
      "Para cancelaciones complejas te conectaremos con un agente. Por favor cuéntanos el motivo de tu cancelación:",
  },
  {
    id: "reclamo",
    label: "🚨 Reclamo u otro problema",
    escalar: true,
    motivoEscalado: "reclamo",
    autoRespuesta:
      "Lamentamos que hayas tenido un inconveniente. Para ayudarte mejor, un agente revisará tu caso. Por favor descríbenos el problema:",
  },
];

// ── Componente principal ──────────────────────────────────────────────────────

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [fase, setFase] = useState<"menu" | "respondiendo" | "escalando" | "finalizado">("menu");
  const [opcionActiva, setOpcionActiva] = useState<ChatOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus en el input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, fase]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function addMessage(from: "bot" | "user", text: string) {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), from, text, timestamp: new Date() },
    ]);
  }

  function abrirChat() {
    if (!isOpen && messages.length === 0) {
      // Mensaje inicial de bienvenida
      setTimeout(() => {
        addMessage(
          "bot",
          "👋 ¡Hola! Soy el asistente de **Groomer SPA**. ¿En qué te puedo ayudar hoy?"
        );
      }, 300);
    }
    setIsOpen(true);
  }

  function cerrarChat() {
    setIsOpen(false);
  }

  function resetearMenu() {
    setFase("menu");
    setOpcionActiva(null);
    setInputValue("");
    addMessage("bot", "¿Hay algo más en lo que te pueda ayudar? 😊");
  }

  // ── Selección de opción del árbol ─────────────────────────────────────────

  function seleccionarOpcion(opcion: ChatOption) {
    setOpcionActiva(opcion);
    addMessage("user", opcion.label);

    setTimeout(() => {
      addMessage("bot", opcion.autoRespuesta ?? "Un momento...");

      if (opcion.escalar) {
        setFase("escalando");
      } else {
        setFase("respondiendo");
      }
    }, 600);
  }

  // ── Envío de mensaje del usuario ──────────────────────────────────────────

  async function enviarMensaje() {
    const texto = inputValue.trim();
    if (!texto || isLoading) return;

    setInputValue("");
    addMessage("user", texto);

    if (fase === "escalando" && opcionActiva?.motivoEscalado) {
      // Escalar a humano via /api/support
      setIsLoading(true);
      addMessage("bot", "⏳ Registrando tu solicitud...");

      try {
        const res = await fetch("/api/support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            motivo: opcionActiva.motivoEscalado,
            mensaje: texto,
          }),
        });

        if (res.ok) {
          addMessage(
            "bot",
            "✅ Tu solicitud fue enviada exitosamente. Un agente de Groomer SPA se pondrá en contacto contigo muy pronto.\n\n¿Prefieres contactarnos de inmediato por WhatsApp?"
          );
          setFase("finalizado");
        } else {
          addMessage(
            "bot",
            "😥 Hubo un problema al enviar tu solicitud. Por favor contáctanos directamente por WhatsApp."
          );
          setFase("finalizado");
        }
      } catch {
        addMessage(
          "bot",
          "😥 No pudimos procesar tu solicitud. Por favor contáctanos por WhatsApp."
        );
        setFase("finalizado");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Respuesta genérica cuando el usuario escribe algo fuera del árbol
      setTimeout(() => {
        addMessage(
          "bot",
          "Gracias por tu mensaje. Si tienes una consulta específica, por favor selecciona una de las opciones del menú para ayudarte mejor. 😊"
        );
        setFase("menu");
      }, 700);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  }

  // ── Renderizado de mensajes con markdown básico ───────────────────────────

  function renderTexto(texto: string) {
    return texto
      .split("\n")
      .map((linea, i) => {
        // Negritas: **texto**
        const conNegritas = linea.replace(
          /\*\*(.+?)\*\*/g,
          "<strong>$1</strong>"
        );
        return (
          <span key={i} dangerouslySetInnerHTML={{ __html: conNegritas }} />
        );
      })
      .reduce<React.ReactNode[]>((acc, el, i) => {
        if (i === 0) return [el];
        return [...acc, <br key={`br-${i}`} />, el];
      }, []);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const WHATSAPP_URL =
    process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "https://wa.me/51999999999";

  return (
    <>
      {/* ── Botón flotante ─────────────────────────────────────────── */}
      <button
        id="chatbot-toggle-btn"
        onClick={isOpen ? cerrarChat : abrirChat}
        aria-label={isOpen ? "Cerrar chat de soporte" : "Abrir chat de soporte"}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                   bg-indigo-600 hover:bg-indigo-700 active:scale-95
                   flex items-center justify-center shadow-lg
                   transition-all duration-200 ease-in-out"
        style={{ boxShadow: "0 4px 20px rgba(99,102,241,0.5)" }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* ── Panel del chat ─────────────────────────────────────────── */}
      {isOpen && (
        <div
          id="chatbot-panel"
          role="dialog"
          aria-label="Chat de soporte Groomer SPA"
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96
                     bg-white rounded-2xl shadow-2xl
                     flex flex-col overflow-hidden
                     border border-slate-200"
          style={{ maxHeight: "520px", height: "520px" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-800 to-indigo-600 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-none">
                Groomer SPA — Soporte
              </p>
              <p className="text-indigo-200 text-xs mt-0.5">
                Respuesta inmediata
              </p>
            </div>
            <button
              onClick={cerrarChat}
              aria-label="Cerrar chat"
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed
                    ${
                      msg.from === "user"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-sm"
                    }`}
                >
                  {renderTexto(msg.text)}
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Árbol de opciones (menú) */}
          {fase === "menu" && messages.length > 0 && (
            <div className="border-t border-slate-100 bg-white p-3 space-y-2">
              <p className="text-xs text-slate-500 font-medium px-1">
                Selecciona una opción:
              </p>
              {OPCIONES_PRINCIPALES.map((opcion) => (
                <button
                  key={opcion.id}
                  id={`chatbot-opcion-${opcion.id}`}
                  onClick={() => seleccionarOpcion(opcion)}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm
                             bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700
                             border border-slate-200 hover:border-indigo-300
                             transition-all duration-150 font-medium"
                >
                  {opcion.label}
                </button>
              ))}
            </div>
          )}

          {/* Volver al menú (después de respuesta automática) */}
          {fase === "respondiendo" && (
            <div className="border-t border-slate-100 bg-white p-3">
              <button
                id="chatbot-volver-btn"
                onClick={resetearMenu}
                className="w-full flex items-center justify-center gap-2
                           px-3 py-2 rounded-xl text-sm font-medium
                           bg-indigo-50 text-indigo-700 hover:bg-indigo-100
                           border border-indigo-200 transition-all duration-150"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver al menú
              </button>
            </div>
          )}

          {/* Input de texto (escalado o ingreso libre) */}
          {fase === "escalando" && (
            <div className="border-t border-slate-100 bg-white p-3 flex gap-2">
              <input
                ref={inputRef}
                id="chatbot-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe tu situación..."
                disabled={isLoading}
                className="flex-1 text-sm bg-slate-50 border border-slate-200
                           rounded-xl px-3 py-2 outline-none
                           focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
                           placeholder:text-slate-400 disabled:opacity-50"
              />
              <button
                id="chatbot-enviar-btn"
                onClick={enviarMensaje}
                disabled={!inputValue.trim() || isLoading}
                aria-label="Enviar mensaje"
                className="w-9 h-9 rounded-xl bg-indigo-600 text-white
                           flex items-center justify-center
                           hover:bg-indigo-700 disabled:opacity-40
                           transition-colors duration-150"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Finalizado — botones de contacto directo */}
          {fase === "finalizado" && (
            <div className="border-t border-slate-100 bg-white p-3 space-y-2">
              <a
                id="chatbot-whatsapp-btn"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2
                           px-3 py-2 rounded-xl text-sm font-semibold
                           bg-green-500 hover:bg-green-600 text-white
                           transition-colors duration-150"
              >
                💬 Contactar por WhatsApp
              </a>
              <button
                id="chatbot-nueva-consulta-btn"
                onClick={() => {
                  setFase("menu");
                  setOpcionActiva(null);
                  addMessage("bot", "¿Tienes alguna otra consulta? 😊");
                }}
                className="w-full flex items-center justify-center gap-2
                           px-3 py-2 rounded-xl text-sm font-medium
                           bg-slate-100 hover:bg-slate-200 text-slate-700
                           transition-colors duration-150"
              >
                <ChevronLeft className="w-4 h-4" />
                Nueva consulta
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
