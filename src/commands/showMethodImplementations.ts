/**
 * Show Method Implementations Command
 * Displays a quick pick with all implementations of a specific method
 */

import * as vscode from 'vscode';
import { MethodImplementation } from '../types';
import { createLocation } from '../utils/pathUtils';
import { getLogger } from '../utils/logger';

/**
 * Show method implementations in a quick pick
 */
export async function showMethodImplementations(
    interfaceName: string,
    methodName: string,
    implementations: MethodImplementation[]
): Promise<void> {
    if (implementations.length === 0) {
        vscode.window.showInformationMessage(
            `No implementations found for ${interfaceName}.${methodName}()`
        );
        return;
    }

    try {
        // Create quick pick items
        const items = implementations.map(impl => {
            let label = `$(symbol-method) ${impl.className}.${methodName}()`;

            // Add annotation badge if present
            if (impl.annotations && impl.annotations.length > 0) {
                const annotation = impl.annotations[0];
                label += ` [@${annotation}]`;
            }

            const relativePath = vscode.workspace.asRelativePath(impl.filePath);
            const description = `${relativePath}:${impl.lineNumber + 1}`;

            return {
                label,
                description,
                implementation: impl
            };
        });

        // Show quick pick
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: `Select an implementation of ${interfaceName}.${methodName}() (${implementations.length} found)`,
            matchOnDescription: true
        });

        if (selected) {
            // Navigate to selected method implementation
            const location = createLocation(
                selected.implementation.filePath,
                selected.implementation.lineNumber
            );
            await vscode.window.showTextDocument(location.uri, {
                selection: location.range
            });

            getLogger().info(`Navigated to ${selected.implementation.className}.${methodName}()`);
        }

    } catch (error) {
        getLogger().error('Error showing method implementations', error as Error);
        vscode.window.showErrorMessage('Failed to show method implementations');
    }
}

/**
 * Register the command
 */
export function registerShowMethodImplementationsCommand(context: vscode.ExtensionContext): void {
    const command = vscode.commands.registerCommand(
        'kotlin-implementation-lens.showMethodImplementations',
        showMethodImplementations
    );
    context.subscriptions.push(command);
}
