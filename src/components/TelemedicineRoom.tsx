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

  const clientIdRef = useRef<string>(`client-${Math.random().toString(36).substring(2, 9)}`);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const processedSignalIdsRef = useRef<Set<string>>(new Set());
  const processedChatIdsRef = useRef<Set<string>>(new Set());

  const localVideoRefs = useRef<Set<HTMLVideoElement>>(new Set());
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Helper to bind media stream to a local video element
  const registerLocalVideo = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      localVideoRefs.current.add(node);
      if (mediaStreamRef.current) {
        if (node.srcObject !== mediaStreamRef.current) {
          node.srcObject = mediaStreamRef.current;
        }
        node.play().catch(() => {});
      }
    }
  }, []);

  // Helper to bind remote video element
  const registerRemoteVideo = useCallback((node: HTMLVideoElement | null) => {
    remoteVideoRef.current = node;
    if (node) {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }
      node.srcObject = remoteStreamRef.current;
      node.play().catch(() => {});
    }
  }, []);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatOpen]);

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
          video.play().catch(() => {});
        });

        // Add tracks to existing PeerConnection if initialized before media stream
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          stream.getTracks().forEach((track) => {
            const alreadyAdded = senders.some((s) => s.track === track);
            if (!alreadyAdded) {
              peerConnectionRef.current?.addTrack(track, stream);
            }
          });
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // WebRTC & Supabase Realtime + BroadcastChannel Setup
  useEffect(() => {
    const roomKey = appointment.id.replace(/[^a-zA-Z0-9_-]/g, "_");
    const channelName = `telemed-${roomKey}`;

    // 1. Supabase Realtime Channel
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    // 2. Browser Local BroadcastChannel (Cross-tab instant sync)
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel(channelName);
      broadcastChannelRef.current = bc;
    }

    const drainIceCandidates = async (pc: RTCPeerConnection) => {
      while (iceCandidatesQueueRef.current.length > 0) {
        const candidate = iceCandidatesQueueRef.current.shift();
        if (candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.warn("Error adding queued ICE candidate:", err);
          }
        }
      }
    };

    const sendSignalMessage = (signalPayload: any) => {
      const signalMsg = {
        ...signalPayload,
        senderClientId: clientIdRef.current,
        senderRole: currentUserRole,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      };
      processedSignalIdsRef.current.add(signalMsg.id);

      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "signal",
          payload: signalMsg,
        });
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          event: "signal",
          payload: signalMsg,
        });
      }
    };

    const createPeerConnection = () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" }
        ],
      });

      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }

      // Add local tracks to peer connection if available
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, mediaStreamRef.current!);
        });
      }

      // Handle local ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalMessage({
            type: "candidate",
            candidate: event.candidate,
          });
        }
      };

      // Handle remote incoming tracks
      pc.ontrack = (event) => {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach((track) => {
            if (!remoteStreamRef.current?.getTracks().includes(track)) {
              remoteStreamRef.current?.addTrack(track);
            }
          });
        } else if (event.track) {
          if (!remoteStreamRef.current.getTracks().includes(event.track)) {
            remoteStreamRef.current.addTrack(event.track);
          }
        }

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          remoteVideoRef.current.play().catch(() => {});
        }
        setRemoteConnected(true);
      };

      const updateConnectionState = () => {
        const state = pc.connectionState;
        const iceState = pc.iceConnectionState;
        if (state === "connected" || iceState === "connected" || iceState === "completed") {
          setRemoteConnected(true);
        } else if (
          state === "disconnected" ||
          state === "failed" ||
          state === "closed" ||
          iceState === "failed" ||
          iceState === "closed"
        ) {
          setRemoteConnected(false);
        }
      };

      pc.onconnectionstatechange = updateConnectionState;
      pc.oniceconnectionstatechange = updateConnectionState;

      peerConnectionRef.current = pc;
      return pc;
    };

    const handleSignalPayload = async (payload: any) => {
      if (!payload || !payload.id || payload.senderClientId === clientIdRef.current) return;
      if (processedSignalIdsRef.current.has(payload.id)) return;
      processedSignalIdsRef.current.add(payload.id);

      let pc = peerConnectionRef.current;
      if (!pc) {
        pc = createPeerConnection();
      }

      try {
        if (payload.type === "offer" && payload.offer) {
          setPeerJoined(true);
          await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
          await drainIceCandidates(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignalMessage({
            type: "answer",
            answer,
          });
        } else if (payload.type === "answer" && payload.answer) {
          setPeerJoined(true);
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          await drainIceCandidates(pc);
        } else if (payload.type === "candidate" && payload.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else {
            iceCandidatesQueueRef.current.push(payload.candidate);
          }
        } else if (payload.type === "peer-joined" || payload.type === "request-offer") {
          setPeerJoined(true);
          // High client ID or DOCTOR role initiates offer
          const shouldOffer = currentUserRole === "DOCTOR" || clientIdRef.current > payload.senderClientId;
          if (shouldOffer) {
            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
            await pc.setLocalDescription(offer);
            sendSignalMessage({
              type: "offer",
              offer,
            });
          } else {
            sendSignalMessage({
              type: "request-offer",
            });
          }
        }
      } catch (err) {
        console.error("Error handling WebRTC signal:", err);
      }
    };

    const handleChatPayload = (payload: any) => {
      if (!payload || !payload.id || payload.senderClientId === clientIdRef.current) return;
      if (processedChatIdsRef.current.has(payload.id)) return;
      processedChatIdsRef.current.add(payload.id);

      setMessages((prev) => [...prev, payload.message]);
    };

    // Attach BroadcastChannel listener
    if (bc) {
      bc.onmessage = (evt) => {
        const { event, payload } = evt.data || {};
        if (event === "signal") handleSignalPayload(payload);
        if (event === "chat") handleChatPayload(payload);
      };
    }

    // Attach Supabase Realtime listeners
    channel
      .on("broadcast", { event: "signal" }, ({ payload }) => handleSignalPayload(payload))
      .on("broadcast", { event: "chat" }, ({ payload }) => handleChatPayload(payload))
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          sendSignalMessage({
            type: "peer-joined",
          });
        }
      });

    // Also announce over local BroadcastChannel immediately
    sendSignalMessage({
      type: "peer-joined",
    });

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [appointment.id, currentUserRole]);

  // Handle joining the call step
  const handleEnterCall = async () => {
    setStep("IN_CALL");

    let pc = peerConnectionRef.current;
    if (!pc) {
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" }
        ],
      });

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          pc?.addTrack(track, mediaStreamRef.current!);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const signalMsg = {
            type: "candidate",
            candidate: event.candidate,
            senderClientId: clientIdRef.current,
            senderRole: currentUserRole,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          };
          processedSignalIdsRef.current.add(signalMsg.id);
          channelRef.current?.send({ type: "broadcast", event: "signal", payload: signalMsg });
          broadcastChannelRef.current?.postMessage({ event: "signal", payload: signalMsg });
        }
      };

      pc.ontrack = (event) => {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach((track) => {
            if (!remoteStreamRef.current?.getTracks().includes(track)) {
              remoteStreamRef.current?.addTrack(track);
            }
          });
        } else if (event.track) {
          if (!remoteStreamRef.current.getTracks().includes(event.track)) {
            remoteStreamRef.current.addTrack(event.track);
          }
        }

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          remoteVideoRef.current.play().catch(() => {});
        }
        setRemoteConnected(true);
      };

      peerConnectionRef.current = pc;
    }

    const joinSignal = {
      type: "peer-joined",
      senderClientId: clientIdRef.current,
      senderRole: currentUserRole,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    processedSignalIdsRef.current.add(joinSignal.id);

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "signal",
        payload: joinSignal,
      });
    }
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        event: "signal",
        payload: joinSignal,
      });
    }

    if (currentUserRole === "DOCTOR") {
      try {
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);

        const offerMsg = {
          type: "offer",
          offer,
          senderClientId: clientIdRef.current,
          senderRole: currentUserRole,
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        processedSignalIdsRef.current.add(offerMsg.id);

        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "signal",
            payload: offerMsg,
          });
        }
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            event: "signal",
            payload: offerMsg,
          });
        }
      } catch (err) {
        console.error("Error creating initial offer:", err);
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

    const msgId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const msgObj = {
      sender: senderName,
      text: inputMsg.trim(),
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, msgObj]);
    setInputMsg("");
    processedChatIdsRef.current.add(msgId);

    const chatPayload = {
      id: msgId,
      senderClientId: clientIdRef.current,
      senderRole: currentUserRole,
      message: msgObj,
    };

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "chat",
        payload: chatPayload,
      });
    }
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        event: "chat",
        payload: chatPayload,
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
                  <div ref={chatEndRef} />
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
