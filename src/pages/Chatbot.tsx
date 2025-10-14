import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Mic, Volume2, Loader2, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AuthGuard from '@/components/AuthGuard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVoiceInput } from '@/hooks/useVoiceInput';

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
    const loadPreferredLanguage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('profiles')
          .select('language')
          .eq('user_id', user.id)
          .single();
        if (data?.language) {
          setLanguage(data.language);
        }
      } catch (e) {
        // ignore and keep default
      }
    };
    loadPreferredLanguage();
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

  const { isListening, startListening, stopListening } = useVoiceInput({
    onTranscript: (text) => {
      setInput(text);
      handleSend();
    },
    language,
  });

  const sanitizeForSpeech = (raw: string): string => {
    let s = raw;
    // Remove code blocks and inline code
    s = s.replace(/```[\s\S]*?```/g, ' ');
    s = s.replace(/`([^`]*)`/g, '$1');
    // Strip markdown links, keep label
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
    // Remove images syntax ![alt](url)
    s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
    // Remove bare URLs
    s = s.replace(/https?:\/\/\S+/g, ' ');
    // Replace common symbols with words
    s = s.replace(/&/g, ' and ');
    s = s.replace(/%/g, ' percent ');
    s = s.replace(/\*/g, ' ');
    s = s.replace(/[#_~^><`|]/g, ' ');
    s = s.replace(/•/g, ' ');
    s = s.replace(/\+/g, ' plus ');
    s = s.replace(/\//g, ' slash ');
    // Remove emoji and non-word pictographs
    s = s.replace(/[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{2600}-\u{27BF}]/gu, ' ');
    // Collapse multiple punctuation
    s = s.replace(/[.,!?;:]{2,}/g, '. ');
    // Normalize whitespace and newlines to pauses
    s = s.replace(/[\r\t]+/g, ' ');
    s = s.replace(/\n{2,}/g, '. ');
    s = s.replace(/\n/g, ', ');
    s = s.replace(/\s{2,}/g, ' ');
    return s.trim();
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(sanitizeForSpeech(text));
      const languageMap: Record<string, string> = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'ta': 'ta-IN',
        'te': 'te-IN',
        'bn': 'bn-IN',
        'mr': 'mr-IN',
        'gu': 'gu-IN',
        'kn': 'kn-IN',
        'ml': 'ml-IN',
        'pa': 'pa-IN'
      };
      const targetLang = languageMap[language] || 'en-IN';

      const setAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const match = voices.find(v => v.lang?.toLowerCase() === targetLang.toLowerCase())
          || voices.find(v => v.lang?.toLowerCase().startsWith(targetLang.split('-')[0].toLowerCase()))
          || null;
        if (match) utterance.voice = match;
        utterance.lang = match?.lang || targetLang;
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => setAndSpeak();
      } else {
        setAndSpeak();
      }
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
              <Select
                value={language}
                onValueChange={async (value) => {
                  setLanguage(value);
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    await supabase
                      .from('profiles')
                      .update({ language: value })
                      .eq('user_id', user.id);
                  } catch (e) {
                    // non-blocking; ignore persistence errors
                  }
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी</SelectItem>
                  <SelectItem value="ta">தமிழ்</SelectItem>
                  <SelectItem value="te">తెలుగు</SelectItem>
                  <SelectItem value="bn">বাংলা</SelectItem>
                  <SelectItem value="mr">मराठी</SelectItem>
                  <SelectItem value="gu">ગુજરાતી</SelectItem>
                  <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
                  <SelectItem value="ml">മലയാളം</SelectItem>
                  <SelectItem value="pa">ਪੰਜਾਬੀ</SelectItem>
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
            <Button 
              variant={isListening ? "destructive" : "outline"} 
              size="icon"
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};

export default Chatbot;
