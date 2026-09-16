/** Session-scoped shared reads: deduplicate requests and never cache failures. */
export class SessionReadCache {
  version = 0;
  private snapshots = new Map<string, { response: Response; loadedAt: number }>();
  private requests = new Map<string, Promise<Response>>();

  clear(): void {
    this.version++;
    this.snapshots.clear();
    this.requests.clear();
  }

  async get(key: string, ttl: number, load: () => Promise<Response>): Promise<Response> {
    const snapshot = this.snapshots.get(key);
    if (snapshot && Date.now() - snapshot.loadedAt < ttl) return snapshot.response.clone();
    let request = this.requests.get(key);
    if (!request) {
      const version = this.version;
      request = load().then(response => {
        if (version === this.version && (response.ok || response.status === 404)) {
          this.snapshots.set(key, { response: response.clone(), loadedAt: Date.now() });
        }
        return response;
      }).finally(() => {
        if (this.requests.get(key) === request) this.requests.delete(key);
      });
      this.requests.set(key, request);
    }
    return (await request).clone();
  }
}
