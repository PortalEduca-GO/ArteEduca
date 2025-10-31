
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Plus, 
  Edit, 
  Save, 
  X, 
  Trash2, 
  UserCheck,
  Shield,
  GraduationCap,
  Building,
  Crown,
  Lock, // Adicionado ícone de cadeado
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import EscolaFields from "@/components/escola/EscolaFields"; // Importado o componente EscolaFields
import { validateUser, validateEmail, validateCPF } from "@/utils/validation";
import { toast } from "sonner";

export default function GerenciarUsuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '', // Campo para a senha
    cpf: '',
    rg: '',
    dataNascimento: '',
    telefone: '',
    app_role: 'professor',
    cre: '',
    municipio: '',
    inep: '', // Alterado de inepPrincipal para inep
    unidadeEducacional: '', // Alterado de unidadeEducacionalPrincipal para unidadeEducacional
    creSecundaria: '',
    municipioSecundaria: '',
    inepSecundaria: '',
    unidadeEducacionalSecundaria: '',
    isActive: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const [userData, usersData] = await Promise.all([
        User.me(),
        User.list()
      ]);
      
      setCurrentUser(userData);
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (userData, isNew = false) => {
    // Validar dados
    const validation = validateUser(userData, isNew);
    if (!validation.valid) {
      toast.error('Erro de Validação', {
        description: (
          <div>
            <p className="font-semibold mb-2">Corrija os seguintes erros:</p>
            <ul className="list-disc pl-5 space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        ),
        duration: 6000,
      });
      return;
    }

    // Verificar email duplicado
    if (isNew) {
      const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
      if (existingUser) {
        toast.error('Email já cadastrado', {
          description: 'Este email já está sendo usado por outro usuário.',
        });
        return;
      }
    } else {
      const existingUser = users.find(u => u.id !== userData.id && u.email.toLowerCase() === userData.email.toLowerCase());
      if (existingUser) {
        toast.error('Email já cadastrado', {
          description: 'Este email já está sendo usado por outro usuário.',
        });
        return;
      }
    }

    // Verificar CPF duplicado
    const cleanCPF = userData.cpf.replace(/\D/g, '');
    if (isNew) {
      const existingCPF = users.find(u => u.cpf.replace(/\D/g, '') === cleanCPF);
      if (existingCPF) {
        toast.error('CPF já cadastrado', {
          description: 'Este CPF já está sendo usado por outro usuário.',
        });
        return;
      }
    } else {
      const existingCPF = users.find(u => u.id !== userData.id && u.cpf.replace(/\D/g, '') === cleanCPF);
      if (existingCPF) {
        toast.error('CPF já cadastrado', {
          description: 'Este CPF já está sendo usado por outro usuário.',
        });
        return;
      }
    }

    setSaving(true);
    try {
      if (isNew) {
        await User.create(userData);
        toast.success("Usuário criado com sucesso!");
        setShowAddForm(false);
        setNewUser({
          full_name: '',
          email: '',
          password: '', // Limpar senha após criação
          cpf: '',
          rg: '',
          dataNascimento: '',
          telefone: '',
          app_role: 'professor',
          cre: '',
          municipio: '',
          inep: '', // Limpar inep
          unidadeEducacional: '', // Limpar unidadeEducacional
          creSecundaria: '',
          municipioSecundaria: '',
          inepSecundaria: '',
          unidadeEducacionalSecundaria: '',
          isActive: true
        });
      } else {
        // Remove isActive from update data to prevent accidental changes when updating user details.
        // isActive changes are handled by handleToggleUserStatus.
        const { isActive, ...updateData } = userData;
        await User.update(userData.id, updateData);
        toast.success("Usuário atualizado com sucesso!");
        setEditingUser(null);
      }
      loadUsers();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast.error("Erro ao salvar usuário. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível.")) {
      return;
    }
    setSaving(true); // Reusing saving state to disable buttons during delete
    try {
      await User.delete(userId);
      toast.success("Usuário excluído com sucesso!");
      loadUsers(); // Reload the list of users
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      toast.error("Erro ao excluir usuário. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    if (!window.confirm(`Tem certeza que deseja ${user.isActive ? 'DESATIVAR' : 'ATIVAR'} este usuário?`)) {
        return;
    }
    setSaving(true);
    try {
        await User.update(user.id, { isActive: !user.isActive });
        toast.success(`Usuário ${user.isActive ? 'desativado' : 'ativado'} com sucesso!`);
        loadUsers();
    } catch (error) {
        console.error("Erro ao alterar status do usuário:", error);
        toast.error("Erro ao alterar o status do usuário. Tente novamente.");
    } finally {
        setSaving(false);
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'articulador': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'gestor': return <Building className="w-4 h-4 text-green-600" />;
      case 'professor': return <GraduationCap className="w-4 h-4 text-purple-600" />;
      default: return <UserCheck className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleName = (role) => {
    switch(role) {
      case 'admin': return 'Administrador';
      case 'articulador': return 'Articulador';
      case 'gestor': return 'Gestor';
      case 'professor': return 'Professor';
      default: return 'Usuário';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="neu-card p-6 sm:p-8">
          <div className="animate-pulse text-gray-600">Carregando usuários...</div>
        </div>
      </div>
    );
  }

  // Use o 'role' fundamental para verificar a permissão de acesso.
  if ((currentUser?.app_role || currentUser?.role) !== 'admin') {
    return (
      <div className="neu-card p-6">
        <div className="text-center py-8">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800">Acesso Negado</h2>
          <p className="text-gray-600 mt-2">Apenas administradores podem gerenciar usuários.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neu-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gerenciar Usuários</h1>
              <p className="text-gray-600">Gerencie usuários e suas funções no sistema</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="neu-button flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </Button>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="neu-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Adicionar Novo Usuário</h2>
            <Button 
              onClick={() => setShowAddForm(false)}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-6">
            {/* Bloco de Dados Pessoais */}
            <div className="neu-inset p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-4">Dados do Usuário</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <Input
                    placeholder="Nome Completo *"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                    className="neu-input"
                  />
                  <Input
                    placeholder="Email *"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="neu-input"
                  />
                  <div className="relative">
                    <Input
                      placeholder="Senha *"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="neu-input pr-10"
                    />
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  <Select value={newUser.app_role} onValueChange={(value) => setNewUser({...newUser, app_role: value})}>
                    <SelectTrigger className="neu-input">
                      <SelectValue placeholder="Função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professor">Professor</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="articulador">Articulador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="CPF *"
                    value={newUser.cpf}
                    onChange={(e) => setNewUser({...newUser, cpf: e.target.value})}
                    className="neu-input"
                  />
                  <Input
                    placeholder="RG"
                    value={newUser.rg}
                    onChange={(e) => setNewUser({...newUser, rg: e.target.value})}
                    className="neu-input"
                  />
                  <Input
                    placeholder="Telefone"
                    value={newUser.telefone}
                    onChange={(e) => setNewUser({...newUser, telefone: e.target.value})}
                    className="neu-input"
                  />
                  <Input
                    type="date"
                    placeholder="Data de Nascimento"
                    value={newUser.dataNascimento}
                    onChange={(e) => setNewUser({...newUser, dataNascimento: e.target.value})}
                    className="neu-input"
                  />
                  <div className="flex items-center space-x-2">
                    <Switch
                        id="isActive"
                        checked={newUser.isActive}
                        onCheckedChange={(checked) => setNewUser({ ...newUser, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Usuário Ativo</Label>
                  </div>
                </div>
            </div>

            {/* Bloco da Escola Principal */}
            <div className="neu-inset p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-4">Unidade Educacional Principal</h3>
                <EscolaFields 
                  values={newUser}
                  onChange={(field, value) => setNewUser(prev => ({ ...prev, [field]: value }))}
                  required={true}
                />
            </div>
            
            {/* Bloco da Escola Secundária */}
            <div className="neu-inset p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-4">Unidade Educacional Secundária (Opcional)</h3>
                 <EscolaFields 
                  values={newUser}
                  onChange={(field, value) => setNewUser(prev => ({ ...prev, [field]: value }))}
                  fieldSuffix="Secundaria"
                />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button 
              onClick={() => handleSaveUser(newUser, true)}
              disabled={saving || !newUser.full_name || !newUser.email || !newUser.password || !newUser.cpf || !newUser.inep}
              className="neu-button-primary px-4 py-2 rounded-lg"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Criando...' : 'Criar Usuário'}
            </Button>
            <Button 
              onClick={() => setShowAddForm(false)}
              variant="ghost"
              className="neu-button px-4 py-2 rounded-lg"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="neu-card p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Usuários ({users.length})</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left font-semibold text-gray-800 rounded-tl-lg">Nome / Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Função</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">CRE / Município</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">INEP Principal</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-800 rounded-tr-lg">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-4">
                    {editingUser?.id === user.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editingUser.full_name || ''}
                          onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                          className="neu-input text-sm"
                          placeholder="Nome completo"
                        />
                        <Input
                          value={editingUser.email || ''}
                          onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                          className="neu-input text-sm"
                          placeholder="Email"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold text-gray-800">
                          {user.full_name || 'Nome não informado'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {user.email}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {editingUser?.id === user.id ? (
                      <Select 
                        value={editingUser.app_role || 'professor'} 
                        onValueChange={(value) => setEditingUser({...editingUser, app_role: value})}
                      >
                        <SelectTrigger className="neu-input text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professor">Professor</SelectItem>
                          <SelectItem value="gestor">Gestor</SelectItem>
                          <SelectItem value="articulador">Articulador</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.app_role)}
                        <span className="text-sm font-medium text-gray-800">
                          {getRoleName(user.app_role)}
                        </span>
                      </div>
                    )}
                  </td>
                   <td className="px-4 py-4">
                    {user.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-gray-200 text-gray-800">Inativo</Badge>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {editingUser?.id === user.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editingUser.cre || ''}
                          onChange={(e) => setEditingUser({...editingUser, cre: e.target.value})}
                          className="neu-input text-sm"
                          placeholder="CRE"
                        />
                        <Input
                          value={editingUser.municipio || ''}
                          onChange={(e) => setEditingUser({...editingUser, municipio: e.target.value})}
                          className="neu-input text-sm"
                          placeholder="Município"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {user.cre || 'CRE não informada'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {user.municipio || 'Município não informado'}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {editingUser?.id === user.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editingUser.inep || ''} // Usando 'inep'
                          onChange={(e) => setEditingUser({...editingUser, inep: e.target.value})} // Atualizando 'inep'
                          className="neu-input text-sm"
                          placeholder="INEP"
                        />
                        <Input
                          value={editingUser.unidadeEducacional || ''} // Usando 'unidadeEducacional'
                          onChange={(e) => setEditingUser({...editingUser, unidadeEducacional: e.target.value})} // Atualizando 'unidadeEducacional'
                          className="neu-input text-sm"
                          placeholder="UE Principal"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {user.inep || 'INEP não informado'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {user.unidadeEducacional || 'UE não informada'}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {editingUser?.id === user.id ? (
                        <>
                          <Button
                            onClick={() => handleSaveUser(editingUser)}
                            disabled={saving}
                            size="icon"
                            className="neu-button text-white"
                            title="Salvar Alterações"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => setEditingUser(null)}
                            size="icon"
                            className="neu-button text-white"
                            title="Cancelar Edição"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => setEditingUser(user)}
                            disabled={saving}
                            size="icon"
                            className="neu-button text-white"
                            title="Editar Usuário"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={saving}
                            size="icon"
                            className="neu-button text-white"
                            title="Excluir Usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                           <Button
                                onClick={() => handleToggleUserStatus(user)}
                                disabled={saving}
                                size="icon"
                                className={`neu-button text-white ${user.isActive ? 'hover:bg-yellow-500' : 'hover:bg-green-500'}`}
                                title={user.isActive ? 'Desativar Usuário' : 'Ativar Usuário'}
                            >
                                {user.isActive ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                            </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
