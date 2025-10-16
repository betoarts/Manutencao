import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client'; // Importação adicionada
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  functionResult?: any;
}

const AIAssistant: React.FC = () => {
  const { session } = useSupabase();
  const [messages, setMessages] = useState<Message[]>([]); // Declaração adicionada
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false); // Declaração adicionada, renomeada de 'loading' para 'isSending' para consistência

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { id: messages.length + 1, sender: 'user', text: input };
    setMessages((prev: Message[]) => [...prev, userMessage]);
    setIsSending(true); // Usando isSending
    setInput(''); // Usando setInput

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { prompt: input },
        headers: headers,
      });

      if (error) {
        console.error('Erro ao chamar a Edge Function do Gemini:', error);
        toast.error(`Erro ao se comunicar com o assistente: ${error.message}`);
        const errorMessage: Message = { id: messages.length + 2, sender: 'ai', text: "Desculpe, houve um erro ao processar sua solicitação." };
        setMessages((prev: Message[]) => [...prev, errorMessage]);
      } else {
        const aiResponse: Message = { 
          id: messages.length + 2, 
          sender: 'ai', 
          text: data.response,
          functionResult: data.functionCalled?.result
        };
        setMessages((prev: Message[]) => [...prev, aiResponse]);
      }
    } catch (err: any) {
      console.error("Erro ao chamar a Edge Function do Gemini:", err);
      toast.error(`Erro ao se comunicar com o assistente: ${err.message}`);
      const errorMessage: Message = { id: messages.length + 2, sender: 'ai', text: "Desculpe, houve um erro ao processar sua solicitação." };
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setIsSending(false); // Usando isSending
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card className="h-[calc(100vh-150px)] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6" /> Assistente de IA (Gemini)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-4 overflow-hidden flex flex-col">
            <ScrollArea className="flex-grow pr-4 mb-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg flex items-start gap-2 ${
                        msg.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {msg.sender === 'ai' ? <Bot className="h-5 w-5 flex-shrink-0" /> : <User className="h-5 w-5 flex-shrink-0" />}
                      <div>
                        <p>{msg.text}</p>
                        {msg.functionResult && (
                          <pre className="mt-2 p-2 text-xs bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto max-h-40">
                            {JSON.stringify(msg.functionResult, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                placeholder="Pergunte algo ao assistente..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isSending) {
                    sendMessage();
                  }
                }}
                disabled={isSending}
              />
              <Button onClick={sendMessage} disabled={isSending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AIAssistant;