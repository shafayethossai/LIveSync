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

      // Update UI optimistically
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
    } catch (err) {
      alert("Failed to send message");
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
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="grid md:grid-cols-3 h-full">
            {/* Conversations List */}
            <div className="border-r overflow-y-auto">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Messages</h2>
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
                    className={`w-full p-4 border-b hover:bg-gray-50 text-left ${selectedConversation?.userId === conv.userId ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={conv.userPhoto} />
                        <AvatarFallback>{conv.userName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{conv.userName}</div>
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
                  <div className="p-4 border-b flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedConversation.userPhoto} />
                      <AvatarFallback>{selectedConversation.userName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{selectedConversation.userName}</div>
                      <div className="text-sm text-gray-500">Online</div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {(selectedConversation.messages || []).map((msg) => (
                      <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.senderId === user.id 
                          ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white' 
                          : 'bg-gray-100 text-gray-900'}`}>
                          <p>{msg.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={loading || !messageText.trim()}
                        className="bg-gradient-to-r from-blue-600 to-green-600"
                      >
                        <Send className="w-4 h-4" />
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