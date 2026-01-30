import { namehash, normalize } from 'viem/ens';

export function getNamehash(name: string): `0x${string}` {
  return namehash(normalize(name));
}

export function formatEnsName(name: string): string {
  try {
    return normalize(name);
  } catch {
    return name;
  }
}

export function isValidEnsName(name: string): boolean {
  try {
    normalize(name);
    return name.includes('.');
  } catch {
    return false;
  }
}
