import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ScreenContainer } from '../components/ScreenContainer';
import { useFormFields } from '../hooks/useFormFields';
import { createDisciplina, fetchProfessores, ProfessorListItem } from '../services/api';
import { theme } from '../styles/theme';

type SubjectForm = {
  nomeDisciplina: string;
  cargaHoraria: string;
  professorId: string;
  curso: string;
  semestre: string;
};

export function SubjectRegistrationScreen() {
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

  useEffect(() => {
    let isMounted = true;

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
      Alert.alert('Disciplina cadastrada', `${fields.nomeDisciplina} foi registrada.`);
      resetFields();
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel salvar o cadastro da disciplina.');
    } finally {
      setIsSubmitting(false);
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
      <AppInput
        label="ID do professor"
        placeholder="Selecione abaixo ou digite"
        keyboardType="numeric"
        value={fields.professorId}
        onChangeText={(value) => updateField('professorId', value)}
        error={errors.professorId}
      />

      {!!selectedProfessor && (
        <Text style={styles.helperText}>Selecionado: {selectedProfessor.nome}</Text>
      )}

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
      <AppInput
        label="Curso"
        placeholder="Ex: Sistemas de Informacao"
        value={fields.curso}
        onChangeText={(value) => updateField('curso', value)}
        error={errors.curso}
      />
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
