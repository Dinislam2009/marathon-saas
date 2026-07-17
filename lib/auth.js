import { getItem, setItem, removeItem } from "./storage";
import { generateId } from "./id";
import { claimInvitationsForUser } from "./data";

// Same Phase-1/Phase-2 split as lib/data.js: everything here runs on
// localStorage today. In Phase 2 this whole file gets replaced by real
// calls (NextAuth/Firebase Auth/your own API route) — the function
// names below are written so the pages calling them barely have to
// change when that happens.

const USERS_KEY = "auth_users";
const SESSION_KEY = "auth_session";
const PENDING_OTP_KEY = "auth_pending_otp";
const OTP_TTL_MS = 5 * 60 * 1000;

function readUsers() {
  return getItem(USERS_KEY, []);
}
function writeUsers(list) {
  setItem(USERS_KEY, list);
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function findUserByIdentifier(identifier) {
  const value = identifier.trim().toLowerCase();
  return (
    readUsers().find(
      (u) => u.email.toLowerCase() === value || u.phone === identifier.trim()
    ) || null
  );
}

// Creates an unverified user + a fresh OTP. Returns the plaintext code
// too — ONLY so the UI can show a "demo mode" hint, since no real SMS/
// WhatsApp provider is wired up yet. Remove that once smsc.kz is live.
export function registerUser(fields) {
  const users = readUsers();
  const user = {
    id: generateId("user"),
    firstName: fields.firstName,
    lastName: fields.lastName,
    email: fields.email,
    phone: fields.phone,
    password: fields.password, // demo only — plaintext. Phase 2: hash server-side.
    verified: false,
    createdAt: new Date().toISOString(),
  };
  writeUsers([...users, user]);

  const code = generateCode();
  setItem(PENDING_OTP_KEY, {
    userId: user.id,
    phone: user.phone,
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
  });

  return { user, devCode: code };
}

export function getPendingOtp() {
  return getItem(PENDING_OTP_KEY, null);
}

export function resendOtp(userId, phone) {
  const code = generateCode();
  setItem(PENDING_OTP_KEY, { userId, phone, code, expiresAt: Date.now() + OTP_TTL_MS });
  return code;
}

export function verifyOtp(userId, code) {
  const pending = getItem(PENDING_OTP_KEY, null);
  if (!pending || pending.userId !== userId) {
    return { ok: false, error: "Сессия мерзімі өтіп кетті. Қайта тіркеліңіз." };
  }
  if (Date.now() > pending.expiresAt) {
    return { ok: false, error: "Кодтың мерзімі бітті. Жаңа код сұраңыз." };
  }
  if (pending.code !== code) {
    return { ok: false, error: "Код қате. Қайта тексеріп көріңіз." };
  }

  writeUsers(readUsers().map((u) => (u.id === userId ? { ...u, verified: true } : u)));
  removeItem(PENDING_OTP_KEY);
  setItem(SESSION_KEY, { userId, loggedInAt: new Date().toISOString() });

  // If an organizer/mentor already added this email or phone as an
  // invite, grant that role right now instead of leaving the account
  // roleless.
  const user = getUser(userId);
  const granted = user ? claimInvitationsForUser(user) : [];

  return { ok: true, granted };
}

export function loginUser(identifier, password) {
  const user = findUserByIdentifier(identifier);
  if (!user) return { ok: false, error: "Бұндай қолданушы табылмады." };
  if (!user.verified) return { ok: false, error: "Аккаунт әлі расталмаған." };
  if (user.password !== password) return { ok: false, error: "Құпия сөз қате." };

  setItem(SESSION_KEY, { userId: user.id, loggedInAt: new Date().toISOString() });
  return { ok: true, user };
}

export function getSession() {
  return getItem(SESSION_KEY, null);
}

export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return readUsers().find((u) => u.id === session.userId) || null;
}

export function getUser(userId) {
  return readUsers().find((u) => u.id === userId) || null;
}

export function logout() {
  removeItem(SESSION_KEY);
}
