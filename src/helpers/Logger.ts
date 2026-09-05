import colors from "colors";

/**
 * Beautiful, prefix-based logging utility using terminal colors.
 */
export default class Logger {
  /**
   * Log an info message.
   * @param message - The main log message.
   * @param args - Additional optional arguments to log.
   */
  static info(message: string, ...args: any[]): void {
    const timestamp = colors.gray(`[${new Date().toLocaleTimeString()}]`);
    const prefix = colors.cyan("[Info]");
    console.log(`${timestamp} ${prefix} ${message}`, ...args);
  }

  /**
   * Log a success/ok message.
   * @param message - The main success message.
   * @param args - Additional optional arguments to log.
   */
  static success(message: string, ...args: any[]): void {
    const timestamp = colors.gray(`[${new Date().toLocaleTimeString()}]`);
    const prefix = colors.green("[OK]");
    console.log(`${timestamp} ${prefix} ${message}`, ...args);
  }

  /**
   * Log a warning message.
   * @param message - The main warning message.
   * @param args - Additional optional arguments to log.
   */
  static warn(message: string, ...args: any[]): void {
    const timestamp = colors.gray(`[${new Date().toLocaleTimeString()}]`);
    const prefix = colors.yellow("[Warning]");
    console.warn(`${timestamp} ${prefix} ${message}`, ...args);
  }

  /**
   * Log an error message.
   * @param message - The main error message.
   * @param args - Additional optional arguments to log.
   */
  static error(message: string, ...args: any[]): void {
    const timestamp = colors.gray(`[${new Date().toLocaleTimeString()}]`);
    const prefix = colors.red("[Error]");
    console.error(`${timestamp} ${prefix} ${message}`, ...args);
  }
}
