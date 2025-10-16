
import React, { useState, useEffect } from 'react';
import { Escola } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Building, MapPin, Hash, AlertCircle } from "lucide-react";

export default function EscolaFields({ 
  values = {}, 
  onChange, 
  fieldPrefix = '', 
  fieldSuffix = '',
  required = false,
  disabled = false 
}) {
  const [loading, setLoading] = useState(false);
  const [escolas, setEscolas] = useState([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadEscolas();
  }, []);

  const loadEscolas = async () => {
    try {
      const escolasData = await Escola.list();
      setEscolas(escolasData);
    } catch (error) {
      console.error("Erro ao carregar escolas:", error);
    }
  };

  const handleInepChange = async (inepValue) => {
    const cleanInep = inepValue.replace(/\D/g, ''); // Remove caracteres não numéricos
    onChange(getFieldName('inep'), cleanInep);
    setNotFound(false);

    if (cleanInep.length === 8) {
      setLoading(true);
      try {
        // Buscar escola pelo INEP
        const escola = escolas.find(e => e.inep === cleanInep);
        
        if (escola) {
          // Preencher campos automaticamente
          onChange(getFieldName('cre'), escola.cre || '');
          onChange(getFieldName('municipio'), escola.municipio || '');
          onChange(getFieldName('unidadeEducacional'), escola.unidadeEducacional || '');
          setNotFound(false);
        } else {
          setNotFound(true);
          // Limpar campos se escola não encontrada
          onChange(getFieldName('cre'), '');
          onChange(getFieldName('municipio'), '');
          onChange(getFieldName('unidadeEducacional'), '');
        }
      } catch (error) {
        console.error("Erro ao buscar escola:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    } else if (cleanInep.length === 0) {
      // Limpar campos quando INEP for removido
      onChange(getFieldName('cre'), '');
      onChange(getFieldName('municipio'), '');
      onChange(getFieldName('unidadeEducacional'), '');
    }
  };

  const getFieldName = (field) => {
    if (!fieldSuffix) return field;
    return field + fieldSuffix;
  };

  return (
    <div className="space-y-4">
      {/* INEP Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Código INEP {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={values[getFieldName('inep')] || ''}
            onChange={(e) => handleInepChange(e.target.value)}
            className="neu-input pl-10"
            placeholder="00000000"
            maxLength={8}
            disabled={disabled || loading}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        {notFound && values[getFieldName('inep')]?.length === 8 && (
          <div className="flex items-center mt-2 text-amber-600">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">Escola não encontrada. Verifique o INEP ou cadastre a escola.</span>
          </div>
        )}
      </div>

      {/* CRE Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CRE {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={values[getFieldName('cre')] || ''}
            onChange={(e) => onChange(getFieldName('cre'), e.target.value)}
            className="neu-input pl-10"
            placeholder="Coordenação Regional de Educação"
            disabled={disabled}
            readOnly={values[getFieldName('inep')]?.length === 8 && !notFound}
          />
        </div>
      </div>

      {/* Município Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Município {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={values[getFieldName('municipio')] || ''}
            onChange={(e) => onChange(getFieldName('municipio'), e.target.value)}
            className="neu-input pl-10"
            placeholder="Nome do município"
            disabled={disabled}
            readOnly={values[getFieldName('inep')]?.length === 8 && !notFound}
          />
        </div>
      </div>

      {/* Unidade Educacional Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Unidade Educacional {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={values[getFieldName('unidadeEducacional')] || ''}
            onChange={(e) => onChange(getFieldName('unidadeEducacional'), e.target.value)}
            className="neu-input pl-10"
            placeholder="Nome da Unidade Educacional"
            disabled={disabled}
            readOnly={values[getFieldName('inep')]?.length === 8 && !notFound}
          />
        </div>
      </div>
    </div>
  );
}
