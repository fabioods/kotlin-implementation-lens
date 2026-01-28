/**
 * Logger utility for extension output
 */

import * as vscode from 'vscode';
import { ILogger } from '../types';

export class Logger implements ILogger {
    private outputChannel: vscode.OutputChannel;

    constructor(channelName: string = 'Kotlin/Java Implementation Lens') {
        this.outputChannel = vscode.window.createOutputChannel(channelName);
    }

    info(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[INFO ${timestamp}] ${message}`);
    }

    warn(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[WARN ${timestamp}] ${message}`);
    }

    error(message: string, error?: Error): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[ERROR ${timestamp}] ${message}`);
        if (error) {
            this.outputChannel.appendLine(`  ${error.message}`);
            if (error.stack) {
                this.outputChannel.appendLine(`  ${error.stack}`);
            }
        }
    }

    debug(message: string, error?: Error): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[DEBUG ${timestamp}] ${message}`);
        if (error) {
            this.outputChannel.appendLine(`  ${error.message}`);
        }
    }

    show(): void {
        this.outputChannel.show();
    }

    dispose(): void {
        this.outputChannel.dispose();
    }
}

// Global logger instance
let globalLogger: Logger | null = null;

export function getLogger(): Logger {
    if (!globalLogger) {
        globalLogger = new Logger();
    }
    return globalLogger;
}

export function setLogger(logger: Logger): void {
    globalLogger = logger;
}
