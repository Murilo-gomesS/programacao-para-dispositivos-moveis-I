type AuthCredentials = {
  emailOrLogin: string;
  password: string;
};

const MOCK_USER = {
  emailOrLogin: 'admin@email.com',
  password: '123',
};

export async function fakeLogin({ emailOrLogin, password }: AuthCredentials): Promise<boolean> {
  // Simula latencia de rede para reproduzir comportamento real de API.
  await new Promise((resolve) => setTimeout(resolve, 600));

  const hasValidCredential =
    emailOrLogin.trim().toLowerCase() === MOCK_USER.emailOrLogin && password.trim() === MOCK_USER.password;

  return hasValidCredential;
}
