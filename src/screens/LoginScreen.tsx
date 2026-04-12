import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useFormFields } from '../hooks/useFormFields';
import { fakeLogin } from '../services/authService';
import { theme } from '../styles/theme';

type LoginErrors = {
  emailOrLogin?: string;
  password?: string;
};

export function LoginScreen() {
  const { login } = useAuth();
  const [errors, setErrors] = useState<LoginErrors>({});
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { fields, updateField } = useFormFields({
    emailOrLogin: '',
    password: '',
  });

  const validate = () => {
    const nextErrors: LoginErrors = {};

    if (!fields.emailOrLogin.trim()) {
      nextErrors.emailOrLogin = 'Informe seu email ou login.';
    }

    if (!fields.password.trim()) {
      nextErrors.password = 'Informe sua senha.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setAuthError('');

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const authenticated = await fakeLogin(fields);

      if (!authenticated) {
        setAuthError('Credenciais invalidas. Use admin@email.com e senha 123.');
        return;
      }

      Alert.alert('Sucesso', 'Login realizado com sucesso.');
      login();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.wrapper}>
        <Text style={styles.title}>App Scholar</Text>
        <Text style={styles.subtitle}>Acesse para gerenciar alunos, docentes e disciplinas.</Text>

        <View style={styles.formCard}>
          <AppInput
            label="Email ou login"
            placeholder="admin@email.com"
            autoCapitalize="none"
            value={fields.emailOrLogin}
            onChangeText={(value) => {
              updateField('emailOrLogin', value);
              setErrors((current) => ({ ...current, emailOrLogin: undefined }));
            }}
            error={errors.emailOrLogin}
          />

          <AppInput
            label="Senha"
            placeholder="Digite sua senha"
            secureTextEntry
            value={fields.password}
            onChangeText={(value) => {
              updateField('password', value);
              setErrors((current) => ({ ...current, password: undefined }));
            }}
            error={errors.password}
          />

          {!!authError && <Text style={styles.authError}>{authError}</Text>}

          <AppButton title="Entrar" onPress={handleSubmit} loading={isLoading} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.mutedText,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  authError: {
    color: theme.colors.danger,
    marginBottom: theme.spacing.sm,
    fontSize: 13,
  },
});
