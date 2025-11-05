
import React, { useState, useEffect } from "react";
import { ProjetoArteEduca } from "@/api/entities";
import { User } from "@/api/entities";
import { 
  Save, 
  Send, 
  Plus, 
  Trash2, 
  FileText, 
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  Settings,
  BookOpen,
  BarChart3,
  Loader2,
  Eye,
  ChevronLeft, // Added ChevronLeft icon
  ChevronRight, // Added ChevronRight icon
  AlertTriangle, // Added AlertTriangle icon
  Check, // Added Check icon for approval
  X // Added X icon for rejection
} from "lucide-react";
import EscolaFields from "../components/escola/EscolaFields";
import { validateProjeto } from "../utils/validation";
import { toast } from "sonner";

// Configuration for each project type
const projectTypeConfigs = {
  artesVisuais: {
    pageTitle: "Projeto de Artes Visuais",
    header: "Professor de Artes Visuais",
    funcaoFields: [
      { id: 'tecnicasBidimensionais', label: 'Técnicas Bidimensionais – Qual?', type: 'text' },
      { id: 'tecnicasTridimensionais', label: 'Técnicas Tridimensionais – Qual?', type: 'text' },
      { id: 'videoarte', label: 'Videoarte', type: 'checkbox' },
      { id: 'instalacaoPerformance', label: 'Instalação/Performance', type: 'checkbox' },
      { id: 'outros', label: 'Outros - Qual?', type: 'text' },
    ]
  },
  bandasEFanfarras: {
    pageTitle: "Projeto de Bandas e Fanfarras",
    header: "Professor de Música",
    funcaoFields: [
      { id: 'bandaMarcialRegente', label: 'Banda Marcial/Regente', type: 'checkbox' },
      { id: 'bandaMusicalRegente', label: 'Banda Musical/Regente', type: 'checkbox' },
      { id: 'bandaDePercussao', label: 'Banda de Percussão', type: 'checkbox' },
      { id: 'cantoCoral', label: 'Canto Coral', type: 'checkbox' },
      { id: 'ensinoColetivoCordas', label: 'Ensino Coletivo de Cordas', type: 'checkbox' },
      { id: 'ensinoColetivoMadeiras', label: 'Ensino Coletivo de Madeiras', type: 'checkbox' },
      { id: 'ensinoColetivoMetaisAgudos', label: 'Ensino Coletivo de Metais Agudos', type: 'checkbox' },
      { id: 'ensinoColetivoMetaisGraves', label: 'Ensino Coletivo de Metais Graves', type: 'checkbox' },
      { id: 'ensinoColetivoPercussao', label: 'Ensino Coletivo de Percussão', type: 'checkbox' },
      { id: 'ensinoColetivoTeclado', label: 'Ensino Coletivo de Teclado', type: 'checkbox' },
      { id: 'ensinoColetivoViolao', label: 'Ensino Coletivo de Violão', type: 'checkbox' },
      { id: 'fanfarra', label: 'Fanfarra', type: 'checkbox' },
      { id: 'praticaDeConjuntoRegente', label: 'Prática de Conjunto/Regente', type: 'checkbox' },
    ]
  },
  danca: {
    pageTitle: "Projeto de Dança",
    header: "Professor de Dança",
    funcaoFields: [
      { id: 'dancasUrbanas', label: 'Danças Urbanas – Qual?', type: 'text' },
      { id: 'dancaJazz', label: 'Dança Jazz', type: 'checkbox' },
      { id: 'dancasPopulares', label: 'Danças Populares – Qual?', type: 'text' },
      { id: 'dancaAfro', label: 'Dança Afro', type: 'checkbox' },
      { id: 'dancasDeSalao', label: 'Danças de Salão – Qual?', type: 'text' },
      { id: 'dancaIndigena', label: 'Dança Indígena', type: 'checkbox' },
      { id: 'dancaContemporanea', label: 'Dança Contemporânea', type: 'checkbox' },
      { id: 'videodanca', label: 'Videodança', type: 'checkbox' },
      { id: 'dancaClassica', label: 'Dança Clássica', type: 'checkbox' },
      { id: 'outros', label: 'Outros - Qual?', type: 'text' },
      { id: 'dancaEducacao', label: 'Dança Educação', type: 'checkbox' },
    ]
  },
  teatro: {
    pageTitle: "Projeto de Teatro",
    header: "Professor de Teatro",
    funcaoFields: [
      { id: 'teatroConvencionalDramatico', label: 'Teatro Convencional/Dramático', type: 'checkbox' },
      { id: 'teatroDoOprimido', label: 'Teatro do Oprimido Qual?', type: 'text' },
      { id: 'teatroPosDramatico', label: 'Teatro Pós-Dramático', type: 'checkbox' },
      { id: 'performanceTeatral', label: 'Performance Teatral', type: 'checkbox' },
      { id: 'teatroFormasAnimadas', label: 'Teatro de Formas Animadas', type: 'checkbox' },
      { id: 'outros', label: 'Outros - Qual?', type: 'text' },
      { id: 'teatroPopularTradicional', label: 'Teatro Popular Tradicional', type: 'checkbox' },
    ]
  },
};

// Make Banda/Fanfarra default for music types not explicitly defined
// This line explicitly overrides the pageTitle for 'bandasEFanfarras'
projectTypeConfigs.bandasEFanfarras.pageTitle = "Projeto de Música";

// Define other music types that share the same funcaoFields as bandasEFanfarras
projectTypeConfigs.cantoCoral = { pageTitle: "Projeto de Canto Coral", header: "Professor de Música", funcaoFields: projectTypeConfigs.bandasEFanfarras.funcaoFields };
projectTypeConfigs.praticaDeConjunto = { pageTitle: "Projeto de Prática de Conjunto", header: "Professor de Música", funcaoFields: projectTypeConfigs.bandasEFanfarras.funcaoFields };
projectTypeConfigs.violao = { pageTitle: "Projeto de Violão", header: "Professor de Música", funcaoFields: projectTypeConfigs.bandasEFanfarras.funcaoFields };


// Function to get the initial state of the project based on its type
const getInitialState = (tipo) => {
  const config = projectTypeConfigs[tipo] || projectTypeConfigs.artesVisuais; // Default to artesVisuais if type is unknown
  const initialFuncao = config.funcaoFields.reduce((acc, field) => {
    acc[field.id] = field.type === 'checkbox' ? false : '';
    return acc;
  }, {});

  return {
    tipoProjeto: tipo, // Add a field to store the project type
    identificacao: {
      cre: '',
      municipio: '',
      unidadeEducacional: '',
      tipoMatriz: 'matricular',
      inep: '',
      quantidadeEstudantes: '',
      quantidadeAlunosFundamental2: '',
      quantidadeAlunosMedio: '',
      etapasEnsino: [],
      professor: {
        nome: '',
        cpf: '',
        rg: '',
        dataNascimento: '',
        telefone: '',
        email: ''
      },
      funcao: initialFuncao, // Dynamically initialized based on project type
      recursosMateriais: [{ material: '', quantidade: '' }]
    },
    projeto: {
      introducao: '',
      justificativa: '',
      objetivoGeral: 'Promover a cultura da formação artística e estética dos estudantes, numa perspectiva de inclusão e transformação social, que busca a melhoria da qualidade da educação, a fim de tornar o estado de Goiás uma referência nacional na arte/educação e elevar o Índice de Desenvolvimento da Educação Básica – Ideb.',
      objetivosEspecificos: '',
      metodologia: '',
      avaliacao: 'A avaliação será de modo sistêmico e contínuo, compreendendo momentos de diagnóstico, formativo, somativo e/ou comparativo, de modo a analisar o interesse, a participação, o envolvimento e a capacidade de reflexão teórico-prática sobre os objetos de conhecimento/conteúdos propostos, bem como, aspectos relacionados à percepção e à sensibilidade na experiência dos conteúdos trabalhados.',
      referencias: ''
    },
    quadroHorario: {
      turno: [],
      cargaHoraria: '20',
      modulacaoPrincipal: Array(8).fill().map(() => ({
        horario: '',
        segunda: false,
        terca: false,
        quarta: false,
        quinta: false,
        sexta: false,
        sabado: false
      }))
    },
    planoAnual: {
      primeiroSemestre: [{ habilidade: '', objetoConhecimento: '', desenvolvimentoConteudo: '' }],
      segundoSemestre: [{ habilidade: '', objetoConhecimento: '', desenvolvimentoConteudo: '' }]
    },
    cronograma: {
      acoes: [
        { acao: 'Projeto', janeiro: true, fevereiro: false, marco: false, abril: false, maio: false, junho: false, agosto: false, setembro: false, outubro: false, novembro: false, dezembro: false },
        { acao: 'Plano Anual de Ensino', janeiro: true, fevereiro: false, marco: false, abril: false, maio: false, junho: false, agosto: false, setembro: false, outubro: false, novembro: false, dezembro: false },
        { acao: 'Diário de Bordo', janeiro: false, fevereiro: true, marco: true, abril: true, maio: true, junho: true, agosto: true, setembro: true, outubro: true, novembro: true, dezembro: false },
        { acao: 'Lista de chamada', janeiro: true, fevereiro: true, marco: true, abril: true, maio: true, junho: true, agosto: true, setembro: true, outubro: true, novembro: true, dezembro: true }
      ]
    },
    status: 'rascunho',
    status_gestor: 'pendente', // Status da validação do gestor
    status_cre: 'pendente', // Status da validação da CRE
    justificativaRejeicao: '', // Initialize rejection reason
    numeroProcessoSEI: '' // Initialize SEI process number
  };
};

export default function ProjetoArteEducaPage() {
  const [tipo, setTipo] = useState(null); // Stores the current project type (e.g., 'artesVisuais')
  const [config, setConfig] = useState(null); // Stores the configuration object for the current type
  const [projeto, setProjeto] = useState(null); // Project data, initialized to null while loading
  const [activeSection, setActiveSection] = useState('identificacao');
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Manages loading state for the component
  const [isReadOnly, setIsReadOnly] = useState(true); // New state for read-only mode, default to true
  const [showRejectionReasonInput, setShowRejectionReasonInput] = useState(false);
  const [currentRejectionReason, setCurrentRejectionReason] = useState('');
  const [canApproveReject, setCanApproveReject] = useState(false); // Can admin/gestor/articulador approve/reject
  const [currentSeiNumber, setCurrentSeiNumber] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('principal'); // New state for school selection

  // Primary useEffect for initial data loading
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tipoFromUrl = urlParams.get('tipo') || 'artesVisuais'; // Default project type
    const idFromUrl = urlParams.get('id');

    const selectedConfig = projectTypeConfigs[tipoFromUrl] || projectTypeConfigs.artesVisuais;
    setTipo(tipoFromUrl);
    setConfig(selectedConfig);

    const loadData = async () => {
        let userData = null;
        let fetchedProject = null;
        try {
            userData = await User.me();
            setUser(userData);
        } catch (error) {
            console.log("Usuário não logado ou erro ao buscar dados do usuário.");
        }

      if (idFromUrl) {
        try {
          const projetosData = await ProjetoArteEduca.list();
          fetchedProject = projetosData.find(p => p.id === idFromUrl);
          
          if (fetchedProject) {
            const projectTypeForInitialState = fetchedProject.tipoProjeto || tipoFromUrl;
            const initialState = getInitialState(projectTypeForInitialState);
            const mergedProject = {
              ...initialState,
              ...fetchedProject,
              justificativaRejeicao: fetchedProject.justificativaRejeicao || '',
              numeroProcessoSEI: fetchedProject.numeroProcessoSEI || '', // Ensure SEI field is initialized
              identificacao: {
                ...initialState.identificacao,
                ...fetchedProject.identificacao,
                quantidadeAlunosFundamental2: fetchedProject.identificacao?.quantidadeAlunosFundamental2 || '',
                quantidadeAlunosMedio: fetchedProject.identificacao?.quantidadeAlunosMedio || '',
                quantidadeEstudantes: (fetchedProject.identificacao?.quantidadeAlunosFundamental2 || fetchedProject.identificacao?.quantidadeAlunosMedio) ?
                                      (parseInt(fetchedProject.identificacao.quantidadeAlunosFundamental2 || '0', 10) + parseInt(fetchedProject.identificacao.quantidadeAlunosMedio || '0', 10)).toString() :
                                      (fetchedProject.identificacao?.quantidadeEstudantes || ''),
                funcao: {
                  ...initialState.identificacao.funcao,
                  ...(fetchedProject.identificacao?.funcao || {})
                },
                professor: {
                    ...initialState.identificacao.professor,
                    ...(fetchedProject.identificacao?.professor || {})
                },
                etapasEnsino: fetchedProject.identificacao?.etapasEnsino || initialState.identificacao.etapasEnsino,
                recursosMateriais: fetchedProject.identificacao?.recursosMateriais || initialState.identificacao.recursosMateriais
              },
              projeto: {
                ...initialState.projeto,
                ...fetchedProject.projeto
              },
              quadroHorario: {
                ...initialState.quadroHorario,
                ...fetchedProject.quadroHorario,
                turno: fetchedProject.quadroHorario?.turno || initialState.quadroHorario.turno,
                cargaHoraria: fetchedProject.quadroHorario?.cargaHoraria || initialState.quadroHorario.cargaHoraria,
                modulacaoPrincipal: initialState.quadroHorario.modulacaoPrincipal.map((initialItem, idx) => {
                    const fetchedItem = fetchedProject.quadroHorario?.modulacaoPrincipal?.[idx] || {};
                    const mergedDays = {};
                    ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'].forEach(dia => {
                        mergedDays[dia] = typeof fetchedItem[dia] === 'string' ? !!fetchedItem[dia] : fetchedItem[dia] || false;
                    });
                    return { ...initialItem, ...fetchedItem, ...mergedDays };
                })
              },
              planoAnual: {
                ...initialState.planoAnual,
                ...fetchedProject.planoAnual,
                primeiroSemestre: fetchedProject.planoAnual?.primeiroSemestre || initialState.planoAnual.primeiroSemestre,
                segundoSemestre: fetchedProject.planoAnual?.segundoSemestre || initialState.planoAnual.segundoSemestre
              },
              cronograma: {
                ...initialState.cronograma,
                ...fetchedProject.cronograma,
                acoes: fetchedProject.cronograma?.acoes || initialState.cronograma.acoes
              }
            };
            setProjeto(mergedProject);
            setCurrentSeiNumber(mergedProject.numeroProcessoSEI || '');
          } else {
            console.log("Projeto não encontrado, inicializando um novo.");
            setProjeto(getInitialState(tipoFromUrl)); 
          }
        } catch (error) {
          console.error("Error loading project:", error);
          setProjeto(getInitialState(tipoFromUrl)); 
        }
      } else {
        const initialState = getInitialState(tipoFromUrl);
        if (userData) {
            initialState.identificacao.cre = userData.cre || '';
            initialState.identificacao.municipio = userData.municipio || '';
            initialState.identificacao.unidadeEducacional = userData.unidadeEducacional || '';
            initialState.identificacao.inep = userData.inep || '';
            
            initialState.identificacao.professor.nome = userData.full_name || '';
            initialState.identificacao.professor.cpf = userData.cpf || '';
            initialState.identificacao.professor.rg = userData.rg || '';
            initialState.identificacao.professor.dataNascimento = userData.dataNascimento || '';
            initialState.identificacao.professor.telefone = userData.telefone || '';
            initialState.identificacao.professor.email = userData.email || '';

            // For new projects, set the initial selected school to 'principal'
            setSelectedSchool('principal');
        }
        setProjeto(initialState);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  // Secondary useEffect to determine permissions based on project status and user role
  useEffect(() => {
    if (!projeto || !user) return; // Wait until both project and user are loaded

    const role = user.app_role;
    const projectStatus = projeto.status;
    const isProfessor = role === 'professor';
    const isAdminOrGestorOrArticulador = role === 'admin' || role === 'gestor' || role === 'articulador';

    // A professor can edit content if the project is a draft or has been rejected
    // Also, if it's a new project (no ID yet) and the user is a professor, they should be able to edit.
    const canEditContent = (isProfessor && (projectStatus === 'rascunho' || projectStatus === 'rejeitado')) || (isProfessor && !projeto.id);
    
    setIsReadOnly(!canEditContent);

    // Admin/Gestor/Articulador can approve/reject projects that are 'enviado'
    setCanApproveReject(isAdminOrGestorOrArticulador && projectStatus === 'enviado');

    // Pre-fill rejection reason if project was rejected and user is admin/gestor/articulador
    if (isAdminOrGestorOrArticulador && projectStatus === 'rejeitado' && projeto.justificativaRejeicao) {
        setCurrentRejectionReason(projeto.justificativaRejeicao);
    } else if (isAdminOrGestorOrArticulador && projectStatus === 'enviado' && projeto.justificativaRejeicao) {
      // If it's sent again after rejection, the reason should still be visible for reference by admin
      setCurrentRejectionReason(projeto.justificativaRejeicao);
    }
    else {
        setCurrentRejectionReason('');
    }

  }, [projeto, user]); // Re-run when project or user changes

  // Handles professor's actions (save as draft, submit for approval)
  const handleProfessorAction = async (newStatus) => {
    // Validar apenas se estiver enviando (não no rascunho)
    if (newStatus === 'enviado') {
      const validation = validateProjeto(projeto);
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
          duration: 8000,
        });
        return;
      }
    }

    setSaving(true);
    let dataToSave = { ...projeto };

    dataToSave.status = newStatus;
    if (newStatus === 'enviado') {
      dataToSave.dataSubmissao = new Date().toISOString();
      dataToSave.justificativaRejeicao = ''; // Clear rejection reason on resubmission
      dataToSave.status_gestor = 'pendente'; // Reset gestor status on submission
      dataToSave.status_cre = 'pendente'; // Reset CRE status on submission
    }

    // Add created_by for new projects
    if (!projeto.id && user) {
      dataToSave.created_by = user.email;
    }

    try {
      let response;
      if (projeto.id) { 
        response = await ProjetoArteEduca.update(projeto.id, dataToSave); 
        toast.success(newStatus === 'rascunho' ? 'Projeto salvo como rascunho!' : 'Projeto enviado com sucesso!');
      } else {
        response = await ProjetoArteEduca.create(dataToSave);
        toast.success(newStatus === 'rascunho' ? 'Projeto criado como rascunho!' : 'Projeto enviado com sucesso!');
        if (response && response.id) {
          setProjeto(prev => ({ ...prev, id: response.id, status: newStatus }));
        }
      }
      setProjeto(prev => ({ ...prev, ...dataToSave })); // Update local state with new status
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      toast.error('Erro ao salvar projeto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Handles admin/gestor/articulador approving a project
  const handleApproveProject = async () => {
    // In a real application, you might prompt for the SEI number here
    const numeroProcessoSEI = prompt("Por favor, insira o número do Processo SEI (opcional):");

    setSaving(true);
    try {
        await ProjetoArteEduca.update(projeto.id, { 
            status: 'aprovado', 
            dataAprovacao: new Date().toISOString(), 
            justificativaRejeicao: '',
            numeroProcessoSEI: numeroProcessoSEI || '' // Save SEI number
        });
        toast.success('Projeto aprovado com sucesso!');
        setProjeto(prev => ({ ...prev, status: 'aprovado', justificativaRejeicao: '', numeroProcessoSEI: numeroProcessoSEI || '' })); // Update local state
        setCurrentSeiNumber(numeroProcessoSEI || '');
    } catch (error) {
        console.error("Erro ao aprovar projeto:", error);
        toast.error('Erro ao aprovar projeto. Tente novamente.');
    } finally {
        setSaving(false);
        setShowRejectionReasonInput(false);
    }
  };

  // Handles admin/gestor/articulador rejecting a project
  const handleRejectProject = async () => {
    if (!currentRejectionReason.trim()) {
        toast.error('Por favor, informe uma justificativa para a rejeição.');
        return;
    }
    setSaving(true);
    try {
        await ProjetoArteEduca.update(projeto.id, { status: 'rejeitado', justificativaRejeicao: currentRejectionReason, numeroProcessoSEI: '' }); // Clear SEI number on rejection
        toast.success('Projeto rejeitado.');
        setProjeto(prev => ({ ...prev, status: 'rejeitado', justificativaRejeicao: currentRejectionReason, numeroProcessoSEI: '' })); // Update local state
        setCurrentSeiNumber('');
    } catch (error) {
        console.error("Erro ao rejeitar projeto:", error);
        toast.error('Erro ao rejeitar projeto. Tente novamente.');
    } finally {
        setSaving(false);
        setShowRejectionReasonInput(false);
    }
  };
  
  const handleSeiNumberUpdate = async () => {
    if (!projeto.id || !user || user.app_role !== 'admin') {
      alert("Você não tem permissão para editar o número SEI ou o projeto não foi salvo.");
      return;
    }
    setSaving(true);
    try {
      await ProjetoArteEduca.update(projeto.id, { numeroProcessoSEI: currentSeiNumber });
      alert('Número do Processo SEI atualizado com sucesso!');
      setProjeto(prev => ({ ...prev, numeroProcessoSEI: currentSeiNumber }));
    } catch (error) {
      console.error("Erro ao atualizar o número SEI:", error);
      alert("Falha ao atualizar o número SEI.");
    } finally {
      setSaving(false);
    }
  };

  // Handles changes for the dynamic 'funcao' fields
  const handleFuncaoChange = (id, value, type) => {
    if (isReadOnly) return;
    setProjeto(prev => ({
      ...prev,
      identificacao: {
        ...prev.identificacao,
        funcao: {
          ...prev.identificacao.funcao,
          [id]: value
        }
      }
    }));
  };

  const addRecursoMaterial = () => {
    if (isReadOnly) return;
    setProjeto(prev => ({
      ...prev,
      identificacao: {
        ...prev.identificacao,
        recursosMateriais: [...prev.identificacao.recursosMateriais, { material: '', quantidade: '' }]
      }
    }));
  };

  const removeRecursoMaterial = (index) => {
    if (isReadOnly) return;
    setProjeto(prev => ({
      ...prev,
      identificacao: {
        ...prev.identificacao,
        recursosMateriais: prev.identificacao.recursosMateriais.filter((_, i) => i !== index)
      }
    }));
  };

  const addPlanoItem = (semestre) => {
    if (isReadOnly) return;
    setProjeto(prev => ({
      ...prev,
      planoAnual: {
        ...prev.planoAnual,
        [semestre]: [...prev.planoAnual[semestre], { habilidade: '', objetoConhecimento: '', desenvolvimentoConteudo: '' }]
      }
    }));
  };

  const removePlanoItem = (semestre, index) => {
    if (isReadOnly) return;
    setProjeto(prev => ({
      ...prev,
      planoAnual: {
        ...prev.planoAnual,
        [semestre]: prev.planoAnual[semestre].filter((_, i) => i !== index)
      }
    }));
  };

  const sections = [
    { id: 'identificacao', name: 'Identificação', icon: MapPin },
    { id: 'projeto', name: 'Projeto', icon: FileText },
    { id: 'horario', name: 'Quadro de Horário', icon: Clock },
    { id: 'plano', name: 'Plano Anual', icon: BookOpen },
    { id: 'cronograma', name: 'Cronograma', icon: Calendar },
    { id: 'final', name: 'Finalização', icon: Send }
  ];

  const currentSectionIndex = sections.findIndex((section) => section.id === activeSection);
  const previousSection = currentSectionIndex > 0 ? sections[currentSectionIndex - 1] : null;
  const nextSection = currentSectionIndex < sections.length - 1 ? sections[currentSectionIndex + 1] : null;

  const navigateToSection = (sectionId) => {
    setActiveSection(sectionId);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextSection = () => {
    if (nextSection) {
      navigateToSection(nextSection.id);
    }
  };

  const handlePreviousSection = () => {
    if (previousSection) {
      navigateToSection(previousSection.id);
    }
  };

  const totalHorasCalculadas = React.useMemo(() => {
    if (!projeto?.quadroHorario) return 0;
    const { modulacaoPrincipal } = projeto.quadroHorario;
    let total = 0;
    const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    modulacaoPrincipal.forEach(linha => { // Changed from [...modulacaoPrincipal, ...modulacaoSecundaria]
        dias.forEach(dia => {
            if (linha[dia]) {
                total++;
            }
        });
    });
    return total;
  }, [projeto?.quadroHorario]);
  
  // Show loading spinner while project data or configuration is being loaded
  if (loading || !projeto || !config) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="neu-card p-6 sm:p-8 flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-gray-600 animate-spin mb-4" />
          <div className="text-gray-600">Carregando formulário...</div>
        </div>
      </div>
    );
  }

  const userSchools = [];
  if (user?.unidadeEducacional && user?.inep) {
    userSchools.push({ id: 'principal', label: user.unidadeEducacional, data: { cre: user.cre, municipio: user.municipio, unidadeEducacional: user.unidadeEducacional, inep: user.inep } });
  }
  if (user?.unidadeEducacionalSecundaria && user?.inepSecundaria) {
    userSchools.push({ id: 'secundaria', label: user.unidadeEducacionalSecundaria, data: { cre: user.creSecundaria, municipio: user.municipioSecundaria, unidadeEducacional: user.unidadeEducacionalSecundaria, inep: user.inepSecundaria } });
  }
  if (user?.unidadeEducacionalTerciaria && user?.inepTerciaria) {
    userSchools.push({ id: 'terciaria', label: user.unidadeEducacionalTerciaria, data: { cre: user.creTerciaria, municipio: user.municipioTerciaria, unidadeEducacional: user.unidadeEducacionalTerciaria, inep: user.inepTerciaria } });
  }

  const handleSchoolSelection = (schoolId) => {
    if (isReadOnly) return;
    const school = userSchools.find(s => s.id === schoolId);
    if (school) {
        setSelectedSchool(schoolId);
        setProjeto(prev => ({
            ...prev,
            identificacao: {
                ...prev.identificacao,
                cre: school.data.cre,
                municipio: school.data.municipio,
                unidadeEducacional: school.data.unidadeEducacional,
                inep: school.data.inep,
                // Reset student counts and stages when changing school
                etapasEnsino: [],
                quantidadeAlunosFundamental2: '',
                quantidadeAlunosMedio: '',
                quantidadeEstudantes: ''
            }
        }));
    }
  };


  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Rejection Reason Alert - Displayed to Professor if project status is 'rejeitado' or 'rascunho' after rejection*/}
      {projeto.justificativaRejeicao && (projeto.status === 'rascunho' || projeto.status === 'rejeitado') && user?.app_role === 'professor' && (
        <div className="neu-card p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-md font-medium text-yellow-800">Projeto Rejeitado</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p><strong>Justificativa:</strong> {projeto.justificativaRejeicao}</p>
                <p className="mt-1">Por favor, revise os pontos indicados e envie o projeto novamente.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="neu-card p-4 sm:p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{config.pageTitle}</h1>
          <p className="text-lg font-semibold text-green-700 mt-2">Arte Educa</p>
          <p className="text-sm text-gray-600 mt-1">Anexos da Portaria n.º 2037/2022</p>
          <p className="text-gray-600 mt-1">Estado de Goiás - Secretaria de Estado da Educação</p>
        </div>
      </div>

      {/* Read-Only Message */}
      {isReadOnly && user?.app_role === 'professor' && projeto.id && (projeto.status === 'enviado' || projeto.status === 'aprovado') && (
         <div className="neu-card p-4 bg-blue-50 text-blue-800 flex items-center space-x-3">
            <Eye className="w-6 h-6" />
            <p className="font-semibold">Modo de visualização. O projeto foi enviado ou aprovado e não pode mais ser editado.</p>
        </div>
      )}
      {isReadOnly && (user?.app_role === 'admin' || user?.app_role === 'gestor' || user?.app_role === 'articulador') && (
        <div className="neu-card p-4 bg-blue-50 text-blue-800 flex items-center space-x-3">
            <Eye className="w-6 h-6" />
            <p className="font-semibold">Modo de visualização de conteúdo. Você pode aprovar ou rejeitar projetos enviados.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="neu-card p-2">
        <div className="flex flex-wrap justify-center gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm ${
                activeSection === section.id
                  ? 'neu-pressed text-blue-600'
                  : 'neu-button text-gray-700 hover:text-gray-900'
              }`}
            >
              <section.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{section.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section Content */}
      <div className="neu-card p-4 sm:p-6">
        {activeSection === 'identificacao' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">1. IDENTIFICAÇÃO DO PROJETO</h2>
            
            {/* School Selector - Only for new, editable projects with more than one school */}
            {!projeto.id && userSchools.length > 1 && !isReadOnly && (
              <div className="neu-inset p-4 rounded-xl mb-6">
                <label htmlFor="schoolSelection" className="font-semibold text-gray-800 mb-4 block">Selecione a Unidade Educacional para este Projeto</label>
                <select
                    id="schoolSelection"
                    value={selectedSchool}
                    onChange={(e) => handleSchoolSelection(e.target.value)}
                    className="neu-input w-full px-4 py-3"
                    disabled={isReadOnly}
                >
                  {userSchools.map(school => (
                    <option key={school.id} value={school.id}>
                      {school.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Modulação Principal (now the only modulation) */}
            <div className="neu-inset p-4 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-4">C – Unidade Educacional</h3>
              <div className="space-y-4">
                <EscolaFields 
                  values={{
                    inep: projeto.identificacao.inep,
                    cre: projeto.identificacao.cre,
                    municipio: projeto.identificacao.municipio,
                    unidadeEducacional: projeto.identificacao.unidadeEducacional
                  }}
                  onChange={(field, value) => {
                      setProjeto(prev => ({
                        ...prev,
                        identificacao: { ...prev.identificacao, [field]: value }
                      }));
                  }}
                  required={true}
                  disabled={isReadOnly}
                />

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Etapas de Ensino que a UE atende</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={projeto.identificacao.etapasEnsino.includes('fundamental2')}
                        onChange={(e) => {
                                const etapas = projeto.identificacao.etapasEnsino;
                                let updatedEtapas;
                                if (e.target.checked) {
                                    updatedEtapas = [...etapas, 'fundamental2'];
                                } else {
                                    updatedEtapas = etapas.filter(e => e !== 'fundamental2');
                                    // Clear the count if the stage is unchecked
                                    setProjeto(prev => {
                                        const newFundamental2Count = '';
                                        const medioCount = parseInt(prev.identificacao.quantidadeAlunosMedio, 10) || 0;
                                        return {
                                            ...prev,
                                            identificacao: {
                                                ...prev.identificacao,
                                                quantidadeAlunosFundamental2: newFundamental2Count,
                                                quantidadeEstudantes: (parseInt(newFundamental2Count || '0', 10) + medioCount).toString(),
                                            }
                                        };
                                    });
                                }
                                setProjeto(prev => ({
                                    ...prev,
                                    identificacao: { ...prev.identificacao, etapasEnsino: updatedEtapas }
                                }));
                        }}
                        className="neu-input w-5 h-5"
                        disabled={isReadOnly}
                      />
                      <span>Fundamental II</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={projeto.identificacao.etapasEnsino.includes('medio')}
                        onChange={(e) => {
                                const etapas = projeto.identificacao.etapasEnsino;
                                let updatedEtapas;
                                if (e.target.checked) {
                                    updatedEtapas = [...etapas, 'medio'];
                                } else {
                                    updatedEtapas = etapas.filter(e => e !== 'medio');
                                    // Clear the count if the stage is unchecked
                                    setProjeto(prev => {
                                        const newMedioCount = '';
                                        const fundamental2Count = parseInt(prev.identificacao.quantidadeAlunosFundamental2, 10) || 0;
                                        return {
                                            ...prev,
                                            identificacao: {
                                                ...prev.identificacao,
                                                quantidadeAlunosMedio: newMedioCount,
                                                quantidadeEstudantes: (fundamental2Count + parseInt(newMedioCount || '0', 10)).toString(),
                                            }
                                        };
                                    });
                                }
                                setProjeto(prev => ({
                                    ...prev,
                                    identificacao: { ...prev.identificacao, etapasEnsino: updatedEtapas }
                                }));
                        }}
                        className="neu-input w-5 h-5"
                        disabled={isReadOnly}
                      />
                      <span>Ensino Médio</span>
                    </label>
                  </div>

                  {projeto.identificacao.etapasEnsino.includes('fundamental2') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade de Alunos do Fundamental II</label>
                      <input
                        type="number"
                        value={projeto.identificacao.quantidadeAlunosFundamental2}
                        onChange={(e) => {
                            const fundamental2 = parseInt(e.target.value, 10) || 0;
                            const medio = parseInt(projeto.identificacao.quantidadeAlunosMedio, 10) || 0;
                            setProjeto(prev => ({
                              ...prev,
                              identificacao: { ...prev.identificacao, quantidadeAlunosFundamental2: e.target.value, quantidadeEstudantes: (fundamental2 + medio).toString() }
                            }))
                        }}
                        className="neu-input w-full px-4 py-3 text-gray-700"
                        placeholder="Número de estudantes"
                        readOnly={isReadOnly}
                      />
                    </div>
                  )}

                  {projeto.identificacao.etapasEnsino.includes('medio') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade de Alunos do Ensino Médio</label>
                      <input
                        type="number"
                        value={projeto.identificacao.quantidadeAlunosMedio}
                        onChange={(e) => {
                            const fundamental2 = parseInt(projeto.identificacao.quantidadeAlunosFundamental2, 10) || 0;
                            const medio = parseInt(e.target.value, 10) || 0;
                            setProjeto(prev => ({
                              ...prev,
                              identificacao: { ...prev.identificacao, quantidadeAlunosMedio: e.target.value, quantidadeEstudantes: (fundamental2 + medio).toString() }
                            }))
                        }}
                        className="neu-input w-full px-4 py-3 text-gray-700"
                        placeholder="Número de estudantes"
                        readOnly={isReadOnly}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tipoMatriz"
                      value="matricular"
                      checked={projeto.identificacao.tipoMatriz === 'matricular'}
                      onChange={(e) => setProjeto(prev => ({
                        ...prev,
                        identificacao: { ...prev.identificacao, tipoMatriz: e.target.value }
                      }))}
                      className="neu-input w-5 h-5"
                      disabled={isReadOnly}
                    />
                    <span>Matriz Curricular</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tipoMatriz"
                      value="projetos"
                      checked={projeto.identificacao.tipoMatriz === 'projetos'}
                      onChange={(e) => setProjeto(prev => ({
                        ...prev,
                        identificacao: { ...prev.identificacao, tipoMatriz: e.target.value }
                      }))}
                      className="neu-input w-5 h-5"
                      disabled={isReadOnly}
                    />
                    <span>Projetos de Atividades Educacionais Complementares</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total de Alunos</label>
                  <input
                    type="text"
                    value={projeto.identificacao.quantidadeEstudantes}
                    className="neu-input w-full px-4 py-3 text-gray-700 bg-gray-100"
                    placeholder="Total de estudantes"
                    readOnly={true}
                  />
                </div>
              </div>
            </div>

            {/* Professor Responsável */}
            <div className="neu-inset p-4 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-4">D – Professor Responsável pelo Projeto (regente)</h3> {/* Label changed from E to D */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={projeto.identificacao.professor.nome}
                    onChange={(e) => setProjeto(prev => ({
                      ...prev,
                      identificacao: {
                        ...prev.identificacao,
                        professor: { ...prev.identificacao.professor, nome: e.target.value }
                      }
                    }))}
                    className="neu-input w-full px-4 py-3 text-gray-700"
                    placeholder="Nome completo do professor"
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                  <input
                    type="text"
                    value={projeto.identificacao.professor.cpf}
                    onChange={(e) => setProjeto(prev => ({
                      ...prev,
                      identificacao: {
                        ...prev.identificacao,
                        professor: { ...prev.identificacao.professor, cpf: e.target.value }
                      }
                    }))}
                    className="neu-input w-full px-4 py-3 text-gray-700"
                    placeholder="000.000.000-00"
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">RG</label>
                  <input
                    type="text"
                    value={projeto.identificacao.professor.rg}
                    onChange={(e) => setProjeto(prev => ({
                      ...prev,
                      identificacao: {
                        ...prev.identificacao,
                        professor: { ...prev.identificacao.professor, rg: e.target.value }
                      }
                    }))}
                    className="neu-input w-full px-4 py-3 text-gray-700"
                    placeholder="RG"
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento</label>
                  <input
                    type="date"
                    value={projeto.identificacao.professor.dataNascimento}
                    onChange={(e) => setProjeto(prev => ({
                      ...prev,
                      identificacao: {
                        ...prev.identificacao,
                        professor: { ...prev.identificacao.professor, dataNascimento: e.target.value }
                      }
                    }))}
                    className="neu-input w-full px-4 py-3 text-gray-700"
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={projeto.identificacao.professor.telefone}
                    onChange={(e) => setProjeto(prev => ({
                      ...prev,
                      identificacao: {
                        ...prev.identificacao,
                        professor: { ...prev.identificacao.professor, telefone: e.target.value }
                      }
                    }))}
                    className="neu-input w-full px-4 py-3 text-gray-700"
                    placeholder="(00) 00000-0000"
                    readOnly={isReadOnly}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                  <input
                    type="email"
                    value={projeto.identificacao.professor.email}
                    onChange={(e) => setProjeto(prev => ({
                      ...prev,
                      identificacao: {
                        ...prev.identificacao,
                        professor: { ...prev.identificacao.professor, email: e.target.value }
                      }
                    }))}
                    className="neu-input w-full px-4 py-3 text-gray-700"
                    placeholder="email@exemplo.com"
                    readOnly={isReadOnly}
                  />
                </div>
              </div>
            </div>

            {/* F - Função (Dynamic based on project type) */}
            <div className="neu-inset p-4 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-4">E – Função: {config.header}</h3> {/* Label changed from F to E */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {config.funcaoFields.map(field => (
                  <div key={field.id}>
                    {field.type === 'checkbox' ? (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={!!projeto.identificacao.funcao?.[field.id]} // Use optional chaining and !! for boolean
                          onChange={(e) => handleFuncaoChange(field.id, e.target.checked, 'checkbox')}
                          className="neu-input w-5 h-5"
                          disabled={isReadOnly}
                        />
                        <span>{field.label}</span>
                      </label>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                        <input
                          type="text"
                          value={projeto.identificacao.funcao?.[field.id] || ''} // Use optional chaining and default to empty string
                          onChange={(e) => handleFuncaoChange(field.id, e.target.value, 'text')}
                          className="neu-input w-full px-4 py-3 text-gray-700"
                          readOnly={isReadOnly}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              { (tipo === 'bandasEFanfarras' || tipo === 'cantoCoral' || tipo === 'praticaDeConjunto' || tipo === 'violao') &&
                <p className="text-sm text-gray-600 mt-4">Obs.: Quando o professor é regente e professor de naipe (ensino coletivo), marcar as duas funções.</p>
              }
            </div>

            {/* Recursos Materiais */}
            <div className="neu-inset p-4 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">F – RECURSOS MATERIAIS</h3> {/* Label changed from G to F */}
                <button
                  onClick={addRecursoMaterial}
                  className="neu-button px-3 py-2 rounded-lg text-gray-700 hover:text-gray-900 flex items-center space-x-2"
                  disabled={isReadOnly}
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">Liste os materiais existentes na UE disponíveis para realização do Projeto Arte Educa. Ex.: Pincéis – 14, telas – 09 etc.</p>
              
              <div className="space-y-3">
                {projeto.identificacao.recursosMateriais.map((recurso, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={recurso.material}
                        onChange={(e) => {
                            const recursos = [...projeto.identificacao.recursosMateriais];
                            recursos[index].material = e.target.value;
                            setProjeto(prev => ({
                              ...prev,
                              identificacao: { ...prev.identificacao, recursosMateriais: recursos }
                            }));
                        }}
                        className="neu-input w-full px-3 py-2 text-gray-700"
                        placeholder="Material"
                        readOnly={isReadOnly}
                      />
                    </div>
                    <div className="w-32">
                      <input
                        type="text"
                        value={recurso.quantidade}
                        onChange={(e) => {
                                const recursos = [...projeto.identificacao.recursosMateriais];
                                recursos[index].quantidade = e.target.value;
                                setProjeto(prev => ({
                                ...prev,
                                identificacao: { ...prev.identificacao, recursosMateriais: recursos }
                                }));
                        }}
                        className="neu-input w-full px-3 py-2 text-gray-700"
                        placeholder="Quantidade"
                        readOnly={isReadOnly}
                      />
                    </div>
                    {projeto.identificacao.recursosMateriais.length > 1 && (
                      <button
                        onClick={() => removeRecursoMaterial(index)}
                        className="neu-button p-2 rounded-lg text-red-600 hover:text-red-800"
                        disabled={isReadOnly}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'projeto' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">2. PROJETO</h2>
            <p className="text-sm text-gray-600 mb-6">O Professor que trabalha em duas unidades escolares deve entregar dois projetos, um de cada UE.</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">A – Introdução</label>
              <p className="text-sm text-gray-600 mb-2">Descreva a proposta pedagógica, evidenciando os benefícios educativos e sociais a serem desenvolvidos com os estudantes.</p>
              <textarea
                value={projeto.projeto.introducao}
                onChange={(e) => setProjeto(prev => ({
                  ...prev,
                  projeto: { ...prev.projeto, introducao: e.target.value }
                }))}
                className="neu-input w-full px-4 py-3 text-gray-700 h-32 resize-none"
                placeholder="Descreva a proposta pedagógica..."
                readOnly={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">B – Justificativa</label>
              <p className="text-sm text-gray-600 mb-2">Fundamente a importância do projeto como resposta a um problema ou necessidade identificado no ambiente escolar.</p>
              <textarea
                value={projeto.projeto.justificativa}
                onChange={(e) => setProjeto(prev => ({
                  ...prev,
                  projeto: { ...prev.projeto, justificativa: e.target.value }
                }))}
                className="neu-input w-full px-4 py-3 text-gray-700 h-32 resize-none"
                placeholder="Fundamente a importância do projeto..."
                readOnly={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">C.1 – Objetivo Geral</label>
              <textarea
                value={projeto.projeto.objetivoGeral}
                onChange={(e) => setProjeto(prev => ({
                  ...prev,
                  projeto: { ...prev.projeto, objetivoGeral: e.target.value }
                }))}
                className="neu-input w-full px-4 py-3 text-gray-700 h-24 resize-none"
                readOnly={true} // This field is intentionally read-only by default
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">C.2 – Objetivos Específicos</label>
              <p className="text-sm text-gray-600 mb-2">Liste os objetivos a serem alcançados. Ex.: Compreender como segurar o instrumento musical.</p>
              <textarea
                value={projeto.projeto.objetivosEspecificos}
                onChange={(e) => setProjeto(prev => ({
                  ...prev,
                  projeto: { ...prev.projeto, objetivosEspecificos: e.target.value }
                }))}
                className="neu-input w-full px-4 py-3 text-gray-700 h-32 resize-none"
                placeholder="Liste os objetivos específicos..."
                readOnly={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">D – Metodologia</label>
              <p className="text-sm text-gray-600 mb-2">Detalhe como são realizadas as aulas, estratégias e práticas de ensino.</p>
              <textarea
                value={projeto.projeto.metodologia}
                onChange={(e) => setProjeto(prev => ({
                  ...prev,
                  projeto: { ...prev.projeto, metodologia: e.target.value }
                }))}
                className="neu-input w-full px-4 py-3 text-gray-700 h-32 resize-none"
                placeholder="Detalhe a metodologia..."
                readOnly={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E – Avaliação</label>
              <textarea
                value={projeto.projeto.avaliacao}
                onChange={(e) => setProjeto(prev => ({
                  ...prev,
                  projeto: { ...prev.projeto, avaliacao: e.target.value }
                }))}
                className="neu-input w-full px-4 py-3 text-gray-700 h-32 resize-none"
                readOnly={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">G – Referências</label>
              <textarea
                value={projeto.projeto.referencias}
                onChange={(e) => setProjeto(prev => ({
                  ...prev,
                  projeto: { ...prev.projeto, referencias: e.target.value }
                }))}
                className="neu-input w-full px-4 py-3 text-gray-700 h-32 resize-none"
                placeholder="Liste as referências bibliográficas..."
                readOnly={isReadOnly}
              />
            </div>
          </div>
        )}

        {activeSection === 'horario' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">3. QUADRO DE HORÁRIO</h2>
            
            {/* Turno */}
            <div className="neu-inset p-4 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-4">TURNO:</h3>
              <div className="flex flex-wrap gap-4">
                {[
                  { value: 'matutino', label: 'Matutino' },
                  { value: 'vespertino', label: 'Vespertino' },
                  { value: 'noturno', label: 'Noturno' },
                  { value: 'entreTurno', label: 'Entre Turno' },
                  { value: 'sabado', label: 'Sábado' }
                ].map((turno) => (
                  <label key={turno.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={projeto.quadroHorario.turno.includes(turno.value)}
                      onChange={(e) => {
                            const turnos = projeto.quadroHorario.turno;
                            if (e.target.checked) {
                                setProjeto(prev => ({
                                ...prev,
                                quadroHorario: { ...prev.quadroHorario, turno: [...turnos, turno.value] }
                                }));
                            } else {
                                setProjeto(prev => ({
                                ...prev,
                                quadroHorario: { ...prev.quadroHorario, turno: turnos.filter(t => t !== turno.value) }
                                }));
                            }
                      }}
                      className="neu-input w-5 h-5"
                      disabled={isReadOnly}
                    />
                    <span>{turno.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Carga Horária */}
            <div className="neu-inset p-4 rounded-xl">
              <div>
                <label htmlFor="cargaHoraria" className="block text-sm font-medium text-gray-700 mb-2">Carga Horária Semanal (em horas-relógio)</label>
                <input
                  id="cargaHoraria"
                  type="number"
                  value={projeto.quadroHorario.cargaHoraria}
                  onChange={(e) => setProjeto(prev => ({
                    ...prev,
                    quadroHorario: { ...prev.quadroHorario, cargaHoraria: e.target.value }
                  }))}
                  className="neu-input w-full px-4 py-3"
                  placeholder="Ex: 20"
                  disabled={isReadOnly}
                />
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg mt-6">
                <h4 className="font-bold text-gray-800 mb-2">ATENÇÃO!</h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• As atividades relacionadas à formação continuada fora do horário escolar não devem ser incluídas no quadro de horário. Elas devem ser voltadas exclusivamente para a formação profissional, como as oferecidas pelo Arte Educa, com certificado válido para a comprovação do bônus de aprimoramento profissional;</li>
                  <li>• Os horários de aprimoramento são: 20h – 5h relógio; 30h – 7h relógio e 40h – 9h relógio;</li>
                  <li>• De acordo com o Art. 6º da Portaria 2037/2022 do Projeto Arte Educa: Quando ocorrer pós turno vespertino, as aulas não podem ultrapassar as 20h.</li>
                  <li>• Segundo a Diretriz Operacional Seduc/GO – 2025, o Professor/Instrutor modulado no Arte Educa deve estar vinculado aos processos de formação continuada fomentados pela Gerência de Arte e Educação e por meio dos cursos ofertados pelo Centro de Estudo e Pesquisa Arte Educa.</li>
                </ul>
              </div>
            </div>

            {/* A – Modulação Principal */}
            <div className="neu-inset p-4 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-4">A – Modulação</h3> {/* Renamed from Modulação Principal */}
              <p className="text-sm text-gray-600 mb-4">(Identificar no quadro de horário o tempo destinado à hora atividade.)</p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-green-100">
                      <th className="border border-gray-400 px-2 py-2 text-sm font-semibold text-gray-800">HORÁRIO</th>
                      <th className="border border-gray-400 px-2 py-2 text-sm font-semibold text-gray-800">SEGUNDA</th>
                      <th className="border border-gray-400 px-2 py-2 text-sm font-semibold text-gray-800">TERÇA</th>
                      <th className="border border-gray-400 px-2 py-2 text-sm font-semibold text-gray-800">QUARTA</th>
                      <th className="border border-gray-400 px-2 py-2 text-sm font-semibold text-gray-800">QUINTA</th>
                      <th className="border border-gray-400 px-2 py-2 text-sm font-semibold text-gray-800">SEXTA</th>
                      <th className="border border-gray-400 px-2 py-2 text-sm font-semibold text-gray-800">SÁBADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projeto.quadroHorario.modulacaoPrincipal.map((linha, index) => (
                      <tr key={index}>
                        <td className="border border-gray-400 p-1">
                          <input
                            type="text"
                            value={linha.horario}
                            onChange={(e) => {
                                    const novaModulacao = [...projeto.quadroHorario.modulacaoPrincipal];
                                    novaModulacao[index].horario = e.target.value;
                                    setProjeto(prev => ({
                                    ...prev,
                                    quadroHorario: { ...prev.quadroHorario, modulacaoPrincipal: novaModulacao }
                                    }));
                            }}
                            className="w-full px-2 py-1 text-sm bg-transparent border-none focus:outline-none"
                            placeholder="Ex: 07:00-08:00"
                            readOnly={isReadOnly}
                          />
                        </td>
                        {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'].map((dia) => (
                          <td key={dia} className="border border-gray-400 p-1 text-center">
                            <input
                              type="checkbox"
                              checked={linha[dia] || false}
                              onChange={(e) => {
                                    if (e.target.checked && totalHorasCalculadas >= parseInt(projeto.quadroHorario.cargaHoraria, 10)) {
                                      toast.warning("A carga horária total não pode exceder a carga horária semanal informada.");
                                      return;
                                    }
                                    const novaModulacao = [...projeto.quadroHorario.modulacaoPrincipal];
                                    novaModulacao[index][dia] = e.target.checked;
                                    setProjeto(prev => ({
                                    ...prev,
                                    quadroHorario: { ...prev.quadroHorario, modulacaoPrincipal: novaModulacao }
                                    }));
                              }}
                              className="neu-input w-5 h-5"
                              disabled={isReadOnly}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Totalizador de Carga Horária */}
            <div className="neu-inset p-4 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-2">Resumo da Carga Horária</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Carga Horária Semanal Informada:</strong> {projeto.quadroHorario.cargaHoraria} horas</p>
                <p><strong>Carga Horária Total Marcada:</strong> {totalHorasCalculadas} horas</p>
                {parseInt(projeto.quadroHorario.cargaHoraria, 10) > totalHorasCalculadas && (
                  <p className="text-yellow-600 font-semibold">
                    <strong>Horas Faltantes:</strong> {parseInt(projeto.quadroHorario.cargaHoraria, 10) - totalHorasCalculadas} horas
                  </p>
                )}
                 {parseInt(projeto.quadroHorario.cargaHoraria, 10) < totalHorasCalculadas && (
                  <p className="text-red-600 font-semibold">
                    Atenção: A carga horária marcada excede a carga horária semanal informada.
                  </p>
                )}
              </div>
            </div>

          </div>
        )}

        {activeSection === 'plano' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">4. PLANO ANUAL DE ENSINO</h2>
            <p className="text-sm text-gray-600 mb-6">Em seu Plano devem ser descritos mais de uma habilidade e mais de um objeto de conhecimento: conteúdo.</p>

            {/* Primeiro Semestre */}
            <div className="neu-inset p-4 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">1º SEMESTRE</h3>
                <button
                  onClick={() => addPlanoItem('primeiroSemestre')}
                  className="neu-button px-3 py-2 rounded-lg text-gray-700 hover:text-gray-900 flex items-center space-x-2"
                  disabled={isReadOnly}
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </div>

              <div className="space-y-4">
                {projeto.planoAnual.primeiroSemestre.map((item, index) => (
                  <div key={index} className="neu-inset p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-800">Item {index + 1}</h4>
                      {projeto.planoAnual.primeiroSemestre.length > 1 && (
                        <button
                          onClick={() => removePlanoItem('primeiroSemestre', index)}
                          className="neu-button p-2 rounded-lg text-red-600 hover:text-red-800"
                          disabled={isReadOnly}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Habilidade</label>
                        <textarea
                          value={item.habilidade}
                          onChange={(e) => {
                                const items = [...projeto.planoAnual.primeiroSemestre];
                                items[index].habilidade = e.target.value;
                                setProjeto(prev => ({
                                ...prev,
                                planoAnual: { ...prev.planoAnual, primeiroSemestre: items }
                                }));
                          }}
                          className="neu-input w-full px-3 py-2 text-gray-700 h-20 resize-none"
                          placeholder="Ex: (GO-EF07AR02) Pesquisar e analisar diferentes estilos visuais..."
                          readOnly={isReadOnly}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Objeto de Conhecimento: Conteúdo</label>
                        <input
                          type="text"
                          value={item.objetoConhecimento}
                          onChange={(e) => {
                                const items = [...projeto.planoAnual.primeiroSemestre];
                                items[index].objetoConhecimento = e.target.value;
                                setProjeto(prev => ({
                                ...prev,
                                planoAnual: { ...prev.planoAnual, primeiroSemestre: items }
                                }));
                          }}
                          className="neu-input w-full px-3 py-2 text-gray-700"
                          placeholder="Ex: Contextos e Práticas: Estilos visuais"
                          readOnly={isReadOnly}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Desenvolvimento do Conteúdo</label>
                        <textarea
                          value={item.desenvolvimentoConteudo}
                          onChange={(e) => {
                                const items = [...projeto.planoAnual.primeiroSemestre];
                                items[index].desenvolvimentoConteudo = e.target.value;
                                setProjeto(prev => ({
                                ...prev,
                                planoAnual: { ...prev.planoAnual, primeiroSemestre: items }
                                }));
                          }}
                          className="neu-input w-full px-3 py-2 text-gray-700 h-20 resize-none"
                          placeholder="Ex: Pesquisar obras de Van Gogh, Botero e Tarsila..."
                          readOnly={isReadOnly}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Segundo Semestre */}
            <div className="neu-inset p-4 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">2º SEMESTRE</h3>
                <button
                  onClick={() => addPlanoItem('segundoSemestre')}
                  className="neu-button px-3 py-2 rounded-lg text-gray-700 hover:text-gray-900 flex items-center space-x-2"
                  disabled={isReadOnly}
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </div>

              <div className="space-y-4">
                {projeto.planoAnual.segundoSemestre.map((item, index) => (
                  <div key={index} className="neu-inset p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-800">Item {index + 1}</h4>
                      {projeto.planoAnual.segundoSemestre.length > 1 && (
                        <button
                          onClick={() => removePlanoItem('segundoSemestre', index)}
                          className="neu-button p-2 rounded-lg text-red-600 hover:text-red-900"
                          disabled={isReadOnly}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Habilidade</label>
                        <textarea
                          value={item.habilidade}
                          onChange={(e) => {
                                const items = [...projeto.planoAnual.segundoSemestre];
                                items[index].habilidade = e.target.value;
                                setProjeto(prev => ({
                                ...prev,
                                planoAnual: { ...prev.planoAnual, segundoSemestre: items }
                                }));
                          }}
                          className="neu-input w-full px-3 py-2 text-gray-700 h-20 resize-none"
                          placeholder="Ex: (GO-EF07AR02) Pesquisar e analisar diferentes estilos visuais..."
                          readOnly={isReadOnly}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Objeto de Conhecimento: Conteúdo</label>
                        <input
                          type="text"
                          value={item.objetoConhecimento}
                          onChange={(e) => {
                                const items = [...projeto.planoAnual.segundoSemestre];
                                items[index].objetoConhecimento = e.target.value;
                                setProjeto(prev => ({
                                ...prev,
                                planoAnual: { ...prev.planoAnual, segundoSemestre: items }
                                }));
                          }}
                          className="neu-input w-full px-3 py-2 text-gray-700"
                          placeholder="Ex: Contextos e Práticas: Estilos visuais"
                          readOnly={isReadOnly}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Desenvolvimento do Conteúdo</label>
                        <textarea
                          value={item.desenvolvimentoConteudo}
                          onChange={(e) => {
                                const items = [...projeto.planoAnual.segundoSemestre];
                                items[index].desenvolvimentoConteudo = e.target.value;
                                setProjeto(prev => ({
                                ...prev,
                                planoAnual: { ...prev.planoAnual, segundoSemestre: items }
                                }));
                          }}
                          className="neu-input w-full px-3 py-2 text-gray-700 h-20 resize-none"
                          placeholder="Ex: Pesquisar obras de Van Gogh, Botero e Tarsila..."
                          readOnly={isReadOnly}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'cronograma' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">5. CRONOGRAMA</h2>
            <p className="text-sm text-gray-600 mb-6">Acrescentar outras ações específicas do projeto em sua UE.</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-green-100">
                    <th className="px-4 py-3 text-left font-semibold text-gray-800 rounded-tl-lg">AÇÕES DO PROJETO</th>
                    <th className="px-2 py-3 text-center font-semibold text-gray-800">Jan</th>
                    <th className="px-2 py-3 text-center font-semibold text-gray-800">Fev</th>
                    <th className="px-2 py-3 text-center font-semibold text-gray-800">Mar</th>
                    <th className="px-2 py-3 text-center font-semibold text-gray-800">Abr</th>
                    <th className="px-2 py-3 text-center font-semibold text-gray-800">Mai</th>
                    <th className="px-2 py-3 text-center font-semibold text-gray-800">Jun</th>
                    <th className="px-2 py-3 text-center font-semibold text-gray-800">Ago</th>
                    <th className="px-2 py-3 text-center font-semibold text-gray-800">Set</th>
                    <th className="px-2 py-3 text-center font-semibold text-gray-800">Out</th>
                    <th className="px-2 py-3 text-center font-semibold text-gray-800">Nov</th>
                    <th className="px-2 py-3 text-center font-semibold text-gray-800 rounded-tr-lg">Dez</th>
                  </tr>
                </thead>
                <tbody>
                  {projeto.cronograma.acoes.map((acao, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-3 font-medium text-gray-800">{acao.acao}</td>
                      {['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'].map((mes) => (
                        <td key={mes} className="px-2 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={acao[mes]}
                            onChange={(e) => {
                                    const acoes = [...projeto.cronograma.acoes];
                                    acoes[index][mes] = e.target.checked;
                                    setProjeto(prev => ({
                                    ...prev,
                                    cronograma: { ...prev.cronograma, acoes }
                                    }));
                            }}
                            className="w-4 h-4"
                            disabled={isReadOnly}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'final' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Finalização do Projeto</h2>
            
            <div className="neu-inset p-4 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-4">Resumo do Projeto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Professor:</span>
                  <p className="text-gray-600">{projeto.identificacao.professor.nome || 'Não informado'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Unidade Educacional:</span>
                  <p className="text-gray-600">{projeto.identificacao.unidadeEducacional || 'Não informado'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">CRE:</span>
                  <p className="text-gray-600">{projeto.identificacao.cre || 'Não informado'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Município:</span>
                  <p className="text-gray-600">{projeto.identificacao.municipio || 'Não informado'}</p>
                </div>
              </div>
            </div>

            {/* Display rejection reason for Admin/Gestor/Articulador if project was rejected */}
            {currentRejectionReason && (user?.app_role === 'admin' || user?.app_role === 'gestor' || user?.app_role === 'articulador') && (
              <div className="neu-inset p-4 bg-red-50 border-l-4 border-red-400 rounded-xl mt-4">
                <h4 className="font-semibold text-red-800 mb-2">Justificativa de Rejeição Anterior:</h4>
                <p className="text-sm text-red-700">{currentRejectionReason}</p>
              </div>
            )}

            {/* Professor actions: Save as Draft / Submit */}
            {user?.app_role === 'professor' && (projeto.status === 'rascunho' || projeto.status === 'rejeitado' || !projeto.id) && (
                <div className="text-center space-y-4">
                    <p className="text-gray-600">Revise todas as informações antes de enviar o projeto.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => handleProfessorAction('rascunho')}
                            disabled={saving}
                            className="neu-button px-6 py-3 rounded-xl text-gray-700 hover:text-gray-900 disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            <Save className="w-5 h-5" />
                            <span>{saving ? 'Salvando...' : 'Salvar como Rascunho'}</span>
                        </button>
                        <button
                            onClick={() => handleProfessorAction('enviado')}
                            disabled={saving}
                            className="neu-button-primary px-6 py-3 rounded-xl disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            <Send className="w-5 h-5" />
                            <span>{saving ? 'Enviando...' : 'Enviar Projeto'}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Admin/Gestor/Articulador actions: Approve / Reject */}
            {canApproveReject && (
                <div className="text-center space-y-4">
                    <p className="text-gray-600">Ações de aprovação/rejeição para o projeto.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleApproveProject}
                            disabled={saving}
                            className="neu-button px-6 py-3 rounded-xl text-green-700 hover:text-green-900 disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            <Check className="w-5 h-5" />
                            <span>{saving ? 'Aprovando...' : 'Aprovar Projeto'}</span>
                        </button>
                        <button
                            onClick={() => setShowRejectionReasonInput(true)}
                            disabled={saving}
                            className="neu-button px-6 py-3 rounded-xl text-red-700 hover:text-red-900 disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            <X className="w-5 h-5" />
                            <span>Rejeitar Projeto</span>
                        </button>
                    </div>

                    {showRejectionReasonInput && (
                        <div className="neu-inset p-4 rounded-xl mt-4">
                            <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-2">
                                Justificativa para Rejeição:
                            </label>
                            <textarea
                                id="rejection-reason"
                                value={currentRejectionReason}
                                onChange={(e) => setCurrentRejectionReason(e.target.value)}
                                className="neu-input w-full px-4 py-3 text-gray-700 h-32 resize-none"
                                placeholder="Descreva o motivo da rejeição do projeto..."
                            />
                            <div className="mt-4 flex justify-end space-x-2">
                                <button
                                    onClick={() => { setShowRejectionReasonInput(false); setCurrentRejectionReason(projeto.justificativaRejeicao || ''); }}
                                    className="neu-button px-4 py-2 rounded-lg text-gray-700 hover:text-gray-900"
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleRejectProject}
                                    className="neu-button px-4 py-2 rounded-lg text-red-700 hover:text-red-900 disabled:opacity-50"
                                    disabled={saving}
                                >
                                    Confirmar Rejeição
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Display current status for professor if not editable */}
            {user?.app_role === 'professor' && projeto.id && (projeto.status === 'enviado' || projeto.status === 'aprovado') && (
                <div className="neu-inset p-4 rounded-xl text-center">
                    <p className="text-lg font-semibold text-gray-700">
                        Status atual do projeto: <span className={`font-bold ${projeto.status === 'enviado' ? 'text-blue-600' : 'text-green-600'}`}>
                            {projeto.status === 'enviado' ? 'Enviado' : 'Aprovado'}
                        </span>
                    </p>
                    {projeto.status === 'aprovado' && projeto.numeroProcessoSEI && (
                        <p className="text-md text-gray-700 mt-2">
                            <strong>Processo SEI:</strong> {projeto.numeroProcessoSEI}
                        </p>
                    )}
                    <p className="text-sm text-gray-600 mt-2">Você não pode editar o projeto enquanto ele estiver neste status.</p>
                </div>
            )}
             {/* Display current status for Admin/Gestor/Articulador if project is already approved/rejected */}
             {(user?.app_role === 'admin' || user?.app_role === 'gestor' || user?.app_role === 'articulador') && 
              (projeto.status === 'aprovado' || projeto.status === 'rejeitado' || projeto.status === 'rascunho') && (
                <div className="neu-inset p-4 rounded-xl text-center">
                    <p className="text-lg font-semibold text-gray-700">
                        Status atual do projeto: <span className={`font-bold ${
                            projeto.status === 'aprovado' ? 'text-green-600' : 
                            projeto.status === 'rejeitado' ? 'text-red-600' :
                            'text-gray-600'
                        }`}>
                            {projeto.status === 'aprovado' ? 'Aprovado' : 
                             projeto.status === 'rejeitado' ? 'Rejeitado' :
                             'Rascunho'}
                        </span>
                    </p>
                    
                    {user?.app_role === 'admin' && projeto.status === 'aprovado' ? (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Processo SEI:</label>
                            <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  value={currentSeiNumber}
                  onChange={(e) => setCurrentSeiNumber(e.target.value)}
                  className="neu-input w-full max-w-xs px-4 py-3 text-gray-700 text-center"
                  placeholder="Insira o número SEI"
                  maxLength={17}
                />
                                <button
                                    onClick={handleSeiNumberUpdate}
                                    disabled={saving}
                                    className="neu-button p-3 rounded-lg text-gray-700 hover:text-gray-900 disabled:opacity-50"
                                    title="Salvar Número SEI"
                                >
                                    <Save className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        projeto.status === 'aprovado' && projeto.numeroProcessoSEI && (
                            <p className="text-md text-gray-700 mt-2">
                                <strong>Processo SEI:</strong> {projeto.numeroProcessoSEI}
                            </p>
                        )
                    )}

                    {projeto.status === 'rascunho' && <p className="text-sm text-gray-600 mt-2">Aguardando o professor enviar para aprovação.</p>}
                </div>
            )}
          </div>
        )}
      </div>

      <div className="neu-card p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={handlePreviousSection}
          disabled={!previousSection}
          className="neu-button px-5 py-3 rounded-xl w-full sm:w-auto disabled:opacity-40"
        >
          {previousSection ? `← Voltar para ${previousSection.name}` : 'Início'}
        </button>
        <p className="text-sm text-gray-600 text-center flex-1">
          {nextSection ? `Próxima etapa: ${nextSection.name}` : 'Você chegou à etapa Finalização.'}
        </p>
        <button
          onClick={handleNextSection}
          disabled={!nextSection}
          className="neu-button-primary px-5 py-3 rounded-xl w-full sm:w-auto disabled:opacity-40"
        >
          {nextSection ? `Avançar para ${nextSection.name} →` : 'Etapa final'}
        </button>
      </div>
    </div>
  );
}
