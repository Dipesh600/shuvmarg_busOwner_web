export interface CachedFile {
    key: string;
    blob: Blob;
    expiresAt: number;
    storedAt: number;
}
export interface FileStore {
    get(key: string): Promise<CachedFile | undefined>;
    put(file: CachedFile): Promise<void>;
    clear(): Promise<void>;
}
const MAX_BYTES = 128 * 1024 * 1024;
export const FILE_TTL = 30 * 60000;
export function accountScope(token: string | null): string | null {
    try {
        if (!token)
            return null;
        const payload = JSON.parse(atob(token.split(".")[1].replaceAll("-", "+").replaceAll("_", "/"))) as {
            id?: string;
            role?: string;
            activeRole?: string;
            exp?: number;
        };
        if (typeof payload.id !== "string" || !payload.id || typeof payload.role !== "string" || !payload.role || typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now())
            return null;
        return `${payload.id}:${payload.activeRole || payload.role}`;
    }
    catch {
        return null;
    }
}
function request<T>(operation: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => { operation.onsuccess = () => resolve(operation.result); operation.onerror = () => reject(operation.error); });
}
export class IndexedFileStore implements FileStore {
    private database: Promise<IDBDatabase> | null = null;
    private open() {
        if (!this.database)
            this.database = new Promise<IDBDatabase>((resolve, reject) => {
                const opening = indexedDB.open("vehicle-document-files-v1", 1);
                opening.onupgradeneeded = () => opening.result.createObjectStore("files", { keyPath: "key" });
                opening.onsuccess = () => resolve(opening.result);
                opening.onerror = () => { this.database = null; reject(opening.error); };
            });
        return this.database;
    }
    async get(key: string) { const db = await this.open(); return request<CachedFile | undefined>(db.transaction("files").objectStore("files").get(key)); }
    async put(file: CachedFile) {
        const db = await this.open();
        const existing = await request<CachedFile[]>(db.transaction("files").objectStore("files").getAll());
        const transaction = db.transaction("files", "readwrite"), files = transaction.objectStore("files");
        let bytes = file.blob.size;
        for (const row of existing.sort((a, b) => b.storedAt - a.storedAt)) {
            if (row.key === file.key)
                continue;
            if (row.expiresAt <= Date.now() || bytes + row.blob.size > MAX_BYTES)
                files.delete(row.key);
            else
                bytes += row.blob.size;
        }
        files.put(file);
        await new Promise<void>((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error); });
    }
    async clear() { const db = await this.open(); const transaction = db.transaction("files", "readwrite"); transaction.objectStore("files").clear(); await new Promise<void>((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error); }); }
}
export class DocumentBlobCache {
    private memory = new Map<string, CachedFile>();
    private pending = new Map<string, Promise<Blob>>();
    private generation = 0;
    private clearing = Promise.resolve();
    private channel: BroadcastChannel | null = null;
    private store: FileStore;
    private clock: () => number;
    constructor(store: FileStore = new IndexedFileStore(), clock: () => number = Date.now) {
        this.store = store;
        this.clock = clock;
        if (typeof window !== "undefined" && typeof window.BroadcastChannel === "function") {
            this.channel = new window.BroadcastChannel("vehicle-document-cache");
            this.channel.onmessage = () => this.clear(false);
        }
    }
    clear(broadcast = true): void {
        if (broadcast)
            this.channel?.postMessage("clear");
        this.generation++;
        this.memory.clear();
        this.pending.clear();
        this.clearing = this.clearing.then(() => this.store.clear()).catch(() => undefined);
        if (typeof window !== "undefined")
            window.dispatchEvent(new Event("vehicle-documents-cleared"));
    }
    async get(scope: string, path: string, version: string | null, load: () => Promise<Blob>): Promise<Blob> {
        if (!scope)
            throw new Error("Sign in to view vehicle documents.");
        const key = JSON.stringify([scope, path, version]), generation = this.generation;
        await this.clearing;
        const assertCurrent = () => { if (generation !== this.generation)
            throw new Error("Session changed. Reopen the vehicle documents."); };
        assertCurrent();
        const snapshot = version ? this.memory.get(key) : undefined;
        if (snapshot && snapshot.expiresAt > this.clock())
            return snapshot.blob;
        let pending = this.pending.get(key);
        if (!pending) {
            pending = (async () => {
                const stored = version ? await this.store.get(key).catch(() => undefined) : undefined;
                assertCurrent();
                if (stored && stored.expiresAt > this.clock()) {
                    this.remember(stored);
                    return stored.blob;
                }
                const blob = await load();
                assertCurrent();
                if (!blob.size || !(blob.type.startsWith("image/") && blob.type !== "image/svg+xml" || blob.type === "application/pdf" || blob.type === "video/mp4"))
                    throw new Error("This file could not be previewed safely.");
                if (version && blob.size <= (blob.type === "video/mp4" ? 50_000_000 : 20 * 1024 * 1024)) {
                    const file = { key, blob, storedAt: this.clock(), expiresAt: this.clock() + FILE_TTL };
                    this.remember(file);
                    // Serialize writes and logout clears so a late write cannot restore a signed-out session.
                    const writing = this.clearing.then(() => { assertCurrent(); return this.store.put(file); });
                    this.clearing = writing.catch(() => undefined);
                    await writing.catch(() => undefined);
                    assertCurrent();
                }
                return blob;
            })().finally(() => { if (this.pending.get(key) === pending)
                this.pending.delete(key); });
            this.pending.set(key, pending);
        }
        return pending;
    }
    private remember(file: CachedFile) {
        this.memory.delete(file.key);
        this.memory.set(file.key, file);
        let bytes = [...this.memory.values()].reduce((sum, row) => sum + row.blob.size, 0);
        for (const [key, row] of this.memory) {
            if (row.expiresAt <= this.clock() || bytes > MAX_BYTES) {
                bytes -= row.blob.size;
                this.memory.delete(key);
            }
        }
    }
}
export const documentBlobCache = new DocumentBlobCache();
