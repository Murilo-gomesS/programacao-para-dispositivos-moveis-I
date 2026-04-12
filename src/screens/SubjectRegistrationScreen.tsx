import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ScreenContainer } from '../components/ScreenContainer';
import { useFormFields } from '../hooks/useFormFields';
import { theme } from '../styles/theme';

type SubjectForm = {
  nomeDisciplina: string;
  cargaHoraria: string;
  professorResponsavel: string;
  curso: string;
  semestre: string;
};

export function SubjectRegistrationScreen() {
  const { fields, updateField, resetFields } = useFormFields<SubjectForm>({
    nomeDisciplina: '',
    cargaHoraria: '',
    professorResponsavel: '',
    curso: '',
    semestre: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SubjectForm, string>>>({});

  const validate = () => {
    const nextErrors: Partial<Record<keyof SubjectForm, string>> = {};

    (Object.entries(fields) as [keyof SubjectForm, string][]).forEach(([field, value]) => {
      if (!value.trim()) {
        nextErrors[field] = 'Campo obrigatorio.';
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    console.log('Cadastro de disciplina:', fields);
    Alert.alert('Disciplina cadastrada', `${fields.nomeDisciplina} foi registrada.`);
    resetFields();
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
        label="Professor responsavel"
        placeholder="Nome do docente"
        value={fields.professorResponsavel}
        onChangeText={(value) => updateField('professorResponsavel', value)}
        error={errors.professorResponsavel}
      />
      <AppInput
        label="Curso"
        placeholder="Ex: Sistemas de Informacao"
        value={fields.curso}
        onChangeText={(value) => updateField('curso', value)}
        error={errors.curso}
      />
      <AppInput
        label="Semestre"
        placeholder="Ex: 2026.1"
        value={fields.semestre}
        onChangeText={(value) => updateField('semestre', value)}
        error={errors.semestre}
      />

      <AppButton title="Salvar cadastro" onPress={handleSubmit} />
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
});
