import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ScreenContainer } from '../components/ScreenContainer';
import { deleteAlunoAdmin, deleteDisciplinaAdmin, deleteProfessorAdmin, fetchAdminAlunos, fetchAdminDisciplinas, fetchAdminNotas, fetchAdminProfessores, fetchCursos, updateAlunoAdmin, updateDisciplinaAdmin, updateProfessorAdmin, upsertNotaAdmin } from '../services/api';
import { theme } from '../styles/theme';

type LoadState = {
  loading: boolean;
  error: string | null;
};

const TABLE_CELL_WIDTH = 170;

export function AdminDataScreen() {
  const { adminDataRevision } = useAuth();
  const [alunos, setAlunos] = useState<Awaited<ReturnType<typeof fetchAdminAlunos>>['alunos']>([]);
  const [professores, setProfessores] = useState<Awaited<ReturnType<typeof fetchAdminProfessores>>['professores']>([]);
  const [disciplinas, setDisciplinas] = useState<Awaited<ReturnType<typeof fetchAdminDisciplinas>>['disciplinas']>([]);
  const [notas, setNotas] = useState<Awaited<ReturnType<typeof fetchAdminNotas>>['notas']>([]);
  const [cursos, setCursos] = useState<Awaited<ReturnType<typeof fetchCursos>>['cursos']>([]);
  const [state, setState] = useState<LoadState>({ loading: true, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);

  const refreshAll = useCallback(async () => {
    const isInitialLoad = !hasLoadedOnce.current;

    try {
      if (isInitialLoad) {
        setState({ loading: true, error: null });
      } else {
        setRefreshing(true);
      }

      const [alunosRes, professoresRes, disciplinasRes, notasRes, cursosRes] = await Promise.all([
        fetchAdminAlunos(),
        fetchAdminProfessores(),
        fetchAdminDisciplinas(),
        fetchAdminNotas(),
        fetchCursos().catch(() => ({ cursos: [] })),
      ]);

      setAlunos(alunosRes.alunos);
      setProfessores(professoresRes.professores);
      setDisciplinas(disciplinasRes.disciplinas);
      setNotas(notasRes.notas);
      setCursos(cursosRes.cursos || []);

      if (isInitialLoad) {
        setState({ loading: false, error: null });
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Nao foi possivel carregar os dados administrativos.';

      setState({ loading: false, error: String(message) });
    } finally {
      hasLoadedOnce.current = true;
      if (!isInitialLoad) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll, adminDataRevision]);

  const disciplinasByProfessor = useMemo(() => {
    const map = new Map<string, typeof disciplinas>();

    for (const d of disciplinas) {
      const key = d.professor_nome;
      const current = map.get(key) || [];
      current.push(d);
      map.set(key, current);
    }

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [disciplinas]);

  const professorIdsComDisciplina = useMemo(() => new Set(disciplinas.map((disciplina) => disciplina.professor_id)), [disciplinas]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editKind, setEditKind] = useState<'aluno' | 'professor' | 'disciplina' | 'nota' | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);

  function openEdit(kind: 'aluno' | 'professor' | 'disciplina' | 'nota', item: any) {
    setEditKind(kind);
    setEditItem(item);
    setEditModalVisible(true);
  }

  async function handleSaveEdit(values: any) {
    try {
      if (editKind === 'aluno' && editItem) {
        await updateAlunoAdmin(editItem.id, values);
      }

      if (editKind === 'professor' && editItem) {
        await updateProfessorAdmin(editItem.id, values);
      }

      if (editKind === 'disciplina' && editItem) {
        await updateDisciplinaAdmin(editItem.id, values);
      }

      if (editKind === 'nota' && editItem) {
        await upsertNotaAdmin({ alunoId: editItem.aluno_id || editItem.alunoId, disciplinaId: editItem.disciplina_id || editItem.disciplinaId, nota1: values.nota1, nota2: values.nota2 });
      }

      setEditModalVisible(false);
      setEditItem(null);
      setEditKind(null);
      await refreshAll();
      Alert.alert('Sucesso', 'Registro atualizado.');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Erro ao atualizar.';
      Alert.alert('Erro', String(message));
    }
  }

  function handleDelete(kind: 'aluno' | 'professor' | 'disciplina', item: any) {
    const label =
      kind === 'aluno'
        ? item.nome
        : kind === 'professor'
          ? item.nome
          : item.nome;

    Alert.alert(
      'Confirmar exclusao',
      `Deseja realmente excluir ${label}? Esta acao nao pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              if (kind === 'aluno') {
                await deleteAlunoAdmin(item.id);
              }

              if (kind === 'professor') {
                await deleteProfessorAdmin(item.id);
              }

              if (kind === 'disciplina') {
                await deleteDisciplinaAdmin(item.id);
              }

              await refreshAll();
              Alert.alert('Sucesso', 'Registro removido com sucesso.');
            } catch (err: any) {
              const message = err?.response?.data?.message || err?.message || 'Erro ao remover registro.';
              Alert.alert('Erro', String(message));
            }
          },
        },
      ],
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.headerBlock}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>Dados (Admin)</Text>
            <Text style={styles.subtitle}>Visualizacao dinamica dos registros cadastrados no sistema.</Text>
          </View>
        </View>
      </View>

      {state.loading ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.helperText}>Carregando dados...</Text>
        </View>
      ) : state.error ? (
        <View style={styles.errorBlock}>
          <Text style={styles.errorTitle}>Erro</Text>
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      ) : (
        <>
          <SectionTitle title={`Alunos matriculados (${alunos.length})`} />
          <HorizontalTable>
            <TableRow header>
              <TableCell header text="Nome" />
              <TableCell header text="Matricula" />
              <TableCell header text="Curso" />
              <TableCell header text="Semestre" />
              <TableCell header text="Email" />
              <TableCell header text="Acao" />
            </TableRow>
            {alunos.map((a) => (
              <TableRow key={a.id}>
                <TableCell text={a.nome} />
                <TableCell text={a.matricula} />
                <TableCell text={a.curso} />
                <TableCell text={String(a.semestre)} />
                <TableCell text={a.email} />
                <ActionCell>
                  <View style={styles.actionButtonsRow}>
                    <Pressable onPress={() => openEdit('aluno', a)}>
                      <Text style={styles.actionEditText}>Editar</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDelete('aluno', a)}>
                      <Text style={styles.actionDeleteText}>Excluir</Text>
                    </Pressable>
                  </View>
                </ActionCell>
              </TableRow>
            ))}
          </HorizontalTable>

          <SectionTitle title={`Professores cadastrados (${professores.length})`} />
          <HorizontalTable>
            <TableRow header>
              <TableCell header text="Nome" />
              <TableCell header text="Titulacao" />
              <TableCell header text="Area" />
              <TableCell header text="Tempo" />
              <TableCell header text="Email" />
              <TableCell header text="Disciplina" />
              <TableCell header text="Acao" />
            </TableRow>
            {professores.map((professor) => {
              const temDisciplina = professorIdsComDisciplina.has(professor.id);

              return (
                <TableRow key={professor.id}>
                  <TableCell text={professor.nome} />
                  <TableCell text={professor.titulacao} />
                  <TableCell text={professor.area} />
                  <TableCell text={String(professor.tempo_docencia)} />
                  <TableCell text={professor.email} />
                  <TableCell text={temDisciplina ? 'Atribuida' : 'Sem disciplina'} />
                  <ActionCell>
                    <View style={styles.actionButtonsRow}>
                      <Pressable onPress={() => openEdit('professor', professor)}>
                        <Text style={styles.actionEditText}>Editar</Text>
                      </Pressable>
                      <Pressable onPress={() => handleDelete('professor', professor)}>
                        <Text style={styles.actionDeleteText}>Excluir</Text>
                      </Pressable>
                    </View>
                  </ActionCell>
                </TableRow>
              );
            })}
          </HorizontalTable>

          <SectionTitle title={`Professores x Disciplinas (${disciplinas.length})`} />
          {disciplinasByProfessor.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma disciplina cadastrada.</Text>
          ) : (
            disciplinasByProfessor.map(([professorNome, list]) => (
              <View key={professorNome} style={styles.groupBlock}>
                <Text style={styles.groupTitle}>{professorNome}</Text>
                <HorizontalTable>
                  <TableRow header>
                    <TableCell header text="Disciplina" />
                    <TableCell header text="Curso" />
                    <TableCell header text="Sem" />
                    <TableCell header text="CH" />
                    <TableCell header text="Acao" />
                  </TableRow>
                  {list.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell text={d.nome} />
                      <TableCell text={d.curso} />
                      <TableCell text={String(d.semestre)} />
                      <TableCell text={String(d.carga_horaria)} />
                      <ActionCell>
                        <View style={styles.actionButtonsRow}>
                          <Pressable onPress={() => openEdit('disciplina', d)}>
                            <Text style={styles.actionEditText}>Editar</Text>
                          </Pressable>
                          <Pressable onPress={() => handleDelete('disciplina', d)}>
                            <Text style={styles.actionDeleteText}>Excluir</Text>
                          </Pressable>
                        </View>
                      </ActionCell>
                    </TableRow>
                  ))}
                </HorizontalTable>
              </View>
            ))
          )}

          <SectionTitle title={`Notas (${notas.length})`} />
          <HorizontalTable>
            <TableRow header>
              <TableCell header text="Aluno" />
              <TableCell header text="Matricula" />
              <TableCell header text="Disciplina" />
              <TableCell header text="N1" />
              <TableCell header text="N2" />
              <TableCell header text="Media" />
              <TableCell header text="Sit." />
              <TableCell header text="Acao" />
            </TableRow>
            {notas.map((n) => (
              <TableRow key={n.id}>
                <TableCell text={n.aluno_nome} />
                <TableCell text={n.aluno_matricula} />
                <TableCell text={n.disciplina_nome} />
                <TableCell text={String(n.nota1)} />
                <TableCell text={String(n.nota2)} />
                <TableCell text={String(n.media)} />
                <TableCell text={n.situacao} />
                <ActionCell>
                  <Pressable onPress={() => openEdit('nota', n)}>
                    <Text style={{ color: theme.colors.primary }}>Editar</Text>
                  </Pressable>
                </ActionCell>
              </TableRow>
            ))}
          </HorizontalTable>
        </>
      )}

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', backgroundColor: theme.colors.surface, padding: 16, borderRadius: theme.radius.md }}>
            <Text style={{ fontWeight: '800', marginBottom: 8 }}>Editar</Text>
            {editKind === 'aluno' && editItem && (
              <EditAlunoForm
                item={editItem}
                cursos={cursos}
                onCancel={() => setEditModalVisible(false)}
                onSave={handleSaveEdit}
              />
            )}

            {editKind === 'professor' && editItem && (
              <EditProfessorForm
                item={editItem}
                onCancel={() => setEditModalVisible(false)}
                onSave={handleSaveEdit}
              />
            )}

            {editKind === 'disciplina' && editItem && (
              <EditDisciplinaForm
                item={editItem}
                professores={professores}
                onCancel={() => setEditModalVisible(false)}
                onSave={handleSaveEdit}
              />
            )}

            {editKind === 'nota' && editItem && (
              <EditNotaForm item={editItem} onCancel={() => setEditModalVisible(false)} onSave={handleSaveEdit} />
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function HorizontalTable({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
      <View style={styles.table}>{children}</View>
    </ScrollView>
  );
}

function TableRow({ children, header = false }: { children: ReactNode; header?: boolean }) {
  return <View style={[styles.row, header ? styles.rowHeader : styles.rowBody]}>{children}</View>;
}

function TableCell({ text, header = false }: { text: string; header?: boolean }) {
  return (
    <View style={[styles.cell, { width: TABLE_CELL_WIDTH }]}>
      <Text numberOfLines={1} style={[styles.cellText, header ? styles.cellTextHeader : null]}>
        {text}
      </Text>
    </View>
  );
}

function ActionCell({ children }: { children: ReactNode }) {
  return <View style={[styles.cell, styles.actionCell, { width: TABLE_CELL_WIDTH }]}>{children}</View>;
}

function EditAlunoForm({ item, cursos, onCancel, onSave }: any) {
  const [nome, setNome] = useState(item.nome || '');
  const [matricula, setMatricula] = useState(item.matricula || '');
  const [curso, setCurso] = useState(item.curso || '');
  const [semestre, setSemestre] = useState(String(item.semestre || ''));
  const [email, setEmail] = useState(item.email || '');
  const [error, setError] = useState('');

  const cursosDisponiveis = cursos.length > 0
    ? cursos
    : Array.from(new Set([item.curso].filter(Boolean))).map((nome: string, index: number) => ({ id: index + 1, nome }));

  function handleSave() {
    const nomeTrimmed = nome.trim();
    const matriculaTrimmed = matricula.trim();
    const cursoTrimmed = curso.trim();
    const emailTrimmed = email.trim();
    const semestreNumero = Number(semestre);

    if (!nomeTrimmed || !matriculaTrimmed || !cursoTrimmed || !emailTrimmed) {
      setError('Preencha todos os campos obrigatorios do aluno.');
      return;
    }

    if (!Number.isInteger(semestreNumero) || semestreNumero <= 0) {
      setError('Semestre invalido.');
      return;
    }

    setError('');
    onSave({
      nome: nomeTrimmed,
      matricula: matriculaTrimmed,
      curso: cursoTrimmed,
      semestre: semestreNumero,
      email: emailTrimmed,
    });
  }

  return (
    <View>
      <TextInput placeholder="Nome" value={nome} onChangeText={setNome} style={styles.input} />
      <TextInput placeholder="Matricula" value={matricula} onChangeText={setMatricula} style={styles.input} />
      <Text style={styles.helperText}>Selecione o curso</Text>
      <View style={styles.selectorBox}>
        {cursosDisponiveis.map((itemCurso: any) => {
          const isSelected = itemCurso.nome === curso;

          return (
            <Pressable
              key={itemCurso.id}
              onPress={() => setCurso(itemCurso.nome)}
              style={({ pressed }) => [
                styles.selectorItem,
                isSelected && styles.selectorItemSelected,
                pressed && styles.selectorItemPressed,
              ]}
            >
              <Text style={styles.selectorItemTitle}>{itemCurso.nome}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput placeholder="Semestre" value={semestre} onChangeText={setSemestre} style={styles.input} keyboardType="numeric" />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />
      {!!error && <Text style={styles.formErrorText}>{error}</Text>}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
        <Pressable onPress={onCancel} style={{ marginRight: 12 }}>
          <Text>Cancelar</Text>
        </Pressable>
        <Pressable onPress={handleSave}>
          <Text style={{ color: theme.colors.primary }}>Salvar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EditProfessorForm({ item, onCancel, onSave }: any) {
  const [nome, setNome] = useState(item.nome || '');
  const [titulacao, setTitulacao] = useState(item.titulacao || '');
  const [area, setArea] = useState(item.area || '');
  const [tempoDocencia, setTempoDocencia] = useState(String(item.tempo_docencia || ''));
  const [email, setEmail] = useState(item.email || '');
  const [error, setError] = useState('');

  function handleSave() {
    const nomeTrimmed = nome.trim();
    const titulacaoTrimmed = titulacao.trim();
    const areaTrimmed = area.trim();
    const emailTrimmed = email.trim();
    const tempo = Number(tempoDocencia);

    if (!nomeTrimmed || !titulacaoTrimmed || !areaTrimmed || !emailTrimmed) {
      setError('Preencha todos os campos do professor.');
      return;
    }

    if (!Number.isInteger(tempo) || tempo <= 0) {
      setError('Tempo de docencia deve ser um numero inteiro maior que zero.');
      return;
    }

    setError('');
    onSave({
      nome: nomeTrimmed,
      titulacao: titulacaoTrimmed,
      area: areaTrimmed,
      tempo_docencia: tempo,
      email: emailTrimmed,
    });
  }

  return (
    <View>
      <TextInput placeholder="Nome" value={nome} onChangeText={setNome} style={styles.input} />
      <TextInput placeholder="Titulacao" value={titulacao} onChangeText={setTitulacao} style={styles.input} />
      <TextInput placeholder="Area" value={area} onChangeText={setArea} style={styles.input} />
      <TextInput
        placeholder="Tempo de docencia"
        value={tempoDocencia}
        onChangeText={setTempoDocencia}
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />
      {!!error && <Text style={styles.formErrorText}>{error}</Text>}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
        <Pressable onPress={onCancel} style={{ marginRight: 12 }}>
          <Text>Cancelar</Text>
        </Pressable>
        <Pressable onPress={handleSave}>
          <Text style={{ color: theme.colors.primary }}>Salvar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EditDisciplinaForm({ item, professores, onCancel, onSave }: any) {
  const [nome, setNome] = useState(item.nome || '');
  const [carga, setCarga] = useState(String(item.carga_horaria || ''));
  const [curso, setCurso] = useState(item.curso || '');
  const [semestre, setSemestre] = useState(String(item.semestre || ''));
  const [professorId, setProfessorId] = useState(String(item.professor_id || ''));
  const [professorSearch, setProfessorSearch] = useState('');

  const professoresFiltrados = professores.filter((professor: any) =>
    String(professor.nome || '').toLowerCase().includes(professorSearch.trim().toLowerCase()),
  );

  const selectedProfessor = professores.find((professor: any) => String(professor.id) === professorId);

  return (
    <View>
      <TextInput placeholder="Nome" value={nome} onChangeText={setNome} style={styles.input} />
      <TextInput placeholder="Carga horaria" value={carga} onChangeText={setCarga} style={styles.input} keyboardType="numeric" />
      <TextInput placeholder="Curso" value={curso} onChangeText={setCurso} style={styles.input} />
      <TextInput placeholder="Semestre" value={semestre} onChangeText={setSemestre} style={styles.input} keyboardType="numeric" />
      {!!selectedProfessor && <Text style={styles.helperText}>Professor selecionado: {selectedProfessor.nome}</Text>}

      <TextInput placeholder="Buscar professor" value={professorSearch} onChangeText={setProfessorSearch} style={styles.input} />

      <View style={styles.selectorBox}>
        {professoresFiltrados.map((professor: any) => {
          const isSelected = String(professor.id) === professorId;

          return (
            <Pressable
              key={professor.id}
              onPress={() => setProfessorId(String(professor.id))}
              style={({ pressed }) => [
                styles.selectorItem,
                isSelected && styles.selectorItemSelected,
                pressed && styles.selectorItemPressed,
              ]}
            >
              <Text style={styles.selectorItemTitle}>{professor.nome}</Text>
              <Text style={styles.selectorItemMeta}>{professor.area}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.helperText}>Professor atual: {selectedProfessor ? selectedProfessor.nome : 'nenhum selecionado'}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
        <Pressable onPress={onCancel} style={{ marginRight: 12 }}>
          <Text>Cancelar</Text>
        </Pressable>
        <Pressable onPress={() => onSave({ nome, carga_horaria: Number(carga), curso, semestre: Number(semestre), professor_id: Number(professorId) })}>
          <Text style={{ color: theme.colors.primary }}>Salvar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EditNotaForm({ item, onCancel, onSave }: any) {
  const [nota1, setNota1] = useState(String(item.nota1 ?? ''));
  const [nota2, setNota2] = useState(String(item.nota2 ?? ''));

  return (
    <View>
      <Text style={{ marginBottom: 6 }}>{`${item.aluno_nome} — ${item.disciplina_nome}`}</Text>
      <TextInput placeholder="Nota 1" value={nota1} onChangeText={setNota1} style={styles.input} keyboardType="numeric" />
      <TextInput placeholder="Nota 2" value={nota2} onChangeText={setNota2} style={styles.input} keyboardType="numeric" />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
        <Pressable onPress={onCancel} style={{ marginRight: 12 }}>
          <Text>Cancelar</Text>
        </Pressable>
        <Pressable onPress={() => onSave({ nota1: Number(nota1), nota2: Number(nota2) })}>
          <Text style={{ color: theme.colors.primary }}>Salvar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    marginBottom: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  headerTextBlock: {
    flex: 1,
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
  sectionTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
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
    marginBottom: theme.spacing.sm,
  },
  groupBlock: {
    marginBottom: theme.spacing.md,
  },
  groupTitle: {
    color: theme.colors.primaryDark,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  tableScroll: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  table: {
    minWidth: TABLE_CELL_WIDTH * 8,
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
    justifyContent: 'center',
  },
  actionCell: {
    alignItems: 'flex-start',
  },
  actionButtonsRow: {
    flexDirection: 'column',
    gap: 8,
  },
  actionEditText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  actionDeleteText: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  selectorBox: {
    marginBottom: theme.spacing.md,
  },
  selectorItem: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  selectorItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#eef5ff',
  },
  selectorItemPressed: {
    opacity: 0.85,
  },
  selectorItemTitle: {
    color: theme.colors.text,
    fontWeight: '800',
    marginBottom: 2,
  },
  selectorItemMeta: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
  cellText: {
    color: theme.colors.text,
    fontSize: 13,
  },
  cellTextHeader: {
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: 8,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  formErrorText: {
    color: theme.colors.danger,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
});
