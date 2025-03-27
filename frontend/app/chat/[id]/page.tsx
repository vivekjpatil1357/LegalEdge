"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useParams, useRouter } from "next/navigation";
import { auth } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import ChatSidebar from "@/components/ChatSidebar";
interface ChatUser
{
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'LAWYER' | 'USER';
  lastMessage?: string;
  lastMessageTime?: string;
}

interface Message
{
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export default function ChatPage()
{
  const router = useRouter();
  const [receiver, setReceiver] = useState<ChatUser | null>();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [chatId, setChatId] = useState('');
  const { id } = useParams();
  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () =>
  {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() =>
  {
    scrollToBottom();
  }, [messages]);
  // Fetch messages for selected chat
  useEffect(() =>
  {
    const fetchMessages = async () =>
    {
      if (id) {
        const response = await fetch(`http://localhost:8000/api/users/ById/${id}`);
        const data = await response.json();
        setReceiver(data);
        console.log('receiver', data);

      }
      if (!chatId)
        return
      console.log(chatId,'chatId');
      
      if (!currentUser) return;

      try {
        const response = await fetch(
          `http://localhost:8000/api/messages/${chatId}`
        );
        if (response.ok) {
          const data = await response.json();
          setMessages(data.data);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [router]);

  // Check authentication
  useEffect(() =>
  {
    const unsubscribe = onAuthStateChanged(auth, (user) =>
    {
      if (user) {
        // Fetch user role
        fetch(`http://localhost:8000/api/users/${user.uid}`)
          .then(res => res.json())
          .then(data =>
          {
            setCurrentUser({ ...data });
            setLoading(false);
          })
          .catch(error =>
          {
            console.error('Error fetching user role:', error);
            setLoading(false);
          });
      } else {
        router.push('/auth/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSendMessage = async (e: React.FormEvent) =>
  {
    e.preventDefault();
    if (!chatId) {
      const message=fetch(`http://localhost:8000/api/chats/createChat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: receiver?.user_id,
          sender_id: currentUser.user_id,
          message: newMessage
        })
      })
        .then(res => res.json())  
        .then(data =>
        {
          console.log('data', data);
          
          setChatId(data.data);
          const message={id:data}
          setMessages(prev => [...prev,{...data} ]);
        })
        .catch(error =>
        {
          console.error('Error fetching user role:', error);
          setLoading(false);
        });
      
      return
    }
    if (!newMessage.trim() || !currentUser) return;

    try {
      const response = await fetch('http://localhost:8000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.uid,
          receiverId: receiver?.user_id,
          content: newMessage.trim()
        })
      });

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message.data]);
        setNewMessage("");
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      {/* <ChatSidebar /> */}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">

        <>
          {/* Chat Header */}
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">{receiver?.first_name + ' ' + receiver?.last_name}</h2>
            <p>{receiver?.email}</p>
          </div>

          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'
                    }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${message.senderId === currentUser?.uid
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                  >
                    <p>{message.content}</p>
                    <span className="text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit">Send</Button>
            </div>
          </form>
        </>

        {!receiver && <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Select a conversation to start chatting</p>
        </div>}

      </div>
    </div>
  );
} 