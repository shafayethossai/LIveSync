import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../ui/Logo';
import { getPosts, getMessages, saveMessage } from '../../data/mockData';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Send, MessageCircle } from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('postId');

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    if (!user) return;

    if (postId) {
      const posts = getPosts();
      const post = posts.find(p => p.id === postId);
      if (post && post.userId !== user.id) {
        const newConv = {
          userId: post.userId,
          userName: post.userName,
          userPhoto: post.userPhoto,
          postId,
          messages: getMessages(user.id).filter(m => 
            (m.senderId === user.id && m.receiverId === post.userId) || 
            (m.senderId === post.userId && m.receiverId === user.id)
          )
        };
        setConversations(prev => {
          if (!prev.find(c => c.userId === post.userId)) {
            setSelectedConversation(newConv);
            return [newConv, ...prev];
          }
          return prev;
        });
      }
    }
  }, [postId, user]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation || !user) return;

    const newMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user.id,
      receiverId: selectedConversation.userId,
      content: messageText,
      timestamp: new Date().toISOString()
    };

    saveMessage(newMessage);

    const updatedConv = {
      ...selectedConversation,
      messages: [...(selectedConversation.messages || []), newMessage]
    };

    setConversations(prev => prev.map(c => 
      c.userId === selectedConversation.userId ? updatedConv : c
    ));
    setSelectedConversation(updatedConv);
    setMessageText('');

    // Simulate reply
    setTimeout(() => {
      const reply = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: selectedConversation.userId,
        receiverId: user.id,
        content: "Thank you! I'll get back to you soon. Contact: +880 1234567890",
        timestamp: new Date().toISOString()
      };
      saveMessage(reply);
      const finalConv = { ...updatedConv, messages: [...updatedConv.messages, reply] };
      setConversations(prev => prev.map(c => c.userId === selectedConversation.userId ? finalConv : c));
      setSelectedConversation(finalConv);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo variant="gradient" size="md" to="/dashboard" />
            <nav className="flex items-center gap-4">
              <Link to="/dashboard"><Button variant="ghost">Dashboard</Button></Link>
              <Link to="/listings"><Button variant="ghost">Browse Listings</Button></Link>
              <Link to="/profile"><Button variant="outline">Profile</Button></Link>
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
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                          {conv.userName.charAt(0)}
                        </AvatarFallback>
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
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                        {selectedConversation.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{selectedConversation.userName}</div>
                      <div className="text-sm text-gray-500">Active now</div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                      selectedConversation.messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.senderId === user.id ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.senderId === user.id ? 'text-blue-100' : 'text-gray-500'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">Start the conversation!</div>
                    )}
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
                      <Button onClick={handleSendMessage} className="bg-gradient-to-r from-blue-600 to-green-600">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">💬</div>
                    <p>Select a conversation</p>
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