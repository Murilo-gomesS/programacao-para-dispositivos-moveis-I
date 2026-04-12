import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ScreenContainer } from '../components/ScreenContainer';
import { useFormFields } from '../hooks/useFormFields';
import { theme } from '../styles/theme';

type StudentForm = {
  nome: string;
  matricula: string;
  curso: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  cidade: string;
  estado: string;
};

export function StudentRegistrationScreen() {
  const { fields, updateField, resetFields } = useFormFields<StudentForm>({
    nome: '',
    matricula: '',
    curso: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: '',
    cidade: '',
    estado: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof StudentForm, string>>>({});

  const validate = () => {
    const nextErrors: Partial<Record<keyof StudentForm, string>> = {};

    (Object.entries(fields) as [keyof StudentForm, string][]).forEach(([field, value]) => {
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

    console.log('Cadastro de aluno:', fields);
    Alert.alert('Aluno cadastrado', `Dados enviados com sucesso.\n${fields.nome} (${fields.matricula})`);
    resetFields();
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Cadastro de Alunos</Text>
      <Text style={styles.subtitle}>Preencha todos os dados para registrar um novo estudante.</Text>

      <AppInput
        label="Nome"
        placeholder="Nome completo"
        value={fields.nome}
        onChangeText={(value) => updateField('nome', value)}
        error={errors.nome}
      />
      <AppInput
        label="Matricula"
        placeholder="000000"
        value={fields.matricula}
        onChangeText={(value) => updateField('matricula', value)}
        error={errors.matricula}
      />
      <AppInput
        label="Curso"
        placeholder="Ex: Engenharia de Software"
        value={fields.curso}
        onChangeText={(value) => updateField('curso', value)}
        error={errors.curso}
      />
      <AppInput
        label="Email"
        placeholder="aluno@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={fields.email}
        onChangeText={(value) => updateField('email', value)}
        error={errors.email}
      />
      <AppInput
        label="Telefone"
        placeholder="(00) 00000-0000"
        keyboardType="phone-pad"
        value={fields.telefone}
        onChangeText={(value) => updateField('telefone', value)}
        error={errors.telefone}
      />
      <AppInput
        label="CEP"
        placeholder="00000-000"
        keyboardType="numeric"
        value={fields.cep}
        onChangeText={(value) => updateField('cep', value)}
        error={errors.cep}
      />
      <AppInput
        label="Endereco"
        placeholder="Rua, numero"
        value={fields.endereco}
        onChangeText={(value) => updateField('endereco', value)}
        error={errors.endereco}
      />
      <AppInput
        label="Cidade"
        placeholder="Cidade"
        value={fields.cidade}
        onChangeText={(value) => updateField('cidade', value)}
        error={errors.cidade}
      />
      <AppInput
        label="Estado"
        placeholder="UF"
        value={fields.estado}
        onChangeText={(value) => updateField('estado', value)}
        error={errors.estado}
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
