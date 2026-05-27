import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ScreenContainer } from '../components/ScreenContainer';
import { useFormFields } from '../hooks/useFormFields';
import { createAluno } from '../services/api';
import {
  fetchCidadesIbge,
  fetchEnderecoByCep,
  fetchEstadosIbge,
  IbgeCidade,
  IbgeEstado,
} from '../services/externalApis';
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

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) {
    return digits;
  }

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (rest.length <= 4) {
    return `(${ddd}) ${rest}`;
  }

  if (rest.length <= 8) {
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }

  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [estados, setEstados] = useState<IbgeEstado[]>([]);
  const [cidades, setCidades] = useState<IbgeCidade[]>([]);
  const [isCidadeLoading, setIsCidadeLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadEstados = async () => {
      try {
        const data = await fetchEstadosIbge();
        if (isMounted) {
          setEstados(data);
        }
      } catch (error) {
        Alert.alert('Atencao', 'Nao foi possivel carregar a lista de estados.');
      }
    };

    loadEstados();

    return () => {
      isMounted = false;
    };
  }, []);

  const validate = () => {
    const nextErrors: Partial<Record<keyof StudentForm, string>> = {};

    (Object.entries(fields) as [keyof StudentForm, string][]).forEach(([field, value]) => {
      if (!value.trim()) {
        nextErrors[field] = 'Campo obrigatorio.';
      }
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (fields.email && !emailRegex.test(fields.email)) {
      nextErrors.email = 'Email invalido.';
    }

    const matriculaDigits = onlyDigits(fields.matricula);
    if (matriculaDigits.length < 3) {
      nextErrors.matricula = 'Matricula invalida.';
    }

    const cepDigits = onlyDigits(fields.cep);
    if (cepDigits.length !== 8) {
      nextErrors.cep = 'CEP invalido.';
    }

    const phoneDigits = onlyDigits(fields.telefone);
    if (phoneDigits.length < 10) {
      nextErrors.telefone = 'Telefone invalido.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCepLookup = async () => {
    if (!fields.cep.trim()) {
      return;
    }

    try {
      setIsCepLoading(true);
      const endereco = await fetchEnderecoByCep(fields.cep);
      updateField('endereco', endereco.logradouro || fields.endereco);
      updateField('cidade', endereco.localidade || fields.cidade);
      updateField('estado', endereco.uf || fields.estado);
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel buscar o endereco pelo CEP.');
    } finally {
      setIsCepLoading(false);
    }
  };

  const handleEstadoLookup = async () => {
    const uf = fields.estado.trim().toUpperCase();
    if (uf.length !== 2) {
      return;
    }

    try {
      setIsCidadeLoading(true);
      const data = await fetchCidadesIbge(uf);
      setCidades(data);
    } catch (error) {
      Alert.alert('Atencao', 'Nao foi possivel carregar as cidades do estado.');
    } finally {
      setIsCidadeLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    const estadoValido =
      !estados.length || estados.some((estado) => estado.sigla === fields.estado.toUpperCase());

    if (!estadoValido) {
      setErrors((current) => ({ ...current, estado: 'UF invalida.' }));
      return;
    }

    if (
      cidades.length > 0 &&
      !cidades.some((cidade) => cidade.nome.toLowerCase() === fields.cidade.toLowerCase())
    ) {
      setErrors((current) => ({ ...current, cidade: 'Cidade invalida.' }));
      return;
    }

    try {
      setIsSubmitting(true);
      await createAluno({
        nome: fields.nome,
        matricula: onlyDigits(fields.matricula),
        curso: fields.curso,
        email: fields.email,
        telefone: onlyDigits(fields.telefone),
        cep: onlyDigits(fields.cep),
        endereco: fields.endereco,
        cidade: fields.cidade,
        estado: fields.estado.trim().toUpperCase(),
      });
      Alert.alert('Aluno cadastrado', `Dados enviados com sucesso.\n${fields.nome} (${fields.matricula})`);
      resetFields();
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel salvar o cadastro do aluno.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Cadastro de Alunos</Text>
        <Text style={styles.subtitle}>Registre estudantes com dados pessoais e contato atualizados.</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipLabel}>Dados</Text>
            <Text style={styles.summaryChipValue}>pessoais</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipLabel}>Busca</Text>
            <Text style={styles.summaryChipValue}>CEP/UF</Text>
          </View>
        </View>
      </View>

      <View style={styles.formCard}>
        <SectionTitle title="Identificação" subtitle="Campos principais do estudante." />
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
          keyboardType="numeric"
          onChangeText={(value) => updateField('matricula', onlyDigits(value).slice(0, 30))}
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
          onChangeText={(value) => updateField('telefone', formatPhone(value))}
          error={errors.telefone}
        />

        <SectionTitle title="Endereco" subtitle="Preencha manualmente ou use a busca pelo CEP." />
        <AppInput
          label="CEP"
          placeholder="00000-000"
          keyboardType="numeric"
          value={fields.cep}
          onChangeText={(value) => updateField('cep', formatCep(value))}
          error={errors.cep}
          onBlur={handleCepLookup}
        />
        <AppButton
          title={isCepLoading ? 'Buscando CEP...' : 'Buscar endereco pelo CEP'}
          onPress={handleCepLookup}
          loading={isCepLoading}
          variant="secondary"
        />
        <AppInput
          label="Endereco"
          placeholder="Rua, numero"
          value={fields.endereco}
          onChangeText={(value) => updateField('endereco', value)}
          error={errors.endereco}
        />
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <AppInput
              label="Cidade"
              placeholder="Cidade"
              value={fields.cidade}
              onChangeText={(value) => updateField('cidade', value)}
              error={errors.cidade}
            />
          </View>
          <View style={styles.rowItemSmall}>
            <AppInput
              label="Estado"
              placeholder="UF"
              value={fields.estado}
              onChangeText={(value) => updateField('estado', value.toUpperCase().slice(0, 2))}
              error={errors.estado}
              onBlur={handleEstadoLookup}
            />
          </View>
        </View>

        {isCidadeLoading && <Text style={styles.helperText}>Carregando cidades...</Text>}

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
  helperText: {
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  rowItemSmall: {
    width: 92,
  },
});
