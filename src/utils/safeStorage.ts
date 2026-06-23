class SafeLocalStorage {
  private memStorage: Record<string, string> = {};

  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn("localStorage is blocked or restricted. Using memory fallback for key:", key, e);
      return this.memStorage[key] !== undefined ? this.memStorage[key] : null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn("localStorage is blocked or restricted. Saving in memory fallback for key:", key, e);
      this.memStorage[key] = String(value);
    }
  }

  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn("localStorage is blocked or restricted. Removing from memory fallback for key:", key, e);
      delete this.memStorage[key];
    }
  }

  clear(): void {
    try {
      window.localStorage.clear();
    } catch (e) {
      console.warn("localStorage is blocked or restricted. Clearing memory fallback:", e);
      this.memStorage = {};
    }
  }
}

export const safeLocalStorage = new SafeLocalStorage();
