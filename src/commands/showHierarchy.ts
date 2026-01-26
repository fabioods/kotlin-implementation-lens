/**
 * Show Hierarchy Command
 * Shows the interface hierarchy tree
 */

import * as vscode from 'vscode';
import { Implementation } from '../types';
import { getLogger } from '../utils/logger';

/**
 * Show interface hierarchy
 */
export async function showHierarchy(
    interfaceName: string,
    implementations: Implementation[]
): Promise<void> {
    try {
        // Build hierarchy text
        let hierarchyText = `Interface: ${interfaceName}\n`;
        hierarchyText += `${'─'.repeat(50)}\n\n`;

        if (implementations.length === 0) {
            hierarchyText += 'No implementations found\n';
        } else {
            hierarchyText += `Implementations (${implementations.length}):\n\n`;

            for (const impl of implementations) {
                hierarchyText += `├─ ${impl.className}`;

                if (impl.annotations && impl.annotations.length > 0) {
                    hierarchyText += ` [@${impl.annotations.join(', @')}]`;
                }

                if (impl.isDataClass) {
                    hierarchyText += ' (data class)';
                }

                if (impl.usesDelegation) {
                    hierarchyText += ' (delegation)';
                }

                hierarchyText += '\n';

                const relativePath = vscode.workspace.asRelativePath(impl.filePath);
                hierarchyText += `│  └─ ${relativePath}:${impl.lineNumber + 1}\n`;
                hierarchyText += '│\n';
            }
        }

        // Show in output channel or new document
        const document = await vscode.workspace.openTextDocument({
            content: hierarchyText,
            language: 'plaintext'
        });

        await vscode.window.showTextDocument(document, {
            preview: true,
            viewColumn: vscode.ViewColumn.Beside
        });

        getLogger().info(`Showed hierarchy for ${interfaceName}`);

    } catch (error) {
        getLogger().error('Error showing hierarchy', error as Error);
        vscode.window.showErrorMessage('Failed to show hierarchy');
    }
}

/**
 * Register the command
 */
export function registerShowHierarchyCommand(context: vscode.ExtensionContext): void {
    const command = vscode.commands.registerCommand(
        'kotlin-implementation-lens.showHierarchy',
        showHierarchy
    );
    context.subscriptions.push(command);
}
