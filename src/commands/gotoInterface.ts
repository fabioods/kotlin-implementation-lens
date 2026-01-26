/**
 * Goto Interface Command
 * Navigates from implementation method back to interface declaration
 */

import * as vscode from 'vscode';
import { InterfaceDeclaration } from '../types';
import { createLocation } from '../utils/pathUtils';
import { getLogger } from '../utils/logger';

/**
 * Go to interface declaration
 */
export async function gotoInterface(
    interfaceData: InterfaceDeclaration | InterfaceDeclaration[]
): Promise<void> {
    try {
        // Handle single interface
        if (!Array.isArray(interfaceData)) {
            const location = createLocation(interfaceData.filePath, interfaceData.lineNumber);
            await vscode.window.showTextDocument(location.uri, {
                selection: location.range
            });
            getLogger().info(`Navigated to interface ${interfaceData.name}`);
            return;
        }

        // Handle multiple interfaces
        const interfaces = interfaceData;

        if (interfaces.length === 0) {
            vscode.window.showInformationMessage('No interfaces found');
            return;
        }

        if (interfaces.length === 1) {
            const location = createLocation(interfaces[0].filePath, interfaces[0].lineNumber);
            await vscode.window.showTextDocument(location.uri, {
                selection: location.range
            });
            getLogger().info(`Navigated to interface ${interfaces[0].name}`);
            return;
        }

        // Show quick pick for multiple interfaces
        const items = interfaces.map(intf => {
            const icon = intf.type === 'interface'
                ? '$(symbol-interface)'
                : intf.type === 'abstract'
                    ? '$(symbol-class)'
                    : '$(symbol-enum)';

            const label = `${icon} ${intf.name}`;
            const relativePath = vscode.workspace.asRelativePath(intf.filePath);
            const description = `${relativePath}:${intf.lineNumber + 1}`;
            const detail = intf.type === 'sealed' ? 'Sealed Class' : intf.type === 'abstract' ? 'Abstract Class' : 'Interface';

            return {
                label,
                description,
                detail,
                interface: intf
            };
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select interface or abstract class',
            matchOnDescription: true
        });

        if (selected) {
            const location = createLocation(selected.interface.filePath, selected.interface.lineNumber);
            await vscode.window.showTextDocument(location.uri, {
                selection: location.range
            });
            getLogger().info(`Navigated to interface ${selected.interface.name}`);
        }

    } catch (error) {
        getLogger().error('Error navigating to interface', error as Error);
        vscode.window.showErrorMessage('Failed to navigate to interface');
    }
}

/**
 * Register the command
 */
export function registerGotoInterfaceCommand(context: vscode.ExtensionContext): void {
    const command = vscode.commands.registerCommand(
        'kotlin-implementation-lens.gotoInterface',
        gotoInterface
    );
    context.subscriptions.push(command);
}
