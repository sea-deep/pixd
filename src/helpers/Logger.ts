export default class Logger {
  static info(message: string, ...details: unknown[]): void {
    console.info(`[INFO] ${message}`, ...details);
  }

  static success(message: string, ...details: unknown[]): void {
    console.info(`[OK] ${message}`, ...details);
  }

  static warn(message: string, ...details: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...details);
  }

  static error(message: string, ...details: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...details);
  }
}
