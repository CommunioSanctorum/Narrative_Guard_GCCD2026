import type { CustomStatusField, CustomStatusValue, Project } from '@/app/types';

export type InventoryItem = { id: string; name: string; quantity: number };
export type GameState = { location: string; health: number; maxHealth: number; gold: number; inventory: InventoryItem[]; customStats: Record<string, CustomStatusValue> };
export type InventoryChange = { action: 'acquire' | 'add' | 'use' | 'consume' | 'remove'; id?: string; name: string; quantity: number };
export type StateProposal = Partial<Omit<GameState, 'inventory' | 'customStats'>> & { inventory?: InventoryItem[]; inventoryChanges?: InventoryChange[]; customStats?: Record<string, CustomStatusValue> };
export type StateHistoryEntry = { index: number; previousHash: string; hash: string; state: GameState; reason: string; accepted: boolean; proposal?: unknown };

export function normalizeGameState(raw: unknown, fallbackLocation = '알 수 없음'): GameState {
  const value = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const maxCandidate = Number(value.maxHealth);
  const maxHealth = Number.isFinite(maxCandidate) ? Math.min(100000, Math.max(1, Math.floor(maxCandidate))) : 100;
  const healthCandidate = Number(value.health);
  const health = Number.isFinite(healthCandidate) ? Math.min(maxHealth, Math.max(0, Math.floor(healthCandidate))) : maxHealth;
  const goldCandidate = Number(value.gold);
  const gold = Number.isFinite(goldCandidate) ? Math.min(1000000000, Math.max(0, Math.floor(goldCandidate))) : 0;
  const inventory: InventoryItem[] = Array.isArray(value.inventory) ? value.inventory.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const item = entry as Record<string, unknown>;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const quantity = Number(item.quantity);
    if (!name || !Number.isInteger(quantity) || quantity < 1 || quantity > 100000) return [];
    const rawId = typeof item.id === 'string' ? item.id.trim() : '';
    const fallbackId = `item-${index}-${name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-')}`;
    return [{ id: rawId || fallbackId, name, quantity }];
  }) : [];
  const customStats: Record<string, CustomStatusValue> = {};
  if (value.customStats && typeof value.customStats === 'object' && !Array.isArray(value.customStats)) {
    for (const [key, item] of Object.entries(value.customStats as Record<string, unknown>)) {
      if (typeof item === 'string' || typeof item === 'boolean' || (typeof item === 'number' && Number.isFinite(item))) customStats[key] = item;
    }
  }
  return { location: typeof value.location === 'string' && value.location.trim() ? value.location.trim() : fallbackLocation, health, maxHealth, gold, inventory, customStats };
}

export function getInitialGameState(project: Project, fallbackLocation = '알 수 없음'): GameState {
  const state = normalizeGameState(project.settings.initialGameState, fallbackLocation);
  const customStats: Record<string, CustomStatusValue> = {};
  for (const field of project.settings.customStatusFields ?? []) {
    const candidate = state.customStats[field.key];
    const valid = field.type === 'number'
      ? typeof candidate === 'number' && Number.isFinite(candidate) && (field.min === undefined || candidate >= field.min) && (field.max === undefined || candidate <= field.max)
      : field.type === 'boolean' ? typeof candidate === 'boolean' : typeof candidate === 'string';
    customStats[field.key] = valid ? candidate : field.initialValue;
  }
  state.customStats = customStats;
  return state;
}

function canonicalState(state: GameState): GameState {
  return normalizeGameState(state, state.location);
}
async function sha256(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
function payload(entry: Omit<StateHistoryEntry, 'hash'>): string {
  return JSON.stringify({ index: entry.index, previousHash: entry.previousHash, state: canonicalState(entry.state), reason: entry.reason, accepted: entry.accepted, proposal: entry.proposal ?? null });
}
export async function appendStateHistory(history: StateHistoryEntry[], state: GameState, reason: string, accepted = true, proposal?: unknown): Promise<StateHistoryEntry[]> {
  const previousHash = history.length ? history[history.length - 1].hash : 'GENESIS';
  const entry: Omit<StateHistoryEntry, 'hash'> = { index: history.length, previousHash, state: canonicalState(state), reason, accepted, ...(proposal === undefined ? {} : { proposal }) };
  return [...history, { ...entry, hash: await sha256(payload(entry)) }];
}
export async function createInitialStateHistory(state: GameState): Promise<StateHistoryEntry[]> {
  return appendStateHistory([], state, 'initial state');
}
export async function verifyStateHistory(history: StateHistoryEntry[]): Promise<{ valid: boolean; reason?: string }> {
  if (!Array.isArray(history) || history.length === 0) return { valid: false, reason: 'empty history' };
  let previousHash = 'GENESIS';
  for (let index = 0; index < history.length; index++) {
    const entry = history[index];
    if (!entry || entry.index !== index || entry.previousHash !== previousHash) return { valid: false, reason: `chain mismatch at ${index}` };
    const { hash, ...rest } = entry;
    if (await sha256(payload(rest)) !== hash) return { valid: false, reason: `hash mismatch at ${index}` };
    previousHash = hash;
  }
  return { valid: true };
}

export function validateStateProposal(current: GameState, proposal: StateProposal | undefined, validLocations: Set<string>, fields: CustomStatusField[] = []): { valid: boolean; state: GameState; reason?: string } {
  if (proposal === undefined || proposal === null || Object.keys(proposal).length === 0) return { valid: true, state: canonicalState(current) };
  if (typeof proposal !== 'object' || Array.isArray(proposal)) return { valid: false, state: current, reason: 'proposal must be an object' };
  const next: GameState = { ...canonicalState(current), inventory: current.inventory.map((item) => ({ ...item })), customStats: { ...current.customStats } };
  if (proposal.customStats !== undefined) {
    if (!proposal.customStats || typeof proposal.customStats !== 'object' || Array.isArray(proposal.customStats)) return { valid: false, state: current, reason: 'invalid customStats' };
    const fieldMap = new Map(fields.map((field) => [field.key, field]));
    for (const [key, value] of Object.entries(proposal.customStats)) {
      const field = fieldMap.get(key);
      if (!field) return { valid: false, state: current, reason: `unknown custom status: ${key}` };
      const valid = field.type === 'number'
        ? typeof value === 'number' && Number.isFinite(value) && (field.min === undefined || value >= field.min) && (field.max === undefined || value <= field.max)
        : field.type === 'boolean' ? typeof value === 'boolean' : typeof value === 'string' && value.length <= 500;
      if (!valid) return { valid: false, state: current, reason: `invalid custom status value: ${key}` };
      next.customStats[key] = value;
    }
  }
  if (proposal.location !== undefined) {
    if (typeof proposal.location !== 'string' || !proposal.location.trim() || !validLocations.has(proposal.location.trim().toLocaleLowerCase())) return { valid: false, state: current, reason: 'unknown location' };
    next.location = proposal.location.trim();
  }
  if (proposal.maxHealth !== undefined) {
    if (!Number.isInteger(proposal.maxHealth) || proposal.maxHealth < 1 || proposal.maxHealth > 100000) return { valid: false, state: current, reason: 'invalid maxHealth' };
    next.maxHealth = proposal.maxHealth;
    next.health = Math.min(next.health, next.maxHealth);
  }
  if (proposal.health !== undefined) {
    if (!Number.isInteger(proposal.health) || proposal.health < 0 || proposal.health > next.maxHealth) return { valid: false, state: current, reason: 'invalid health' };
    next.health = proposal.health;
  }
  if (proposal.gold !== undefined) {
    if (!Number.isInteger(proposal.gold) || proposal.gold < 0 || proposal.gold > 1000000000) return { valid: false, state: current, reason: 'invalid gold' };
    next.gold = proposal.gold;
  }
  if (proposal.inventory !== undefined && proposal.inventoryChanges !== undefined) return { valid: false, state: current, reason: 'inventory and inventoryChanges cannot be combined' };
  if (proposal.inventory !== undefined) {
    if (!Array.isArray(proposal.inventory)) return { valid: false, state: current, reason: 'invalid inventory' };
    const seen = new Set<string>();
    const nextInventory: InventoryItem[] = [];
    for (const raw of proposal.inventory) {
      if (!raw || typeof raw.name !== 'string' || !raw.name.trim() || !Number.isInteger(raw.quantity) || raw.quantity < 1 || raw.quantity > 100000) return { valid: false, state: current, reason: 'invalid inventory item' };
      const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : raw.name.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-') || 'item';
      if (seen.has(id)) return { valid: false, state: current, reason: 'duplicate inventory id' };
      seen.add(id); nextInventory.push({ id, name: raw.name.trim(), quantity: raw.quantity });
    }
    next.inventory = nextInventory;
  }
  if (proposal.inventoryChanges !== undefined) {
    if (!Array.isArray(proposal.inventoryChanges)) return { valid: false, state: current, reason: 'invalid inventoryChanges' };
    for (const change of proposal.inventoryChanges) {
      if (!change || typeof change.name !== 'string' || !change.name.trim() || !Number.isInteger(change.quantity) || change.quantity < 1 || change.quantity > 100000) return { valid: false, state: current, reason: 'invalid inventory operation' };
      const name = change.name.trim();
      const idx = next.inventory.findIndex((item) => change.id ? item.id === change.id : item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
      if (change.action === 'acquire' || change.action === 'add') {
        if (idx >= 0) {
          const total = next.inventory[idx].quantity + change.quantity;
          if (total > 100000) return { valid: false, state: current, reason: 'inventory quantity limit exceeded' };
          next.inventory[idx] = { ...next.inventory[idx], quantity: total };
        } else {
          const id = change.id?.trim() || name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-') || `item-${next.inventory.length}`;
          if (next.inventory.some((item) => item.id === id)) return { valid: false, state: current, reason: 'duplicate inventory id' };
          next.inventory.push({ id, name, quantity: change.quantity });
        }
      } else if (change.action === 'use' || change.action === 'consume' || change.action === 'remove') {
        if (idx < 0 || next.inventory[idx].quantity < change.quantity) return { valid: false, state: current, reason: 'item missing or insufficient quantity' };
        next.inventory[idx].quantity -= change.quantity;
        if (next.inventory[idx].quantity === 0) next.inventory.splice(idx, 1);
      } else return { valid: false, state: current, reason: 'unknown inventory action' };
    }
  }
  return { valid: true, state: next };
}
