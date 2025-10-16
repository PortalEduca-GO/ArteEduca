
import React, { useState, useEffect, useCallback } from 'react';
import { TermoDeCompromisso } from '@/api/entities';
import { ProjetoArteEduca } from '@/api/entities';
import { User } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Save, ShieldCheck, Edit, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';

const TermoCompromissoPage = () => {
    const [termo, setTermo] = useState(null);
    const [projeto, setProjeto] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const initialContent = useCallback((projetoRef, gestorNome, gestorCpf, gestorRg, inep, portaria, professores) => `
Eu, ${gestorNome || '___________________'}, portador do RG nº ${gestorRg || '___________________'}, CPF ${gestorCpf || '___________________'}, Gestor(a) da Unidade Educacional ${projetoRef?.identificacao?.unidadeEducacional || ''}, INEP ${inep || '___________________'}, regulamentado pela Portaria nº ${portaria || '___________________'}, declaro para os devidos fins que assumo total compromisso e responsabilidade em relação ao desenvolvimento do Projeto Arte Educa durante a vigência do mesmo nessa unidade educacional bem como, o cumprimento da carga horária do(s) professor(es) do projeto, a saber: ${professores || '___________________'}.

Declaro ainda:
- Garantir o cumprimento das Normas e Diretrizes do Projeto Arte Educa, conforme Portaria 2037/2022 – SEDUC;
- Responsabilizar-me pela execução e logística do atendimento aos estudantes;
- Acompanhar o desenvolvimento pedagógico e a frequência dos estudantes;
- Garantir que o professor faça o upload, no Drive da Gerência de Arte e Educação, dos documentos pedagógicos, a saber: Projeto Anual, Frequência Mensal, Planejamento Mensal e Relatório Mensal, devidamente assinados, seja por meio do site gov.br ou de próprio punho;
- Garantir condições e segurança para que os estudantes matriculados no projeto participem de eventos arte/educativos internos e externos à Unidade Educacional;
- Estar ciente de que o não cumprimento das responsabilidades supracitadas, podem ocasionar a penalidade de suspensão do projeto.
    `, []);

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
                    ProjetoArteEduca.get(projetoId) // Usar .get() para buscar um projeto específico
                ]);
                setUser(userData);

                if (!currentProjeto) {
                    throw new Error("Projeto não encontrado ou você não tem permissão para acessá-lo.");
                }
                setProjeto(currentProjeto);

                const termos = await TermoDeCompromisso.list();
                let currentTermo = termos.find(t => t.projetoId === projetoId);

                if (!currentTermo) {
                    // Buscar gestor da unidade educacional para criar termo inicial
                    const gestores = await User.list();
                    const gestorData = gestores.find(u =>
                        u.app_role === 'gestor' &&
                        u.inep === currentProjeto.identificacao?.inep
                    ) || {};
                    
                    const newTermoData = {
                        projetoId: projetoId,
                        unidadeEducacionalId: currentProjeto.identificacao?.inep,
                        gestorNome: gestorData.full_name || '',
                        gestorCpf: gestorData.cpf || '',
                        gestorRg: gestorData.rg || '',
                        portaria: '',
                        professores: currentProjeto.identificacao?.professor?.nome || '',
                        conteudo: initialContent(currentProjeto, gestorData.full_name, gestorData.cpf, gestorData.rg, currentProjeto.identificacao?.inep, '', currentProjeto.identificacao?.professor?.nome),
                        validado: false,
                    };
                    currentTermo = await TermoDeCompromisso.create(newTermoData);
                }
                setTermo(currentTermo);

            } catch (error) {
                console.error("Erro ao carregar dados:", error.message);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [initialContent]);

    const handleSave = async () => {
        if (!termo) return;
        setSaving(true);
        try {
            await TermoDeCompromisso.update(termo.id, { ...termo });
            alert("Termo de compromisso salvo com sucesso!");
            setIsEditing(false);
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Falha ao salvar o termo.");
        } finally {
            setSaving(false);
        }
    };
    
    const handleValidate = async () => {
        if (!termo || termo.validado) return;
        if (!confirm("Tem certeza que deseja aprovar este termo? Esta ação não pode ser desfeita.")) return;
        setSaving(true);
        try {
            const updateData = {
                ...termo,
                validado: true,
                dataValidacao: new Date().toISOString()
            };
            await TermoDeCompromisso.update(termo.id, updateData);
            setTermo(updateData);
            // Também atualiza o status do projeto
            await ProjetoArteEduca.update(projeto.id, { status_gestor: 'validado' });
            alert("Termo aprovado com sucesso!");
        } catch (error) {
            console.error("Erro ao validar:", error);
            alert("Falha ao aprovar o termo.");
        } finally {
            setSaving(false);
        }
    };


    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /> Carregando...</div>;
    }
    
    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                <div className="neu-card p-6">
                    <div className="text-center py-8">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-gray-800">Erro ao Carregar o Termo</h2>
                        <p className="text-gray-600 mt-2">{error}</p>
                        <button onClick={() => navigate(createPageUrl('Dashboard'))} className="neu-button flex items-center space-x-2 px-4 py-2 mt-6 mx-auto">
                            <ArrowLeft className="w-5 h-5" />
                            <span>Voltar ao Dashboard</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    const canEdit = (user?.app_role === 'gestor' || user?.app_role === 'admin') && !termo?.validado;
    const canValidate = user?.app_role === 'gestor' && !termo?.validado;
    const canView = user?.app_role === 'admin' || user?.app_role === 'articulador' || user?.app_role === 'gestor' || user?.app_role === 'professor';

    if (!canView) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                <div className="neu-card p-6">
                    <div className="text-center py-8">
                        <h2 className="text-lg font-semibold text-gray-800">Acesso Negado</h2>
                        <p className="text-gray-600 mt-2">Você não tem permissão para visualizar este termo de compromisso.</p>
                    </div>
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
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">TERMO DE COMPROMISSO E RESPONSABILIDADE DA UNIDADE ESCOLAR</h1>
                    {projeto && <p className="text-gray-600 mt-2">{projeto.identificacao?.unidadeEducacional}</p>}
                    
                    {/* Informações do Projeto */}
                    {projeto && (
                        <div className="mt-6 neu-inset p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Informações do Projeto</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-left">
                                <div>
                                    <strong>Projeto:</strong> {projeto.tipoProjeto}
                                </div>
                                <div>
                                    <strong>Professor:</strong> {projeto.identificacao?.professor?.nome}
                                </div>
                                <div>
                                    <strong>CRE:</strong> {projeto.identificacao?.cre}
                                </div>
                                <div>
                                    <strong>Município:</strong> {projeto.identificacao?.municipio}
                                </div>
                                <div>
                                    <strong>INEP:</strong> {projeto.identificacao?.inep}
                                </div>
                                <div>
                                    <strong>Status:</strong> {projeto.status || 'Pendente'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <textarea
                        className="neu-input w-full h-96 p-4 text-gray-700 leading-relaxed"
                        value={termo?.conteudo || ''}
                        onChange={(e) => setTermo({ ...termo, conteudo: e.target.value })}
                    />
                ) : (
                    <div className="prose max-w-none p-4 neu-inset rounded-lg whitespace-pre-wrap">
                        {termo?.conteudo}
                    </div>
                )}
                
                {termo?.validado && (
                    <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-center space-x-2">
                        <ShieldCheck className="w-6 h-6"/>
                        <span className="font-semibold">Aprovado em {new Date(termo.dataValidacao).toLocaleDateString()}</span>
                    </div>
                )}

                <div className="mt-8 flex flex-wrap gap-4 justify-end">
                    {canEdit && !isEditing && (
                        <button onClick={() => setIsEditing(true)} className="neu-button px-6 py-3 rounded-xl flex items-center justify-center space-x-2 text-gray-700 hover:text-gray-900">
                            <Edit className="w-5 h-5" />
                            <span>Editar Termo</span>
                        </button>
                    )}
                    {canEdit && isEditing && (
                         <button onClick={handleSave} disabled={saving} className="neu-button-primary px-6 py-3 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50">
                            <Save className="w-5 h-5" />
                            <span>{saving ? 'Salvando...' : 'Salvar Termo'}</span>
                        </button>
                    )}
                     {canValidate && (
                        <button onClick={handleValidate} disabled={saving || termo?.validado} className="neu-button-primary px-6 py-3 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50">
                            <ShieldCheck className="w-5 h-5" />
                            <span>{saving ? 'Aprovando...' : 'Aprovar Termo'}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TermoCompromissoPage;
