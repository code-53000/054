import { openDB, type IDBPDatabase } from 'idb';
import type { SavedCircuit } from '@/types/circuit';

const DB_NAME = 'circuit-designer-db';
const STORE_NAME = 'circuits';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveCircuit(circuit: SavedCircuit): Promise<void> {
  const db = await getDB();
  const now = Date.now();
  const toSave: SavedCircuit = {
    ...circuit,
    updatedAt: now,
    createdAt: circuit.createdAt || now,
  };
  await db.put(STORE_NAME, toSave);
}

export async function loadCircuit(id: string): Promise<SavedCircuit | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function listCircuits(): Promise<SavedCircuit[]> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteCircuit(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}
