import { ReactNode, useEffect, useMemo, useState } from 'react';
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
import { ScreenContainer } from '../components/ScreenContainer';
import { fetchAdminAlunos, fetchAdminDisciplinas, fetchAdminNotas, updateAlunoAdmin, updateDisciplinaAdmin, upsertNotaAdmin } from '../services/api';
import { theme } from '../styles/theme';

type LoadState = {
  loading: boolean;
  error: string | null;
};

export function AdminDataScreen() {
  const [alunos, setAlunos] = useState<Awaited<ReturnType<typeof fetchAdminAlunos>>['alunos']>([]);
  const [disciplinas, setDisciplinas] = useState<Awaited<ReturnType<typeof fetchAdminDisciplinas>>['disciplinas']>([]);
  const [notas, setNotas] = useState<Awaited<ReturnType<typeof fetchAdminNotas>>['notas']>([]);
  const [state, setState] = useState<LoadState>({ loading: true, error: null });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setState({ loading: true, error: null });

        const [alunosRes, disciplinasRes, notasRes] = await Promise.all([
          fetchAdminAlunos(),
          fetchAdminDisciplinas(),
          fetchAdminNotas(),
        ]);

        if (!isMounted) return;

        setAlunos(alunosRes.alunos);
        setDisciplinas(disciplinasRes.disciplinas);
        setNotas(notasRes.notas);
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Nao foi possivel carregar os dados administrativos.';

        if (isMounted) {
          setState({ loading: false, error: String(message) });
        }

        return;
      }

      if (isMounted) {
        setState({ loading: false, error: null });
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editKind, setEditKind] = useState<'aluno' | 'disciplina' | 'nota' | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);

  async function refreshAll() {
    try {
      const [alunosRes, disciplinasRes, notasRes] = await Promise.all([
        fetchAdminAlunos(),
        fetchAdminDisciplinas(),
        fetchAdminNotas(),
      ]);

      setAlunos(alunosRes.alunos);
      setDisciplinas(disciplinasRes.disciplinas);
      setNotas(notasRes.notas);
    } catch (err: any) {
      // ignore here
    }
  }

  function openEdit(kind: 'aluno' | 'disciplina' | 'nota', item: any) {
    setEditKind(kind);
    setEditItem(item);
    setEditModalVisible(true);
  }

  async function handleSaveEdit(values: any) {
    try {
      if (editKind === 'aluno' && editItem) {
        await updateAlunoAdmin(editItem.id, values);
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

  return (
    <ScreenContainer>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Dados (Admin)</Text>
        <Text style={styles.subtitle}>Visualizacao dinamica dos registros cadastrados no sistema.</Text>
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
              <TableCell header flex={2} text="Nome" />
              <TableCell header flex={1} text="Matricula" />
              <TableCell header flex={2} text="Curso" />
              <TableCell header flex={2} text="Email" />
            </TableRow>
            {alunos.map((a) => (
              <TableRow key={a.id}>
                <TableCell flex={2} text={a.nome} />
                <TableCell flex={1} text={a.matricula} />
                <TableCell flex={2} text={a.curso} />
                <TableCell flex={2} text={a.email} />
                <TableCell flex={1} text="" />
                <ActionCell flex={1}>
                  <Pressable onPress={() => openEdit('aluno', a)}>
                    <Text style={{ color: theme.colors.primary }}>Editar</Text>
                  </Pressable>
                </ActionCell>
              </TableRow>
            ))}
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
                    <TableCell header flex={2} text="Disciplina" />
                    <TableCell header flex={2} text="Curso" />
                    <TableCell header flex={1} text="Sem" />
                    <TableCell header flex={1} text="CH" />
                  </TableRow>
                  {list.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell flex={2} text={d.nome} />
                      <TableCell flex={2} text={d.curso} />
                      <TableCell flex={1} text={String(d.semestre)} />
                      <TableCell flex={1} text={String(d.carga_horaria)} />
                      <TableCell flex={1} text="" />
                      <ActionCell flex={1}>
                        <Pressable onPress={() => openEdit('disciplina', d)}>
                          <Text style={{ color: theme.colors.primary }}>Editar</Text>
                        </Pressable>
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
              <TableCell header flex={2} text="Aluno" />
              <TableCell header flex={1} text="Matricula" />
              <TableCell header flex={2} text="Disciplina" />
              <TableCell header flex={1} text="N1" />
              <TableCell header flex={1} text="N2" />
              <TableCell header flex={1} text="Media" />
              <TableCell header flex={1} text="Sit." />
            </TableRow>
            {notas.map((n) => (
              <TableRow key={n.id}>
                <TableCell flex={2} text={n.aluno_nome} />
                <TableCell flex={1} text={n.aluno_matricula} />
                <TableCell flex={2} text={n.disciplina_nome} />
                <TableCell flex={1} text={String(n.nota1)} />
                <TableCell flex={1} text={String(n.nota2)} />
                <TableCell flex={1} text={String(n.media)} />
                <TableCell flex={1} text={n.situacao} />
                <TableCell flex={1} text="" />
                <ActionCell flex={1}>
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
              <EditAlunoForm item={editItem} onCancel={() => setEditModalVisible(false)} onSave={handleSaveEdit} />
            )}

            {editKind === 'disciplina' && editItem && (
              <EditDisciplinaForm item={editItem} onCancel={() => setEditModalVisible(false)} onSave={handleSaveEdit} />
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

function TableCell({ text, flex, header = false }: { text: string; flex: number; header?: boolean }) {
  return (
    <View style={[styles.cell, { flex }]}> 
      <Text numberOfLines={1} style={[styles.cellText, header ? styles.cellTextHeader : null]}>
        {text}
      </Text>
    </View>
  );
}

function ActionCell({ children, flex = 1 }: { children: ReactNode; flex?: number }) {
  return <View style={[styles.cell, { flex }]}>{children}</View>;
}

function EditAlunoForm({ item, onCancel, onSave }: any) {
  const [nome, setNome] = useState(item.nome || '');
  const [matricula, setMatricula] = useState(item.matricula || '');
  const [curso, setCurso] = useState(item.curso || '');
  const [email, setEmail] = useState(item.email || '');

  return (
    <View>
      <TextInput placeholder="Nome" value={nome} onChangeText={setNome} style={styles.input} />
      <TextInput placeholder="Matricula" value={matricula} onChangeText={setMatricula} style={styles.input} />
      <TextInput placeholder="Curso" value={curso} onChangeText={setCurso} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
        <Pressable onPress={onCancel} style={{ marginRight: 12 }}>
          <Text>Cancelar</Text>
        </Pressable>
        <Pressable onPress={() => onSave({ nome, matricula, curso, email })}>
          <Text style={{ color: theme.colors.primary }}>Salvar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EditDisciplinaForm({ item, onCancel, onSave }: any) {
  const [nome, setNome] = useState(item.nome || '');
  const [carga, setCarga] = useState(String(item.carga_horaria || ''));
  const [curso, setCurso] = useState(item.curso || '');
  const [semestre, setSemestre] = useState(String(item.semestre || ''));
  const [professorId, setProfessorId] = useState(String(item.professor_id || ''));

  return (
    <View>
      <TextInput placeholder="Nome" value={nome} onChangeText={setNome} style={styles.input} />
      <TextInput placeholder="Carga horaria" value={carga} onChangeText={setCarga} style={styles.input} keyboardType="numeric" />
      <TextInput placeholder="Curso" value={curso} onChangeText={setCurso} style={styles.input} />
      <TextInput placeholder="Semestre" value={semestre} onChangeText={setSemestre} style={styles.input} keyboardType="numeric" />
      <TextInput placeholder="Professor ID" value={professorId} onChangeText={setProfessorId} style={styles.input} keyboardType="numeric" />
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
  input: {
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: 8,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
});
