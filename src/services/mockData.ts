export type ReportCardItem = {
  disciplina: string;
  nota1: number;
  nota2: number;
  media: number;
  situacao: 'Aprovado' | 'Reprovado';
};

export const reportCardMock: ReportCardItem[] = [
  { disciplina: 'Matematica', nota1: 8.0, nota2: 7.5, media: 7.75, situacao: 'Aprovado' },
  { disciplina: 'Historia', nota1: 6.2, nota2: 7.0, media: 6.6, situacao: 'Aprovado' },
  { disciplina: 'Fisica', nota1: 4.8, nota2: 5.1, media: 4.95, situacao: 'Reprovado' },
  { disciplina: 'Biologia', nota1: 9.0, nota2: 8.3, media: 8.65, situacao: 'Aprovado' },
];
