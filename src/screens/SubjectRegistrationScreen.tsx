import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useFormFields } from '../hooks/useFormFields';
import {
  AdminDisciplinaListItem,
  createCurso,
  createDisciplina,
  fetchAdminDisciplinas,
  fetchCursos,
  fetchProfessores,
  CursoListItem,
  ProfessorListItem,
} from '../services/api';
import { theme } from '../styles/theme';

type SubjectForm = {
  nomeDisciplina: string;
  cargaHoraria: string;
  professorId: string;
  curso: string;
  semestre: string;
};

export function SubjectRegistrationScreen() {
  const { bumpAdminDataRevision } = useAuth();
  const { fields, updateField, resetFields } = useFormFields<SubjectForm>({
    nomeDisciplina: '',
    cargaHoraria: '',
    professorId: '',
    curso: '',
    semestre: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SubjectForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [professores, setProfessores] = useState<ProfessorListItem[]>([]);
  const [isProfessoresLoading, setIsProfessoresLoading] = useState(false);
  const [professoresError, setProfessoresError] = useState<string | null>(null);
  const [professorSearch, setProfessorSearch] = useState('');
  const [cursos, setCursos] = useState<CursoListItem[]>([]);
  const [disciplinas, setDisciplinas] = useState<AdminDisciplinaListItem[]>([]);
  const [isCursosLoading, setIsCursosLoading] = useState(false);
  const [novoCurso, setNovoCurso] = useState('');
  const [isCursoSubmitting, setIsCursoSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCursos = async () => {
      try {
        setIsCursosLoading(true);
        const data = await fetchCursos();
        if (isMounted) {
          setCursos(data.cursos || []);
        }
      } catch (error) {
        if (isMounted) {
          setCursos([]);
        }
      } finally {
        if (isMounted) {
          setIsCursosLoading(false);
        }
      }
    };

    const loadDisciplinas = async () => {
      try {
        const data = await fetchAdminDisciplinas();
        if (isMounted) {
          setDisciplinas(data.disciplinas || []);
        }
      } catch (error) {
        if (isMounted) {
          setDisciplinas([]);
        }
      }
    };

    const loadProfessores = async () => {
      try {
        setIsProfessoresLoading(true);
        setProfessoresError(null);
        const data = await fetchProfessores();
        if (isMounted) {
          setProfessores(data.professores || []);
        }
      } catch (error) {
        if (isMounted) {
          setProfessoresError('Nao foi possivel carregar a lista de professores.');
          setProfessores([]);
        }
      } finally {
        if (isMounted) {
          setIsProfessoresLoading(false);
        }
      }
    };

    loadCursos();
    loadDisciplinas();
    loadProfessores();

    return () => {
      isMounted = false;
    };
  }, []);

  const professoresFiltrados = useMemo(() => {
    const term = professorSearch.trim().toLowerCase();
    if (!term) {
      return professores;
    }

    return professores.filter((prof) => prof.nome.toLowerCase().includes(term));
  }, [professores, professorSearch]);

  const selectedProfessor = useMemo(() => {
    const id = Number(fields.professorId);
    if (!Number.isFinite(id) || id <= 0) {
      return null;
    }
    return professores.find((p) => p.id === id) || null;
  }, [fields.professorId, professores]);

  const selectedCurso = useMemo(() => {
    const current = fields.curso.trim().toLowerCase();
    return cursos.find((curso) => curso.nome.trim().toLowerCase() === current) || null;
  }, [cursos, fields.curso]);

  const cursosDisponiveis = useMemo(() => {
    const fromCatalog = cursos.map((curso) => curso.nome).filter(Boolean);
    const fromDisciplinas = disciplinas.map((disciplina) => disciplina.curso).filter(Boolean);

    return Array.from(new Set([...fromCatalog, ...fromDisciplinas])).sort();
  }, [cursos, disciplinas]);

  const validate = () => {
    const nextErrors: Partial<Record<keyof SubjectForm, string>> = {};

    (Object.entries(fields) as [keyof SubjectForm, string][]).forEach(([field, value]) => {
      if (!value.trim()) {
        nextErrors[field] = 'Campo obrigatorio.';
      }
    });

    const carga = Number(fields.cargaHoraria);
    if (!Number.isFinite(carga) || carga <= 0) {
      nextErrors.cargaHoraria = 'Informe um numero valido.';
    }

    const semestre = Number(fields.semestre);
    if (!Number.isFinite(semestre) || !Number.isInteger(semestre) || semestre <= 0) {
      nextErrors.semestre = 'Informe um numero valido.';
    }

    const professorId = Number(fields.professorId);
    if (!Number.isFinite(professorId) || professorId <= 0) {
      nextErrors.professorId = 'Informe um ID valido.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await createDisciplina({
        nome: fields.nomeDisciplina,
        carga_horaria: Number(fields.cargaHoraria),
        professor_id: Number(fields.professorId),
        curso: fields.curso,
        semestre: Number(fields.semestre),
      });
      bumpAdminDataRevision();
      Alert.alert('Disciplina cadastrada', `${fields.nomeDisciplina} foi registrada.`);
      resetFields();
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel salvar o cadastro da disciplina.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCurso = async () => {
    const nome = novoCurso.trim();
    if (!nome) {
      Alert.alert('Atencao', 'Informe o nome do curso.');
      return;
    }

    try {
      setIsCursoSubmitting(true);
      const curso = await createCurso({ nome });
      setCursos((current) => {
        if (current.some((item) => item.nome.toLowerCase() === curso.curso.nome.toLowerCase())) {
          return current;
        }

        return [...current, curso.curso].sort((a, b) => a.nome.localeCompare(b.nome));
      });
      updateField('curso', curso.curso.nome);
      setNovoCurso('');
      Alert.alert('Curso cadastrado', `${curso.curso.nome} foi adicionado ao catalogo.`);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Nao foi possivel cadastrar o curso.';
      Alert.alert('Erro', String(message));
    } finally {
      setIsCursoSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Cadastro de Disciplinas</Text>
      <Text style={styles.subtitle}>Associe disciplina, docente e informacoes curriculares.</Text>

      <AppInput
        label="Nome da disciplina"
        placeholder="Ex: Programacao Mobile"
        value={fields.nomeDisciplina}
        onChangeText={(value) => updateField('nomeDisciplina', value)}
        error={errors.nomeDisciplina}
      />
      <AppInput
        label="Carga horaria"
        placeholder="Ex: 80"
        keyboardType="numeric"
        value={fields.cargaHoraria}
        onChangeText={(value) => updateField('cargaHoraria', value)}
        error={errors.cargaHoraria}
      />
      {!!selectedProfessor && (
        <Text style={styles.helperText}>Selecionado: {selectedProfessor.nome}</Text>
      )}

      <Text style={styles.sectionLabel}>Cadastro de curso</Text>
      <AppInput
        label="Novo curso"
        placeholder="Ex: Sistemas de Informacao"
        value={novoCurso}
        onChangeText={setNovoCurso}
      />
      <AppButton title="Cadastrar curso" onPress={handleCreateCurso} loading={isCursoSubmitting} variant="secondary" />

      <Text style={styles.sectionLabel}>Curso da disciplina</Text>
      {isCursosLoading ? (
        <Text style={styles.helperText}>Carregando cursos...</Text>
      ) : cursosDisponiveis.length === 0 ? (
        <Text style={styles.helperText}>Cadastre um curso acima para selecionar aqui.</Text>
      ) : (
        <View style={styles.listBox}>
          {cursosDisponiveis.map((curso) => {
            const isSelected = fields.curso === curso;

            return (
              <Pressable
                key={curso}
                onPress={() => updateField('curso', curso)}
                style={({ pressed }) => [
                  styles.listItem,
                  isSelected && styles.listItemSelected,
                  pressed && styles.listItemPressed,
                ]}
              >
                <Text style={styles.listItemTitle}>{curso}</Text>
                <Text style={styles.listItemMeta}>{isSelected ? 'Selecionado' : 'Toque para selecionar'}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {!!selectedCurso && <Text style={styles.helperText}>Curso escolhido: {selectedCurso.nome}</Text>}

      <AppInput
        label="Buscar professor"
        placeholder="Digite o nome"
        value={professorSearch}
        onChangeText={setProfessorSearch}
      />

      {isProfessoresLoading ? (
        <Text style={styles.helperText}>Carregando professores...</Text>
      ) : professoresError ? (
        <Text style={styles.errorInline}>{professoresError}</Text>
      ) : professoresFiltrados.length === 0 ? (
        <Text style={styles.helperText}>Nenhum professor encontrado.</Text>
      ) : (
        <View style={styles.listBox}>
          {professoresFiltrados.map((prof) => {
            const isSelected = String(prof.id) === fields.professorId;

            return (
              <Pressable
                key={prof.id}
                onPress={() => updateField('professorId', String(prof.id))}
                style={({ pressed }) => [
                  styles.listItem,
                  isSelected && styles.listItemSelected,
                  pressed && styles.listItemPressed,
                ]}
              >
                <Text style={styles.listItemTitle}>
                  {prof.nome} (ID: {prof.id})
                </Text>
                <Text style={styles.listItemMeta}>{prof.area}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {!!errors.professorId && <Text style={styles.errorInline}>{errors.professorId}</Text>}

      {!!errors.curso && <Text style={styles.errorInline}>{errors.curso}</Text>}
      <AppInput
        label="Semestre"
        placeholder="Ex: 1"
        keyboardType="numeric"
        value={fields.semestre}
        onChangeText={(value) => updateField('semestre', value)}
        error={errors.semestre}
      />

      <AppButton title="Salvar cadastro" onPress={handleSubmit} loading={isSubmitting} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.lg,
  },
  helperText: {
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    color: theme.colors.text,
    fontWeight: '800',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  errorInline: {
    color: theme.colors.danger,
    marginBottom: theme.spacing.md,
  },
  listBox: {
    marginBottom: theme.spacing.md,
  },
  listItem: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  listItemSelected: {
    borderColor: theme.colors.primary,
  },
  listItemPressed: {
    opacity: 0.85,
  },
  listItemTitle: {
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  listItemMeta: {
    color: theme.colors.mutedText,
  },
});
