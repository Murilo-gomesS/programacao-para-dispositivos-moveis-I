import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import {
  fetchAlunoVisao,
  fetchMeuAlunoPerfil,
  fetchProfessorVisao,
  updateMeuAlunoPerfil,
  upsertNotaProfessor,
} from '../services/api';
import { theme } from '../styles/theme';

type LoadState = { loading: boolean; error: string | null };

export function VisualizationScreen() {
  const { user, updateUser } = useAuth();
  const perfil = user?.perfil;

  const [state, setState] = useState<LoadState>({ loading: true, error: null });
  const [professorData, setProfessorData] = useState<Awaited<ReturnType<typeof fetchProfessorVisao>> | null>(null);
  const [alunoData, setAlunoData] = useState<Awaited<ReturnType<typeof fetchAlunoVisao>> | null>(null);
  const [alunoPerfil, setAlunoPerfil] = useState<Awaited<ReturnType<typeof fetchMeuAlunoPerfil>>['aluno'] | null>(null);
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: '',
    cidade: '',
    estado: '',
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setState({ loading: true, error: null });

        if (perfil === 'Professor') {
          const res = await fetchProfessorVisao();
          if (isMounted) {
            setProfessorData(res);
            setAlunoData(null);
          }
        } else if (perfil === 'Aluno') {
          const [visaoRes, perfilRes] = await Promise.all([fetchAlunoVisao(), fetchMeuAlunoPerfil()]);
          if (isMounted) {
            setAlunoData(visaoRes);
            setAlunoPerfil(perfilRes.aluno);
            setProfileForm({
              nome: perfilRes.aluno.nome || '',
              email: perfilRes.aluno.email || '',
              telefone: perfilRes.aluno.telefone || '',
              cep: perfilRes.aluno.cep || '',
              endereco: perfilRes.aluno.endereco || '',
              cidade: perfilRes.aluno.cidade || '',
              estado: perfilRes.aluno.estado || '',
            });
            setProfessorData(null);
          }
        } else {
          if (isMounted) {
            setProfessorData(null);
            setAlunoData(null);
          }
        }

        if (isMounted) {
          setState({ loading: false, error: null });
        }
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || 'Nao foi possivel carregar a visualizacao.';
        if (isMounted) {
          setState({ loading: false, error: String(message) });
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [perfil]);

  const professorDisciplinas = professorData?.disciplinas || [];
  const professorAlunos = professorData?.alunos || [];

  const alunoDisciplinas = alunoData?.disciplinas || [];

  const resumoTitulo =
    perfil === 'Professor'
      ? `Você leciona ${professorDisciplinas.length} disciplina(s)`
      : perfil === 'Aluno'
        ? `Você está matriculado em ${alunoDisciplinas.length} disciplina(s)`
        : 'Acesso restrito';

  const resumoDescricao =
    perfil === 'Professor'
      ? `${professorAlunos.length} aluno(s) aparecem nas disciplinas vinculadas ao seu perfil.`
      : perfil === 'Aluno'
        ? 'Seus dados pessoais podem ser ajustados nesta tela.'
        : 'Essa área está liberada somente para alunos e professores.';

  const disciplinasWithEmpty = useMemo(() => {
    return professorDisciplinas.map((d) => ({
      ...d,
      alunos: Array.isArray(d.alunos) ? d.alunos : [],
    }));
  }, [professorDisciplinas]);

  const fmt = (value: number | null) => (value === null ? '-' : String(value));
  const fmtSituacao = (value: string | null) => (value ? value : '-');

  const handleSaveGrade = async (alunoId: number, disciplinaId: number) => {
    const key = `${alunoId}-${disciplinaId}`;
    const item = professorData?.disciplinas
      .flatMap((disciplina) => disciplina.alunos.map((aluno) => ({ disciplinaId: disciplina.id, aluno })))
      .find((entry) => entry.disciplinaId === disciplinaId && entry.aluno.id === alunoId);

    if (!item) {
      return;
    }

    const stateKeyN1 = `n1-${key}`;
    const stateKeyN2 = `n2-${key}`;
    const nota1 = Number((noteInputs[stateKeyN1] ?? '').replace(',', '.'));
    const nota2 = Number((noteInputs[stateKeyN2] ?? '').replace(',', '.'));

    if (!Number.isFinite(nota1) || !Number.isFinite(nota2)) {
      Alert.alert('Atencao', 'Informe notas validas entre 0 e 10.');
      return;
    }

    try {
      setSavingNotes((current) => ({ ...current, [key]: true }));
      await upsertNotaProfessor({ alunoId, disciplinaId, nota1, nota2 });
      const updated = await fetchProfessorVisao();
      setProfessorData(updated);
      Alert.alert('Sucesso', 'Nota atualizada com sucesso.');
    } catch (error: any) {
      Alert.alert('Erro', error?.response?.data?.message || 'Nao foi possivel atualizar a nota.');
    } finally {
      setSavingNotes((current) => ({ ...current, [key]: false }));
    }
  };

  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (perfil !== 'Professor' || !professorData) return;

    const nextInputs: Record<string, string> = {};
    for (const disciplina of professorData.disciplinas) {
      for (const aluno of disciplina.alunos) {
        const key = `${aluno.id}-${disciplina.id}`;
        nextInputs[`n1-${key}`] = aluno.nota1 === null ? '' : String(aluno.nota1);
        nextInputs[`n2-${key}`] = aluno.nota2 === null ? '' : String(aluno.nota2);
      }
    }
    setNoteInputs(nextInputs);
  }, [perfil, professorData]);

  const handleSaveProfile = async () => {
    if (perfil !== 'Aluno') return;

    try {
      setSavingProfile(true);
      const result = await updateMeuAlunoPerfil({
        nome: profileForm.nome,
        email: profileForm.email,
        telefone: profileForm.telefone || null,
        cep: profileForm.cep || null,
        endereco: profileForm.endereco || null,
        cidade: profileForm.cidade || null,
        estado: profileForm.estado || null,
      });

      setAlunoPerfil(result.aluno);
      await updateUser({
        nome: result.usuario.nome,
        perfil: result.usuario.perfil,
        alunoId: result.usuario.alunoId,
        professorId: result.usuario.professorId,
        matricula: user?.matricula,
      });
      Alert.alert('Sucesso', 'Seus dados foram atualizados.');
    } catch (error: any) {
      Alert.alert('Erro', error?.response?.data?.message || 'Nao foi possivel atualizar seus dados.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Visualização</Text>
        <Text style={styles.subtitle}>
          {perfil === 'Professor'
            ? 'Materias, alunos e notas das suas turmas.'
            : perfil === 'Aluno'
              ? 'Suas materias, notas, professores e dados pessoais.'
              : 'Disponivel apenas para aluno e professor.'}
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{resumoTitulo}</Text>
          <Text style={styles.summaryText}>{resumoDescricao}</Text>
        </View>
      </View>

      {state.loading ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.helperText}>Carregando...</Text>
        </View>
      ) : state.error ? (
        <View style={styles.errorBlock}>
          <Text style={styles.errorTitle}>Erro</Text>
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      ) : perfil === 'Professor' ? (
        <>
          <SectionTitle title={`Disciplinas (${disciplinasWithEmpty.length})`} subtitle="Somente matérias vinculadas ao seu perfil." />
          {disciplinasWithEmpty.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma disciplina vinculada.</Text>
          ) : (
            disciplinasWithEmpty.map((d) => (
              <View key={d.id} style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <View>
                    <Text style={styles.groupTitle}>{d.nome}</Text>
                    <Text style={styles.groupMeta}>
                      {d.curso} · Sem {d.semestre}
                    </Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{d.alunos.length} aluno(s)</Text>
                  </View>
                </View>

                {d.alunos.length === 0 ? (
                  <Text style={styles.emptyText}>Sem alunos matriculados.</Text>
                ) : (
                  d.alunos.map((a) => {
                    const key = `${a.id}-${d.id}`;

                    return (
                      <View key={key} style={styles.editCard}>
                        <Text style={styles.editCardTitle}>{a.nome}</Text>
                        <Text style={styles.groupMeta}>Matrícula: {a.matricula}</Text>

                        <View style={styles.gradeGrid}>
                          <View style={styles.gradeInput}>
                            <AppInput
                              label="Nota 1"
                              keyboardType="numeric"
                              value={noteInputs[`n1-${key}`] || ''}
                              onChangeText={(value) =>
                                setNoteInputs((current) => ({ ...current, [`n1-${key}`]: value }))
                              }
                            />
                          </View>
                          <View style={styles.gradeInput}>
                            <AppInput
                              label="Nota 2"
                              keyboardType="numeric"
                              value={noteInputs[`n2-${key}`] || ''}
                              onChangeText={(value) =>
                                setNoteInputs((current) => ({ ...current, [`n2-${key}`]: value }))
                              }
                            />
                          </View>
                        </View>

                        <Text style={styles.groupMeta}>
                          Atual: N1 {fmt(a.nota1)} | N2 {fmt(a.nota2)} | Media {fmt(a.media)} | Sit. {fmtSituacao(a.situacao)}
                        </Text>

                        <AppButton
                          title={savingNotes[key] ? 'Salvando...' : 'Salvar nota'}
                          onPress={() => handleSaveGrade(a.id, d.id)}
                          loading={!!savingNotes[key]}
                        />
                      </View>
                    );
                  })
                )}
              </View>
            ))
          )}

          <SectionTitle title={`Alunos (${professorAlunos.length})`} subtitle="Lista derivada das matrículas e notas lançadas." />
          {professorAlunos.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum aluno encontrado.</Text>
          ) : (
            <View style={styles.listCard}>
              {professorAlunos.map((a) => (
                <View key={a.id} style={styles.listItem}>
                  <Text style={styles.listItemTitle}>{a.nome}</Text>
                  <Text style={styles.listItemSubtitle}>Matrícula {a.matricula}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : perfil === 'Aluno' ? (
        <>
          <SectionTitle title="Meus dados" subtitle="Atualize seu perfil sem sair da tela." />
          {alunoPerfil ? (
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View>
                  <Text style={styles.profileTitle}>{alunoPerfil.nome}</Text>
                  <Text style={styles.profileMeta}>Matrícula {alunoPerfil.matricula}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{alunoPerfil.curso}</Text>
                </View>
              </View>

              <AppInput
                label="Nome"
                value={profileForm.nome}
                onChangeText={(value) => setProfileForm((current) => ({ ...current, nome: value }))}
              />
              <AppInput
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={profileForm.email}
                onChangeText={(value) => setProfileForm((current) => ({ ...current, email: value }))}
              />
              <AppInput
                label="Telefone"
                value={profileForm.telefone}
                onChangeText={(value) => setProfileForm((current) => ({ ...current, telefone: value }))}
              />
              <AppInput
                label="CEP"
                value={profileForm.cep}
                onChangeText={(value) => setProfileForm((current) => ({ ...current, cep: value }))}
              />
              <AppInput
                label="Endereco"
                value={profileForm.endereco}
                onChangeText={(value) => setProfileForm((current) => ({ ...current, endereco: value }))}
              />
              <AppInput
                label="Cidade"
                value={profileForm.cidade}
                onChangeText={(value) => setProfileForm((current) => ({ ...current, cidade: value }))}
              />
              <AppInput
                label="Estado"
                value={profileForm.estado}
                onChangeText={(value) => setProfileForm((current) => ({ ...current, estado: value }))}
              />

              <AppButton
                title={savingProfile ? 'Salvando...' : 'Salvar meus dados'}
                onPress={handleSaveProfile}
                loading={savingProfile}
              />
            </View>
          ) : null}

          <SectionTitle title={`Disciplinas (${alunoDisciplinas.length})`} subtitle="Notas e professores vinculados às suas matrículas." />
          {alunoDisciplinas.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma disciplina encontrada.</Text>
          ) : (
            <View style={styles.listCard}>
              {alunoDisciplinas.map((d) => (
                <View key={d.id} style={styles.subjectCard}>
                  <View style={styles.sectionCardHeader}>
                    <View style={styles.subjectHeaderBlock}>
                      <Text style={styles.listItemTitle}>{d.nome}</Text>
                      <Text style={styles.listItemSubtitle}>{d.professor.nome}</Text>
                    </View>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Sem {d.semestre}</Text>
                    </View>
                  </View>

                  <View style={styles.gradeSummaryRow}>
                    <ValueChip label="N1" value={fmt(d.nota1)} />
                    <ValueChip label="N2" value={fmt(d.nota2)} />
                    <ValueChip label="Média" value={fmt(d.media)} />
                    <ValueChip label="Situação" value={fmtSituacao(d.situacao)} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <Text style={styles.emptyText}>Sem acesso.</Text>
      )}
    </ScreenContainer>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function HorizontalTable({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
      <View style={styles.table}>{children}</View>
    </ScrollView>
  );
}

function TableRow({ children, header = false }: { children: React.ReactNode; header?: boolean }) {
  return <View style={[styles.row, header ? styles.rowHeader : styles.rowBody]}>{children}</View>;
}

function TableCell({ text, flex, header = false }: { text: string; flex: number; header?: boolean }) {
  return (
    <View style={[styles.cell, { flex }]}>
      <Text numberOfLines={1} style={[styles.cellText, header ? styles.cellTextHeader : null]}>
        {text}
      </Text>
    </View>
  );
}

function ValueChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.valueChip}>
      <Text style={styles.valueChipLabel}>{label}</Text>
      <Text style={styles.valueChipValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  summaryCard: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.mutedText,
    fontSize: 14,
  },
  summaryTitle: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 4,
  },
  summaryText: {
    color: theme.colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitleWrap: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  sectionSubtitle: {
    marginTop: 4,
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  centerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  helperText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.mutedText,
    fontSize: 14,
  },
  errorBlock: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  errorTitle: {
    color: theme.colors.text,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.mutedText,
  },
  emptyText: {
    color: theme.colors.mutedText,
    marginTop: theme.spacing.sm,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  groupTitle: {
    color: theme.colors.primaryDark,
    fontWeight: '800',
    fontSize: 16,
  },
  groupMeta: {
    color: theme.colors.mutedText,
    marginTop: 4,
    fontSize: 13,
  },
  profileCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  profileTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  profileMeta: {
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.sm,
  },
  editCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  editCardTitle: {
    color: theme.colors.text,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  gradeGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  gradeInput: {
    flex: 1,
  },
  badge: {
    backgroundColor: theme.colors.background,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badgeText: {
    color: theme.colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  listCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  listItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listItemTitle: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  listItemSubtitle: {
    color: theme.colors.mutedText,
    marginTop: 3,
    fontSize: 13,
  },
  subjectCard: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  subjectHeaderBlock: {
    flex: 1,
  },
  gradeSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  valueChip: {
    minWidth: '46%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  valueChipLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    marginBottom: 2,
  },
  valueChipValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  tableScroll: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  table: {
    minWidth: 720,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowHeader: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.accent,
  },
  rowBody: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.accent,
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.sm,
  },
  cellText: {
    color: theme.colors.text,
    fontSize: 13,
  },
  cellTextHeader: {
    fontWeight: '800',
  },
});
