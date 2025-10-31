import jsPDF from "jspdf";
import "jspdf-autotable";

const SECTION_MARGIN = 10;
const PAGE_MARGIN = 15;
const PRIMARY_COLOR = [73, 163, 242];
const LIGHT_ROW_COLOR = [233, 244, 254];

const monthOrder = [
  { key: "janeiro", label: "Jan" },
  { key: "fevereiro", label: "Fev" },
  { key: "marco", label: "Mar" },
  { key: "abril", label: "Abr" },
  { key: "maio", label: "Mai" },
  { key: "junho", label: "Jun" },
  { key: "agosto", label: "Ago" },
  { key: "setembro", label: "Set" },
  { key: "outubro", label: "Out" },
  { key: "novembro", label: "Nov" },
  { key: "dezembro", label: "Dez" }
];

const dayOrder = [
  { key: "segunda", label: "Seg" },
  { key: "terca", label: "Ter" },
  { key: "quarta", label: "Qua" },
  { key: "quinta", label: "Qui" },
  { key: "sexta", label: "Sex" },
  { key: "sabado", label: "Sáb" }
];

const STATUS_LABELS = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  validado: "Validado",
  pendente: "Pendente"
};

const safeText = (value) => {
  if (value === null || value === undefined) return "Não informado";
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "Não informado";
  }
  const text = String(value).trim();
  return text.length ? text : "Não informado";
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
};

const slugify = (value) => {
  return (value || "projeto")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60) || "projeto";
};

async function loadImageAsPngDataUrl(path) {
  if (!path) return null;

  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Falha ao carregar logo (${response.status})`);
    }

    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const objectUrl = window.URL.createObjectURL(blob);
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/png");
          resolve({ dataUrl, width: img.width, height: img.height });
        } catch (err) {
          reject(err);
        } finally {
          window.URL.revokeObjectURL(objectUrl);
        }
      };
      img.onerror = (err) => {
        window.URL.revokeObjectURL(objectUrl);
        reject(err);
      };
      img.src = objectUrl;
    });
  } catch (error) {
    console.warn("Não foi possível carregar o logo para o PDF:", error.message);
    return null;
  }
}

function ensureSpace(doc, currentY, neededSpace = 20) {
  let safeY = Number(currentY);
  if (!Number.isFinite(safeY)) {
    safeY = PAGE_MARGIN;
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  if (safeY + neededSpace >= pageHeight - PAGE_MARGIN) {
    doc.addPage();
    return PAGE_MARGIN;
  }
  return safeY;
}

function addSectionTitle(doc, title, currentY) {
  currentY = ensureSpace(doc, currentY, 12);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  const normalizedTitle = title === undefined || title === null ? "" : String(title);
  if (normalizedTitle.length) {
    doc.text(normalizedTitle, PAGE_MARGIN, currentY);
  }
  doc.setFont("helvetica", "normal");
  return currentY + 6;
}

function addKeyValueTable(doc, currentY, rows) {
  if (!rows.length) return currentY;

  const startY = ensureSpace(doc, currentY, 10);
  doc.autoTable({
    startY,
    head: [["Campo", "Detalhes"]],
    body: rows,
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      overflow: "linebreak"
    },
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: 255,
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: LIGHT_ROW_COLOR
    },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN }
  });

  const finalY = doc.lastAutoTable?.finalY
    || doc.previousAutoTable?.finalY
    || startY;
  return (Number.isFinite(finalY) ? finalY : startY) + SECTION_MARGIN;
}

function addSimpleTable(doc, currentY, head, body) {
  if (!body.length) return currentY;

  const startY = ensureSpace(doc, currentY, 10);
  doc.autoTable({
    startY,
    head: [head],
    body,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: { top: 2.5, right: 3.5, bottom: 2.5, left: 3.5 },
      overflow: "linebreak"
    },
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: 255,
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: LIGHT_ROW_COLOR
    },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN }
  });

  const finalY = doc.lastAutoTable?.finalY
    || doc.previousAutoTable?.finalY
    || startY;
  return (Number.isFinite(finalY) ? finalY : startY) + SECTION_MARGIN;
}

function addLongTextSection(doc, title, text, currentY) {
  if (!text) return currentY;

  currentY = addSectionTitle(doc, title, currentY);
  const paragraphs = String(text).split(/\r?\n/);
  const maxWidth = doc.internal.pageSize.getWidth() - PAGE_MARGIN * 2;

  paragraphs.forEach((paragraph) => {
    const content = paragraph.trim().length ? paragraph : " ";
    const wrappedLines = doc.splitTextToSize(content, maxWidth);
    wrappedLines.forEach((line) => {
      currentY = ensureSpace(doc, currentY, 10);
      const normalizedLine = line === undefined || line === null ? "" : String(line);
      if (normalizedLine.length) {
        doc.text(normalizedLine, PAGE_MARGIN, currentY);
      }
      currentY += 5;
    });
    currentY += 2;
  });

  return currentY + SECTION_MARGIN;
}

function buildIdentificacaoRows(projeto) {
  const identificacao = projeto?.identificacao || {};
  const professor = identificacao.professor || {};
  const turnos = Array.isArray(projeto?.quadroHorario?.turno) ? projeto.quadroHorario.turno : [];

  return [
    ["Tipo de Projeto", getProjectTypeLabel(projeto?.tipoProjeto)],
    ["CRE", safeText(identificacao.cre)],
    ["Município", safeText(identificacao.municipio)],
    ["Unidade Educacional", safeText(identificacao.unidadeEducacional)],
    ["INEP", safeText(identificacao.inep)],
    ["Tipo de Matriz", safeText(identificacao.tipoMatriz)],
    ["Quantidade de Estudantes", safeText(identificacao.quantidadeEstudantes)],
    ["Turnos", safeText(turnos)],
    ["Etapas de Ensino", safeText(identificacao.etapasEnsino)],
    ["Professor Responsável", safeText(professor.nome)],
    ["CPF", safeText(professor.cpf)],
    ["RG", safeText(professor.rg)],
    ["Data de Nascimento", safeText(professor.dataNascimento)],
    ["Telefone", safeText(professor.telefone)],
    ["E-mail", safeText(professor.email)]
  ];
}

function getProjectTypeLabel(tipoProjeto) {
  const map = {
    artesVisuais: "Artes Visuais",
    bandasEFanfarras: "Bandas e Fanfarras",
    cantoCoral: "Canto Coral",
    danca: "Dança",
    praticaDeConjunto: "Prática de Conjunto",
    teatro: "Teatro",
    violao: "Violão"
  };
  return map[tipoProjeto] || safeText(tipoProjeto);
}

function buildProjetoPedagogicoRows(projeto) {
  const dados = projeto?.projeto || {};
  return [
    ["Introdução", safeText(dados.introducao)],
    ["Justificativa", safeText(dados.justificativa)],
    ["Objetivo Geral", safeText(dados.objetivoGeral)],
    ["Objetivos Específicos", safeText(dados.objetivosEspecificos)],
    ["Metodologia", safeText(dados.metodologia)],
    ["Avaliação", safeText(dados.avaliacao)],
    ["Referências", safeText(dados.referencias)]
  ];
}

function buildRecursosMateriaisRows(projeto) {
  const recursos = projeto?.identificacao?.recursosMateriais || [];
  return recursos
    .filter((item) => item && (item.material || item.quantidade))
    .map((item, index) => [String(index + 1), safeText(item.material), safeText(item.quantidade)]);
}

function buildQuadroHorarioRows(projeto) {
  const modulacao = projeto?.quadroHorario?.modulacaoPrincipal || [];
  return modulacao
    .filter((linha) => linha && (linha.horario || dayOrder.some((dia) => linha[dia.key])))
    .map((linha) => [
      safeText(linha.horario),
      ...dayOrder.map((dia) => (linha[dia.key] ? "X" : ""))
    ]);
}

function buildPlanoRows(lista) {
  return (lista || [])
    .filter((item) => item && (item.habilidade || item.objetoConhecimento || item.desenvolvimentoConteudo))
    .map((item, index) => [
      String(index + 1),
      safeText(item.habilidade),
      safeText(item.objetoConhecimento),
      safeText(item.desenvolvimentoConteudo)
    ]);
}

function buildCronogramaRows(acoes = []) {
  return acoes
    .filter((acao) => acao && (acao.acao || monthOrder.some((mes) => acao[mes.key])))
    .map((acao) => [
      safeText(acao.acao),
      ...monthOrder.map((mes) => (acao[mes.key] ? "X" : ""))
    ]);
}

function buildStatusRows(projeto, termo, declaracao) {
  const rows = [
    ["Status Geral", STATUS_LABELS[projeto?.status] || safeText(projeto?.status)],
    ["Status Gestor", STATUS_LABELS[projeto?.status_gestor] || safeText(projeto?.status_gestor)],
    ["Status CRE", STATUS_LABELS[projeto?.status_cre] || safeText(projeto?.status_cre)],
    ["Status Admin", projeto?.status === "aprovado" ? "Projeto aprovado" : "Pendente"],
    ["Data de Envio", formatDate(projeto?.dataSubmissao) || "-"],
    ["Data de Atualização", formatDate(projeto?.updated_date) || "-"],
  ];

  rows.push([
    "Termo de Compromisso",
    termo?.validado
      ? `Validado em ${formatDate(termo.dataValidacao)}`
      : "Não validado"
  ]);

  rows.push([
    "Declaração CRE",
    declaracao?.validado
      ? `Validado em ${formatDate(declaracao.dataValidacao)}`
      : "Não validado"
  ]);

  if (projeto?.numeroProcessoSEI && projeto.status === "aprovado") {
    rows.push(["Processo SEI", safeText(projeto.numeroProcessoSEI)]);
  }

  return rows;
}

export async function generateProjectPdf({
  projeto,
  termo,
  declaracao,
  logoUrl = "/reduziada_colorida.png"
}) {
  if (!projeto) {
    throw new Error("Dados do projeto não fornecidos para geração do PDF.");
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let currentY = PAGE_MARGIN;

  const logoAsset = await loadImageAsPngDataUrl(logoUrl) || await loadImageAsPngDataUrl("/logo-estado.webp") || null;

  let headerTextX = PAGE_MARGIN;
  if (logoAsset) {
    const aspectRatio = logoAsset.width && logoAsset.height ? logoAsset.width / logoAsset.height : 1.3;
    const imgHeight = 12;
    const imgWidth = imgHeight * aspectRatio;
    doc.addImage(logoAsset.dataUrl, "PNG", PAGE_MARGIN, currentY, imgWidth, imgHeight, undefined, "FAST");
    headerTextX = PAGE_MARGIN + imgWidth + 10;
  } else {
    currentY += 2;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Secretaria de Estado da Educação de Goiás", headerTextX, currentY + 6);
  doc.setFontSize(12);
  doc.text("Centro de Estudo e Pesquisa - Projeto Arte Educa", headerTextX, currentY + 13);

  currentY += 24;
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.4);
  doc.line(PAGE_MARGIN, currentY - 8, doc.internal.pageSize.getWidth() - PAGE_MARGIN, currentY - 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const projectTitle = `Projeto Arte Educa - ${getProjectTypeLabel(projeto.tipoProjeto)}`;
  doc.text(projectTitle, PAGE_MARGIN, currentY);
  currentY += SECTION_MARGIN;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const unidade = safeText(projeto?.identificacao?.unidadeEducacional);
  doc.text(`Unidade Educacional: ${unidade}`, PAGE_MARGIN, currentY);
  currentY += SECTION_MARGIN;

  currentY = addSectionTitle(doc, "Identificação", currentY);
  currentY = addKeyValueTable(doc, currentY, buildIdentificacaoRows(projeto));

  currentY = addSectionTitle(doc, "Projeto Pedagógico", currentY);
  currentY = addKeyValueTable(doc, currentY, buildProjetoPedagogicoRows(projeto));

  const recursosMateriais = buildRecursosMateriaisRows(projeto);
  if (recursosMateriais.length) {
    currentY = addSectionTitle(doc, "Recursos Materiais", currentY);
    currentY = addSimpleTable(doc, currentY, ["#", "Material", "Quantidade"], recursosMateriais);
  }

  const professor = projeto?.identificacao?.professor || {};
  const contatoParts = [professor.telefone, professor.email]
    .map((item) => (item ? item.toString().trim() : ""))
    .filter((item) => item.length > 0);
  const recursosHumanosRows = [
    ["Professor Responsável", safeText(professor.nome)],
    ["Contato", contatoParts.length ? contatoParts.join(" | ") : "Não informado"]
  ];
  currentY = addSectionTitle(doc, "Recursos Humanos", currentY);
  currentY = addKeyValueTable(doc, currentY, recursosHumanosRows);

  const quadroHorarioRows = buildQuadroHorarioRows(projeto);
  if (quadroHorarioRows.length) {
    currentY = addSectionTitle(doc, "Quadro de Horário", currentY);
    const head = ["Horário", ...dayOrder.map((dia) => dia.label)];
    currentY = addSimpleTable(doc, currentY, head, quadroHorarioRows);
  }

  const planoPrimeiro = buildPlanoRows(projeto?.planoAnual?.primeiroSemestre);
  if (planoPrimeiro.length) {
    currentY = addSectionTitle(doc, "Plano Anual - 1º Semestre", currentY);
    currentY = addSimpleTable(doc, currentY, ["#", "Habilidade", "Objeto de Conhecimento", "Desenvolvimento do Conteúdo"], planoPrimeiro);
  }

  const planoSegundo = buildPlanoRows(projeto?.planoAnual?.segundoSemestre);
  if (planoSegundo.length) {
    currentY = addSectionTitle(doc, "Plano Anual - 2º Semestre", currentY);
    currentY = addSimpleTable(doc, currentY, ["#", "Habilidade", "Objeto de Conhecimento", "Desenvolvimento do Conteúdo"], planoSegundo);
  }

  const cronogramaRows = buildCronogramaRows(projeto?.cronograma?.acoes);
  if (cronogramaRows.length) {
    currentY = addSectionTitle(doc, "Cronograma de Execução", currentY);
    const head = ["Ação", ...monthOrder.map((mes) => mes.label)];
    currentY = addSimpleTable(doc, currentY, head, cronogramaRows);
  }

  currentY = addSectionTitle(doc, "Status e Validações", currentY);
  currentY = addKeyValueTable(doc, currentY, buildStatusRows(projeto, termo, declaracao));

  if (termo?.validado && termo?.conteudo) {
    doc.addPage();
    currentY = PAGE_MARGIN;
    currentY = addLongTextSection(doc, "Termo de Compromisso (Conteúdo Validado)", termo.conteudo);
  }

  if (declaracao?.validado && declaracao?.conteudo) {
    doc.addPage();
    currentY = PAGE_MARGIN;
    currentY = addLongTextSection(doc, "Declaração da CRE (Conteúdo Validado)", declaracao.conteudo);
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  currentY = ensureSpace(doc, currentY, 20);
  doc.text(
    "Este documento foi gerado automaticamente pelo sistema Arte Educa.",
    PAGE_MARGIN,
    currentY
  );

  const fileName = `projeto-arte-educa-${slugify(projeto?.identificacao?.unidadeEducacional || projeto?.id)}.pdf`;
  doc.save(fileName);
}
