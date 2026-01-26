/**
 * Kotlin/Java Implementation Lens Extension
 * Main entry point
 */

import * as vscode from 'vscode';
import { InterfaceImplementationLensProvider } from './providers/interfaceImplementationLensProvider';
import { MethodImplementationLensProvider } from './providers/methodImplementationLensProvider';
import { ReverseNavigationLensProvider } from './providers/reverseNavigationLensProvider';
import { registerShowImplementationsCommand } from './commands/showImplementations';
import { registerShowMethodImplementationsCommand } from './commands/showMethodImplementations';
import { registerGotoInterfaceCommand } from './commands/gotoInterface';
import { registerClearCacheCommand } from './commands/clearCache';
import { registerOpenSettingsCommand } from './commands/openSettings';
import { registerShowHierarchyCommand } from './commands/showHierarchy';
import { getCacheManager, startCacheCleanup } from './cache/cacheManager';
import { getLogger } from './utils/logger';

// Providers
let interfaceProvider: InterfaceImplementationLensProvider;
let methodProvider: MethodImplementationLensProvider;
let reverseProvider: ReverseNavigationLensProvider;

// Cache cleanup interval
let cacheCleanupInterval: NodeJS.Timeout;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
    const logger = getLogger();
    logger.info('Kotlin/Java Implementation Lens extension activated');

    try {
        // Initialize providers
        interfaceProvider = new InterfaceImplementationLensProvider();
        methodProvider = new MethodImplementationLensProvider();
        reverseProvider = new ReverseNavigationLensProvider();

        // Language selectors
        const kotlinSelector: vscode.DocumentSelector = { language: 'kotlin', scheme: 'file' };
        const javaSelector: vscode.DocumentSelector = { language: 'java', scheme: 'file' };

        // Register CodeLens providers for both Kotlin and Java
        context.subscriptions.push(
            vscode.languages.registerCodeLensProvider(kotlinSelector, interfaceProvider),
            vscode.languages.registerCodeLensProvider(javaSelector, interfaceProvider),
            vscode.languages.registerCodeLensProvider(kotlinSelector, methodProvider),
            vscode.languages.registerCodeLensProvider(javaSelector, methodProvider),
            vscode.languages.registerCodeLensProvider(kotlinSelector, reverseProvider),
            vscode.languages.registerCodeLensProvider(javaSelector, reverseProvider)
        );

        // Register commands
        registerShowImplementationsCommand(context);
        registerShowMethodImplementationsCommand(context);
        registerGotoInterfaceCommand(context);
        registerClearCacheCommand(context);
        registerOpenSettingsCommand(context);
        registerShowHierarchyCommand(context);

        // Register refresh command
        context.subscriptions.push(
            vscode.commands.registerCommand('kotlin-implementation-lens.refresh', () => {
                interfaceProvider.refresh();
                methodProvider.refresh();
                reverseProvider.refresh();
                logger.info('CodeLens refreshed');
            })
        );

        // Watch for configuration changes
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(event => {
                if (event.affectsConfiguration('kotlinImplementationLens')) {
                    logger.info('Configuration changed, refreshing CodeLens');

                    // Update cache timeout if changed
                    const config = vscode.workspace.getConfiguration('kotlinImplementationLens');
                    const cacheTimeout = config.get<number>('cacheTimeout', 300000);
                    getCacheManager().setTTL(cacheTimeout);

                    // Clear cache and refresh
                    getCacheManager().clear();
                    interfaceProvider.refresh();
                    methodProvider.refresh();
                    reverseProvider.refresh();
                }
            })
        );

        // Watch for file changes to invalidate cache
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.{kt,java}');

        context.subscriptions.push(
            watcher.onDidChange(uri => {
                logger.debug(`File changed: ${uri.fsPath}`);
                getCacheManager().invalidateByFile(uri.fsPath);
            }),
            watcher.onDidDelete(uri => {
                logger.debug(`File deleted: ${uri.fsPath}`);
                getCacheManager().invalidateByFile(uri.fsPath);
            }),
            watcher
        );

        // Start cache cleanup
        const config = vscode.workspace.getConfiguration('kotlinImplementationLens');
        const cacheTimeout = config.get<number>('cacheTimeout', 300000);
        getCacheManager().setTTL(cacheTimeout);
        cacheCleanupInterval = startCacheCleanup(getCacheManager(), 60000); // Every minute

        logger.info('Extension initialization complete');

        // Show welcome message (only on first activation)
        const hasShownWelcome = context.globalState.get<boolean>('hasShownWelcome', false);
        if (!hasShownWelcome) {
            vscode.window.showInformationMessage(
                'Kotlin/Java Implementation Lens is now active! Open a Kotlin or Java interface to see CodeLens.',
                'Settings'
            ).then(selection => {
                if (selection === 'Settings') {
                    vscode.commands.executeCommand('kotlin-implementation-lens.openSettings');
                }
            });
            context.globalState.update('hasShownWelcome', true);
        }

    } catch (error) {
        logger.error('Failed to activate extension', error as Error);
        vscode.window.showErrorMessage('Failed to activate Kotlin/Java Implementation Lens');
    }
}

/**
 * Extension deactivation
 */
export function deactivate() {
    const logger = getLogger();
    logger.info('Kotlin/Java Implementation Lens extension deactivated');

    // Clear cache cleanup interval
    if (cacheCleanupInterval) {
        clearInterval(cacheCleanupInterval);
    }

    // Clear cache
    getCacheManager().clear();

    // Dispose logger
    logger.dispose();
}
