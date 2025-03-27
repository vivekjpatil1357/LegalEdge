import { ScrollArea } from '@radix-ui/react-scroll-area'
import { Card } from './ui/card'
import React, { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/config/firebase';

interface ChatUser
{
  id: string;
  name: string;
  email: string;
  role: 'LAWYER' | 'USER';
  lastMessage?: string;
  lastMessageTime?: string;
}
const ChatSidebar = () =>
{
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  useEffect(() =>
  {
    const unsubscribe = onAuthStateChanged(auth, (user) =>
    {
      if (user) {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, []);
  useEffect(() =>
  {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);
  const fetchUsers = async () =>
  {
    try {
      const response = await fetch(`http://localhost:8000/api/users/${currentUser.uid}`);
      const data = await response.json();
      const res = await fetch(`http://localhost:8000/api/chats/${data.user_id}`);
      const d = await res.json();
      console.log(d);

      setUsers(d.map((chat: any) =>
      (
        {
          id: chat.id,
          name: chat.user.first_name+' '+chat.user.last_name,
          email: chat.email,
          role: chat.role,
          
          
        }
      )));
      console.log('from chatsidebar', data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }


  return (
    <div className="w-80 border-r">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-2">
          <h2 className="text-xl font-bold mb-4">
            {currentUser?.role === 'LAWYER' ? 'Clients' : 'Lawyers'}
          </h2>
          {
            !users && <div className="text-gray-500 text-sm">No Chats found</div>
          }
          {users?.map((user, idx) => (
            <Card
              key={idx}
              className={`p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${selectedUser?.id === user.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                }`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="font-semibold">{user.name}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
              {user.lastMessage && (
                <div className="text-sm text-gray-500 mt-1 truncate">
                  {user.lastMessage}
                </div>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export default ChatSidebar