import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ReportCardScreen } from '../screens/ReportCardScreen';
import { StudentRegistrationScreen } from '../screens/StudentRegistrationScreen';
import { SubjectRegistrationScreen } from '../screens/SubjectRegistrationScreen';
import { TeacherRegistrationScreen } from '../screens/TeacherRegistrationScreen';
import { theme } from '../styles/theme';
import { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.text },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedText,
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 8 },
        tabBarIcon: ({ color, size }) => {
          const iconByRoute: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Dashboard: 'home-outline',
            Alunos: 'school-outline',
            Professores: 'people-outline',
            Disciplinas: 'book-outline',
            Boletim: 'document-text-outline',
          };

          return <Ionicons name={iconByRoute[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Alunos" component={StudentRegistrationScreen} options={{ title: 'Alunos' }} />
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
      <Tab.Screen name="Boletim" component={ReportCardScreen} options={{ title: 'Boletim' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated } = useAuth();

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
