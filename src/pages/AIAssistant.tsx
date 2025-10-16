import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client'; // Importar o cliente Supabase

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { id: messages.length + 1, sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      // Invocar a Edge Function do Supabase
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { prompt: input },
      });

      if (error) {
        throw new Error(error.message);
      }

      const aiResponse: Message = { id: messages.length + 2, sender: 'ai', text: data.response };
      setMessages((prev) => [...prev, aiResponse]);

    } catch (err: any) {
      console.error("Erro ao chamar a Edge Function do Gemini:", err);
      toast.error(`Erro ao se comunicar com o assistente: ${err.message}`);
      const errorMessage: Message = { id: messages.length + 2, sender: 'ai', text: "Desculpe, houve um erro ao processar sua solicitação." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
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
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {msg.text}
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