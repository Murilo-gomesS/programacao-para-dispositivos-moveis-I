import axios from 'axios';

const http = axios.create({
  timeout: 8000,
});

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { ts: number; data: unknown }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setCached(key: string, data: unknown) {
  cache.set(key, { ts: Date.now(), data });
}

export type ViaCepResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export async function fetchEnderecoByCep(cep: string, signal?: AbortSignal) {
  try {
    const normalizedCep = cep.replace(/\D/g, '');
    if (normalizedCep.length !== 8) {
      throw new Error('CEP invalido.');
    }

    const cacheKey = `viacep:${normalizedCep}`;
    const cached = getCached<ViaCepResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await http.get<ViaCepResponse>(
      `https://viacep.com.br/ws/${normalizedCep}/json/`,
      { signal },
    );

    if (response.data.erro) {
      throw new Error('CEP nao encontrado.');
    }

    setCached(cacheKey, response.data);
    return response.data;
  } catch (error) {
    throw new Error('Falha ao consultar o ViaCEP.');
  }
}

export type IbgeEstado = {
  id: number;
  sigla: string;
  nome: string;
};

export type IbgeCidade = {
  id: number;
  nome: string;
};

export async function fetchEstadosIbge() {
  try {
    const cacheKey = 'ibge:estados';
    const cached = getCached<IbgeEstado[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await http.get<IbgeEstado[]>(
      'https://servicodados.ibge.gov.br/api/v1/localidades/estados',
    );

    const data = response.data.sort((a, b) => a.nome.localeCompare(b.nome));
    setCached(cacheKey, data);
    return data;
  } catch (error) {
    throw new Error('Falha ao consultar estados no IBGE.');
  }
}

export async function fetchCidadesIbge(uf: string, signal?: AbortSignal) {
  try {
    const normalizedUf = uf.trim().toUpperCase();
    if (normalizedUf.length !== 2) {
      throw new Error('UF invalida.');
    }

    const cacheKey = `ibge:cidades:${normalizedUf}`;
    const cached = getCached<IbgeCidade[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await http.get<IbgeCidade[]>(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${normalizedUf}/municipios`,
      { signal },
    );

    const data = response.data.sort((a, b) => a.nome.localeCompare(b.nome));
    setCached(cacheKey, data);
    return data;
  } catch (error) {
    throw new Error('Falha ao consultar cidades no IBGE.');
  }
}
