// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.15.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Definição das ferramentas que o Gemini pode usar
const tools = [
  {
    function_declarations: [
      {
        name: "listAssets",
        description: "Lista todos os ativos registrados no sistema, opcionalmente filtrando por termo de busca e status.",
        parameters: {
          type: "OBJECT",
          properties: {
            searchTerm: {
              type: "STRING",
              description: "Termo de busca para filtrar ativos por nome ou código de identificação."
            },
            status: {
              type: "STRING",
              enum: ["active", "in_maintenance", "depreciated"],
              description: "Status do ativo para filtrar (ativo, em_manutencao, depreciado)."
            }
          },
          required: []
        }
      },
      {
        name: "createAsset",
        description: "Cria um novo ativo no sistema.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: {
              type: "STRING",
              description: "Nome do ativo (obrigatório)."
            },
            tag_code: {
              type: "STRING",
              description: "Código de identificação do ativo (obrigatório)."
            },
            description: {
              type: "STRING",
              description: "Descrição detalhada do ativo."
            },
            acquisition_date: {
              type: "STRING",
              format: "date",
              description: "Data de aquisição do ativo no formato YYYY-MM-DD."
            },
            supplier: {
              type: "STRING",
              description: "Nome do fornecedor do ativo."
            },
            value: {
              type: "NUMBER",
              description: "Valor de aquisição do ativo."
            },
            useful_life_years: {
              type: "NUMBER",
              description: "Vida útil esperada do ativo em anos."
            },
            status: {
              type: "STRING",
              enum: ["active", "in_maintenance", "depreciated"],
              description: "Status inicial do ativo (padrão: active)."
            },
            department_id: {
              type: "STRING",
              description: "ID do departamento ao qual o ativo pertence."
            },
            custodian_id: {
              type: "STRING",
              description: "ID do usuário responsável pelo ativo."
            }
          },
          required: ["name", "tag_code"]
        }
      },
      {
        name: "listMaintenanceRecords",
        description: "Lista todos os registros de manutenção, opcionalmente filtrando por nome do ativo e status da manutenção.",
        parameters: {
          type: "OBJECT",
          properties: {
            assetName: {
              type: "STRING",
              description: "Nome do ativo para filtrar os registros de manutenção."
            },
            status: {
              type: "STRING",
              enum: ["Agendada", "Em Andamento", "Concluída", "Cancelada"],
              description: "Status da manutenção para filtrar."
            }
          },
          required: []
        }
      }
    ]
  }
];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Edge Function: Request received. Method:", req.method);
    console.log("Edge Function: All headers:", Object.fromEntries(req.headers.entries()));

    // Lê o corpo da requisição diretamente como JSON
    const { prompt } = await req.json();
    console.log("Edge Function: Prompt recebido:", prompt);

    if (!prompt) {
      return new Response(JSON.stringify({ error: "O prompt é obrigatório." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("Edge Function: GEMINI_API_KEY não está configurada!");
      throw new Error("A chave de API do Gemini não está configurada.");
    }
    console.log("Edge Function: GEMINI_API_KEY está configurada.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro", tools });

    // Obter o token de autenticação do usuário
    const authHeader = req.headers.get('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    console.log("Edge Function: Token de autorização presente:", !!token);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    // Obter o usuário autenticado para RLS e user_id
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.warn("Edge Function: Nenhum usuário autenticado para a Edge Function. RLS pode restringir o acesso. Erro:", userError?.message);
    } else {
      console.log("Edge Function: Usuário autenticado:", user.id);
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = result.response;
    const functionCall = response.functionCall();

    if (functionCall) {
      const { name, args } = functionCall;
      console.log("Edge Function: Chamada de função detectada:", name, "com argumentos:", args);
      let functionResult;

      switch (name) {
        case "listAssets": {
          let query = supabase.from('assets').select('*');
          if (args.searchTerm) {
            query = query.or(`name.ilike.%${args.searchTerm}%,tag_code.ilike.%${args.searchTerm}%`);
          }
          if (args.status) {
            query = query.eq('status', args.status);
          }
          const { data, error } = await query;
          if (error) {
            console.error("Edge Function: Erro ao listar ativos:", error);
            throw error;
          }
          functionResult = data;
          console.log("Edge Function: Resultado de listAssets:", functionResult);
          break;
        }
        case "createAsset": {
          if (!user) throw new Error("Usuário não autenticado para criar ativos.");
          const { data, error } = await supabase.from('assets').insert({ ...args, user_id: user.id }).select().single();
          if (error) {
            console.error("Edge Function: Erro ao criar ativo:", error);
            throw error;
          }
          functionResult = data;
          console.log("Edge Function: Resultado de createAsset:", functionResult);
          break;
        }
        case "listMaintenanceRecords": {
          let query = supabase.from('maintenance_records').select('*, assets(name, tag_code)');
          if (args.assetName) {
            query = query.ilike('assets.name', `%${args.assetName}%`);
          }
          if (args.status) {
            query = query.eq('status', args.status);
          }
          const { data, error } = await query;
          if (error) {
            console.error("Edge Function: Erro ao listar registros de manutenção:", error);
            throw error;
          }
          functionResult = data;
          console.log("Edge Function: Resultado de listMaintenanceRecords:", functionResult);
          break;
        }
        default:
          throw new Error(`Função desconhecida: ${name}`);
      }

      // Enviar o resultado da função de volta ao Gemini para uma resposta natural
      const secondResult = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: prompt }] },
          { role: "function", parts: [{ functionResponse: { name, response: functionResult } }] }
        ],
      });
      const secondResponse = secondResult.response;
      const text = secondResponse.text();
      
      return new Response(JSON.stringify({ response: text, functionCalled: { name, args, result: functionResult } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      // Se não houver chamada de função, retorna a resposta de texto normal
      const text = response.text();
      console.log("Edge Function: Resposta de texto do Gemini:", text);
      return new Response(JSON.stringify({ response: text }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error) {
    console.error("Edge Function: Erro capturado no bloco try-catch principal:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});