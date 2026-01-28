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

/**
 * Extended CodeLens with metadata for resolution
 */
interface ReverseCodeLens extends vscode.CodeLens {
    interfaceNames: string[];
    methodName: string;
    searchConfig: SearchConfig;
}

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
        let foundOpeningBrace = false;
        let classDeclarationBuffer: string[] = [];
        let inClassDeclaration = false;

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
                // Start of class declaration
                if (!inClassDeclaration && /^(?:data\s+)?(?:open\s+)?(?:abstract\s+)?class\s+\w+/.test(trimmed)) {
                    inClassDeclaration = true;
                    classDeclarationBuffer = [trimmed];
                }
                // Continue multiline declaration
                else if (inClassDeclaration) {
                    classDeclarationBuffer.push(trimmed);
                }

                // Complete declaration found (has opening brace)
                if (inClassDeclaration && line.includes('{')) {
                    const fullDeclaration = classDeclarationBuffer.join(' ');
                    const extracted = extractImplementation(fullDeclaration, language);

                    if (extracted && extracted.className) {
                        currentClass = extracted.className;
                        currentInterfaces = [extracted.interfaceName];
                        inClass = true;
                        foundOpeningBrace = true;
                        braceCount = 1;
                        inClassDeclaration = false;
                        classDeclarationBuffer = [];

                        // Check for multiple interfaces after the ') :'
                        const implementsMatch = fullDeclaration.match(/\)\s*:\s*([A-Z]\w*(?:\s*,\s*[A-Z]\w*)*)/);
                        if (implementsMatch) {
                            const interfaces = implementsMatch[1].split(',').map(s => s.trim());
                            currentInterfaces = interfaces;
                        }
                    } else {
                        // Not an implementation, reset
                        inClassDeclaration = false;
                        classDeclarationBuffer = [];
                    }
                    continue;
                }

                // If still building declaration, continue to next line
                if (inClassDeclaration) {
                    continue;
                }
            }

            if (!inClass || !currentClass || currentInterfaces.length === 0) {
                continue;
            }

            // If we haven't found the opening brace yet, keep looking
            if (!foundOpeningBrace) {
                if (line.includes('{')) {
                    foundOpeningBrace = true;
                    braceCount = 1;
                    getLogger().debug(`Found opening brace at line ${i}`);
                }
                continue;
            }

            // Track braces
            const openBraces = (line.match(/{/g) || []).length;
            const closeBraces = (line.match(/}/g) || []).length;
            braceCount += openBraces - closeBraces;

            // End of class
            if (braceCount === 0) {
                inClass = false;
                currentClass = null;
                currentInterfaces = [];
                foundOpeningBrace = false;
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

            // Create range for CodeLens (at the beginning of the line)
            const range = new vscode.Range(i, 0, i, line.length);

            // Create CodeLens with metadata (command is undefined, will be resolved)
            const codeLens: ReverseCodeLens = Object.assign(new vscode.CodeLens(range), {
                interfaceNames: [...currentInterfaces], // Copy array
                methodName,
                searchConfig
            });

            codeLenses.push(codeLens);
        }

        return codeLenses;
    }

    /**
     * Resolve CodeLens with actual interface information
     */
    async resolveCodeLens(
        codeLens: vscode.CodeLens,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens> {
        const lens = codeLens as ReverseCodeLens;

        // If it doesn't have our metadata, return as-is
        if (!lens.interfaceNames || !lens.methodName) {
            return codeLens;
        }

        try {
            // Find interfaces that declare this method
            const matchingInterfaces = [];

            for (const interfaceName of lens.interfaceNames) {
                // Check cancellation before each async operation
                if (token.isCancellationRequested) {
                    return codeLens;
                }

                const interfaces = await getSearchEngine().findInterfaceDeclarations(
                    interfaceName,
                    lens.searchConfig
                );

                // Check if this interface has the method
                for (const interfaceDecl of interfaces) {
                    // For simplicity, assume interface has the method
                    // (Full validation would require parsing interface methods)
                    matchingInterfaces.push(interfaceDecl);
                }
            }

            // Check cancellation after all async operations
            if (token.isCancellationRequested) {
                return codeLens;
            }

            if (matchingInterfaces.length === 0) {
                codeLens.command = {
                    title: '', // Hide if no interface found
                    command: ''
                };
                return codeLens;
            }

            // Update CodeLens with result
            if (matchingInterfaces.length === 1) {
                codeLens.command = {
                    title: `$(symbol-interface) Go to ${matchingInterfaces[0].name}`,
                    command: 'kotlin-implementation-lens.gotoInterface',
                    arguments: [matchingInterfaces[0]]
                };
            } else {
                codeLens.command = {
                    title: `$(symbol-interface) Go to interface (${matchingInterfaces.length} options)`,
                    command: 'kotlin-implementation-lens.gotoInterface',
                    arguments: [matchingInterfaces]
                };
            }

        } catch (error) {
            getLogger().error('Error finding interface declarations', error as Error);
            codeLens.command = {
                title: '', // Hide on error
                command: ''
            };
        }

        return codeLens;
    }
}
