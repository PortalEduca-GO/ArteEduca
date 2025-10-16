// import { base44 } from './base44Client';
import Papa from 'papaparse';

// MODO DESENVOLVIMENTO: Mock das integrações
const mockIntegration = async (name, params) => {
  console.log(`[Mock] ${name} chamado com:`, params);
  return {
    success: true,
    message: `Mock de ${name} executado com sucesso`,
    data: params
  };
};

export const Core = {
  InvokeLLM: async (params) => {
    console.log('[Mock] InvokeLLM - chamado');
    return {
      success: true,
      response: "Esta é uma resposta simulada do LLM em modo desenvolvimento."
    };
  },
  
  SendEmail: async (params) => {
    console.log('[Mock] SendEmail - email simulado:', {
      to: params.to,
      subject: params.subject
    });
    return {
      success: true,
      message: 'Email simulado enviado com sucesso (modo desenvolvimento)'
    };
  },
  
  UploadFile: async (params) => {
    console.log('[Mock] UploadFile - arquivo recebido:', params.file?.name);
    // Criar URL temporário do arquivo
    const fileUrl = params.file ? URL.createObjectURL(params.file) : '#';
    return {
      success: true,
      file_url: fileUrl,  // Retornar file_url (não url)
      url: fileUrl,       // Manter também url para compatibilidade
      filename: params.file?.name || params.filename || 'arquivo.txt'
    };
  },
  
  GenerateImage: async (params) => {
    console.log('[Mock] GenerateImage - gerando imagem placeholder');
    const imageUrl = `https://via.placeholder.com/800x600?text=${encodeURIComponent(params.prompt || 'Imagem')}`;
    return {
      success: true,
      url: imageUrl,
      image_url: imageUrl,  // Algumas APIs usam image_url
      prompt: params.prompt
    };
  },
  
  ExtractDataFromUploadedFile: async (params) => {
    console.log('[Mock] ExtractDataFromUploadedFile - extraindo dados do arquivo');
    console.log('⚠️ Processamento LOCAL de arquivo - tentando ler conteúdo real');
    
    // Verificar se o schema espera um array (para importação de escolas)
    const isArraySchema = params.json_schema?.type === 'array';
    
    let output;
    
    if (isArraySchema) {
      // Tentar processar arquivo CSV/Excel real
      try {
        // Buscar o arquivo blob a partir da URL
        const response = await fetch(params.file_url);
        const text = await response.text();
        
        console.log('📄 Arquivo lido. Tamanho:', text.length, 'bytes');
        
        // Usar PapaParse para processar CSV
        const parseResult = await new Promise((resolve, reject) => {
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            complete: resolve,
            error: reject
          });
        });
        
        if (parseResult.errors.length > 0) {
          console.warn('⚠️ Avisos ao processar CSV:', parseResult.errors);
        }
        
        const rawData = parseResult.data;
        console.log(`📋 ${rawData.length} linhas encontradas no arquivo`);
        
        if (rawData.length === 0) {
          throw new Error('Arquivo vazio ou sem dados');
        }
        
        // Mostrar colunas encontradas
        const headers = Object.keys(rawData[0] || {});
        console.log('� Colunas detectadas:', headers);
        
        // Mapear nomes de colunas para os campos esperados (case-insensitive)
        const fieldMap = {
          'cre': ['cre', 'coordenadoria', 'coord'],
          'municipio': ['municipio', 'município', 'cidade', 'location'],
          'inep': ['inep', 'cod_inep', 'codigo_inep', 'código_inep', 'codigo'],
          'unidadeEducacional': ['unidadeeducacional', 'unidade_educacional', 'escola', 'nome', 'unidade', 'estabelecimento', 'nome_escola'],
          'email': ['email', 'e-mail', 'correio', 'contato']
        };
        
        // Normalizar os dados
        output = rawData.map(row => {
          const normalizedRow = {};
          
          // Para cada campo esperado, procurar a coluna correspondente
          Object.keys(fieldMap).forEach(field => {
            const possibleNames = fieldMap[field];
            
            // Procurar a primeira coluna que corresponda
            for (const name of possibleNames) {
              const foundKey = headers.find(h => 
                h.toLowerCase().replace(/[^a-z0-9]/g, '') === name.toLowerCase().replace(/[^a-z0-9]/g, '')
              );
              
              if (foundKey && row[foundKey]) {
                normalizedRow[field] = String(row[foundKey]).trim();
                break;
              }
            }
          });
          
          return normalizedRow;
        }).filter(row => {
          // Só incluir se tiver pelo menos escola ou INEP
          return row.unidadeEducacional || row.inep;
        });
        
        console.log(`✅ ${output.length} registros válidos extraídos`);
        
        if (output.length === 0) {
          throw new Error('Nenhum registro válido encontrado. Verifique se as colunas estão corretas.');
        }
        
        // Mostrar preview dos primeiros registros
        console.log('📝 Preview dos primeiros 3 registros:', output.slice(0, 3));
        
      } catch (error) {
        console.error('❌ Erro ao processar arquivo:', error);
        console.log('⚠️ Retornando dados de exemplo como fallback');
        
        // Fallback: retornar dados de exemplo
        output = [
          {
            cre: '1ª CRE',
            municipio: 'Rio de Janeiro',
            inep: '33041196',
            unidadeEducacional: 'Escola Municipal Exemplo 1 (Erro ao processar seu arquivo)',
            email: 'escola1@educacao.rj.gov.br'
          },
          {
            cre: '2ª CRE',
            municipio: 'Rio de Janeiro',
            inep: '33041197',
            unidadeEducacional: 'Colégio Estadual Exemplo 2 (Verifique o formato do arquivo)',
            email: 'escola2@educacao.rj.gov.br'
          },
          {
            cre: '3ª CRE',
            municipio: 'Niterói',
            inep: '33041198',
            unidadeEducacional: 'Centro Educacional Exemplo 3 (Use CSV com colunas: cre, municipio, inep, unidadeEducacional, email)',
            email: 'escola3@educacao.rj.gov.br'
          }
        ];
      }
    } else {
      // Retornar objeto de formulário (para importação de PDF)
      output = {
        title: 'Formulário Importado (Simulação)',
        description: 'Este é um formulário de exemplo criado a partir da simulação de extração de PDF',
        fields: [
          {
            id: 'field_1',
            type: 'text',
            label: 'Nome Completo',
            placeholder: 'Digite seu nome',
            required: true
          },
          {
            id: 'field_2',
            type: 'email',
            label: 'E-mail',
            placeholder: 'Digite seu e-mail',
            required: true
          },
          {
            id: 'field_3',
            type: 'text',
            label: 'Telefone',
            placeholder: 'Digite seu telefone',
            required: false
          },
          {
            id: 'field_4',
            type: 'textarea',
            label: 'Observações',
            placeholder: 'Digite observações adicionais',
            required: false
          }
        ]
      };
    }
    
    return {
      status: 'success',
      success: true,
      output: output,
      message: 'Dados extraídos com sucesso (simulação)'
    };
  },
  
  CreateFileSignedUrl: async (params) => {
    console.log('[Mock] CreateFileSignedUrl - criando URL assinada');
    return {
      success: true,
      url: params.fileUrl || params.file_url || '#',
      signed_url: params.fileUrl || params.file_url || '#'
    };
  },
  
  UploadPrivateFile: async (params) => {
    console.log('[Mock] UploadPrivateFile - arquivo privado simulado');
    const fileUrl = params.file ? URL.createObjectURL(params.file) : '#';
    return {
      success: true,
      file_url: fileUrl,
      url: fileUrl,
      filename: params.file?.name || 'arquivo-privado.txt'
    };
  }
};

export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;
export const CreateFileSignedUrl = Core.CreateFileSignedUrl;
export const UploadPrivateFile = Core.UploadPrivateFile;

// Para voltar ao Base44, descomente as linhas abaixo e comente as linhas acima:
/*
export const Core = base44.integrations.Core;
export const InvokeLLM = base44.integrations.Core.InvokeLLM;
export const SendEmail = base44.integrations.Core.SendEmail;
export const UploadFile = base44.integrations.Core.UploadFile;
export const GenerateImage = base44.integrations.Core.GenerateImage;
export const ExtractDataFromUploadedFile = base44.integrations.Core.ExtractDataFromUploadedFile;
export const CreateFileSignedUrl = base44.integrations.Core.CreateFileSignedUrl;
export const UploadPrivateFile = base44.integrations.Core.UploadPrivateFile;
*/






