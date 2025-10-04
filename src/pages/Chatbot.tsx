import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Mic, Volume2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import AuthGuard from '@/components/AuthGuard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(20);

      if (data) {
        const chatMessages: Message[] = data.flatMap((msg) => [
          {
            id: `${msg.id}-user`,
            role: 'user' as const,
            content: msg.message,
            timestamp: new Date(msg.created_at),
          },
          ...(msg.response
            ? [
                {
                  id: `${msg.id}-assistant`,
                  role: 'assistant' as const,
                  content: msg.response,
                  timestamp: new Date(msg.created_at),
                },
              ]
            : []),
        ]);
        setMessages(chatMessages);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: {
          message: input,
          language,
          history: messages.slice(-5).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to get response',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl font-bold">AI Assistant</h1>
                <p className="text-xs text-muted-foreground">Ask anything about farming</p>
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
                <CardContent className="py-8">
                  <h2 className="text-xl font-semibold text-center mb-4">
                    {language === 'hi'
                      ? 'नमस्ते! मैं आपकी कैसे मदद कर सकता हूं?'
                      : 'Hello! How can I help you today?'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      language === 'hi'
                        ? 'धान की खेती के लिए सबसे अच्छा समय क्या है?'
                        : 'What is the best time to plant rice?',
                      language === 'hi'
                        ? 'टमाटर के पत्ते पीले क्यों हो रहे हैं?'
                        : 'Why are my tomato leaves turning yellow?',
                      language === 'hi'
                        ? 'जैविक खाद कैसे बनाएं?'
                        : 'How do I make organic compost?',
                      language === 'hi'
                        ? 'कीट नियंत्रण के प्राकृतिक तरीके?'
                        : 'Natural ways to control pests?',
                    ].map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="text-left h-auto py-3 px-4"
                        onClick={() => setInput(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card
                    className={`max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card'
                    }`}
                  >
                    <CardContent className="py-3 px-4">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.role === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-6 px-2"
                          onClick={() => speakText(message.content)}
                        >
                          <Volume2 className="w-3 h-3 mr-1" />
                          Listen
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-card">
                  <CardContent className="py-3 px-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </CardContent>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder={
                language === 'hi' ? 'अपना सवाल यहां टाइप करें...' : 'Type your question here...'
              }
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              variant="default"
              size="icon"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon">
              <Mic className="w-5 h-5" />
            </Button>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};

export default Chatbot;
