/** Honor server throttling without retrying or queuing user writes. */
export class RateLimitCooldown {
  private until = 0;
  private limited: Response | null = null;
  private now: () => number;
  constructor(now: () => number = Date.now) { this.now = now; }
  get active(): boolean { return this.until > this.now(); }
  record(response: Response): void {
    if (response.status !== 429) return;
    const header = response.headers.get("Retry-After");
    const seconds = header && /^\d+(?:\.\d+)?$/.test(header) ? Number(header) : null;
    const date = header ? Date.parse(header) : NaN;
    const delay = seconds !== null ? seconds * 1000
      : Number.isFinite(date) ? Math.max(0, date - this.now()) : 60_000;
    this.until = Math.max(this.until, this.now() + delay);
    this.limited = response.clone();
  }
  response(): Response | null {
    if (!this.active) { this.limited = null; return null; }
    return this.limited?.clone() || null;
  }
}
