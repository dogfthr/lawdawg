import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Upload, FileText, Clock, AlertTriangle, Search, Edit3, Folder, Send, Plus, X, File, CheckCircle, Loader, Calendar, Hash, Users, Paperclip, ArrowRight, Sparkles, Phone, Mic, Shield, Share2, FolderOpen, UserCheck, Activity, Download, Link, Eye, Check } from 'lucide-react';
import * as THREE from 'three';

const createCircularParticleTexture = () => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  if (!context) {
    return null;
  }

  const center = size / 2;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  return texture;
};

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: Date;
  content?: string;
  analysis?: DocumentAnalysis;
  shared?: boolean;
  sharedWith?: string[];
}

interface DocumentAnalysis {
  summary: string;
  keyPoints: string[];
  parties: string[];
  dates: { event: string; date: string }[];
  risks: string[];
}

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'contract' | 'filing' | 'deadline' | 'meeting' | 'other';
  status?: 'completed' | 'pending' | 'upcoming';
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  documents?: Document[];
  analysis?: any;
  timeline?: TimelineEvent[];
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: Date;
  messages: Message[];
  documents: Document[];
  timeline: TimelineEvent[];
  caseStatus?: 'active' | 'pending' | 'resolved';
  assignedLawyer?: Lawyer;
}

interface Lawyer {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  experience: string;
  available: boolean;
  rate: string;
}

interface CaseUpdate {
  id: string;
  date: Date;
  title: string;
  description: string;
  type: 'document' | 'meeting' | 'filing' | 'update';
}

// Voice Sphere Component
const VoiceSphere: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create sphere geometry with particles
    const particleCount = 8000;
    const sphereRadius = 1.6;
    const radiusVariance = 0.08;
    const mouseInfluenceRadius = sphereRadius * 1.6;
    const mouseRepelRadius = sphereRadius * 1.2;
    const baseParticleSize = 0.03;
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    
    // Generate points on sphere surface
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const radius = sphereRadius + (Math.random() - 0.5) * radiusVariance;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      scales[i] = Math.random() * 0.5 + 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    // Create material
    const particleTexture = createCircularParticleTexture();
    const material = new THREE.PointsMaterial({
      color: 0x0f172a,
      size: baseParticleSize,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      map: particleTexture ?? undefined,
      alphaMap: particleTexture ?? undefined,
      alphaTest: 0.15
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let time = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      time += 0.001;

      if (particles && geometry) {
        const positions = geometry.attributes.position.array as Float32Array;
        
        // Rotate sphere
        particles.rotation.y += 0.002;
        particles.rotation.x = Math.sin(time) * 0.05;
        
        const mouseX = mouseRef.current.x * mouseInfluenceRadius;
        const mouseY = mouseRef.current.y * mouseInfluenceRadius;

        // Make particles react to mouse
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          const x = positions[i3];
          const y = positions[i3 + 1];
          const z = positions[i3 + 2];
          
          // Calculate distance from mouse in 3D space
          const mouseDistance = Math.sqrt(
            Math.pow(x - mouseX, 2) +
            Math.pow(y - mouseY, 2) +
            Math.pow(z, 2)
          );
          
          // Repel particles near mouse
          if (mouseDistance < mouseRepelRadius) {
            const force = (mouseRepelRadius - mouseDistance) * 0.015;
            const angle = Math.atan2(y - mouseY, x - mouseX);
            
            positions[i3] += Math.cos(angle) * force;
            positions[i3 + 1] += Math.sin(angle) * force;
          }
          
          // Return to sphere shape
          const currentRadius = Math.sqrt(x * x + y * y + z * z);
          const targetRadius = sphereRadius;
          const returnForce = 0.05;
          
          if (Math.abs(currentRadius - targetRadius) > 0.01) {
            const scale = 1 - (currentRadius - targetRadius) * returnForce / currentRadius;
            positions[i3] *= scale;
            positions[i3 + 1] *= scale;
            positions[i3 + 2] *= scale;
          }
          
          // Add breathing effect
          const breathe = Math.sin(time * 2 + i * 0.01) * 0.015;
          const normalizedPos = {
            x: positions[i3] / currentRadius,
            y: positions[i3 + 1] / currentRadius,
            z: positions[i3 + 2] / currentRadius
          };
          
          positions[i3] += normalizedPos.x * breathe;
          positions[i3 + 1] += normalizedPos.y * breathe;
          positions[i3 + 2] += normalizedPos.z * breathe;
        }
        
        geometry.attributes.position.needsUpdate = true;
        
        // Pulse effect when listening
        if (isListening) {
          const pulse = Math.sin(time * 5) * 0.5 + 0.5;
          material.opacity = 0.6 + pulse * 0.4;
          material.size = baseParticleSize + pulse * 0.012;
        } else {
          material.opacity = 0.85;
          material.size = baseParticleSize;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (particleTexture) {
        particleTexture.dispose();
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTranscript('Listening...');
      // Simulate voice recognition
      setTimeout(() => {
        setTranscript('I need help reviewing the contract terms in section 3.2');
        setTimeout(() => {
          setTranscript('Processing your request...');
          setTimeout(() => {
            setIsListening(false);
            onClose();
          }, 2000);
        }, 1500);
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50">
      <div ref={containerRef} className="absolute inset-0" />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-8">
        {/* Top Section */}
        <div className="w-full max-w-4xl pointer-events-auto">
          <button
            onClick={onClose}
            className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Center Status */}
        <div className="text-center">
          <h2 className="text-2xl font-light text-gray-900 mb-2">DawgMarshall</h2>
          <p className="text-gray-600 animate-pulse">{transcript}</p>
        </div>
        
        {/* Bottom Controls */}
        <div className="flex flex-col items-center gap-4 pointer-events-auto">
          <button
            onClick={toggleListening}
            className={`w-20 h-20 rounded-full border-2 transition-all flex items-center justify-center ${
              isListening 
                ? 'bg-black text-white border-black scale-110' 
                : 'bg-white text-black border-gray-300 hover:border-black'
            }`}
          >
            <Mic className={`w-8 h-8 ${isListening ? 'animate-pulse' : ''}`} />
          </button>
          <p className="text-sm text-gray-500">
            {isListening ? 'Click to stop' : 'Click to speak'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Main Component
const LawDawgMVP: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'timeline' | 'documents' | 'tracking' | 'lawyers' | 'repository'>('chat');
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'Contract Dispute - ABC Corp',
      lastMessage: new Date(),
      messages: [],
      documents: [],
      timeline: [],
      caseStatus: 'active'
    }
  ]);
  
  const [lawyers] = useState<Lawyer[]>([
    { id: '1', name: 'Sarah Mitchell', specialization: 'Contract Law', rating: 4.9, experience: '15 years', available: true, rate: '$450/hr' },
    { id: '2', name: 'David Chen', specialization: 'Corporate Law', rating: 4.8, experience: '12 years', available: true, rate: '$380/hr' },
    { id: '3', name: 'Emily Rodriguez', specialization: 'IP & Patent Law', rating: 4.9, experience: '10 years', available: false, rate: '$420/hr' },
  ]);
  
  const [caseUpdates] = useState<CaseUpdate[]>([
    { id: '1', date: new Date('2024-10-20'), title: 'Contract analysis completed', description: 'AI analysis identified 3 critical issues', type: 'document' },
    { id: '2', date: new Date('2024-10-19'), title: 'Timeline generated', description: 'Case timeline with 8 key events created', type: 'update' },
    { id: '3', date: new Date('2024-10-18'), title: 'Documents uploaded', description: '5 documents added to case file', type: 'document' },
  ]);
  
  const [activeConversationId, setActiveConversationId] = useState<string>('1');
  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation.messages]);

  // Simulated AI response generator
  const generateAIResponse = async (userMessage: string, docs?: Document[]): Promise<string> => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (docs && docs.length > 0) {
      return `I've analyzed the uploaded ${docs.length} document(s). Here's what I found:

**Key Information:**
• Document type: ${docs[0].name.includes('contract') ? 'Contract Agreement' : 'Legal Document'}
• Parties identified: Party A (Client), Party B (Vendor)
• Effective date: ${new Date().toLocaleDateString()}
• Term: 24 months with auto-renewal clause

**Critical Points:**
1. **Termination Clause** - Either party may terminate with 60 days written notice
2. **Liability Cap** - Limited to total fees paid in preceding 12 months
3. **Jurisdiction** - Disputes governed by laws of Delaware

**Potential Issues:**
⚠️ Auto-renewal clause may not be clearly highlighted
⚠️ Indemnification section appears one-sided

Would you like me to create a detailed timeline or extract specific clauses?`;
    }
    
    const responses: { [key: string]: string } = {
      'timeline': `I'll create a comprehensive timeline for your case. Based on the information provided:

**Timeline Created:**
📅 **January 15, 2024** - Initial contract signed
📅 **February 1, 2024** - Performance period begins
📅 **March 15, 2024** - First milestone deadline
📅 **June 30, 2024** - Mid-term review scheduled
📅 **January 31, 2026** - Contract expiration (if not renewed)

I've added these dates to your case timeline. You can view and edit them in the Timeline tab.`,
      
      'review': `I'll conduct a thorough review of your contract. Here's my analysis:

**Contract Health Score: 7/10**

**Strengths:**
✓ Clear scope of work definition
✓ Detailed payment terms and schedule
✓ Comprehensive confidentiality provisions

**Areas of Concern:**
• Unlimited liability for certain breaches
• No clear dispute escalation process
• Missing force majeure provisions

**Recommendations:**
1. Add liability cap for indirect damages
2. Include mediation before litigation
3. Define specific force majeure events

Would you like me to draft amendments for these issues?`,
      
      'issue': `I've identified several legal issues in your case:

**Primary Concerns:**
1. **Breach of Contract** - Non-delivery of services as specified in Section 3.2
2. **Timeline Violations** - Missed deadlines on March 15 and April 30
3. **Payment Disputes** - Invoice discrepancies totaling $45,000

**Recommended Actions:**
• Send formal notice of breach within 10 days
• Document all communications and delays
• Consider initiating mediation proceedings

**Risk Assessment:** Medium-High
**Success Probability:** 65-70% based on similar cases

Should I draft a breach notice letter?`
    };
    
    // Check for keywords and return appropriate response
    if (userMessage.toLowerCase().includes('timeline')) return responses.timeline;
    if (userMessage.toLowerCase().includes('review')) return responses.review;
    if (userMessage.toLowerCase().includes('issue') || userMessage.toLowerCase().includes('problem')) return responses.issue;
    
    // Default response
    return `I understand you need help with: "${userMessage}"

I can assist you with:
• **Document Analysis** - Upload contracts, briefs, or legal documents
• **Timeline Creation** - Build chronological case timelines
• **Issue Identification** - Spot legal risks and concerns
• **Contract Review** - Detailed analysis of terms and conditions
• **Legal Research** - Find relevant cases and precedents

How would you like to proceed?`;
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    // Update conversation with user message
    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        return { 
          ...conv, 
          messages: [...conv.messages, userMessage],
          lastMessage: new Date()
        };
      }
      return conv;
    }));
    
    setInputValue('');
    setIsTyping(true);
    
    // Generate AI response
    const aiResponse = await generateAIResponse(userMessage.content);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };
    
    // Add timeline events if discussing timeline
    if (userMessage.content.toLowerCase().includes('timeline')) {
      const events: TimelineEvent[] = [
        { id: '1', date: '2024-01-15', title: 'Contract Signed', description: 'Initial agreement executed', type: 'contract', status: 'completed' },
        { id: '2', date: '2024-02-01', title: 'Performance Start', description: 'Service delivery begins', type: 'other', status: 'completed' },
        { id: '3', date: '2024-03-15', title: 'First Milestone', description: 'Delivery deadline', type: 'deadline', status: 'pending' },
        { id: '4', date: '2024-06-30', title: 'Mid-term Review', description: 'Performance evaluation', type: 'meeting', status: 'upcoming' }
      ];
      
      setConversations(prev => prev.map(conv => {
        if (conv.id === activeConversationId) {
          return { ...conv, timeline: events };
        }
        return conv;
      }));
    }
    
    setIsTyping(false);
    
    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        return { 
          ...conv, 
          messages: [...conv.messages, assistantMessage],
          lastMessage: new Date()
        };
      }
      return conv;
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const uploadedDocs: Document[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const doc: Document = {
        id: Date.now().toString() + i,
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date(),
        analysis: {
          summary: 'Processing document...',
          keyPoints: [],
          parties: [],
          dates: [],
          risks: []
        },
        shared: false,
        sharedWith: []
      };
      uploadedDocs.push(doc);
    }
    
    // Add system message about upload
    const systemMessage: Message = {
      id: Date.now().toString(),
      role: 'system',
      content: `📎 Uploaded ${uploadedDocs.length} document(s)`,
      timestamp: new Date(),
      documents: uploadedDocs
    };
    
    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        return { 
          ...conv, 
          messages: [...conv.messages, systemMessage],
          documents: [...conv.documents, ...uploadedDocs],
          lastMessage: new Date()
        };
      }
      return conv;
    }));
    
    setIsTyping(true);
    
    // Simulate document analysis
    setTimeout(async () => {
      const aiResponse = await generateAIResponse('analyze documents', uploadedDocs);
      const analysisMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setIsTyping(false);
      setConversations(prev => prev.map(conv => {
        if (conv.id === activeConversationId) {
          return { 
            ...conv, 
            messages: [...conv.messages, analysisMessage],
            lastMessage: new Date()
          };
        }
        return conv;
      }));
    }, 2000);
  };

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: 'New Case Analysis',
      lastMessage: new Date(),
      messages: [],
      documents: [],
      timeline: [],
      caseStatus: 'pending'
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setActiveView('chat');
  };

  const handleGoogleDriveConnect = () => {
    setGoogleDriveConnected(!googleDriveConnected);
    // Simulate connection
    if (!googleDriveConnected) {
      setTimeout(() => {
        alert('Google Drive connected successfully!');
      }, 1000);
    }
  };

  const handleShareDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowShareModal(true);
  };

  const formatMessage = (content: string) => {
    // Convert markdown-style formatting to React elements
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={i} className="font-semibold text-gray-900 mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
      } else if (line.startsWith('• ')) {
        return <li key={i} className="ml-4 mb-1">{line.substring(2)}</li>;
      } else if (line.startsWith('✓ ')) {
        return <li key={i} className="ml-4 mb-1 text-gray-700">{line}</li>;
      } else if (line.startsWith('⚠️ ')) {
        return <li key={i} className="ml-4 mb-1 text-gray-600">{line}</li>;
      } else if (line.startsWith('📅 ')) {
        return <li key={i} className="ml-4 mb-2 font-medium">{line}</li>;
      } else if (line.match(/^\d+\. /)) {
        return <li key={i} className="ml-4 mb-2">{line}</li>;
      }
      return <p key={i} className="mb-2">{line}</p>;
    });
  };

  const quickActions = [
    { icon: <FileText className="w-4 h-4" />, label: 'Review this contract', action: 'review this contract' },
    { icon: <Clock className="w-4 h-4" />, label: 'Build case timeline', action: 'create a timeline' },
    { icon: <AlertTriangle className="w-4 h-4" />, label: 'Identify legal issues', action: 'identify legal issues' },
    { icon: <Search className="w-4 h-4" />, label: 'Research precedents', action: 'research similar cases' }
  ];

  return (
    <div className="flex h-screen bg-white">
      {/* Voice Interface */}
      {showVoiceInterface && (
        <VoiceSphere onClose={() => setShowVoiceInterface(false)} />
      )}
      
      {/* Share Modal */}
      {showShareModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Share Document with Lawyer</h3>
            <p className="text-gray-600 mb-4">Share "{selectedDocument.name}" with:</p>
            <div className="space-y-2 mb-6">
              {lawyers.filter(l => l.available).map(lawyer => (
                <label key={lawyer.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" className="rounded" />
                  <div className="flex-1">
                    <p className="font-medium">{lawyer.name}</p>
                    <p className="text-xs text-gray-500">{lawyer.specialization}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  alert('Document shared successfully!');
                }}
                className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Share Document
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <Hash className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">LawDawg</h1>
                <p className="text-xs text-gray-500">Legal Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <button
            onClick={handleNewConversation}
            className="w-full py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            New Case Analysis
          </button>
        </div>
        
        {/* Google Drive Connection */}
        <div className="px-4 pt-4">
          <button
            onClick={handleGoogleDriveConnect}
            className={`w-full p-3 rounded-lg transition-all flex items-center gap-3 ${
              googleDriveConnected 
                ? 'bg-gray-100 border border-gray-300' 
                : 'bg-white border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="p-2 bg-gray-100 rounded-lg">
              <FolderOpen className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900">Google Drive</p>
              <p className="text-xs text-gray-500">
                {googleDriveConnected ? 'Connected' : 'Click to connect'}
              </p>
            </div>
            {googleDriveConnected && (
              <Check className="w-4 h-4 text-green-600" />
            )}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Cases</h2>
          <div className="space-y-2">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveConversationId(conv.id);
                  setActiveView('chat');
                }}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  activeConversationId === conv.id 
                    ? 'bg-white shadow-sm border border-gray-200' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{conv.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {conv.messages.length} messages • {conv.documents.length} documents
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {conv.caseStatus && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        conv.caseStatus === 'active' ? 'bg-green-100 text-green-700' :
                        conv.caseStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {conv.caseStatus}
                      </span>
                    )}
                    {conv.documents.length > 0 && (
                      <Paperclip className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-black rounded-full" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Pro Plan</p>
              <p className="text-xs text-gray-500">Unlimited analyses</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Hash className="w-5 h-5 text-gray-700" />
                </button>
              )}
              
              {/* View Tabs */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('chat')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeView === 'chat' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveView('timeline')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeView === 'timeline' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setActiveView('documents')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeView === 'documents' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Documents
                </button>
                <button
                  onClick={() => setActiveView('tracking')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    activeView === 'tracking' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  Tracking
                </button>
                <button
                  onClick={() => setActiveView('lawyers')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    activeView === 'lawyers' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <UserCheck className="w-3 h-3" />
                  Lawyers
                </button>
                <button
                  onClick={() => setActiveView('repository')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    activeView === 'repository' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Share2 className="w-3 h-3" />
                  Repository
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowVoiceInterface(true)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-all flex items-center gap-2 relative"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm font-medium">Call DawgMarshall</span>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse ml-1" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'chat' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto">
                {activeConversation.messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center p-8">
                    <div className="max-w-2xl w-full">
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                          How can I help with your case?
                        </h2>
                        <p className="text-gray-600">
                          Upload documents, ask questions, or use quick actions below
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-8">
                        {quickActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setInputValue(action.action);
                              handleSend();
                            }}
                            className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-left group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-white rounded-lg text-gray-600 group-hover:text-black transition-colors">
                                {action.icon}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{action.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors flex items-center gap-2 font-medium"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Documents
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-6">
                    {activeConversation.messages.map(message => (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                          {message.role === 'system' ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
                              <CheckCircle className="w-4 h-4 text-gray-600" />
                              {message.content}
                            </div>
                          ) : (
                            <div className={`${
                              message.role === 'user' 
                                ? 'bg-black text-white rounded-2xl rounded-br-sm px-4 py-3' 
                                : 'bg-gray-50 text-gray-900 rounded-2xl rounded-bl-sm px-4 py-3'
                            }`}>
                              {message.role === 'user' ? (
                                <p className="text-sm">{message.content}</p>
                              ) : (
                                <div className="text-sm space-y-1">
                                  {formatMessage(message.content)}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {message.documents && message.documents.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.documents.map(doc => (
                                <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                  <File className="w-5 h-5 text-gray-500" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                    <p className="text-xs text-gray-500">{doc.size}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span className="text-sm">LawDawg is analyzing...</span>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              
              {/* Input Area */}
              <div className="border-t border-gray-200 bg-white p-4">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-end gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Paperclip className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    <button
                      onClick={() => setShowVoiceInterface(true)}
                      className="p-3 hover:bg-gray-100 rounded-lg transition-colors group relative"
                      title="Call DawgMarshall"
                    >
                      <Phone className="w-5 h-5 text-gray-600 group-hover:text-black transition-colors" />
                      <div className="absolute top-0 right-0 w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    
                    <div className="flex-1">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Ask about legal issues, timelines, or upload documents..."
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:bg-white transition-all"
                      />
                    </div>
                    
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || isTyping}
                      className="p-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeView === 'timeline' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Case Timeline</h2>
                  <p className="text-gray-600">Chronological view of all case events</p>
                </div>
                
                {activeConversation.timeline.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No timeline events yet</p>
                    <button
                      onClick={() => {
                        setActiveView('chat');
                        setInputValue('create a timeline for my case');
                      }}
                      className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
                    >
                      Generate Timeline
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeConversation.timeline.map((event, idx) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            event.status === 'completed' ? 'bg-green-500' :
                            event.status === 'pending' ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`} />
                          {idx < activeConversation.timeline.length - 1 && (
                            <div className="w-0.5 h-20 bg-gray-200 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            {event.status && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                event.status === 'completed' ? 'bg-green-100 text-green-700' :
                                event.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {event.status}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                          <p className="text-gray-600 text-sm">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeView === 'documents' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Case Documents</h2>
                  <p className="text-gray-600">All uploaded and analyzed documents</p>
                </div>
                
                {activeConversation.documents.length === 0 ? (
                  <div className="text-center py-12">
                    <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No documents uploaded yet</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
                    >
                      Upload Documents
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {activeConversation.documents.map(doc => (
                      <div key={doc.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <FileText className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{doc.name}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {doc.size} • Uploaded {doc.uploadedAt.toLocaleTimeString()}
                              </p>
                              {doc.analysis && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-900 font-medium mb-2">AI Analysis</p>
                                  <p className="text-xs text-gray-700">{doc.analysis.summary}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  onClick={() => handleShareDocument(doc)}
                                  className="px-3 py-1 bg-black text-white rounded text-xs hover:bg-gray-900 transition-colors flex items-center gap-1"
                                >
                                  <Share2 className="w-3 h-3" />
                                  Share with Lawyer
                                </button>
                                {doc.shared && (
                                  <span className="text-xs text-green-600 flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Shared
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeView === 'tracking' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Case Tracking</h2>
                  <p className="text-gray-600">Real-time updates and progress tracking</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Documents</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">{activeConversation.documents.length}</p>
                      </div>
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Timeline Events</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">{activeConversation.timeline.length}</p>
                      </div>
                      <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Case Status</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1 capitalize">{activeConversation.caseStatus || 'Active'}</p>
                      </div>
                      <Activity className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-4">Recent Updates</h3>
                <div className="space-y-3">
                  {caseUpdates.map(update => (
                    <div key={update.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-lg ${
                        update.type === 'document' ? 'bg-gray-200' :
                        update.type === 'meeting' ? 'bg-gray-300' :
                        'bg-gray-100'
                      }`}>
                        {update.type === 'document' ? <FileText className="w-4 h-4 text-gray-700" /> :
                         update.type === 'meeting' ? <Users className="w-4 h-4 text-gray-700" /> :
                         <Activity className="w-4 h-4 text-gray-700" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{update.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{update.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {update.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeView === 'lawyers' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Consult a Lawyer</h2>
                  <p className="text-gray-600">Connect with verified legal professionals</p>
                </div>
                
                <div className="grid gap-4">
                  {lawyers.map(lawyer => (
                    <div key={lawyer.id} className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{lawyer.name}</h3>
                            <p className="text-sm text-gray-600">{lawyer.specialization}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium">⭐ {lawyer.rating}</span>
                                <span className="text-xs text-gray-500">rating</span>
                              </div>
                              <div className="text-sm text-gray-500">
                                {lawyer.experience} experience
                              </div>
                              <div className="text-sm font-medium">
                                {lawyer.rate}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`px-3 py-1 rounded-full text-xs ${
                            lawyer.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {lawyer.available ? 'Available' : 'Busy'}
                          </div>
                          <button
                            disabled={!lawyer.available}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            Schedule Consultation
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeView === 'repository' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Repository</h2>
                  <p className="text-gray-600">Share case files and documents with your legal team</p>
                </div>
                
                <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Secure Sharing Enabled</p>
                      <p className="text-xs text-gray-500">End-to-end encrypted document sharing</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors text-sm">
                    Generate Share Link
                  </button>
                </div>
                
                <div className="grid gap-4">
                  {activeConversation.documents.length > 0 ? (
                    activeConversation.documents.map(doc => (
                      <div key={doc.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <div>
                              <h4 className="font-medium text-gray-900">{doc.name}</h4>
                              <p className="text-xs text-gray-500">{doc.size} • AI Analyzed</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>
                            <button 
                              onClick={() => handleShareDocument(doc)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Share2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                        {doc.shared && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">Shared with: {doc.sharedWith?.join(', ') || 'Your legal team'}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No documents in repository yet</p>
                      <button
                        onClick={() => setActiveView('documents')}
                        className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
                      >
                        Upload Documents
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LawDawgMVP;
