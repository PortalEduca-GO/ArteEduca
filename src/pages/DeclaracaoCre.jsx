import React, { useState, useEffect, useCallback } from 'react';
import { DeclaracaoCre } from '@/api/entities';
import { ProjetoArteEduca } from '@/api/entities';
import { User } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Save, ShieldCheck, Edit, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';

const DeclaracaoCrePage = () => {
    const [declaracao, setDeclaracao] = useState(null);
    const [projeto, setProjeto] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const initialContent = useCallback((projeto) => {
        const areaArtisticaMap = {
            artesVisuais: 'Artes Visuais',
            bandasEFanfarras: 'Música',
            cantoCoral: 'Música',
            danca: 'Dança',
            praticaDeConjunto: 'Música',
            teatro: 'Teatro',
            violao: 'Música'
        };
        
        const projectTypeDetails = {
            artesVisuais: { name: 'Artes Visuais' },
            bandasEFanfarras: { name: 'Bandas e Fanfarras' },
            cantoCoral: { name: 'Canto Coral' },
            danca: { name: 'Dança' },
            praticaDeConjunto: { name: 'Prática de Conjunto' },
            teatro: { name: 'Teatro' },
            violao: { name: 'Violão' }
        };

        const areaArtistica = areaArtisticaMap[projeto?.tipoProjeto] || '______';
        const modalidade = projectTypeDetails[projeto?.tipoProjeto]?.name || '______';
        const unidadeEducacional = projeto?.identificacao?.unidadeEducacional || '______';
        const professor = projeto?.identificacao?.professor?.nome || '______';
        const cre = projeto?.identificacao?.cre || '______';
        const municipio = projeto?.identificacao?.municipio || '______';
        const hoje = new Date();
        const dia = hoje.getDate();
        const mes = hoje.toLocaleString('pt-BR', { month: 'long' });
        const ano = hoje.getFullYear();

    return `Declaro para os devidos fins que o Projeto Arte Educa na Área Artística ${areaArtistica} com a(s)
Modalidade(s) ${modalidade}
a ser desenvolvido na Unidade Educacional ${unidadeEducacional}
pelo(s) Professor(s) ${professor}
Foi analisado e aprovado pela CRE de ${cre}.

Desta forma o referido projeto está habilitado a ser executado no decorrer do corrente ano.

Por ser verdade, firmo o presente para que surta seus efeitos legais.

${municipio}, ${dia} de ${mes} de ${ano}.


_________________________________________
Articulador(a) do Desporto Educacional, Arte e Educação

_________________________________________
Assessor(a) Pedagógico(a)

_________________________________________
Coordenador(a) Regional de Educação
`;
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const projetoId = urlParams.get('projetoId');
                
                if (!projetoId) {
                    throw new Error("ID do projeto não fornecido.");
                }

                const [userData, currentProjeto] = await Promise.all([
                    User.me(),
                    ProjetoArteEduca.get(projetoId)
                ]);
                setUser(userData);

                if (!currentProjeto) {
                    throw new Error("Projeto não encontrado.");
                }
                setProjeto(currentProjeto);

                const declaracoes = await DeclaracaoCre.list();
                let currentDeclaracao = declaracoes.find(d => d.projetoId === projetoId);

                if (!currentDeclaracao) {
                    const newDeclaracaoData = {
                        projetoId: projetoId,
                        conteudo: initialContent(currentProjeto),
                        validado: false,
                    };
                    currentDeclaracao = await DeclaracaoCre.create(newDeclaracaoData);
                }
                setDeclaracao(currentDeclaracao);

            } catch (err) {
                console.error("Erro ao carregar dados:", err.message);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [initialContent]);

    const handleSave = async () => {
        if (!declaracao) return;
        setSaving(true);
        try {
            await DeclaracaoCre.update(declaracao.id, { conteudo: declaracao.conteudo });
            alert("Declaração salva com sucesso!");
            setIsEditing(false);
        } catch (err) {
            console.error("Erro ao salvar:", err);
            alert("Falha ao salvar a declaração.");
        } finally {
            setSaving(false);
        }
    };
    
    const handleValidate = async () => {
        if (!declaracao || declaracao.validado) return;
        if (!confirm("Tem certeza que deseja validar esta declaração? Esta ação não pode ser desfeita.")) return;
        setSaving(true);
        try {
            const updateData = {
                validado: true,
                dataValidacao: new Date().toISOString()
            };
            await DeclaracaoCre.update(declaracao.id, updateData);
            setDeclaracao(prev => ({ ...prev, ...updateData }));
            await ProjetoArteEduca.update(projeto.id, { status_cre: 'validado' });
            alert("Declaração validada com sucesso!");
        } catch (err) {
            console.error("Erro ao validar:", err);
            alert("Falha ao validar a declaração.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /> Carregando...</div>;
    }
    
    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="neu-card p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-800">Erro ao Carregar a Declaração</h2>
                    <p className="text-gray-600 mt-2">{error}</p>
                    <button onClick={() => navigate(createPageUrl('Dashboard'))} className="neu-button mt-6 mx-auto">Voltar ao Dashboard</button>
                </div>
            </div>
        );
    }
    
    const canEdit = (user?.app_role === 'articulador' || user?.app_role === 'admin') && !declaracao?.validado;
    const canValidate = user?.app_role === 'articulador' && !declaracao?.validado;
    const canView = ['admin', 'articulador', 'gestor', 'professor'].includes(user?.app_role);

    if (!canView) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="neu-card p-6 text-center">
                    <h2 className="text-lg font-semibold text-gray-800">Acesso Negado</h2>
                    <p className="text-gray-600 mt-2">Você não tem permissão para visualizar esta declaração.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
            <button onClick={() => navigate(createPageUrl('Dashboard'))} className="neu-button flex items-center space-x-2 px-4 py-2">
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar ao Dashboard</span>
            </button>

            <div className="neu-card p-6 sm:p-8">
                <div className="text-center mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">DECLARAÇÃO DA COORDENAÇÃO REGIONAL DE EDUCAÇÃO – CRE</h1>
                    <p className="text-sm text-gray-500 mt-1">ANEXO IV - Portaria n.º 2037/2022</p>
                    {projeto && <p className="text-gray-600 mt-2">{projeto.identificacao?.unidadeEducacional}</p>}
                </div>

                {isEditing ? (
                    <textarea
                        className="neu-input w-full h-96 p-4 text-gray-700 leading-relaxed"
                        value={declaracao?.conteudo || ''}
                        onChange={(e) => setDeclaracao({ ...declaracao, conteudo: e.target.value })}
                        disabled={saving}
                    />
                ) : (
                    <div className="prose max-w-none p-4 neu-inset rounded-lg whitespace-pre-wrap">
                        {declaracao?.conteudo}
                    </div>
                )}
                
                {declaracao?.validado && (
                    <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-center space-x-2">
                        <ShieldCheck className="w-6 h-6"/>
                        <span className="font-semibold">Validado em {new Date(declaracao.dataValidacao).toLocaleDateString()}</span>
                    </div>
                )}

                <div className="mt-8 flex flex-wrap gap-4 justify-end">
                    {canEdit && !isEditing && (
                        <button onClick={() => setIsEditing(true)} className="neu-button px-6 py-3 rounded-xl flex items-center justify-center space-x-2 text-gray-700 hover:text-gray-900">
                            <Edit className="w-5 h-5" />
                            <span>Editar</span>
                        </button>
                    )}
                    {canEdit && isEditing && (
                         <button onClick={handleSave} disabled={saving} className="neu-button-primary px-6 py-3 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50">
                            <Save className="w-5 h-5" />
                            <span>{saving ? 'Salvando...' : 'Salvar'}</span>
                        </button>
                    )}
                     {canValidate && (
                        <button onClick={handleValidate} disabled={saving || declaracao?.validado} className="neu-button-primary px-6 py-3 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50">
                            <ShieldCheck className="w-5 h-5" />
                            <span>{saving ? 'Validando...' : 'Validar Declaração'}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeclaracaoCrePage;