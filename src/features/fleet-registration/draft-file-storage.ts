import type { FleetFiles } from "./types";

const DB_NAME = "shuvmarg_fleet_draft_files_v2";
const STORE_NAME = "draft_files";
const DB_VERSION = 1;

interface StoredFileRecord {
  id: string; // `${draftId}:${slotKey}`
  draftId: string;
  slotKey: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  blob: Blob;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not available"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("draftId", "draftId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function fileToRecord(draftId: string, slotKey: string, file: File): StoredFileRecord {
  return {
    id: `${draftId}:${slotKey}`,
    draftId,
    slotKey,
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    blob: file.slice(0, file.size, file.type),
  };
}

function recordToFile(record: StoredFileRecord): File {
  return new File([record.blob], record.name, {
    type: record.type,
    lastModified: record.lastModified,
  });
}

export async function saveDraftFiles(draftId: string, files: FleetFiles): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // Flatten slots
    const slots: { key: string; file: File | null }[] = [
      { key: "photos.front", file: files.photos.front },
      { key: "photos.rear", file: files.photos.rear },
      { key: "photos.side", file: files.photos.side },
      { key: "photos.cabin", file: files.photos.cabin },
      { key: "fitnessCert", file: files.fitnessCert },
      { key: "insurance", file: files.insurance },
      { key: "bluebook", file: files.bluebook },
      { key: "routePermit", file: files.routePermit },
    ];

    for (const { key, file } of slots) {
      const recordId = `${draftId}:${key}`;
      if (file && typeof file !== "string" && typeof file.slice === "function") {
        store.put(fileToRecord(draftId, key, file));
      } else if (typeof file !== "string") {
        store.delete(recordId);
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Failed to persist draft files in IndexedDB:", err);
  }
}

export async function loadDraftFiles(draftId: string): Promise<FleetFiles> {
  const result: FleetFiles = {
    photos: { front: null, rear: null, side: null, cabin: null },
    fitnessCert: null,
    insurance: null,
    bluebook: null,
    routePermit: null,
  };

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("draftId");
    const request = index.getAll(IDBKeyRange.only(draftId));

    const records: StoredFileRecord[] = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    for (const record of records) {
      const file = recordToFile(record);
      if (record.slotKey === "photos.front") result.photos.front = file;
      else if (record.slotKey === "photos.rear") result.photos.rear = file;
      else if (record.slotKey === "photos.side") result.photos.side = file;
      else if (record.slotKey === "photos.cabin") result.photos.cabin = file;
      else if (record.slotKey === "fitnessCert") result.fitnessCert = file;
      else if (record.slotKey === "insurance") result.insurance = file;
      else if (record.slotKey === "bluebook") result.bluebook = file;
      else if (record.slotKey === "routePermit") result.routePermit = file;
    }
  } catch (err) {
    console.warn("Failed to read draft files from IndexedDB:", err);
  }

  return result;
}

export async function deleteDraftFiles(draftId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("draftId");
    const request = index.getAllKeys(IDBKeyRange.only(draftId));

    request.onsuccess = () => {
      const keys = request.result || [];
      for (const key of keys) {
        store.delete(key);
      }
    };

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Failed to delete draft files from IndexedDB:", err);
  }
}
