// One Euro filter: smooths jittery signals without adding lag on fast movement.
// Casiez, Roussel & Vogel (2012). minCutoff lowers jitter; beta lowers lag.
export class OneEuro {
  private x: number | null = null;
  private dx = 0;
  private last = 0;
  constructor(private minCutoff = 1.0, private beta = 0.02, private dCutoff = 1.0) {}

  private alpha(cutoff: number, dt: number) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  filter(value: number, tMs: number) {
    if (this.x === null) {
      this.x = value;
      this.last = tMs;
      return value;
    }
    const dt = Math.max((tMs - this.last) / 1000, 1e-3);
    this.last = tMs;
    const rawDx = (value - this.x) / dt;
    this.dx = this.dx + this.alpha(this.dCutoff, dt) * (rawDx - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x = this.x + this.alpha(cutoff, dt) * (value - this.x);
    return this.x;
  }
}
