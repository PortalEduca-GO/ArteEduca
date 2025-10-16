
import React, { useState, useEffect } from "react";
import { Escola, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Plus,
  Edit,
  Save,
  X,
  Trash2,
  Search,
  Shield,
  Mail,
  MapPin,
  Hash,
} from "lucide-react";

export default function GerenciarEscolas() {
  const [escolas, setEscolas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingEscola, setEditingEscola] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [newEscola, setNewEscola] = useState({
    cre: "",
    municipio: "",
    inep: "",
    unidadeEducacional: "",
    email: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, escolasData] = await Promise.all([User.me(), Escola.list("-created_date")]);
      setCurrentUser(userData);
      setEscolas(escolasData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEscola = async (escolaData, isNew = false) => {
    setSaving(true);
    try {
      if (isNew) {
        await Escola.create(escolaData);
        alert("Escola criada com sucesso!");
        setShowAddForm(false);
        setNewEscola({ cre: "", municipio: "", inep: "", unidadeEducacional: "", email: "" });
      } else {
        await Escola.update(escolaData.id, escolaData);
        alert("Escola atualizada com sucesso!");
        setEditingEscola(null);
      }
      loadData();
    } catch (error) {
      console.error("Erro ao salvar escola:", error);
      alert("Erro ao salvar escola. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEscola = async (escolaId) => {
    if (confirm("Tem certeza que deseja excluir esta escola? Esta ação não pode ser desfeita.")) {
      try {
        await Escola.delete(escolaId);
        alert("Escola excluída com sucesso!");
        loadData();
      } catch (error) {
        console.error("Erro ao excluir escola:", error);
        alert("Erro ao excluir escola. Tente novamente.");
      }
    }
  };

  const filteredEscolas = escolas.filter((escola) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      escola.unidadeEducacional?.toLowerCase().includes(searchLower) ||
      escola.cre?.toLowerCase().includes(searchLower) ||
      escola.municipio?.toLowerCase().includes(searchLower) ||
      escola.inep?.toLowerCase().includes(searchLower) ||
      escola.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="neu-card p-6 sm:p-8">
          <div className="animate-pulse text-gray-600">Carregando escolas...</div>
        </div>
      </div>
    );
  }

  if (currentUser?.app_role !== "admin") {
    return (
      <div className="neu-card p-6">
        <div className="text-center py-8">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800">Acesso Negado</h2>
          <p className="text-gray-600 mt-2">Apenas administradores podem gerenciar escolas.</p>
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
            <Building2 className="w-8 h-8 text-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gerenciar Escolas</h1>
              <p className="text-gray-600">Gerencie as unidades educacionais do sistema</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={async () => {
                if (selectedIds.size === 0) {
                  alert("Selecione ao menos uma escola para excluir.");
                  return;
                }

                if (!confirm(`Tem certeza que deseja excluir ${selectedIds.size} escola(s)? Esta ação não pode ser desfeita.`)) {
                  return;
                }

                try {
                  const idsArray = Array.from(selectedIds);
                  setSaving(true);
                  const res = await Escola.bulkDelete(idsArray);
                  alert(`Exclusão concluída. Removidas: ${res.deleted}, falhas: ${res.failed}`);
                  setSelectedIds(new Set());
                  setSelectAll(false);
                  loadData();
                } catch (err) {
                  console.error("Erro ao excluir em massa:", err);
                  alert("Erro ao excluir escolas selecionadas.");
                } finally {
                  setSaving(false);
                }
              }}
              className="neu-button px-4 py-2 rounded-lg text-red-600 hover:text-red-800 flex items-center space-x-2"
              disabled={saving}
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir selecionadas</span>
            </Button>

            <Button onClick={() => setShowAddForm(true)} className="neu-button flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nova Escola</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="neu-card p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar escolas por nome, CRE, município, INEP ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="neu-input w-full pl-10 pr-4 py-3 text-gray-700"
          />
        </div>
      </div>

      {/* Add School Form */}
      {showAddForm && (
        <div className="neu-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Adicionar Nova Escola</h2>
            <Button onClick={() => setShowAddForm(false)} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CRE *</label>
              <Input
                placeholder="Coordenação Regional"
                value={newEscola.cre}
                onChange={(e) => setNewEscola({ ...newEscola, cre: e.target.value })}
                className="neu-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Município *</label>
              <Input
                placeholder="Município"
                value={newEscola.municipio}
                onChange={(e) => setNewEscola({ ...newEscola, municipio: e.target.value })}
                className="neu-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código INEP *</label>
              <Input
                placeholder="00000000"
                value={newEscola.inep}
                onChange={(e) => setNewEscola({ ...newEscola, inep: e.target.value })}
                className="neu-input"
                maxLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                placeholder="contato@escola.edu.br"
                value={newEscola.email}
                onChange={(e) => setNewEscola({ ...newEscola, email: e.target.value })}
                className="neu-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Unidade Educacional *</label>
              <Input
                placeholder="Nome completo da escola"
                value={newEscola.unidadeEducacional}
                onChange={(e) => setNewEscola({ ...newEscola, unidadeEducacional: e.target.value })}
                className="neu-input"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button onClick={() => setShowAddForm(false)} variant="outline">
              Cancelar
            </Button>
            <Button
              onClick={() => handleSaveEscola(newEscola, true)}
              disabled={saving || !newEscola.cre || !newEscola.municipio || !newEscola.inep || !newEscola.unidadeEducacional}
              className="btn-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Criar Escola"}
            </Button>
          </div>
        </div>
      )}

      {/* Schools Table */}
      <div className="neu-card p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Escolas Cadastradas ({filteredEscolas.length})</h2>

        {filteredEscolas.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{searchTerm ? "Nenhuma escola encontrada" : "Nenhuma escola cadastrada"}</h3>
            <p className="text-gray-600 mb-6">{searchTerm ? "Tente ajustar o termo de busca" : "Comece cadastrando a primeira escola"}</p>
            {!searchTerm && (
              <Button onClick={() => setShowAddForm(true)} className="neu-button">
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeira Escola
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectAll(checked);
                        if (checked) {
                          const allIds = filteredEscolas.map((s) => s.id);
                          setSelectedIds(new Set(allIds));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Unidade Educacional</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">CRE</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Município</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">INEP</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800 rounded-tr-lg">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEscolas.map((escola) => {
                  const isSelected = selectedIds.has(escola.id);
                  return (
                    <tr key={escola.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (checked) next.add(escola.id);
                              else next.delete(escola.id);
                              if (next.size === filteredEscolas.length) setSelectAll(true);
                              else setSelectAll(false);
                              return next;
                            });
                          }}
                        />
                      </td>
                      <td className="px-4 py-4">
                        {editingEscola?.id === escola.id ? (
                          <Input
                            value={editingEscola.unidadeEducacional || ""}
                            onChange={(e) => setEditingEscola({ ...editingEscola, unidadeEducacional: e.target.value })}
                            className="neu-input text-sm"
                            placeholder="Nome da escola"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-semibold text-gray-800">{escola.unidadeEducacional || <span className="text-gray-400 italic">Não informado</span>}</div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {editingEscola?.id === escola.id ? (
                          <Input value={editingEscola.cre || ""} onChange={(e) => setEditingEscola({ ...editingEscola, cre: e.target.value })} className="neu-input text-sm" placeholder="CRE" />
                        ) : (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-800">{escola.cre || <span className="text-gray-400 italic">Não informado</span>}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {editingEscola?.id === escola.id ? (
                          <Input value={editingEscola.municipio || ""} onChange={(e) => setEditingEscola({ ...editingEscola, municipio: e.target.value })} className="neu-input text-sm" placeholder="Município" />
                        ) : (
                          <span className="text-sm text-gray-800">{escola.municipio || <span className="text-gray-400 italic">Não informado</span>}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {editingEscola?.id === escola.id ? (
                          <Input value={editingEscola.inep || ""} onChange={(e) => setEditingEscola({ ...editingEscola, inep: e.target.value })} className="neu-input text-sm" placeholder="INEP" maxLength={8} />
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-mono text-gray-800">{escola.inep || <span className="text-gray-400 italic">Não informado</span>}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {editingEscola?.id === escola.id ? (
                          <Input type="email" value={editingEscola.email || ""} onChange={(e) => setEditingEscola({ ...editingEscola, email: e.target.value })} className="neu-input text-sm" placeholder="email@escola.br" />
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{escola.email || <span className="text-gray-400 italic">Não informado</span>}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {editingEscola?.id === escola.id ? (
                            <>
                              <Button onClick={() => handleSaveEscola(editingEscola)} disabled={saving} size="icon" className="neu-button text-white" title="Salvar">
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button onClick={() => setEditingEscola(null)} size="icon" className="neu-button text-white" title="Cancelar">
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button onClick={() => setEditingEscola(escola)} size="icon" className="neu-button text-white" title="Editar Escola">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button onClick={() => handleDeleteEscola(escola.id)} size="icon" className="neu-button text-white" title="Excluir Escola">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
