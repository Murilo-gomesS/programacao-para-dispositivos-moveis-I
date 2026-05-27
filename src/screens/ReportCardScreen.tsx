import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Alert } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { fetchBoletim } from '../services/api';
import { theme } from '../styles/theme';

type ReportCardItem = {
  nome: string;
  nota1: number;
  nota2: number;
  media: number;
  situacao: 'Aprovado' | 'Reprovado';
};

export function ReportCardScreen() {
  const { user } = useAuth();
  const [records, setRecords] = useState<ReportCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [matricula, setMatricula] = useState(user?.matricula || '2024001');

  const isAluno = user?.perfil === 'Aluno' && !!user?.matricula;

  const handleMatriculaChange = (value: string) => {
    if (isAluno) {
      return;
    }

    setMatricula(value.replace(/\D/g, '').slice(0, 30));
  };

  useEffect(() => {
    if (isAluno && user?.matricula) {
      setMatricula(user.matricula);
    }
  }, [isAluno, user?.matricula]);

  const handleFetch = async () => {
    if (!matricula.trim()) {
      Alert.alert('Atencao', 'Informe a matricula do aluno.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetchBoletim(matricula.trim());
      setRecords(response.disciplinas || []);
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel carregar o boletim.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Boletim Escolar</Text>
      <Text style={styles.subtitle}>Resumo de desempenho por disciplina.</Text>

      <AppInput
        label="Matricula"
        placeholder="000000"
        value={matricula}
        keyboardType="numeric"
        onChangeText={handleMatriculaChange}
        editable={!isAluno}
      />
      <AppButton title="Buscar boletim" onPress={handleFetch} loading={isLoading} />

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando boletim...</Text>
        </View>
      ) : records.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma disciplina encontrada.</Text>
      ) : (
        records.map((item) => (
          <View key={item.nome} style={styles.recordCard}>
            <Text style={styles.discipline}>{item.nome}</Text>
            <Text style={styles.meta}>Nota 1: {item.nota1.toFixed(1)}</Text>
            <Text style={styles.meta}>Nota 2: {item.nota2.toFixed(1)}</Text>
            <Text style={styles.meta}>Media: {item.media.toFixed(2)}</Text>
            <Text
              style={[
                styles.status,
                item.situacao === 'Aprovado' ? styles.statusApproved : styles.statusFailed,
              ]}
            >
              {item.situacao}
            </Text>
          </View>
        ))
      )}
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
  loadingBox: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.mutedText,
  },
  emptyText: {
    color: theme.colors.mutedText,
    marginTop: theme.spacing.lg,
  },
  recordCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  discipline: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  meta: {
    color: theme.colors.mutedText,
    marginBottom: 4,
  },
  status: {
    marginTop: theme.spacing.sm,
    fontWeight: '700',
  },
  statusApproved: {
    color: theme.colors.success,
  },
  statusFailed: {
    color: theme.colors.danger,
  },
});
