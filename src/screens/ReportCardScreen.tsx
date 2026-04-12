import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { ReportCardItem, reportCardMock } from '../services/mockData';
import { theme } from '../styles/theme';

export function ReportCardScreen() {
  const [records, setRecords] = useState<ReportCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simula carregamento inicial de dados vindo de uma API.
    const timeout = setTimeout(() => {
      setRecords(reportCardMock);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Boletim Escolar</Text>
      <Text style={styles.subtitle}>Resumo de desempenho por disciplina.</Text>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando boletim...</Text>
        </View>
      ) : (
        records.map((item) => (
          <View key={item.disciplina} style={styles.recordCard}>
            <Text style={styles.discipline}>{item.disciplina}</Text>
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
