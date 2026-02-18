import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/** Chat export PDFs and ZIPs are deleted after this many milliseconds (1 minute). */
export const CHAT_EXPORT_TTL_MS = 1 * 60 * 1000;

const CHAT_EXPORT_DIR_NAME = 'chat-exports';

/**
 * Returns the absolute directory path for chat export PDFs (uploads/chat-exports).
 */
export function getChatExportDir(): string {
  return path.join(process.cwd(), 'uploads', CHAT_EXPORT_DIR_NAME);
}

/**
 * Deterministic key for same eventId + userId (reuse same file, no duplicate PDFs).
 */
export function getChatExportKey(eventId: string, userId: string): string {
  return `${crypto.createHash('sha256').update(`${eventId}|${userId}`).digest('hex').slice(0, 32)}.pdf`;
}

/**
 * Deterministic key for "all users" ZIP for an event (reuse same ZIP if still valid).
 */
export function getChatExportAllUsersKey(eventId: string): string {
  return `all-${crypto.createHash('sha256').update(eventId).digest('hex').slice(0, 24)}.zip`;
}

/**
 * Deterministic key for "my chats" ZIP/PDF for one user in an event (each user gets their own file).
 */
export function getChatExportMyChatsKey(eventId: string, userId: string): string {
  return `my-${crypto.createHash('sha256').update(`${eventId}|${userId}`).digest('hex').slice(0, 24)}.zip`;
}

/**
 * Deterministic key for a single conversation PDF (userId + otherUserId in event).
 */
export function getChatExportConversationKey(eventId: string, userId: string, otherUserId: string): string {
  const ordered = [userId, otherUserId].sort();
  return `conv-${crypto.createHash('sha256').update(`${eventId}|${ordered[0]}|${ordered[1]}`).digest('hex').slice(0, 24)}.pdf`;
}

/**
 * Public URL path for a chat export file (no domain).
 */
export function getChatExportPublicPath(key: string): string {
  return `/uploads/${CHAT_EXPORT_DIR_NAME}/${key}`;
}

/**
 * Ensures the chat export directory exists; returns its path.
 */
export function ensureChatExportDir(): string {
  const dir = getChatExportDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * True if file exists and was modified within TTL (still valid to reuse).
 */
export function isChatExportFileValid(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const stat = fs.statSync(filePath);
  const ageMs = Date.now() - stat.mtimeMs;
  return ageMs < CHAT_EXPORT_TTL_MS;
}

/**
 * Writes the PDF buffer to file and schedules deletion after TTL.
 */
export function writeChatExportPdfAndScheduleDelete(filePath: string, buffer: Buffer): void {
  fs.writeFileSync(filePath, buffer);
  scheduleDeleteAfterTtl(filePath);
}

/**
 * Schedules deletion of a file after TTL. Use for ZIP or any export file.
 */
export function scheduleDeleteAfterTtl(filePath: string): void {
  setTimeout(() => {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // ignore
    }
  }, CHAT_EXPORT_TTL_MS);
}

/**
 * Deletes chat export PDFs older than TTL. Call periodically (e.g. every 60s) from app startup.
 */
export function runChatExportCleanup(): void {
  const dir = getChatExportDir();
  try {
    if (!fs.existsSync(dir)) return;
    const now = Date.now();
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (!f.endsWith('.pdf') && !f.endsWith('.zip')) continue;
      const filePath = path.join(dir, f);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > CHAT_EXPORT_TTL_MS) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Starts the cleanup interval (every 60 seconds). Call once on module init.
 * Lightweight: only lists one small dir and deletes expired PDFs – no impact on server speed.
 */
export function startChatExportCleanupInterval(): void {
  setInterval(runChatExportCleanup, 60 * 1000);
}
