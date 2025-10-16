// import { base44 } from './base44Client';

// MODO DESENVOLVIMENTO: Usando banco de dados local
import {
  LocalForm,
  LocalSubmission,
  LocalUser,
  LocalProjetoArteEduca,
  LocalTermoDeCompromisso,
  LocalEscola,
  LocalDeclaracaoCre,
  seedDatabase
} from './localDb';

// Inicializar dados de exemplo na primeira execução
seedDatabase();

// Exportar entidades locais
export const Form = LocalForm;
export const Submission = LocalSubmission;
export const ProjetoArteEduca = LocalProjetoArteEduca;
export const TermoDeCompromisso = LocalTermoDeCompromisso;
export const Escola = LocalEscola;
export const DeclaracaoCre = LocalDeclaracaoCre;
export const User = LocalUser;

// Para voltar ao Base44, descomente as linhas abaixo e comente as linhas acima:
/*
export const Form = base44.entities.Form;
export const Submission = base44.entities.Submission;
export const ProjetoArteEduca = base44.entities.ProjetoArteEduca;
export const TermoDeCompromisso = base44.entities.TermoDeCompromisso;
export const Escola = base44.entities.Escola;
export const DeclaracaoCre = base44.entities.DeclaracaoCre;
export const User = base44.auth;
*/