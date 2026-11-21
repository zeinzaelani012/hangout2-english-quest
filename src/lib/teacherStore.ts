// PHASE 12 — teacher-owned stores: the roster, identity matching, the gate
// session and the teacher's release name.
//
// THE CURTAIN, NOT A LOCK (Part G): there is no login and no server. The gate
// exists so a learner flipping through the menu does not land on assessment
// data and release buttons. The code is stored HASHED because a plain-text
// code teaches the wrong habit — not because this is security.

import { damerauLevenshtein } from './normalise';

// ── Roster (Part C.1) ─────────────────────────────────────────────────────────

export interface RosterEntry {
  id: string;
  name: string;
  class: string;
  addedAt: number;
  /** Sample entries come from the fixture and clear with the imported data. */
  sample?: boolean;
}

const ROSTER_KEY = 'h2eq.roster.v1';

export function loadRoster(): RosterEntry[] {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (raw) return JSON.parse(raw) as RosterEntry[];
  } catch { /* corrupt — start clean */ }
  return [];
}

export function saveRoster(entries: RosterEntry[]): void {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(entries));
  } catch { /* storage full */ }
}

/** Stable slug of the normalised name — the roster entry's id. */
export function nameSlug(name: string): string {
  return normaliseName(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'learner';
}

export function addRosterEntry(name: string, className = ''): RosterEntry {
  const roster = loadRoster();
  const existing = roster.find(r => r.id === nameSlug(name));
  if (existing) {
    if (className && existing.class !== className) {
      existing.class = className;
      saveRoster(roster);
    }
    return existing;
  }
  const entry: RosterEntry = { id: nameSlug(name), name: name.trim(), class: className, addedAt: Date.now() };
  roster.push(entry);
  saveRoster(roster);
  return entry;
}

export function removeRosterEntry(id: string): void {
  saveRoster(loadRoster().filter(r => r.id !== id));
}

// ── Normalisation + matching (Part C.2) ───────────────────────────────────────

/** Trim, collapse whitespace, lowercase, strip a trailing full stop, unify
 * curly apostrophes, remove diacritics. Applied on READ only — records are
 * immutable evidence and are never rewritten. */
export function normaliseName(name: string): string {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2019\u2018]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\.+$/, '');
}

export interface IdentityMatch {
  /** The resolved roster entry, or null when unmatched. */
  entry: RosterEntry | null;
  /** True when the raw name IS the roster name (no fuzzy step involved). */
  exact: boolean;
  /** True when a link record resolved this raw name. */
  linked: boolean;
}

/**
 * Matching, applied on read:
 *   exact normalised match → that learner
 *   stored link            → that learner (the teacher decided once)
 *   anything else          → null — never auto-merged on a near-match
 */
export function matchIdentity(rawName: string, roster: RosterEntry[], links: Record<string, string>): IdentityMatch {
  const norm = normaliseName(rawName);
  const byId = new Map(roster.map(r => [r.id, r]));
  for (const entry of roster) {
    if (normaliseName(entry.name) === norm) return { entry, exact: true, linked: false };
  }
  const linkedId = links[rawName] ?? links[norm];
  if (linkedId) {
    const entry = byId.get(linkedId) ?? null;
    if (entry) return { entry, exact: false, linked: true };
  }
  return { entry: null, exact: false, linked: false };
}

/** Near-match proposals — shown for a one-click link, NEVER applied
 * automatically (Part J rule 2). Two signals qualify: edit distance ≤ 2 on
 * the normalised names, or a clean PREFIX match ("aisyah" of "Aisyah Nur
 * Fadhilah" — a 12-year-old typing fast truncates, she does not transpose). */
export function proposeLinks(rawName: string, roster: RosterEntry[]): RosterEntry[] {
  const norm = normaliseName(rawName);
  if (!norm) return [];
  return roster.filter(entry => {
    const target = normaliseName(entry.name);
    if (target === norm) return false; // that is an exact match, not a proposal
    const d = damerauLevenshtein(norm, target);
    if (d <= 2) return true;
    return target.startsWith(norm) || norm.startsWith(target);
  });
}

// ── Identity links (Part C.2.5) ───────────────────────────────────────────────

const LINKS_KEY = 'h2eq.identity.links.v1';

export function loadLinks(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LINKS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch { /* corrupt */ }
  return {};
}

export function saveLink(rawName: string, rosterId: string): void {
  const links = loadLinks();
  links[rawName] = rosterId;
  links[normaliseName(rawName)] = rosterId; // both spellings resolve next time
  try {
    localStorage.setItem(LINKS_KEY, JSON.stringify(links));
  } catch { /* storage full */ }
}

// ── The gate (Part G) ─────────────────────────────────────────────────────────

const GATE_KEY = 'h2eq.teacher.gate.v1';
const SESSION_KEY = 'h2eq.teacher.session.v1';
const TEACHER_KEY = 'h2eq.teacher.v1';
const IDLE_MS = 20 * 60 * 1000;

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Store the code hashed. Migration: a legacy plain-text settings.teacherPin
 * is hashed into the gate on first unlock and then cleared from settings. */
export async function setGateCode(code: string): Promise<void> {
  const hash = await sha256Hex(`h2eq-gate:${code}`);
  localStorage.setItem(GATE_KEY, JSON.stringify({ hash, updatedAt: Date.now() }));
}

export async function gateCodeMatches(code: string): Promise<boolean> {
  const raw = localStorage.getItem(GATE_KEY);
  let hash: string | null = null;
  if (raw) {
    try {
      hash = (JSON.parse(raw) as { hash: string }).hash ?? null;
    } catch { hash = null; }
  }
  if (!hash) {
    // First run — adopt the given code as the gate (the Settings default).
    await setGateCode(code);
    return true;
  }
  return (await sha256Hex(`h2eq-gate:${code}`)) === hash;
}

export interface TeacherSession {
  unlockedAt: number;
  lastActivity: number;
}

const sessionKey = () => `h2eq.teacher.session.v1:${window.location.pathname}`;

export function unlockSession(): void {
  const session: TeacherSession = { unlockedAt: Date.now(), lastActivity: Date.now() };
  try {
    sessionStorage.setItem(sessionKey(), JSON.stringify(session));
  } catch { /* private mode */ }
}

export function touchSession(): void {
  const session = readSession();
  if (session) {
    session.lastActivity = Date.now();
    try {
      sessionStorage.setItem(sessionKey(), JSON.stringify(session));
    } catch { /* private mode */ }
  }
}

function readSession(): TeacherSession | null {
  try {
    const raw = sessionStorage.getItem(sessionKey());
    if (!raw) return null;
    const session = JSON.parse(raw) as TeacherSession;
    if (Date.now() - session.lastActivity > IDLE_MS) {
      sessionStorage.removeItem(sessionKey());
      return null; // 20 minutes idle — the session ends itself
    }
    return session;
  } catch {
    return null;
  }
}

/** Session ends when the tab closes (sessionStorage) or after 20 idle minutes. */
export function isSessionUnlocked(): boolean {
  return readSession() !== null;
}

export function lockSession(): void {
  try {
    sessionStorage.removeItem(sessionKey());
  } catch { /* ignore */ }
}

// ── The teacher's release name (Part E3) ──────────────────────────────────────

export function getTeacherName(): string {
  try {
    const raw = localStorage.getItem(TEACHER_KEY);
    if (raw) return (JSON.parse(raw) as { name: string }).name ?? '';
  } catch { /* ignore */ }
  return '';
}

export function setTeacherName(name: string): void {
  try {
    localStorage.setItem(TEACHER_KEY, JSON.stringify({ name: name.trim(), savedAt: Date.now() }));
  } catch { /* storage full */ }
}
