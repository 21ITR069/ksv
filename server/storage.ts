// Storage is not used in this Firebase-based application
// All data operations are handled directly through Firebase SDK
// This file is kept for compatibility with the server template structure

export interface IStorage {
  // Firebase handles all storage operations
}

export class MemStorage implements IStorage {
  constructor() {
    // No-op - Firebase handles storage
  }
}

export const storage = new MemStorage();
