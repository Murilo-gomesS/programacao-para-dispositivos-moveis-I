import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { DashboardCard } from '../components/DashboardCard';
import { ScreenContainer } from '../components/ScreenContainer';
import { MainTabParamList } from '../navigation/types';
import { theme } from '../styles/theme';

type DashboardNavigationProp = BottomTabNavigationProp<MainTabParamList>;

export function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();

  return (
    <ScreenContainer>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Painel Principal</Text>
        <Text style={styles.subtitle}>Selecione uma area para iniciar as operacoes academicas.</Text>
      </View>

      <DashboardCard
        title="Cadastro de Alunos"
        description="Registre dados pessoais e academicos dos estudantes."
        onPress={() => navigation.navigate('Alunos')}
      />
      <DashboardCard
        title="Cadastro de Professores"
        description="Gerencie o quadro docente com dados profissionais."
        onPress={() => navigation.navigate('Professores')}
      />
      <DashboardCard
        title="Cadastro de Disciplinas"
        description="Associe disciplinas, carga horaria e semestre."
        onPress={() => navigation.navigate('Disciplinas')}
      />
      <DashboardCard
        title="Consulta de Boletim"
        description="Visualize desempenho, medias e situacao final."
        onPress={() => navigation.navigate('Boletim')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.mutedText,
    fontSize: 14,
  },
});
