const os = require('os');
const { spawn } = require('child_process');

function isPrivateIpv4(address) {
  if (!address) return false;
  if (address.startsWith('10.')) return true;
  if (address.startsWith('192.168.')) return true;

  const m = address.match(/^172\.(\d+)\./);
  if (m) {
    const second = Number(m[1]);
    return second >= 16 && second <= 31;
  }

  return false;
}

function pickLanIpv4() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(nets)) {
    const list = nets[name] || [];

    for (const net of list) {
      if (!net) continue;
      if (net.family !== 'IPv4') continue;
      if (net.internal) continue;

      candidates.push({ name, address: net.address });
    }
  }

  const privateCandidates = candidates.filter((c) => isPrivateIpv4(c.address));
  if (privateCandidates.length > 0) {
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
