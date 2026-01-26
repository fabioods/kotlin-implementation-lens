/**
 * Show Implementations Command
 * Displays a quick pick with all implementations of an interface
 */

import * as vscode from 'vscode';
import { Implementation, ImplementationQuickPickItem } from '../types';
import { createLocation } from '../utils/pathUtils';
import { getLogger } from '../utils/logger';

/**
 * Show implementations in a quick pick
 */
export async function showImplementations(
    interfaceName: string,
    implementations: Implementation[]
): Promise<void> {
    if (implementations.length === 0) {
        vscode.window.showInformationMessage(`No implementations found for ${interfaceName}`);
        return;
    }

    try {
        // Create quick pick items
        const items: ImplementationQuickPickItem[] = implementations.map(impl => {
            let label = `$(symbol-class) ${impl.className}`;

            // Add annotation badge if present
            if (impl.annotations && impl.annotations.length > 0) {
                const annotation = impl.annotations[0]; // Show first annotation
                label += ` [@${annotation}]`;
            }

            // Add data class badge
            if (impl.isDataClass) {
                label += ' (data)';
            }

            // Add delegation badge
            if (impl.usesDelegation) {
                label += ' (by delegation)';
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
            placeHolder: `Select an implementation of ${interfaceName} (${implementations.length} found)`,
            matchOnDescription: true
        });

        if (selected) {
            // Navigate to selected implementation
            const location = createLocation(
                selected.implementation.filePath,
                selected.implementation.lineNumber
            );
            await vscode.window.showTextDocument(location.uri, {
                selection: location.range
            });

            getLogger().info(`Navigated to ${selected.implementation.className}`);
        }

    } catch (error) {
        getLogger().error('Error showing implementations', error as Error);
        vscode.window.showErrorMessage('Failed to show implementations');
    }
}

/**
 * Register the command
 */
export function registerShowImplementationsCommand(context: vscode.ExtensionContext): void {
    const command = vscode.commands.registerCommand(
        'kotlin-implementation-lens.showImplementations',
        showImplementations
    );
    context.subscriptions.push(command);
}
