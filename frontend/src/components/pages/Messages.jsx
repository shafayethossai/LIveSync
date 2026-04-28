import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../ui/Logo';
import api from '../../services/api';                    // ← Real API
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Send, MessageCircle } from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('postId');
  const ownerId = searchParams.get('ownerId');
  const ownerName = searchParams.get('ownerName');

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch conversations (you can expand this later)
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        const res = await api.get('/messages/conversations');
        setConversations(res.data);
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };

    fetchConversations();
  }, [user]);

  // Auto-open conversation if coming from a post
  useEffect(() => {
    if (!user || !ownerId) return;

    const ownerIdNum = Number(ownerId);
    if (!ownerIdNum || Number.isNaN(ownerIdNum)) return;

    const existing = conversations.find((conv) => Number(conv.userId) === ownerIdNum);
    if (existing) {
      setSelectedConversation(existing);
      return;
    }

    if (ownerIdNum === user.id) return;

    setSelectedConversation({
      userId: ownerIdNum,
      userName: ownerName || 'User',
      userPhoto: '',
      messages: [],
      postId,
    });
  }, [postId, ownerId, ownerName, user, conversations]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !user) return;

    setLoading(true);

    try {
      const newMessage = {
        receiverId: selectedConversation.userId,
        content: messageText,
      };

      await api.post('/messages', newMessage);

      const updatedConv = {
        ...selectedConversation,
        messages: [...(selectedConversation.messages || []), {
          id: Date.now(),
          senderId: user.id,
          content: messageText,
          timestamp: new Date().toISOString()
        }]
      };

      setConversations(prev => prev.map(c => 
        c.userId === selectedConversation.userId ? updatedConv : c
      ));
      setSelectedConversation(updatedConv);
      setMessageText('');
    } catch (error) {
      alert("Failed to send message", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm">
        <div className="w-full px-2 sm:px-4 lg:px-8 py-2 sm:py-4">
          <div className="flex items-center justify-between gap-1 sm:gap-4">
            <Logo variant="gradient" size="sm" to="/dashboard" className="flex-shrink-0" />
            <nav className="flex items-center gap-0.5 sm:gap-3">
              <Link to="/dashboard">
                <Button variant="ghost" className="px-1.5 sm:px-3 py-1 sm:py-2 h-auto text-xs sm:text-sm">
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">🏠</span>
                </Button>
              </Link>
              <Link to="/listings">
                <Button variant="ghost" className="px-1.5 sm:px-3 py-1 sm:py-2 h-auto text-xs sm:text-sm">
                  <span className="hidden sm:inline">Browse</span>
                  <span className="sm:hidden">🔍</span>
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="outline" className="px-1.5 sm:px-3 py-1 sm:py-2 h-auto text-xs sm:text-sm">
                  <span className="hidden sm:inline">Profile</span>
                  <span className="sm:hidden">👤</span>
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="grid md:grid-cols-3 h-full">
            {/* Conversations List */}
            <div className="border-r border-slate-200 overflow-y-auto bg-slate-50">
              <div className="p-5 border-b border-slate-200 bg-white">
                <h2 className="text-xl font-semibold tracking-tight">Messages</h2>
                <p className="text-sm text-slate-500 mt-1">Keep the conversation flowing.</p>
              </div>
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="mb-4">No conversations yet</p>
                  <Link to="/listings"><Button variant="outline">Browse Listings</Button></Link>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 border-b border-slate-200 text-left transition-colors duration-200 ${selectedConversation?.userId === conv.userId ? 'bg-white shadow-sm' : 'hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="shadow-sm ring-1 ring-slate-200">
                        <AvatarImage src={conv.userPhoto} />
                        <AvatarFallback>{conv.userName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-slate-900">{conv.userName}</div>
                        <div className="text-sm text-slate-500 truncate">{conv.lastMessage || 'Tap to open chat'}</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Chat Area */}
            <div className="md:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="p-5 border-b border-slate-200 flex items-center gap-4 bg-slate-50">
                    <Avatar className="shadow-sm ring-1 ring-slate-200">
                      <AvatarImage src={selectedConversation.userPhoto} />
                      <AvatarFallback>{selectedConversation.userName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-slate-900">{selectedConversation.userName}</div>
                      <div className="text-sm text-emerald-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        Online
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-50">
                    {(selectedConversation.messages || []).map((msg) => (
                      <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-4 py-3 rounded-[28px] shadow-sm ${msg.senderId === user.id 
                          ? 'bg-gradient-to-r from-sky-600 to-emerald-500 text-white rounded-br-none' 
                          : 'bg-slate-100 text-slate-900 rounded-bl-none'}`}>
                          <p className="text-sm leading-6">{msg.content}</p>
                          <p className={`text-[11px] mt-2 ${msg.senderId === user.id ? 'text-sky-100/90' : 'text-slate-500'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-5 border-t border-slate-200 bg-white">
                    <div className="flex gap-3 items-center">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 rounded-full border border-slate-200 bg-slate-100 shadow-sm px-4 py-3"
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={loading || !messageText.trim()}
                        className="rounded-full w-14 h-14 p-0 bg-gradient-to-r from-blue-600 to-green-600 shadow-lg"
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}