import React, { useState } from "react";
import { Escola } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, CheckCircle, AlertCircle, Download } from "lucide-react";

export default function ImportarEscolas() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [imported, setImported] = useState(false);

  const handleFileUpload = async (uploadedFile) => {
    if (!uploadedFile) return;
    
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file: uploadedFile });
      setFile({ name: uploadedFile.name, url: file_url });
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao fazer upload do arquivo");
    } finally {
      setUploading(false);
    }
  };

  const processFile = async () => {
    if (!file) return;
    
    setProcessing(true);
    try {
      const jsonSchema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            cre: { type: "string" },
            municipio: { type: "string" },
            inep: { type: "string" },
            unidadeEducacional: { type: "string" },
            email: { type: "string" }
          },
          required: ["cre", "municipio", "inep", "unidadeEducacional"]
        }
      };

      const result = await ExtractDataFromUploadedFile({
        file_url: file.url,
        json_schema: jsonSchema
      });

      if (result.status === "success") {
        setResults(result.output);
      } else {
        alert("Erro ao processar arquivo: " + result.details);
      }
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      alert("Erro ao processar arquivo");
    } finally {
      setProcessing(false);
    }
  };

  const importSchools = async () => {
    if (!results || results.length === 0) return;
    
    try {
      // Usar bulkCreate para inserir todas as escolas
      await Escola.bulkCreate(results);
      setImported(true);
      alert(`${results.length} escolas importadas com sucesso!`);
    } catch (error) {
      console.error("Erro ao importar escolas:", error);
      alert("Erro ao importar escolas. Algumas podem já existir.");
    }
  };

  const downloadTemplate = () => {
    const csvContent = `cre,municipio,inep,unidadeEducacional,email
1ª CRE,Rio de Janeiro,33041196,Escola Municipal Exemplo,contato@escola.edu.br
2ª CRE,Niterói,33041197,Colégio Estadual Exemplo 2,escola2@educacao.rj.gov.br`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_escolas.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neu-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Importar Escolas</h1>
            <p className="text-gray-600">Importe uma lista de escolas via arquivo CSV ou Excel</p>
          </div>
          <Button onClick={downloadTemplate} className="neu-button flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Baixar Template</span>
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="neu-card p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">1. Fazer Upload do Arquivo</h2>
        
        {!file ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Arraste e solte o arquivo aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Formatos suportados: CSV, Excel (.xlsx)
            </p>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              className="hidden"
              id="file-upload"
            />
            <Button asChild className="neu-button">
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
              </label>
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-green-600" />
              <span className="font-medium text-green-800">{file.name}</span>
            </div>
            <Button
              onClick={() => setFile(null)}
              variant="ghost"
              size="sm"
            >
              Remover
            </Button>
          </div>
        )}
      </div>

      {/* Process File */}
      {file && !results && (
        <div className="neu-card p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">2. Processar Arquivo</h2>
          <p className="text-gray-600 mb-4">
            Clique para extrair e validar os dados do arquivo
          </p>
          <Button
            onClick={processFile}
            disabled={processing}
            className="neu-button"
          >
            {processing ? 'Processando...' : 'Processar Arquivo'}
          </Button>
        </div>
      )}

      {/* Results Preview */}
      {results && (
        <div className="neu-card p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">3. Prévia dos Dados</h2>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              <CheckCircle className="w-5 h-5 inline mr-2" />
              {results.length} escolas encontradas no arquivo
            </p>
          </div>
          
          <div className="overflow-x-auto mb-4">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">CRE</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Município</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">INEP</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Unidade Educacional</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Email</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 5).map((escola, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="px-4 py-3 text-gray-800">{escola.cre}</td>
                    <td className="px-4 py-3 text-gray-800">{escola.municipio}</td>
                    <td className="px-4 py-3 text-gray-800">{escola.inep}</td>
                    <td className="px-4 py-3 text-gray-800">{escola.unidadeEducacional}</td>
                    <td className="px-4 py-3 text-gray-800">{escola.email || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {results.length > 5 && (
              <p className="text-sm text-gray-500 mt-2">
                Mostrando 5 de {results.length} escolas...
              </p>
            )}
          </div>

          {!imported && (
            <Button
              onClick={importSchools}
              className="btn-primary flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Importar {results.length} Escolas</span>
            </Button>
          )}

          {imported && (
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-800">
                <CheckCircle className="w-5 h-5 inline mr-2" />
                Escolas importadas com sucesso!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="neu-card p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Instruções</h2>
        <div className="space-y-3 text-gray-600">
          <p>• O arquivo deve ter as colunas: <strong>cre, municipio, inep, unidadeEducacional, email</strong></p>
          <p>• O INEP deve ter 8 dígitos</p>
          <p>• Email é opcional</p>
          <p>• Baixe o template para ver o formato correto</p>
          <p>• Escolas duplicadas (mesmo INEP) serão ignoradas</p>
        </div>
      </div>
    </div>
  );
}