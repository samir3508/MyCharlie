import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Initialiser le client Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ [MCP Server] Variables d\'environnement manquantes:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.error('✅ [MCP Server] Client Supabase initialisé:', supabaseUrl);

// Créer le serveur MCP
const server = new Server(
  {
    name: 'leo-supabase-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Lister les outils disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('📋 [MCP Server] Liste des outils demandée');

  return {
    tools: [
      {
        name: 'list_tables',
        description: 'Liste toutes les tables de la base de données dans le schéma public',
        inputSchema: {
          type: 'object',
          properties: {
            schemas: {
              type: 'array',
              items: { type: 'string' },
              default: ['public'],
              description: 'Liste des schémas à interroger',
            },
          },
        },
      },
      {
        name: 'describe_table',
        description: 'Décrit la structure d\'une table (colonnes, types, contraintes)',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Nom de la table à décrire',
            },
          },
          required: ['table'],
        },
      },
      {
        name: 'query',
        description: 'Exécute une requête SQL SELECT (lecture seule)',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Requête SQL SELECT à exécuter',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'list_clients',
        description: 'Liste les clients d\'un tenant',
        inputSchema: {
          type: 'object',
          properties: {
            tenant_id: {
              type: 'string',
              description: 'ID du tenant (UUID)',
            },
            limit: {
              type: 'number',
              default: 20,
              description: 'Nombre maximum de résultats',
            },
          },
          required: ['tenant_id'],
        },
      },
      {
        name: 'get_client',
        description: 'Récupère un client par son ID',
        inputSchema: {
          type: 'object',
          properties: {
            client_id: {
              type: 'string',
              description: 'ID du client (UUID)',
            },
          },
          required: ['client_id'],
        },
      },
      {
        name: 'create_client',
        description: 'Crée un nouveau client',
        inputSchema: {
          type: 'object',
          properties: {
            tenant_id: {
              type: 'string',
              description: 'ID du tenant (UUID)',
            },
            nom: {
              type: 'string',
              description: 'Nom du client',
            },
            prenom: {
              type: 'string',
              description: 'Prénom du client',
            },
            email: {
              type: 'string',
              description: 'Email du client (optionnel)',
            },
            telephone: {
              type: 'string',
              description: 'Téléphone du client (optionnel)',
            },
          },
          required: ['tenant_id', 'nom', 'prenom'],
        },
      },
      {
        name: 'list_devis',
        description: 'Liste les devis d\'un tenant',
        inputSchema: {
          type: 'object',
          properties: {
            tenant_id: {
              type: 'string',
              description: 'ID du tenant (UUID)',
            },
            statut: {
              type: 'string',
              description: 'Filtrer par statut (optionnel)',
            },
            limit: {
              type: 'number',
              default: 20,
            },
          },
          required: ['tenant_id'],
        },
      },
      {
        name: 'get_devis',
        description: 'Récupère un devis par son ID avec ses lignes',
        inputSchema: {
          type: 'object',
          properties: {
            devis_id: {
              type: 'string',
              description: 'ID du devis (UUID)',
            },
          },
          required: ['devis_id'],
        },
      },
    ],
  };
});

// Gérer les appels d'outils
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  console.error(`🔧 [MCP Server] Appel de l'outil: ${name}`);
  console.error(`📥 [MCP Server] Arguments:`, JSON.stringify(args, null, 2));

  try {
    switch (name) {
      case 'list_tables': {
        const schemas = (args as any)?.schemas || ['public'];
        const schemaList = Array.isArray(schemas) ? schemas : [schemas];

        const { data, error } = await supabase.rpc('exec_sql', {
          query: `
            SELECT 
              table_schema,
              table_name,
              table_type
            FROM information_schema.tables
            WHERE table_schema = ANY($1::text[])
              AND table_type = 'BASE TABLE'
            ORDER BY table_schema, table_name;
          `,
          params: [schemaList],
        });

        if (error) {
          // Si exec_sql n'existe pas, utiliser une requête directe
          const { data: tablesData, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_type', 'BASE TABLE');

          if (tablesError) throw tablesError;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  (tablesData || []).map((t: any) => t.table_name),
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'describe_table': {
        const tableName = (args as any)?.table as string;

        // Récupérer les colonnes
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .order('ordinal_position');

        if (columnsError) throw columnsError;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  table: tableName,
                  columns: columns || [],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'query': {
        const query = (args as any)?.query as string;

        // Vérifier que c'est une requête SELECT
        if (!query.trim().toUpperCase().startsWith('SELECT')) {
          throw new Error('Seules les requêtes SELECT sont autorisées');
        }

        // Exécuter la requête via Supabase
        // Note: Supabase ne supporte pas l'exécution SQL directe sans fonction RPC
        // Ici on va utiliser une approche alternative
        throw new Error(
          'L\'exécution de requêtes SQL directes nécessite une fonction RPC. Utilisez list_tables, describe_table ou les outils spécifiques.'
        );
      }

      case 'list_clients': {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('tenant_id', (args as any)?.tenant_id)
          .order('created_at', { ascending: false })
          .limit((args as any)?.limit || 20);

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data || [], null, 2),
            },
          ],
        };
      }

      case 'get_client': {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', (args as any)?.client_id)
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'create_client': {
        const { data, error } = await supabase
          .from('clients')
          .insert({
            tenant_id: (args as any)?.tenant_id,
            nom: (args as any)?.nom,
            prenom: (args as any)?.prenom,
            nom_complet: `${(args as any)?.prenom} ${(args as any)?.nom}`,
            email: (args as any)?.email || null,
            telephone: (args as any)?.telephone || null,
            type: 'particulier',
          })
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `✅ Client créé avec succès:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'list_devis': {
        let query = supabase
          .from('devis')
          .select(
            `
            *,
            clients (
              nom_complet,
              email
            )
          `
          )
          .eq('tenant_id', (args as any)?.tenant_id);

        if ((args as any)?.statut) {
          query = query.eq('statut', (args as any)?.statut);
        }

        const { data, error } = await query
          .order('created_at', { ascending: false })
          .limit((args as any)?.limit || 20);

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data || [], null, 2),
            },
          ],
        };
      }

      case 'get_devis': {
        const { data, error } = await supabase
          .from('devis')
          .select(
            `
            *,
            clients (*),
            lignes_devis (*)
          `
          )
          .eq('id', (args as any)?.devis_id)
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Outil inconnu: ${name}`);
    }
  } catch (error: any) {
    console.error(`❌ [MCP Server] Erreur avec l'outil ${name}:`, error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Erreur: ${error.message || error.toString()}`,
        },
      ],
      isError: true,
    };
  }
});

// Démarrer le serveur
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 [MCP Server] Serveur MCP LÉO Supabase démarré et prêt');
}

main().catch((error) => {
  console.error('❌ [MCP Server] Erreur fatale:', error);
  process.exit(1);
});
