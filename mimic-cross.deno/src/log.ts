import * as log from "std/log/mod.ts";
import { format } from "std/datetime/mod.ts";
import { config } from "../config/config.ts";

const formatter = (record: log.LogRecord) =>
  `${
    format(record.datetime, "yyyy-MM-dd HH:mm:ss")
  } [${record.levelName}] ${record.msg}`;

await log.setup({
  handlers: {
    console: new log.ConsoleHandler("WARNING", {
      formatter: formatter,
    }),
    consoleVerbose: new log.ConsoleHandler("DEBUG", {
      formatter: formatter,
    }),
    file: new log.RotatingFileHandler("DEBUG", {
      maxBytes: 1024 * 1024 * 10,
      maxBackupCount: 10,
      filename: config.logFile,
      formatter: formatter,
    }),
  },
  loggers: {
    default: {
      level: "INFO",
      handlers: ["file"],
    },
    cli: {
      level: "INFO",
      handlers: ["console", "file"],
    },
    verbose: {
      level: "INFO",
      handlers: ["consoleVerbose", "file"],
    },
    debug: {
      level: "DEBUG",
      handlers: ["consoleVerbose", "file"],
    },
  },
});

class mimicLogger {
  #logger: log.Logger;
  #mode: string;
  constructor(mode: string) {
    this.#logger = log.getLogger(mode);
    this.#mode = mode;
  }
  get mode() {
    return this.#mode;
  }
  set mode(mode: string) {
    this.#logger = log.getLogger(mode);
    this.#mode = mode;
  }
  debug(...args: Parameters<log.Logger["debug"]>) {
    this.#logger.debug(...args);
  }
  info(...args: Parameters<log.Logger["info"]>) {
    this.#logger.info(...args);
  }
  warning(...args: Parameters<log.Logger["warning"]>) {
    this.#logger.warn(...args);
  }
  error(...args: Parameters<log.Logger["error"]>) {
    this.#logger.error(...args);
  }
}

if (Deno.env.get("MIMIC_CROSS_DEBUG") === "1") {
  config.logMode = "debug";
}
export const logger = new mimicLogger(config.logMode);
