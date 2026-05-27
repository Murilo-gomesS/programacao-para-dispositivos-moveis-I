import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AdminDataScreen } from '../screens/AdminDataScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ReportCardScreen } from '../screens/ReportCardScreen';
import { VisualizationScreen } from '../screens/VisualizationScreen';
import { StudentRegistrationScreen } from '../screens/StudentRegistrationScreen';
import { SubjectRegistrationScreen } from '../screens/SubjectRegistrationScreen';
import { TeacherRegistrationScreen } from '../screens/TeacherRegistrationScreen';
import { theme } from '../styles/theme';
import { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabsNavigator() {
  const { user, logout } = useAuth();
  const perfil = user?.perfil;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.text },
        headerRight: () => (
          <Pressable onPress={logout} style={styles.headerRightButton}>
            <Text style={styles.headerRightText}>Sair</Text>
          </Pressable>
        ),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedText,
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 8 },
        tabBarIcon: ({ color, size }) => {
          const iconByRoute: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Dashboard: 'home-outline',
            Dados: 'list-outline',
            Alunos: 'school-outline',
            Professores: 'people-outline',
            Disciplinas: 'book-outline',
            Visualizacao: 'eye-outline',
            Boletim: 'document-text-outline',
          };

          return <Ionicons name={iconByRoute[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Inicio' }} />
      {perfil === 'Administrador' ? (
        <>
          <Tab.Screen name="Dados" component={AdminDataScreen} options={{ title: 'Dados' }} />
          <Tab.Screen
            name="Alunos"
            component={StudentRegistrationScreen}
            options={{ title: 'Alunos' }}
          />
          <Tab.Screen
            name="Professores"
            component={TeacherRegistrationScreen}
            options={{ title: 'Professores' }}
          />
          <Tab.Screen
            name="Disciplinas"
            component={SubjectRegistrationScreen}
            options={{ title: 'Disciplinas' }}
          />
        </>
      ) : null}

      {perfil === 'Professor' || perfil === 'Aluno' ? (
        <Tab.Screen name="Visualizacao" component={VisualizationScreen} options={{ title: 'Visualizacao' }} />
      ) : null}
      <Tab.Screen name="Boletim" component={ReportCardScreen} options={{ title: 'Boletim' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  headerRightButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  headerRightText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});
