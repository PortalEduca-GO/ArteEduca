
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Save, User as UserIcon, Building, Hash, Map, Phone, Mail, Lock } from "lucide-react";
import EscolaFields from "@/components/escola/EscolaFields"; // Importar o componente compartilhado

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [availableRoles, setAvailableRoles] = useState(['professor']);

  const loadUserData = useCallback(async () => {
    try {
      const userData = await User.me();
      const normalizedUser = userData || {};
      const adminRoleList = ['admin', 'gestor', 'articulador', 'professor'];
      const rawRoles = Array.isArray(normalizedUser.available_roles) ? normalizedUser.available_roles : [];
      const isAdminAccount = Boolean(normalizedUser.is_admin_account || rawRoles.includes('admin'));

      let roles = [];
      if (isAdminAccount) {
        roles = adminRoleList;
      } else {
        const fallbackRole = normalizedUser.app_role || 'professor';
        roles = rawRoles.filter((role) => role !== 'admin');

        if (!roles.includes(fallbackRole)) {
          roles = [...roles, fallbackRole];
        }

        if (roles.length === 0) {
          roles = [fallbackRole];
        }
      }

      setUser(normalizedUser);
      setAvailableRoles(Array.from(new Set(roles)));
      setFormData({ ...normalizedUser, available_roles: roles, is_admin_account: isAdminAccount });
      setIsAdmin(isAdminAccount);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      navigate(createPageUrl("Dashboard"));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const adminRoleList = ['admin', 'gestor', 'articulador', 'professor'];
      const rolesToPersist = isAdmin
        ? adminRoleList
        : Array.from(new Set((availableRoles || []).filter((role) => role !== 'admin')));

      const currentRole = formData.app_role || 'professor';
      if (!rolesToPersist.includes(currentRole)) {
        rolesToPersist.push(currentRole);
      }

      const dataToSave = {
        ...formData,
        available_roles: rolesToPersist,
        is_admin_account: isAdmin,
      };
      
      // Limpeza de campos de texto de erro antes de salvar
      if (dataToSave.unidadeEducacional === 'Nenhuma unidade educacional encontrada com este INEP.' || 
          dataToSave.unidadeEducacional === 'Erro ao buscar unidade educacional.') {
        dataToSave.unidadeEducacional = '';
      }
      if (dataToSave.unidadeEducacionalSecundaria === 'Nenhuma unidade educacional encontrada com este INEP.' ||
          dataToSave.unidadeEducacionalSecundaria === 'Erro ao buscar unidade educacional.') {
        dataToSave.unidadeEducacionalSecundaria = '';
      }
       if (dataToSave.unidadeEducacionalTerciaria === 'Nenhuma unidade educacional encontrada com este INEP.' ||
          dataToSave.unidadeEducacionalTerciaria === 'Erro ao buscar unidade educacional.') {
        dataToSave.unidadeEducacionalTerciaria = '';
      }

      await User.updateMyUserData(dataToSave);
      alert("Perfil atualizado com sucesso!");
      
      const isProfileComplete = dataToSave.cpf && dataToSave.cre && dataToSave.inep;
      
      if (isProfileComplete) {
        window.location.href = createPageUrl("Dashboard");
      } else {
        window.location.reload();
      }
      
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert("Ocorreu um erro ao salvar seu perfil.");
    } finally {
      setSaving(false);
    }
  };
  
  const renderField = (id, label, placeholder, icon, required = false) => {
    const Icon = icon;
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon className="w-5 h-5 text-gray-400" />
          </span>
          <input
            id={id}
            type="text"
            value={formData[id] || ''}
            onChange={(e) => handleInputChange(id, e.target.value)}
            className="neu-input w-full pl-10 pr-4 py-3"
            placeholder={placeholder}
            required={required}
          />
        </div>
      </div>
    );
  }

  const roleLabels = {
    admin: 'Administrador',
    gestor: 'Gestor',
    articulador: 'Articulador',
    professor: 'Professor',
  };

  if (loading) {
    return <div className="text-center p-8">Carregando perfil...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="neu-card p-6">
        <h1 className="text-2xl font-bold text-gray-800">Editar Perfil</h1>
        <p className="text-gray-600 mt-1">Mantenha seus dados sempre atualizados.</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="neu-card p-6 space-y-6">
          
            {/* Bloco de Dados Pessoais e de Acesso */}
            <div className="neu-inset p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-4">Dados Pessoais e de Acesso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderField('full_name', 'Nome Completo', 'Seu nome completo', UserIcon, true)}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Mail className="w-5 h-5 text-gray-400" />
                            </span>
                            <input 
                              id="email" 
                              type="email" 
                              value={formData.email || user?.email || ''} 
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="neu-input w-full pl-10 pr-4 py-3"
                              placeholder="seu.email@exemplo.com"
                            />
                        </div>
                    </div>
                    {renderField('cpf', 'CPF *', '000.000.000-00', Hash, true)}
                    {renderField('rg', 'RG', '0.000.000', Hash)}
                    {renderField('telefone', 'Telefone', '(00) 00000-0000', Phone)}
                    <div>
                        <label htmlFor="dataNascimento" className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                        <input
                            id="dataNascimento"
                            type="date"
                            value={formData.dataNascimento || ''}
                            onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                            className="neu-input w-full px-4 py-3"
                        />
                    </div>
                    <div>
                        <label htmlFor="app_role" className="block text-sm font-medium text-gray-700 mb-1">Seu Perfil</label>
                        <select
                            id="app_role"
                            value={formData.app_role || 'professor'}
                            onChange={(e) => handleInputChange('app_role', e.target.value)}
                            className="neu-input w-full px-4 py-3"
                            disabled={!isAdmin}
                        >
                            {availableRoles.map((role) => (
                              <option key={role} value={role}>
                                {roleLabels[role] || role}
                              </option>
                            ))}
                        </select>
                        {isAdmin ? (
                          <p className="text-xs text-gray-500 mt-1">
                            Administrador: selecione o perfil que deseja simular e salve as alterações.
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">O perfil de acesso só pode ser alterado por um administrador.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bloco da Escola Principal */}
            <div className="neu-inset p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-4">Unidade Educacional Principal</h3>
                <EscolaFields 
                  values={formData}
                  onChange={handleInputChange}
                  fieldPrefix=""
                  required={true}
                />
            </div>
            
            {/* Bloco da Escola Secundária */}
            <div className="neu-inset p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-4">Unidade Educacional Secundária (Opcional)</h3>
                 <EscolaFields 
                  values={formData}
                  onChange={handleInputChange}
                  fieldPrefix="Secundaria"
                  fieldSuffix="Secundaria"
                />
            </div>

            {/* Bloco da Escola Terciária */}
            <div className="neu-inset p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-4">Unidade Educacional Terciária (Opcional)</h3>
                 <EscolaFields 
                  values={formData}
                  onChange={handleInputChange}
                  fieldPrefix="Terciaria"
                  fieldSuffix="Terciaria"
                />
            </div>

        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="neu-button-primary px-6 py-3 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
