const os = require('os');
const { spawn } = require('child_process');

function isPrivateIpv4(address) {
  if (!address) return false;
  if (address.startsWith('10.')) return true;
  if (address.startsWith('192.168.')) return true;

  const match = address.match(/^172\.(\d+)\./);
  if (match) {
    const second = Number(match[1]);
    return second >= 16 && second <= 31;
  }

  return false;
}

function isPreferredAdapterName(name) {
  const normalized = String(name || '').toLowerCase();
  return (
    normalized.includes('ethernet') ||
    normalized.includes('wi-fi') ||
    normalized.includes('wifi') ||
    normalized.includes('wireless')
  );
}

function isExcludedAdapterName(name) {
  const normalized = String(name || '').toLowerCase();
  return (
    normalized.includes('wsl') ||
    normalized.includes('loopback') ||
    normalized.includes('virtual') ||
    normalized.includes('vmware') ||
    normalized.includes('hyper-v') ||
    normalized.includes('vethernet')
  );
}

function pickLanIpv4() {
  const explicitHost =
    process.env.EXPO_HOST_IP ||
    process.env.REACT_NATIVE_PACKAGER_HOSTNAME ||
    process.env.EXPO_PACKAGER_HOSTNAME;

  if (explicitHost && isPrivateIpv4(explicitHost)) {
    return explicitHost;
  }

  const nets = os.networkInterfaces();
  const candidates = [];

  for (const [name, list] of Object.entries(nets)) {
    if (isExcludedAdapterName(name)) continue;

    for (const net of list || []) {
      if (!net) continue;
      if (net.family !== 'IPv4') continue;
      if (net.internal) continue;

      candidates.push({
        name,
        address: net.address,
        preferred: isPreferredAdapterName(name),
        is192: net.address.startsWith('192.168.'),
        is172: /^172\.(\d+)\./.test(net.address),
      });
    }
  }

  const privateCandidates = candidates.filter((c) => isPrivateIpv4(c.address));
  if (privateCandidates.length > 0) {
    privateCandidates.sort((a, b) => {
      if (a.preferred !== b.preferred) return a.preferred ? -1 : 1;
      if (a.is192 !== b.is192) return a.is192 ? -1 : 1;
      if (a.is172 !== b.is172) return a.is172 ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    return privateCandidates[0].address;
  }

  return candidates[0]?.address || null;
}

function parseArgs(argv) {
  const args = { port: 8081, clear: false };

  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];

    if (item === '--port') {
      const next = argv[i + 1];
      const port = Number(next);
      if (!Number.isNaN(port) && port > 0) {
        args.port = port;
      }
      i += 1;
      continue;
    }

    if (item === '--clear' || item === '-c') {
      args.clear = true;
    }
  }

  return args;
}

const { port, clear } = parseArgs(process.argv.slice(2));
const host = pickLanIpv4();

if (host) {
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = host;
  process.env.EXPO_PACKAGER_HOSTNAME = host;
  process.env.EXPO_HOST_IP = host;
  console.log(`[expoStartLan] Host LAN detectado: ${host}`);
} else {
  console.warn('[expoStartLan] Nao foi possivel detectar IP LAN; usando comportamento padrao do Expo.');
}

const expoArgs = ['expo', 'start', '--lan', '--port', String(port)];
if (clear) {
  expoArgs.push('-c');
}

const isWindows = process.platform === 'win32';

const child = spawn(
  isWindows ? 'cmd.exe' : 'npx',
  isWindows ? ['/d', '/s', '/c', 'npx', ...expoArgs] : expoArgs,
  {
    stdio: 'inherit',
    env: process.env,
  },
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
