import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ScreenContainer } from '../components/ScreenContainer';
import { useFormFields } from '../hooks/useFormFields';
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

  const validate = () => {
    const nextErrors: Partial<Record<keyof TeacherForm, string>> = {};

    (Object.entries(fields) as [keyof TeacherForm, string][]).forEach(([field, value]) => {
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

    console.log('Cadastro de professor:', fields);
    Alert.alert('Professor cadastrado', `${fields.nome} foi registrado com sucesso.`);
    resetFields();
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Cadastro de Professores</Text>
      <Text style={styles.subtitle}>Registre o perfil academico e profissional do docente.</Text>

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
      <AppInput
        label="Tempo de docencia"
        placeholder="Ex: 8 anos"
        value={fields.tempoDocencia}
        onChangeText={(value) => updateField('tempoDocencia', value)}
        error={errors.tempoDocencia}
      />
      <AppInput
        label="Email"
        placeholder="professor@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={fields.email}
        onChangeText={(value) => updateField('email', value)}
        error={errors.email}
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
