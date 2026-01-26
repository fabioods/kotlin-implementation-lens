/**
 * Clear Cache Command
 * Clears all cached search results
 */

import * as vscode from 'vscode';
import { getCacheManager } from '../cache/cacheManager';
import { getLogger } from '../utils/logger';

/**
 * Clear all caches
 */
export async function clearCache(): Promise<void> {
    try {
        const cacheManager = getCacheManager();
        const stats = cacheManager.getStats();

        cacheManager.clear();

        getLogger().info('Cache cleared by user');
        vscode.window.showInformationMessage(
            `Cache cleared (${stats.total} entries removed)`
        );

        // Refresh all CodeLens
        vscode.commands.executeCommand('kotlin-implementation-lens.refresh');

    } catch (error) {
        getLogger().error('Error clearing cache', error as Error);
        vscode.window.showErrorMessage('Failed to clear cache');
    }
}

/**
 * Register the command
 */
export function registerClearCacheCommand(context: vscode.ExtensionContext): void {
    const command = vscode.commands.registerCommand(
        'kotlin-implementation-lens.clearCache',
        clearCache
    );
    context.subscriptions.push(command);
}
