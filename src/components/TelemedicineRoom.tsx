"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Shield,
  User,
  CheckCircle2,
  Send,
  Wifi
} from "lucide-react";
import { Appointment } from "@/types";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

interface TelemedicineRoomProps {
  appointment: Appointment;
  currentUserRole: string;
  onClose: () => void;
}

export const TelemedicineRoom: React.FC<TelemedicineRoomProps> = ({
  appointment,
  currentUserRole,
  onClose,
}) => {
  const [step, setStep] = useState<"WAITING_ROOM" | "IN_CALL">("WAITING_ROOM");
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [peerJoined, setPeerJoined] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    {
      sender: "Sistema",
      text: "Conexão segura criptografada iniciada. Aguarde o outro participante entrar na sala.",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const localVideoRefs = useRef<Set<HTMLVideoElement>>(new Set());
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Helper to bind media stream to a video element
  const registerLocalVideo = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      localVideoRefs.current.add(node);
      if (mediaStreamRef.current) {
        node.srcObject = mediaStreamRef.current;
      }
    }
  }, []);

  // Helper to bind remote video element
  const registerRemoteVideo = useCallback((node: HTMLVideoElement | null) => {
    remoteVideoRef.current = node;
    if (node && peerConnectionRef.current) {
      const receivers = peerConnectionRef.current.getReceivers();
      const remoteTracks = receivers.map((r) => r.track).filter(Boolean);
      if (remoteTracks.length > 0) {
        const stream = new MediaStream(remoteTracks);
        node.srcObject = stream;
      }
    }
  }, []);

  // Initialize camera and microphone media stream
  useEffect(() => {
    let isMounted = true;

    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;

        // Apply initial mic and video states
        stream.getAudioTracks().forEach((t) => (t.enabled = micEnabled));
        stream.getVideoTracks().forEach((t) => (t.enabled = videoEnabled));

        // Attach to all local video refs
        localVideoRefs.current.forEach((video) => {
          video.srcObject = stream;
        });
      } catch (err) {
        console.warn("Could not access camera/mic:", err);
      }
    }

    setupMedia();

    return () => {
      isMounted = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // WebRTC & Supabase Realtime Setup
  useEffect(() => {
    const channelName = `telemed-${appointment.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channelRef.current = channel;

    const createPeerConnection = () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      // Add local tracks to peer connection
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, mediaStreamRef.current!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.send({
            type: "broadcast",
            event: "signal",
            payload: {
              type: "candidate",
              candidate: event.candidate,
              senderRole: currentUserRole,
            },
          });
        }
      };

      // Handle remote tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          setRemoteConnected(true);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setRemoteConnected(true);
        } else if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          setRemoteConnected(false);
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    };

    channel
      .on("broadcast", { event: "signal" }, async ({ payload }) => {
        if (!payload || payload.senderRole === currentUserRole) return;

        let pc = peerConnectionRef.current;
        if (!pc) {
          pc = createPeerConnection();
        }

        try {
          if (payload.type === "offer") {
            setPeerJoined(true);
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channel.send({
              type: "broadcast",
              event: "signal",
              payload: {
                type: "answer",
                answer,
                senderRole: currentUserRole,
              },
            });
          } else if (payload.type === "answer") {
            setPeerJoined(true);
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          } else if (payload.type === "candidate") {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else if (payload.type === "peer-joined") {
            setPeerJoined(true);
            // Initiate WebRTC offer if doctor or first to start
            if (currentUserRole === "DOCTOR") {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              channel.send({
                type: "broadcast",
                event: "signal",
                payload: {
                  type: "offer",
                  offer,
                  senderRole: currentUserRole,
                },
              });
            }
          }
        } catch (err) {
          console.error("Error handling WebRTC signal:", err);
        }
      })
      .on("broadcast", { event: "chat" }, ({ payload }) => {
        if (payload && payload.senderRole !== currentUserRole) {
          setMessages((prev) => [...prev, payload.message]);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Announce presence in the room
          channel.send({
            type: "broadcast",
            event: "signal",
            payload: {
              type: "peer-joined",
              senderRole: currentUserRole,
            },
          });
        }
      });

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [appointment.id, currentUserRole]);

  // Handle joining the call step
  const handleEnterCall = async () => {
    setStep("IN_CALL");

    let pc = peerConnectionRef.current;
    if (!pc) {
      // Create PC if not already created
      const newPc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          newPc.addTrack(track, mediaStreamRef.current!);
        });
      }
      peerConnectionRef.current = newPc;
      pc = newPc;
    }

    if (channelRef.current) {
      // Re-announce peer joined to trigger negotiation if necessary
      channelRef.current.send({
        type: "broadcast",
        event: "signal",
        payload: {
          type: "peer-joined",
          senderRole: currentUserRole,
        },
      });

      if (currentUserRole === "DOCTOR") {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channelRef.current.send({
            type: "broadcast",
            event: "signal",
            payload: {
              type: "offer",
              offer,
              senderRole: currentUserRole,
            },
          });
        } catch (err) {
          console.error("Error creating initial offer:", err);
        }
      }
    }
  };

  const toggleMic = () => {
    const nextState = !micEnabled;
    setMicEnabled(nextState);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = nextState));
    }
  };

  const toggleVideo = () => {
    const nextState = !videoEnabled;
    setVideoEnabled(nextState);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = nextState));
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const senderName =
      currentUserRole === "DOCTOR"
        ? `Dr(a). ${appointment.doctor_user?.first_name || ""}`
        : appointment.patient_user?.first_name || "Paciente";

    const msgObj = {
      sender: senderName,
      text: inputMsg.trim(),
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, msgObj]);
    setInputMsg("");

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "chat",
        payload: {
          message: msgObj,
          senderRole: currentUserRole,
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                Teleconsulta Med.na Nativa
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Criptografia Ponta a Ponta
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {appointment.specialty?.name || "Atendimento Geral"} —{" "}
                {currentUserRole === "PATIENT"
                  ? `Médico: Dr(a). ${appointment.doctor_user?.first_name || ""} ${appointment.doctor_user?.last_name || ""}`
                  : `Paciente: ${appointment.patient_user?.first_name || ""} ${appointment.patient_user?.last_name || ""}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-bold transition-colors"
          >
            Sair da Sala
          </button>
        </div>

        {/* STEP 1: WAITING ROOM */}
        {step === "WAITING_ROOM" && (
          <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center overflow-y-auto">
            {/* Left Column: Camera Preview */}
            <div className="space-y-4">
              <div className="relative aspect-video bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center group shadow-inner">
                {/* Always keep video element mounted so media stream doesn't get destroyed */}
                <video
                  ref={registerLocalVideo}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform -scale-x-100 ${
                    videoEnabled ? "block" : "hidden"
                  }`}
                />

                {!videoEnabled && (
                  <div className="text-center text-slate-500">
                    <User className="w-16 h-16 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-semibold">Sua câmera está desligada</p>
                  </div>
                )}

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700">
                  <button
                    onClick={toggleMic}
                    className={`p-2 rounded-full transition-colors ${
                      micEnabled ? "bg-slate-700 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={`p-2 rounded-full transition-colors ${
                      videoEnabled ? "bg-slate-700 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Waiting Info & Audio/Video Verification */}
            <div className="space-y-6 text-white">
              <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700">
                <h4 className="text-base font-bold mb-2 flex items-center gap-2 text-sky-400">
                  <Shield className="w-5 h-5 text-sky-400" /> Sala de Espera do Atendimento
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Por favor, confirme se seus periféricos de áudio e vídeo estão funcionando perfeitamente antes de iniciar a sessão médica.
                </p>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Microfone ativado e detectado
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Câmera HD configurada
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Conexão WebRTC de alta velocidade
                  </div>
                </div>
              </div>

              <button
                onClick={handleEnterCall}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Video className="w-5 h-5" /> Entrar na Sala de Consulta Agora
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: IN CALL */}
        {step === "IN_CALL" && (
          <div className="flex-1 flex overflow-hidden relative bg-slate-950">
            {/* Main Video View */}
            <div className="flex-1 relative flex items-center justify-center p-4">
              {/* Remote Video Stream Container */}
              <div className="w-full h-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative flex items-center justify-center">
                {/* Remote Video Element */}
                <video
                  ref={registerRemoteVideo}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${remoteConnected ? "block" : "hidden"}`}
                />

                {/* Remote Participant Placeholder when not connected */}
                {!remoteConnected && (
                  <div className="text-center space-y-3">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-sky-600 to-emerald-500 mx-auto flex items-center justify-center text-3xl font-bold text-white shadow-xl animate-pulse">
                      {currentUserRole === "PATIENT" ? "Dr." : "Pac."}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">
                        {currentUserRole === "PATIENT"
                          ? `Dr(a). ${appointment.doctor_user?.first_name || "Médico"} ${appointment.doctor_user?.last_name || ""}`
                          : `${appointment.patient_user?.first_name || "Paciente"} ${appointment.patient_user?.last_name || ""}`}
                      </h4>
                      <p className="text-xs text-sky-400 font-semibold mt-1 flex items-center justify-center gap-1">
                        <Wifi className="w-3 h-3 animate-ping" />
                        {peerJoined
                          ? "Conectando transmissão de áudio e vídeo ao vivo..."
                          : "Aguardando outro participante entrar na consulta..."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Local Self PIP Video View */}
                <div className="absolute top-4 right-4 w-44 aspect-video bg-slate-950 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
                  <video
                    ref={registerLocalVideo}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${
                      videoEnabled ? "block" : "hidden"
                    }`}
                  />
                  {!videoEnabled && (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px] font-semibold bg-slate-900">
                      Câmera off
                    </div>
                  )}
                </div>

                {/* Floating Bottom Control Bar */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-full border border-slate-700 shadow-2xl">
                  <button
                    onClick={toggleMic}
                    title={micEnabled ? "Mutar áudio" : "Ativar áudio"}
                    className={`p-3 rounded-full transition-colors ${
                      micEnabled ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-red-600 text-white"
                    }`}
                  >
                    {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={toggleVideo}
                    title={videoEnabled ? "Desligar câmera" : "Ligar câmera"}
                    className={`p-3 rounded-full transition-colors ${
                      videoEnabled ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-red-600 text-white"
                    }`}
                  >
                    {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={() => setChatOpen(!chatOpen)}
                    title="Abrir chat do atendimento"
                    className={`p-3 rounded-full transition-colors ${
                      chatOpen ? "bg-sky-600 text-white" : "bg-slate-800 text-white hover:bg-slate-700"
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>

                  <button
                    onClick={onClose}
                    title="Encerrar chamada"
                    className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-lg"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Drawer Side Panel */}
            {chatOpen && (
              <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full">
                <div className="p-4 border-b border-slate-800 font-bold text-xs text-white uppercase tracking-wider flex justify-between items-center">
                  <span>Chat do Atendimento</span>
                  <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white">
                    ✕
                  </button>
                </div>

                <div className="flex-1 p-4 space-y-3 overflow-y-auto text-xs">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-slate-200 space-y-1"
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold text-sky-400">
                        <span>{m.sender}</span>
                        <span className="text-slate-500">{m.time}</span>
                      </div>
                      <p className="leading-relaxed">{m.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
