import * as fs from "fs"

export enum LogLevel {
    Info = 0,
    Warn = 1,
    Error = 2,
    Debug = 3
}

export default class Log {
    private static _instance: Log
    private _logFile: string
    private _logLevel: number

    private constructor() {
        this._logFile = ""
        this._logLevel = LogLevel.Debug
    }

    public static get instance(): Log {
        if (!Log._instance) {
            Log._instance = new Log()
        }
        return Log._instance
    }

    public setLogFile(logFile: string) {
        this._logFile = logFile
    }

    public setLogLevel(logLevel: LogLevel) {
        this._logLevel = logLevel
    }

    public log(type: LogLevel, message: string) {
        if (type > this._logLevel) {
            return
        }

        switch (type) {
            case LogLevel.Info:
                console.log(message)
                break
            case LogLevel.Warn:
                console.warn(message)
                break
            case LogLevel.Error:
                console.error(message)
                break
            case LogLevel.Debug:
                console.debug(message)
                break
        }

        if (this._logFile !== "") {
            let date = new Date()
            let dateString = date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })
            let timeString = date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
            let logString = `${dateString} ${timeString} ${type} ${message}`
            fs.appendFileSync(this._logFile, logString + "\n")
        }
    }

    info(message: string) {
        this.log(LogLevel.Info, message)
    }

    warn(message: string) {
        this.log(LogLevel.Warn, message)
    }

    error(message: string) {
        this.log(LogLevel.Error, message)
    }

    debug(message: string) {
        this.log(LogLevel.Debug, message)
    }       
}