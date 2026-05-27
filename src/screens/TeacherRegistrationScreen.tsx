import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ScreenContainer } from '../components/ScreenContainer';
import { useFormFields } from '../hooks/useFormFields';
import { createProfessor } from '../services/api';
import { theme } from '../styles/theme';

type TeacherForm = {
  nome: string;
  titulacao: string;
  areaAtuacao: string;
  tempoDocencia: string;
  email: string;
};

export function TeacherRegistrationScreen() {
  const { fields, updateField, resetFields } = useFormFields<TeacherForm>({
    nome: '',
    titulacao: '',
    areaAtuacao: '',
    tempoDocencia: '',
    email: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TeacherForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: Partial<Record<keyof TeacherForm, string>> = {};

    (Object.entries(fields) as [keyof TeacherForm, string][]).forEach(([field, value]) => {
      if (!value.trim()) {
        nextErrors[field] = 'Campo obrigatorio.';
      }
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (fields.email && !emailRegex.test(fields.email)) {
      nextErrors.email = 'Email invalido.';
    }

    const tempo = Number(fields.tempoDocencia);
    if (!Number.isFinite(tempo) || tempo <= 0) {
      nextErrors.tempoDocencia = 'Informe um numero valido.';
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
      await createProfessor({
        nome: fields.nome,
        titulacao: fields.titulacao,
        area: fields.areaAtuacao,
        tempo_docencia: Number(fields.tempoDocencia),
        email: fields.email,
      });
      Alert.alert('Professor cadastrado', `${fields.nome} foi registrado com sucesso.`);
      resetFields();
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel salvar o cadastro do professor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Cadastro de Professores</Text>
        <Text style={styles.subtitle}>Registre o perfil acadêmico e o contato do docente.</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipLabel}>Perfil</Text>
            <Text style={styles.summaryChipValue}>acadêmico</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipLabel}>Contato</Text>
            <Text style={styles.summaryChipValue}>email</Text>
          </View>
        </View>
      </View>

      <View style={styles.formCard}>
        <SectionTitle title="Identificação" subtitle="Dados principais do docente." />
        <AppInput
          label="Nome"
          placeholder="Nome completo"
          value={fields.nome}
          onChangeText={(value) => updateField('nome', value)}
          error={errors.nome}
        />
        <AppInput
          label="Titulacao"
          placeholder="Ex: Mestre, Doutor"
          value={fields.titulacao}
          onChangeText={(value) => updateField('titulacao', value)}
          error={errors.titulacao}
        />
        <AppInput
          label="Area de atuacao"
          placeholder="Ex: Ciencias Exatas"
          value={fields.areaAtuacao}
          onChangeText={(value) => updateField('areaAtuacao', value)}
          error={errors.areaAtuacao}
        />
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <AppInput
              label="Tempo de docencia"
              placeholder="Ex: 8 anos"
              value={fields.tempoDocencia}
              onChangeText={(value) => updateField('tempoDocencia', value)}
              error={errors.tempoDocencia}
            />
          </View>
          <View style={styles.rowItem}>
            <AppInput
              label="Email"
              placeholder="professor@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={fields.email}
              onChangeText={(value) => updateField('email', value)}
              error={errors.email}
            />
          </View>
        </View>

        <AppButton title="Salvar cadastro" onPress={handleSubmit} loading={isSubmitting} />
      </View>
    </ScreenContainer>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
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
  summaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  summaryChip: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
  },
  summaryChipLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    marginBottom: 2,
  },
  summaryChipValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  sectionBlock: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  sectionSubtitle: {
    color: theme.colors.mutedText,
    marginTop: 2,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
});
