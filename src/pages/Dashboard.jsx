
import React, { useState, useEffect } from "react";
import { ProjetoArteEduca } from "@/api/entities";
import { User } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  FileText,
  Calendar,
  User as UserIcon,
  MapPin,
  Eye,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Palette,
  Music,
  Mic,
  PersonStanding,
  Drama,
  Guitar,
  Users as GroupIcon,
  BarChart3,
  ShieldCheck,
  FileCheck2,
  ChevronDown
} from
"lucide-react";
import { format } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const projectTypeDetails = {
  artesVisuais: { name: 'Artes Visuais', icon: Palette },
  bandasEFanfarras: { name: 'Bandas e Fanfarras', icon: Music },
  cantoCoral: { name: 'Canto Coral', icon: Mic },
  danca: { name: 'Dança', icon: PersonStanding },
  praticaDeConjunto: { name: 'Prática de Conjunto', icon: GroupIcon },
  teatro: { name: 'Teatro', icon: Drama },
  violao: { name: 'Violão', icon: Guitar }
};

const getDashboardTitle = (role) => {
  switch (role) {
    case 'professor':return 'Meus Projetos';
    case 'gestor':return 'Projetos da Unidade Escolar';
    case 'articulador':return 'Projetos da CRE';
    case 'admin':return 'Dashboard Geral';
    default:return 'Dashboard';
  }
};

export default function Dashboard() {
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    cre: 'todos',
    municipio: 'todos',
    inep: '', // This will now be used for general search across UE/Professor/INEP
    tipoProjeto: 'todos',
    status: 'todos'
  });
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, projeto: null, reason: '' });
  const [approvalModal, setApprovalModal] = useState({ isOpen: false, projeto: null, seiNumber: '' });

  const COLORS = ['#0d7377', '#41b883', '#14a085', '#3498db', '#9b59b6', '#f39c12', '#e74c3c', '#34495e', '#7f8c8d'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me().catch(() => null);
      setUser(userData);

      let filterQuery = {};
      if (userData) {
        if (userData.app_role === 'professor') {
          filterQuery = { created_by: userData.email };
        } else if (userData.app_role === 'gestor') {
          // This client-side filter is complex and might be better than a server-side one for OR conditions on nested fields.
          // Let's keep it but load all non-draft projects first.
          filterQuery = { 'status': { '$ne': 'rascunho' } };
        } else if (userData.app_role === 'articulador') {
          filterQuery = { 'identificacao.cre': userData.cre, 'status_gestor': 'validado' };
        }
      }

      const projetosData = await ProjetoArteEduca.filter(filterQuery, "-created_date");

      if (userData && userData.app_role === 'gestor') {
        // Apply the complex gestor logic client-side after initial fetch
        const gestorIneps = [userData.inep, userData.inepSecundaria].filter(Boolean);
        const gestorProjetos = projetosData.filter((p) =>
        gestorIneps.includes(p.identificacao?.inep) ||
        gestorIneps.includes(p.identificacao?.unidadeSecundaria?.inep)
        );
        setProjetos(gestorProjetos);
      } else {
        setProjetos(projetosData);
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setProjetos([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteProjeto = async (projetoId) => {
    if (confirm("Tem certeza que deseja excluir este projeto?")) {
      try {
        await ProjetoArteEduca.delete(projetoId);
        setProjetos((prev) => prev.filter((p) => p.id !== projetoId));
      } catch (error) {
        console.error("Erro ao excluir projeto:", error);
        alert("Erro ao excluir projeto.");
      }
    }
  };

  const handleOpenRejectionModal = (projeto) => {
    setRejectionModal({ isOpen: true, projeto, reason: '' });
  };

  const handleRejectProject = async () => {
    if (!rejectionModal.reason) {
      alert('A justificativa da rejeição é obrigatória.');
      return;
    }
    try {
      await ProjetoArteEduca.update(rejectionModal.projeto.id, {
        status: 'rascunho',
        status_gestor: 'pendente',
        status_cre: 'pendente',
        justificativaRejeicao: rejectionModal.reason
      });
      alert('Projeto rejeitado e devolvido ao professor.');
      setRejectionModal({ isOpen: false, projeto: null, reason: '' });
      loadData();
    } catch (error) {
      console.error("Erro ao rejeitar projeto:", error);
      alert('Ocorreu um erro ao rejeitar o projeto.');
    }
  };

  const handleOpenApprovalModal = (projeto) => {
    setApprovalModal({ isOpen: true, projeto, seiNumber: '' });
  };

  const handleApproveProject = async () => {
    if (!approvalModal.seiNumber) {
      alert('O número do processo SEI é obrigatório para aprovação.');
      return;
    }
    try {
      await ProjetoArteEduca.update(approvalModal.projeto.id, {
        status: 'aprovado',
        numeroProcessoSEI: approvalModal.seiNumber
      });
      alert('Projeto aprovado com sucesso!');
      setApprovalModal({ isOpen: false, projeto: null, seiNumber: '' });
      loadData();
    } catch (error) {
      console.error("Erro ao aprovar projeto:", error);
      alert('Ocorreu um erro ao aprovar o projeto.');
    }
  };

  const handleStatusChange = async (projeto, newStatus, role) => {
    let updateData = {}; // Initialize as empty object

    if (user?.app_role !== role) {
      alert("Você não tem permissão para executar esta ação.");
      return;
    }

    if (role === 'gestor') {
      updateData = { status_gestor: newStatus };
    } else if (role === 'articulador') {
      updateData = { status_cre: newStatus };
    } else {
      alert("Ação não definida para este perfil ou tipo de status.");
      return; // Ação não definida para este perfil
    }

    try {
      await ProjetoArteEduca.update(projeto.id, updateData);
      alert("Status do projeto atualizado com sucesso!"); // Added success alert
      loadData(); // Recarregar os dados para atualizar a interface
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status do projeto.");
    }
  };

  const getStatusInfo = (status, iconClass) => {
    switch (status) {
      case 'rascunho':return { icon: <Clock className={iconClass} />, text: 'Rascunho', color: 'text-yellow-600' };
      case 'enviado':return { icon: <FileText className={iconClass} />, text: 'Enviado', color: 'text-blue-600' };
      case 'aprovado':return { icon: <CheckCircle className={iconClass} />, text: 'Aprovado', color: 'text-green-600' };
      case 'rejeitado':return { icon: <XCircle className={iconClass} />, text: 'Rejeitado', color: 'text-red-600' };
      case 'validado':return { icon: <ShieldCheck className={iconClass} />, text: 'Validado', color: 'text-green-700' };
      case 'pendente':return { icon: <Clock className={iconClass} />, text: 'Pendente', color: 'text-gray-600' };
      default:return { icon: <Clock className={iconClass} />, text: 'Pendente', color: 'text-gray-600' };
    }
  };

  const StatusBadge = ({ status, label }) => {
    // If status is falsy (null, undefined, false, 0, or empty string), don't render.
    if (!status) return null;

    // Custom text for gestor 'validado' status
    if (label === 'Gestor' && status === 'validado') {
      const { icon, color } = getStatusInfo(status, "w-4 h-4 mr-1");
      // Adjusted color for consistency with validado status
      const bgColor = color.replace('text-', 'bg-').replace('-700', '-100');
      return (
        <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${bgColor}`}>
                {icon}
                <span className={color}>{label}: Plano Aprovado</span>
            </div>);

    }

    const { icon, text, color } = getStatusInfo(status, "w-4 h-4 mr-1");
    // Adjusted color for consistency
    const bgColor = color.replace('text-', 'bg-').replace('-600', '-100').replace('-700', '-100');
    return (
      <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${bgColor}`}>
            {icon}
            <span className={color}>{label ? `${label}: ` : ''}{text}</span>
        </div>);

  };


  const getProjectIcon = (tipo) => {
    const Icon = projectTypeDetails[tipo]?.icon || FileText;
    return <Icon className="w-5 h-5 text-gray-700 mr-3" />;
  };

  const filteredProjetos = projetos.filter((projeto) => {
    const { cre, municipio, inep, tipoProjeto, status } = filters;
    const pId = projeto.identificacao;

    const statusMatch = () => {
      if (status === 'todos') return true;
      // Check across all status fields based on role context
      if (user?.app_role === 'gestor') return (projeto.status_gestor || 'pendente') === status;
      if (user?.app_role === 'articulador') return (projeto.status_cre || 'pendente') === status;
      // Default/Admin/Professor check main status, falling back to 'pendente' if undefined
      return (projeto.status || 'pendente') === status;
    };

    const inepSearchMatch = () => {
      if (inep === '') return true;
      const lowerCaseInep = inep.toLowerCase();
      return (
        pId?.unidadeEducacional && pId.unidadeEducacional.toLowerCase().includes(lowerCaseInep) ||
        pId?.professor?.nome && pId.professor.nome.toLowerCase().includes(lowerCaseInep) ||
        pId?.inep && pId.inep.includes(lowerCaseInep) ||
        pId?.unidadeSecundaria?.inep && pId.unidadeSecundaria.inep.includes(lowerCaseInep));

    };

    return (
      (cre === 'todos' || pId?.cre === cre) && (
      municipio === 'todos' || pId?.municipio === municipio) &&
      inepSearchMatch() && (
      tipoProjeto === 'todos' || projeto.tipoProjeto === tipoProjeto) &&
      statusMatch());

  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      cre: 'todos',
      municipio: 'todos',
      inep: '',
      tipoProjeto: 'todos',
      status: 'todos'
    });
  };

  const creOptions = [...new Set(projetos.map((p) => p.identificacao?.cre).filter(Boolean))].sort();
  const municipioOptions = [...new Set(projetos.map((p) => p.identificacao?.municipio).filter(Boolean))].sort();

  const getChartDataByTipo = () => {
    // Changed to include all projects, not just approved ones
    const counts = projetos.reduce((acc, p) => {
      const typeName = projectTypeDetails[p.tipoProjeto]?.name || 'Outro';
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map((name) => ({ name, projetos: counts[name] }));
  };

  const getChartDataByCRE = () => {
    // Changed to include all projects, not just approved ones
    const counts = projetos.reduce((acc, p) => {
      const cre = p.identificacao?.cre || 'Não informada';
      acc[cre] = (acc[cre] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map((name) => ({ name, projetos: counts[name] }));
  };

  const getChartDataByMunicipio = () => {
    // Changed to include all projects, not just approved ones
    const counts = projetos.reduce((acc, p) => {
      const municipio = p.identificacao?.municipio || 'Não informado';
      acc[municipio] = (acc[municipio] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map((name) => ({ name, projetos: counts[name] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="neu-card p-6 sm:p-8">
          <div className="animate-pulse text-gray-600">Carregando projetos...</div>
        </div>
      </div>);

  }

  const renderProjectList = () => {
    return filteredProjetos.length === 0 ?
    <div className="text-center py-8 sm:py-12">
        <div className="neu-raised p-6 sm:p-8 rounded-full w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center">
          <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum projeto encontrado</h3>
        <p className="text-gray-600 mb-6">
          Nenhum projeto corresponde aos filtros aplicados. Tente limpar os filtros.
        </p>
        <Button onClick={clearFilters} className="neu-button">Limpar Filtros</Button>
      </div> :

    <div className="overflow-x-auto">
        {/* Table Header with Filters */}
        <div className="bg-gray-100 rounded-t-lg">
          <div className="grid grid-cols-6 gap-4 px-4 py-3">
            <div className="text-left">
              <div className="font-semibold text-gray-800 mb-2">Unidade Educacional</div>
              <Input
              type="text"
              placeholder="Buscar UE, professor ou INEP..."
              value={filters.inep}
              onChange={(e) => handleFilterChange('inep', e.target.value)}
              className="neu-input text-xs" />

            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800 mb-2">CRE</div>
              <Select value={filters.cre} onValueChange={(value) => handleFilterChange('cre', value)}>
                <SelectTrigger className="neu-input text-xs">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="neu-card">
                  <SelectItem value="todos">Todas as CREs</SelectItem>
                  {creOptions.map((cre) => <SelectItem key={cre} value={cre}>{cre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800 mb-2">Município</div>
              <Select value={filters.municipio} onValueChange={(value) => handleFilterChange('municipio', value)}>
                <SelectTrigger className="neu-input text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="neu-card">
                  <SelectItem value="todos">Todos os Municípios</SelectItem>
                  {municipioOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800 mb-2">Tipo de Projeto</div>
              <Select value={filters.tipoProjeto} onValueChange={(value) => handleFilterChange('tipoProjeto', value)}>
                <SelectTrigger className="neu-input text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="neu-card">
                  {/* Corrected mapping to use object entries for key and name */}
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  {Object.entries(projectTypeDetails).map(([key, { name }]) =>
                <SelectItem key={key} value={key}>{name}</SelectItem>
                )}
                </SelectContent>
              </Select>
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800 mb-2">Status</div>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="neu-input text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="neu-card">
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  {(user?.app_role === 'gestor' || user?.app_role === 'articulador' || user?.app_role === 'admin') &&
                <SelectItem value="validado">Validado</SelectItem>
                }
                  {(user?.app_role === 'gestor' || user?.app_role === 'articulador' || user?.app_role === 'admin') &&
                <SelectItem value="pendente">Pendente</SelectItem>
                }
                </SelectContent>
              </Select>
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800 mb-2">Ações</div>
              <Button onClick={clearFilters} className="neu-button text-xs w-full">
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Accordion Table Data */}
        <Accordion type="multiple" className="w-full neu-card rounded-t-none">
          {filteredProjetos.map((projeto) =>
        <AccordionItem key={projeto.id} value={projeto.id} className="border-b border-gray-200 last:border-b-0">
              <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <div className="grid grid-cols-6 gap-4 w-full text-left">
                  <div className="flex items-center space-x-3">
                    {getProjectIcon(projeto.tipoProjeto)}
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                        {projeto.identificacao?.unidadeEducacional || 'Unidade não informada'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Prof. {projeto.identificacao?.professor?.nome || 'Professor não definido'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {projeto.identificacao?.cre || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {projeto.identificacao?.municipio || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {projectTypeDetails[projeto.tipoProjeto]?.name || 'Projeto'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex flex-col space-y-1">
                      {projeto.status &&
                  <StatusBadge status={projeto.status} />
                  }
                      {projeto.status_gestor && projeto.status_gestor !== 'pendente' &&
                  <StatusBadge status={projeto.status_gestor} label="Gestor" />
                  }
                      {projeto.status_cre && projeto.status_cre !== 'pendente' &&
                  <StatusBadge status={projeto.status_cre} label="CRE" />
                  }
                    </div>
                  </div>
                  {/* ChevronDown handled by AccordionTrigger component automatically */}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="neu-inset p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100">Dados da Unidade</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>INEP:</strong> {projeto.identificacao?.inepPrincipal || 'N/A'}</p>
                        <p><strong>Quantidade de Estudantes:</strong> {projeto.identificacao?.quantidadeEstudantes || 'N/A'}</p>
                        <p><strong>Etapas de Ensino:</strong> {projeto.identificacao?.etapasEnsino?.join(', ') || 'N/A'}</p>
                        <p><strong>Criado em:</strong> {format(new Date(projeto.created_date), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100">Professor Responsável</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>Nome:</strong> {projeto.identificacao?.professor?.nome || 'N/A'}</p>
                        <p><strong>CPF:</strong> {projeto.identificacao?.professor?.cpf || 'N/A'}</p>
                        <p><strong>Telefone:</strong> {projeto.identificacao?.professor?.telefone || 'N/A'}</p>
                        <p><strong>Email:</strong> {projeto.identificacao?.professor?.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100">Status do Projeto</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>Status Geral:</strong> {getStatusInfo(projeto.status).text || 'Pendente'}</p>
                        {projeto.status_gestor &&
                    <p><strong>Status Gestor:</strong> {getStatusInfo(projeto.status_gestor).text}</p>
                    }
                        {projeto.status_cre &&
                    <p><strong>Status CRE:</strong> {getStatusInfo(projeto.status_cre).text}</p>
                    }
                        {projeto.dataSubmissao &&
                    <p><strong>Data Envio:</strong> {format(new Date(projeto.dataSubmissao), 'dd/MM/yyyy')}</p>
                    }
                        {projeto.numeroProcessoSEI &&
                    <p><strong>Processo SEI:</strong> {projeto.numeroProcessoSEI}</p>
                    }
                      </div>
                    </div>
                  </div>

                  {/* Project Details */}
                  {projeto.projeto?.introducao &&
              <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Introdução</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                        {projeto.projeto.introducao.length > 200 ?
                  `${projeto.projeto.introducao.substring(0, 200)}...` :
                  projeto.projeto.introducao
                  }
                      </p>
                    </div>
              }

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                  to={createPageUrl(`ProjetoArteEduca?id=${projeto.id}&tipo=${projeto.tipoProjeto}`)}
                  className="neu-button px-4 py-2 rounded-lg text-gray-600 hover:text-gray-800 flex items-center space-x-2"
                  title="Visualizar Detalhes do Projeto">

                      <Eye className="w-4 h-4" />
                      <span>Visualizar</span>
                    </Link>

                    {user?.app_role === 'professor' && projeto.status_gestor !== 'validado' &&
                <Link
                  to={createPageUrl(`ProjetoArteEduca?id=${projeto.id}&tipo=${projeto.tipoProjeto}&edit=true`)}
                  className="neu-button px-4 py-2 rounded-lg text-blue-600 hover:text-blue-800 flex items-center space-x-2"
                  title="Editar Projeto">

                        <Edit className="w-4 h-4" />
                        <span>Editar</span>
                      </Link>
                }

                    {/* Gestor: Termo de compromisso (sempre visível para o gestor) */}
                    {user?.app_role === 'gestor' && (
                        <Link
                            to={createPageUrl(`TermoCompromisso?projetoId=${projeto.id}`)}
                            className="neu-button px-4 py-2 rounded-lg text-gray-600 hover:text-gray-800 flex items-center space-x-2"
                            title="Gerar ou Visualizar Termo de Compromisso">
                            <FileCheck2 className="w-4 h-4" />
                            <span>Termo</span>
                        </Link>
                    )}

                    {/* Gestor: Aprovação (apenas se pendente) */}
                    {user?.app_role === 'gestor' && projeto.status_gestor === 'pendente' && (
                        <button
                            onClick={() => handleStatusChange(projeto, 'validado', 'gestor')}
                            className="neu-button px-4 py-2 rounded-lg text-green-600 hover:text-green-800 flex items-center space-x-2"
                            title="Aprovar Plano de Estudos (Gestor)">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Aprovar plano de estudos</span>
                        </button>
                    )}
                    
                    {user?.app_role === 'articulador' && projeto.status_gestor === 'validado' && (
                      <>
                        <Link
                            to={createPageUrl(`TermoCompromisso?projetoId=${projeto.id}`)}
                            className="neu-button px-4 py-2 rounded-lg text-gray-600 hover:text-gray-800 flex items-center space-x-2"
                            title="Visualizar Termo de Compromisso">
                          <FileCheck2 className="w-4 h-4" />
                          <span>Termo</span>
                        </Link>
                        <Link
                            to={createPageUrl(`DeclaracaoCre?projetoId=${projeto.id}`)}
                            className="neu-button px-4 py-2 rounded-lg text-gray-600 hover:text-gray-800 flex items-center space-x-2"
                            title="Visualizar Declaração da CRE">
                          <FileCheck2 className="w-4 h-4" />
                          <span>Declaração CRE</span>
                        </Link>
                        {projeto.status_cre !== 'validado' && (
                            <button
                                onClick={() => handleStatusChange(projeto, 'validado', 'articulador')}
                                className="neu-button px-4 py-2 rounded-lg text-green-600 hover:text-green-800 flex items-center space-x-2"
                                title="Validar Projeto (CRE)">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Validar CRE</span>
                            </button>
                        )}
                      </>
                    )}

                    {user?.app_role === 'admin' && projeto.status_cre === 'validado' && projeto.status !== 'aprovado' &&
                <>
                        <button
                    onClick={() => handleOpenApprovalModal(projeto)}
                    className="neu-button px-4 py-2 rounded-lg text-green-600 hover:text-green-800 flex items-center space-x-2"
                    title="Aprovar Projeto">

                          <CheckCircle2 className="w-4 h-4" />
                          <span>Aprovar</span>
                        </button>
                        <button
                    onClick={() => handleOpenRejectionModal(projeto)}
                    className="neu-button px-4 py-2 rounded-lg text-red-600 hover:text-red-800 flex items-center space-x-2"
                    title="Rejeitar Projeto">

                          <XCircle className="w-4 h-4" />
                          <span>Rejeitar</span>
                        </button>
                      </>
                }

                    {/* Admin: Termo de Compromisso (Gestor) e Declaração CRE */}
                    {user?.app_role === 'admin' && (projeto.status_gestor === 'validado' || projeto.status === 'aprovado') && (
                        <Link
                            to={createPageUrl(`TermoCompromisso?projetoId=${projeto.id}`)}
                            className="neu-button px-4 py-2 rounded-lg text-gray-600 hover:text-gray-800 flex items-center space-x-2"
                            title="Visualizar Termo de Compromisso do Gestor">
                            <FileCheck2 className="w-4 h-4" />
                            <span>Ver Termo Gestor</span>
                        </Link>
                    )}
                    {user?.app_role === 'admin' && (projeto.status_cre === 'validado' || projeto.status === 'aprovado') && (
                        <Link
                            to={createPageUrl(`DeclaracaoCre?projetoId=${projeto.id}`)}
                            className="neu-button px-4 py-2 rounded-lg text-gray-600 hover:text-gray-800 flex items-center space-x-2"
                            title="Visualizar Declaração da CRE">
                            <FileCheck2 className="w-4 h-4" />
                            <span>Ver Declaração CRE</span>
                        </Link>
                    )}

                    {(user?.app_role === 'admin' || user?.email === projeto.created_by && projeto.status === 'rascunho') &&
                <button
                  onClick={() => deleteProjeto(projeto.id)}
                  className="neu-button px-4 py-2 rounded-lg text-red-600 hover:text-red-800 flex items-center space-x-2"
                  title="Excluir Projeto">

                        <Trash2 className="w-4 h-4" />
                        <span>Excluir</span>
                      </button>
                }

                    {projeto.status !== 'rascunho' &&
                <button
                  className="neu-button px-4 py-2 rounded-lg text-gray-600 hover:text-gray-800 flex items-center space-x-2"
                  title="Baixar Projeto em PDF">

                        <Download className="w-4 h-4" />
                        <span>Baixar PDF</span>
                      </button>
                }
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
        )}
        </Accordion>
      </div>;

  };

  if (user?.app_role === 'admin' &&
  filters.cre === 'todos' &&
  filters.municipio === 'todos' &&
  filters.inep === '' &&
  filters.tipoProjeto === 'todos' &&
  filters.status === 'todos') {
    // Admin dashboard overview
    const chartDataByTipo = getChartDataByTipo();
    const chartDataByCRE = getChartDataByCRE();
    const chartDataByMunicipio = getChartDataByMunicipio();
    return (
      <div className="space-y-6">
        <div className="neu-card p-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Dashboard Geral</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Visão completa de todos os projetos do sistema</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 neu-inset p-6 rounded-xl text-center">
                    <h2 className="text-4xl font-bold text-blue-600">{projetos.length}</h2>
                    <p className="text-gray-600 dark:text-gray-400">Projetos Totais</p>
                </div>
                 <div className="bg-green-50 neu-inset p-6 rounded-xl text-center">
                    <h2 className="text-green-600 text-4xl font-bold">{projetos.filter((p) => p.status === 'aprovado').length}</h2>
                    <p className="text-gray-600 dark:text-gray-400">Projetos Aprovados</p>
                </div>
                 <div className="bg-yellow-50 neu-inset p-6 rounded-xl text-center">
                    <h2 className="text-4xl font-bold text-yellow-600">{projetos.filter((p) => p.status === 'enviado' || p.status_gestor === 'pendente' || p.status_cre === 'pendente').length}</h2>
                    <p className="text-gray-600 dark:text-gray-400">Projetos Pendentes</p>
                </div>
            </div>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Projetos por Tipo</h3>
                  <div className="neu-inset p-4 rounded-xl" style={{ height: '400px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartDataByTipo} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="projetos">
                                {chartDataByTipo.map((entry, index) =>
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      )}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Projetos por CRE</h3>
                  <div className="neu-inset p-4 rounded-xl" style={{ height: '400px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartDataByCRE} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="projetos">
                                {chartDataByCRE.map((entry, index) =>
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      )}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Projetos por Município</h3>
                  <div className="neu-inset p-4 rounded-xl" style={{ height: '400px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartDataByMunicipio} margin={{ top: 5, right: 20, left: -10, bottom: 75 }} className="opacity-100 recharts-surface">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="projetos">
                                {chartDataByMunicipio.map((entry, index) =>
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      )}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
                </div>
            </div>
        </div>
        <div className="neu-card p-4 sm:p-6">
           <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Todos os Projetos</h2>
           {/* Render list for admin */}
           {renderProjectList()}
        </div>
      </div>);

  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Modals */}
      <Dialog open={rejectionModal.isOpen} onOpenChange={() => setRejectionModal({ isOpen: false, projeto: null, reason: '' })}>
        <DialogContent className="neu-card">
          <DialogHeader>
            <DialogTitle>Rejeitar Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Por favor, forneça a justificativa para a rejeição do projeto "{rejectionModal.projeto?.identificacao?.unidadeEducacional}". Esta informação será enviada ao professor.</p>
            <Textarea
              placeholder="Justificativa da rejeição (obrigatório)"
              value={rejectionModal.reason}
              onChange={(e) => setRejectionModal((prev) => ({ ...prev, reason: e.target.value }))}
              className="neu-input"
              rows={5} />

          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="neu-button">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleRejectProject} className="neu-button-primary" disabled={!rejectionModal.reason}>Confirmar Rejeição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={approvalModal.isOpen} onOpenChange={() => setApprovalModal({ isOpen: false, projeto: null, seiNumber: '' })}>
        <DialogContent className="neu-card">
          <DialogHeader>
            <DialogTitle>Aprovar Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Para aprovar o projeto "{approvalModal.projeto?.identificacao?.unidadeEducacional}", por favor, insira o número do processo SEI.</p>
            <Input
              placeholder="Número do Processo SEI (obrigatório)"
              value={approvalModal.seiNumber}
              onChange={(e) => setApprovalModal((prev) => ({ ...prev, seiNumber: e.target.value }))}
              className="neu-input" />

          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="neu-button">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleApproveProject} className="neu-button-primary" disabled={!approvalModal.seiNumber}>Confirmar Aprovação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="neu-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{getDashboardTitle(user?.app_role)}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {user?.app_role === 'professor' && 'Visualize e gerencie todos os seus projetos em um só lugar.'}
              {user?.app_role === 'gestor' && 'Visualize e valide os projetos da sua Unidade Educacional.'}
              {user?.app_role === 'articulador' && 'Acompanhe e aproves os projetos da sua Coordenação Regional.'}
              {user?.app_role === 'admin' && 'Supervisione e gerencie todos os projetos do sistema.'}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Projetos (includes the integrated filters now) */}
      <div className="neu-card p-4 sm:p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          {user?.app_role === 'professor' && `Meus Projetos (${filteredProjetos.length})`}
          {user?.app_role === 'gestor' && `Projetos da UE (${filteredProjetos.length})`}
          {user?.app_role === 'articulador' && `Projetos da CRE (${filteredProjetos.length})`}
          {user?.app_role === 'admin' && `Projetos (${filteredProjetos.length})`}
        </h2>
        {renderProjectList()}
      </div>
    </div>);

}
