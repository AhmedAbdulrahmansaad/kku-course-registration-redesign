import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Mail, 
  Send,
  Inbox,
  Archive,
  Trash2,
  Search,
  Star,
  Reply,
  Forward,
  MoreVertical
} from 'lucide-react';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface Message {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
}

export const MessagesPage: React.FC = () => {
  const { language } = useApp();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      from: 'ahmad.alghamdi@kku.edu.sa',
      subject: language === 'ar' ? 'استفسار عن المقررات' : 'Inquiry about courses',
      body: language === 'ar' 
        ? 'مرحباً، أريد الاستفسار عن المقررات المتاحة للمستوى السادس...' 
        : 'Hello, I want to inquire about available courses for level 6...',
      date: '2024-01-15',
      read: false,
      starred: true,
    },
    {
      id: '2',
      from: 'fatimah.alqahtani@kku.edu.sa',
      subject: language === 'ar' ? 'طلب موافقة على التسجيل' : 'Registration approval request',
      body: language === 'ar' 
        ? 'أرجو الموافقة على طلب التسجيل في مقرر قواعد البيانات...' 
        : 'Please approve my registration request for Database course...',
      date: '2024-01-14',
      read: true,
      starred: false,
    },
    {
      id: '3',
      from: 'mohammed.rasheed@kku.edu.sa',
      subject: language === 'ar' ? 'تحديث الجدول الدراسي' : 'Schedule update',
      body: language === 'ar' 
        ? 'تم تحديث الجدول الدراسي للفصل الحالي...' 
        : 'The schedule for current semester has been updated...',
      date: '2024-01-13',
      read: true,
      starred: false,
    },
  ]);

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [composeForm, setComposeForm] = useState({
    to: '',
    subject: '',
    body: '',
  });

  const unreadCount = messages.filter(m => !m.read).length;

  const filteredMessages = messages.filter(m => 
    m.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    // Send message logic
    setIsComposeOpen(false);
    setComposeForm({ to: '', subject: '', body: '' });
  };

  const markAsRead = (id: string) => {
    setMessages(messages.map(m => 
      m.id === id ? { ...m, read: true } : m
    ));
  };

  const toggleStar = (id: string) => {
    setMessages(messages.map(m => 
      m.id === id ? { ...m, starred: !m.starred } : m
    ));
  };

  const deleteMessage = (id: string) => {
    setMessages(messages.filter(m => m.id !== id));
    if (selectedMessage?.id === id) {
      setSelectedMessage(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative -mx-4 -mt-8 px-4">
        <div className="absolute inset-0 h-48 bg-gradient-to-br from-[#184A2C] via-blue-700 to-blue-900 dark:from-[#0e2818] dark:via-blue-900 dark:to-black"></div>
        <div className="absolute inset-0 h-48 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#D4AF37]/20 via-transparent to-transparent"></div>

        <div className="relative z-10 text-white py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Mail className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold drop-shadow-lg">
                  {language === 'ar' ? 'الرسائل' : 'Messages'}
                </h1>
                <p className="text-white/90 text-lg">
                  {unreadCount} {language === 'ar' ? 'رسالة غير مقروءة' : 'unread messages'}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsComposeOpen(true)}
              className="bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:from-yellow-600 hover:to-[#D4AF37] text-black font-bold"
            >
              <Send className="h-5 w-5 mr-2" />
              {language === 'ar' ? 'رسالة جديدة' : 'New Message'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={language === 'ar' ? 'ابحث في الرسائل...' : 'Search messages...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => {
                    setSelectedMessage(message);
                    markAsRead(message.id);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedMessage?.id === message.id
                      ? 'bg-[#184A2C]/10 border-2 border-[#184A2C]'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  } ${!message.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`text-sm font-medium truncate ${!message.read ? 'font-bold' : ''}`}>
                      {message.from}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(message.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Star className={`h-4 w-4 ${message.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                      </button>
                      {!message.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm mb-1 truncate ${!message.read ? 'font-semibold' : ''}`}>
                    {message.subject}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {message.body}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.date}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Message View */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedMessage.subject}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{selectedMessage.from}</span>
                    <span>•</span>
                    <span>{selectedMessage.date}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Reply className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'رد' : 'Reply'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Forward className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'إعادة توجيه' : 'Forward'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteMessage(selectedMessage.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{selectedMessage.body}</p>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <Mail className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">
                {language === 'ar' ? 'لم يتم تحديد رسالة' : 'No message selected'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'ar' 
                  ? 'اختر رسالة من القائمة لعرضها' 
                  : 'Select a message from the list to view it'}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Send className="h-6 w-6 text-[#184A2C]" />
              {language === 'ar' ? 'رسالة جديدة' : 'New Message'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'اكتب رسالتك وأرسلها' 
                : 'Compose and send your message'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Input
                placeholder={language === 'ar' ? 'إلى:' : 'To:'}
                value={composeForm.to}
                onChange={(e) => setComposeForm({ ...composeForm, to: e.target.value })}
              />
            </div>

            <div>
              <Input
                placeholder={language === 'ar' ? 'الموضوع:' : 'Subject:'}
                value={composeForm.subject}
                onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
              />
            </div>

            <div>
              <Textarea
                placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Write your message...'}
                value={composeForm.body}
                onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                rows={8}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSendMessage}
              className="bg-gradient-to-r from-[#184A2C] to-green-700 hover:from-green-700 hover:to-[#184A2C]"
            >
              <Send className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'إرسال' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
