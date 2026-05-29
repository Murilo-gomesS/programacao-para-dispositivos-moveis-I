import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function inferDevHost(): string | null {
  const anyConstants = Constants as any;
  const hostUri: string | undefined =
    Constants.expoConfig?.hostUri ||
    anyConstants?.manifest2?.extra?.expoClient?.hostUri ||
    anyConstants?.manifest?.hostUri;

  if (!hostUri) {
    return null;
  }

  return hostUri.split(':')[0] || null;
}

function getDefaultApiBaseUrl(): string {
  const inferredHost = inferDevHost();
  if (inferredHost) {
    return `http://${inferredHost}:3333/api`;
  }

  const localhost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${localhost}:3333/api`;
}

const api = axios.create({
  baseURL: (() => {
    const configured = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
    if (typeof configured === 'string' && configured.trim()) {
      return configured.trim();
    }

    return getDefaultApiBaseUrl();
  })(),
  timeout: 10000,
});

export type LoginResponse = {
  usuario: {
    nome: string;
    perfil: string;
    alunoId?: number;
    professorId?: number;
    matricula?: string;
  };
  token: string;
};

export type LoginPayload = {
  email: string;
  senha: string;
};

export type CursoListItem = {
  id: number;
  nome: string;
};

export type AlunoPayload = {
  nome: string;
  matricula: string;
  curso: string;
  semestre: number;
  email: string;
  telefone?: string;
  cep?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  disciplinaIds?: number[];
};

export async function login(payload: LoginPayload) {
  const response = await api.post<LoginResponse>('/login', payload);
  return response.data;
}

export async function createAluno(payload: AlunoPayload) {
  const response = await api.post('/alunos', payload);
  return response.data;
}

export async function deleteAlunoAdmin(id: number) {
  const response = await api.delete(`/alunos/${id}`);
  return response.data;
}

export type ProfessorPayload = {
  nome: string;
  titulacao: string;
  area: string;
  tempo_docencia: number;
  email: string;
};

export async function createProfessor(payload: ProfessorPayload) {
  const response = await api.post('/professores', payload);
  return response.data;
}

export async function deleteProfessorAdmin(id: number) {
  const response = await api.delete(`/professores/${id}`);
  return response.data;
}

export async function updateProfessorAdmin(id: number, payload: Partial<ProfessorPayload>) {
  const response = await api.put(`/professores/${id}`, payload);
  return response.data;
}

export type DisciplinaPayload = {
  nome: string;
  carga_horaria: number;
  professor_id: number;
  curso: string;
  semestre: number;
};

export type CursoPayload = {
  nome: string;
};

export type ProfessorListItem = {
  id: number;
  nome: string;
  titulacao: string;
  area: string;
  tempo_docencia: number;
  email: string;
};

export async function createDisciplina(payload: DisciplinaPayload) {
  const response = await api.post('/disciplinas', payload);
  return response.data;
}

export async function deleteDisciplinaAdmin(id: number) {
  const response = await api.delete(`/disciplinas/${id}`);
  return response.data;
}

export async function fetchCursos() {
  const response = await api.get<{ cursos: CursoListItem[] }>('/cursos');
  return response.data;
}

export async function createCurso(payload: CursoPayload) {
  const response = await api.post('/cursos', payload);
  return response.data;
}

export async function fetchProfessores() {
  const response = await api.get<{ professores: ProfessorListItem[] }>('/professores');
  return response.data;
}

export async function fetchAdminProfessores() {
  const response = await api.get<{ professores: ProfessorListItem[] }>('/professores');
  return response.data;
}

export async function fetchBoletim(matricula: string) {
  const response = await api.get(`/boletim/${matricula}`);
  return response.data;
}

export type AdminAlunoListItem = {
  id: number;
  nome: string;
  matricula: string;
  curso: string;
  semestre: number;
  email: string;
};

export async function fetchAdminAlunos() {
  const response = await api.get<{ alunos: AdminAlunoListItem[] }>('/alunos');
  return response.data;
}

export async function updateAlunoAdmin(id: number, payload: Partial<AlunoPayload>) {
  const response = await api.put(`/alunos/${id}`, payload);
  return response.data;
}

export type AdminDisciplinaListItem = {
  id: number;
  nome: string;
  carga_horaria: number;
  curso: string;
  semestre: number;
  professor_id: number;
  professor_nome: string;
  professor_email: string;
};

export async function fetchAdminDisciplinas() {
  const response = await api.get<{ disciplinas: AdminDisciplinaListItem[] }>('/disciplinas');
  return response.data;
}

export async function updateDisciplinaAdmin(id: number, payload: Partial<DisciplinaPayload>) {
  const response = await api.put(`/disciplinas/${id}`, payload);
  return response.data;
}

export type AdminNotaListItem = {
  id: number;
  aluno_nome: string;
  aluno_matricula: string;
  disciplina_nome: string;
  disciplina_curso: string;
  disciplina_semestre: number;
  nota1: number;
  nota2: number;
  media: number;
  situacao: 'Aprovado' | 'Reprovado';
};

export async function fetchAdminNotas() {
  const response = await api.get<{ notas: AdminNotaListItem[] }>('/notas');
  return response.data;
}

export async function upsertNotaAdmin(payload: UpsertNotaPayload) {
  const response = await api.put('/notas/admin', payload);
  return response.data;
}

export type ProfessorVisaoDisciplinaAluno = {
  id: number;
  nome: string;
  matricula: string;
  nota1: number | null;
  nota2: number | null;
  media: number | null;
  situacao: 'Aprovado' | 'Reprovado' | null;
};

export type ProfessorVisaoDisciplina = {
  id: number;
  nome: string;
  curso: string;
  semestre: number;
  alunos: ProfessorVisaoDisciplinaAluno[];
};

export type ProfessorVisaoResponse = {
  professor: { id: number; nome: string };
  disciplinas: ProfessorVisaoDisciplina[];
  alunos: { id: number; nome: string; matricula: string }[];
};

export async function fetchProfessorVisao() {
  const response = await api.get<ProfessorVisaoResponse>('/visao/professor');
  return response.data;
}

export type AlunoVisaoDisciplina = {
  id: number;
  nome: string;
  curso: string;
  semestre: number;
  professor: { id: number; nome: string };
  nota1: number | null;
  nota2: number | null;
  media: number | null;
  situacao: 'Aprovado' | 'Reprovado' | null;
};

export type AlunoVisaoResponse = {
  aluno: { id: number; nome: string; matricula: string };
  disciplinas: AlunoVisaoDisciplina[];
};

export async function fetchAlunoVisao() {
  const response = await api.get<AlunoVisaoResponse>('/visao/aluno');
  return response.data;
}

export type AlunoPerfil = {
  id: number;
  nome: string;
  matricula: string;
  curso: string;
  semestre: number;
  email: string;
  telefone: string | null;
  cep: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
};

export async function fetchMeuAlunoPerfil() {
  const response = await api.get<{ aluno: AlunoPerfil }>('/alunos/me');
  return response.data;
}

export type UpdateAlunoPerfilPayload = {
  nome: string;
  email: string;
  telefone?: string | null;
  cep?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  semestre?: number | null;
};

export async function updateMeuAlunoPerfil(payload: UpdateAlunoPerfilPayload) {
  const response = await api.put<{ aluno: AlunoPerfil; usuario: { nome: string; perfil: string; matricula?: string; alunoId?: number; professorId?: number } }>(
    '/alunos/me',
    payload,
  );
  return response.data;
}

export type UpsertNotaPayload = {
  alunoId: number;
  disciplinaId: number;
  nota1: number;
  nota2: number;
};

export async function upsertNotaProfessor(payload: UpsertNotaPayload) {
  const response = await api.put('/notas', payload);
  return response.data;
}

export function setAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}

export default api;
