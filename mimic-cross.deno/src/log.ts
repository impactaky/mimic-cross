import * as log from "std/log/mod.ts";
import { format } from "std/datetime/mod.ts";
import { config } from "../config/config.ts";

const formatter = (record: log.LogRecord) =>
  `${
    format(record.datetime, "yyyy-MM-dd HH:mm:ss")
  } [${record.levelName}] ${record.msg}`;

await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("WARNING", {
      formatter: formatter,
    }),
    consoleVerbose: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: formatter,
    }),
    file: new log.handlers.RotatingFileHandler("DEBUG", {
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

export let logger = log.getLogger(config.logType);
