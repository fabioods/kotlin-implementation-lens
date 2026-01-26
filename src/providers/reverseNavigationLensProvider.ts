/**
 * Reverse Navigation Lens Provider
 * Shows "← goto InterfaceName" on implementation methods
 */

import * as vscode from 'vscode';
import { SearchConfig } from '../types';
import { extractImplementation, extractMethodName, isCommentLine } from '../engine/patternBank';
import { getSearchEngine } from '../engine/searchEngine';
import { getLogger } from '../utils/logger';
import { getLanguage } from '../utils/pathUtils';

export class ReverseNavigationLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor() {}

    /**
     * Refresh CodeLens
     */
    refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }

    /**
     * Provide CodeLens for a document
     */
    async provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens[]> {
        const codeLenses: vscode.CodeLens[] = [];

        // Check if reverse navigation is enabled
        const config = vscode.workspace.getConfiguration('kotlinImplementationLens');
        const showReverseNavigation = config.get<boolean>('showReverseNavigation', true);

        if (!showReverseNavigation) {
            return codeLenses;
        }

        const language = getLanguage(document.fileName);
        if (!language) {
            return codeLenses;
        }

        const text = document.getText();
        const lines = text.split('\n');

        // Get configuration
        const searchPaths = config.get<string[]>('searchPaths', ['src']);
        const excludePaths = config.get<string[]>('excludePaths', ['test', 'androidTest']);
        const includeJavaFiles = config.get<boolean>('includeJavaFiles', true);
        const annotationFilters = config.get<string[]>('annotationFilters', []);

        const searchConfig: SearchConfig = {
            searchPaths,
            excludePaths,
            fileExtensions: includeJavaFiles ? ['kt', 'java'] : ['kt'],
            filterMocks: false,
            includeJavaFiles,
            annotationFilters
        };

        // Find implemented interfaces/abstract classes
        let currentClass: string | null = null;
        let currentInterfaces: string[] = [];
        let inClass = false;
        let braceCount = 0;

        for (let i = 0; i < lines.length; i++) {
            if (token.isCancellationRequested) {
                return codeLenses;
            }

            const line = lines[i];
            const trimmed = line.trim();

            // Skip comments
            if (isCommentLine(line)) {
                continue;
            }

            // Check for class implementing interface
            if (!inClass) {
                const extracted = extractImplementation(trimmed, language);
                if (extracted && extracted.className) {
                    currentClass = extracted.className;
                    currentInterfaces = [extracted.interfaceName];
                    inClass = true;

                    // Check for multiple interfaces (comma-separated)
                    const multiMatch = trimmed.match(/:\s*([A-Z]\w*(?:\s*,\s*[A-Z]\w*)*)/);
                    if (multiMatch) {
                        const interfaces = multiMatch[1].split(',').map(s => s.trim());
                        currentInterfaces = interfaces;
                    }
                }
            }

            if (!inClass || !currentClass || currentInterfaces.length === 0) {
                continue;
            }

            // Track braces
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;

            // End of class
            if (braceCount === 0 && inClass && i > 0) {
                inClass = false;
                currentClass = null;
                currentInterfaces = [];
                continue;
            }

            // Check for override methods
            if (!trimmed.includes('override')) {
                continue;
            }

            // Extract method name
            const methodName = extractMethodName(trimmed, language);
            if (!methodName) {
                continue;
            }

            // Create range for CodeLens (at the end of the line)
            const range = new vscode.Range(i, line.length, i, line.length);

            // Create CodeLens
            const codeLens = new vscode.CodeLens(range, {
                title: '$(loading~spin) ...',
                command: ''
            });

            codeLenses.push(codeLens);

            // Async: Find interface declarations and update CodeLens
            this.findInterfaceDeclarations(
                currentInterfaces,
                methodName,
                searchConfig,
                codeLens
            );
        }

        return codeLenses;
    }

    /**
     * Resolve CodeLens
     */
    async resolveCodeLens(
        codeLens: vscode.CodeLens,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens> {
        return codeLens;
    }

    /**
     * Find interface declarations and update CodeLens
     */
    private async findInterfaceDeclarations(
        interfaceNames: string[],
        methodName: string,
        searchConfig: SearchConfig,
        codeLens: vscode.CodeLens
    ): Promise<void> {
        try {
            // Find interfaces that declare this method
            const matchingInterfaces = [];

            for (const interfaceName of interfaceNames) {
                const interfaces = await getSearchEngine().findInterfaceDeclarations(
                    interfaceName,
                    searchConfig
                );

                // Check if this interface has the method
                for (const interfaceDecl of interfaces) {
                    // For simplicity, assume interface has the method
                    // (Full validation would require parsing interface methods)
                    matchingInterfaces.push(interfaceDecl);
                }
            }

            if (matchingInterfaces.length === 0) {
                codeLens.command = {
                    title: '',
                    command: ''
                };
                return;
            }

            // Update CodeLens with result
            if (matchingInterfaces.length === 1) {
                codeLens.command = {
                    title: `$(arrow-left) ${matchingInterfaces[0].name}`,
                    command: 'kotlin-implementation-lens.gotoInterface',
                    arguments: [matchingInterfaces[0]]
                };
            } else {
                codeLens.command = {
                    title: `$(arrow-left) ${matchingInterfaces.length} interfaces`,
                    command: 'kotlin-implementation-lens.gotoInterface',
                    arguments: [matchingInterfaces]
                };
            }

        } catch (error) {
            getLogger().error('Error finding interface declarations', error as Error);
            codeLens.command = {
                title: '',
                command: ''
            };
        }
    }
}
