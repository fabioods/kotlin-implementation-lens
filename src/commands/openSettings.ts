/**
 * Open Settings Command
 * Opens the extension settings
 */

import * as vscode from 'vscode';
import { getLogger } from '../utils/logger';

/**
 * Open extension settings
 */
export async function openSettings(): Promise<void> {
    try {
        await vscode.commands.executeCommand(
            'workbench.action.openSettings',
            'kotlinImplementationLens'
        );
        getLogger().info('Opened extension settings');
    } catch (error) {
        getLogger().error('Error opening settings', error as Error);
        vscode.window.showErrorMessage('Failed to open settings');
    }
}

/**
 * Register the command
 */
export function registerOpenSettingsCommand(context: vscode.ExtensionContext): void {
    const command = vscode.commands.registerCommand(
        'kotlin-implementation-lens.openSettings',
        openSettings
    );
    context.subscriptions.push(command);
}
