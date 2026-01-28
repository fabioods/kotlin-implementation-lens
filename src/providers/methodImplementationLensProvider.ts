/**
 * Method Implementation Lens Provider
 * Shows "👁️ N implementations" above each method in an interface
 */

import * as vscode from 'vscode';
import { SearchConfig } from '../types';
import { extractInterfaceName, extractMethodName, isCommentLine } from '../engine/patternBank';
import { getSearchEngine } from '../engine/searchEngine';
import { getFilterEngine } from '../engine/filterEngine';
import { getLogger } from '../utils/logger';
import { getLanguage } from '../utils/pathUtils';

/**
 * Extended CodeLens with metadata for resolution
 */
interface MethodCodeLens extends vscode.CodeLens {
    interfaceName: string;
    methodName: string;
    searchConfig: SearchConfig;
    filterMocks: boolean;
}

export class MethodImplementationLensProvider implements vscode.CodeLensProvider {
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

        // Check if method lens is enabled
        const config = vscode.workspace.getConfiguration('kotlinImplementationLens');
        const showMethodLens = config.get<boolean>('showMethodLens', true);

        if (!showMethodLens) {
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
        const filterMocks = config.get<boolean>('filterMocks', true);
        const annotationFilters = config.get<string[]>('annotationFilters', []);

        const searchConfig: SearchConfig = {
            searchPaths,
            excludePaths,
            fileExtensions: includeJavaFiles ? ['kt', 'java'] : ['kt'],
            filterMocks,
            includeJavaFiles,
            annotationFilters
        };

        // Find interface/abstract class
        let currentInterface: string | null = null;
        let inInterface = false;
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

            // Check for interface/abstract class start
            if (!inInterface) {
                const interfaceName = extractInterfaceName(trimmed, language);
                if (interfaceName) {
                    currentInterface = interfaceName;
                    inInterface = true;
                }
            }

            if (!inInterface || !currentInterface) {
                continue;
            }

            // Track braces
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;

            // End of interface
            if (braceCount === 0 && inInterface && i > 0) {
                inInterface = false;
                currentInterface = null;
                continue;
            }

            // Extract method name
            const methodName = extractMethodName(trimmed, language);
            if (!methodName) {
                continue;
            }

            // Skip if it's a default method (Java)
            if (trimmed.includes('default ') && language === 'java') {
                continue;
            }

            // Create range for CodeLens (at the beginning of the line)
            const range = new vscode.Range(i, 0, i, line.length);

            // Create CodeLens with metadata (command is undefined, will be resolved)
            const codeLens: MethodCodeLens = Object.assign(new vscode.CodeLens(range), {
                interfaceName: currentInterface,
                methodName,
                searchConfig,
                filterMocks
            });

            codeLenses.push(codeLens);
        }

        return codeLenses;
    }

    /**
     * Resolve CodeLens with actual implementation count
     */
    async resolveCodeLens(
        codeLens: vscode.CodeLens,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens> {
        const lens = codeLens as MethodCodeLens;

        // If it doesn't have our metadata, return as-is
        if (!lens.interfaceName || !lens.methodName) {
            return codeLens;
        }

        try {
            // Search for method implementations
            let implementations = await getSearchEngine().searchMethodImplementations(
                lens.interfaceName,
                lens.methodName,
                lens.searchConfig
            );

            // Check cancellation after async operation
            if (token.isCancellationRequested) {
                return codeLens;
            }

            // Filter mocks if enabled
            if (lens.filterMocks) {
                implementations = getFilterEngine().filterMocks(implementations);
            }

            const count = implementations.length;

            // Update CodeLens with result
            codeLens.command = {
                title: count === 0
                    ? '$(search) No implementations found'
                    : count === 1
                        ? '$(eye) 1 implementation'
                        : `$(eye) ${count} implementations`,
                command: 'kotlin-implementation-lens.showMethodImplementations',
                arguments: [lens.interfaceName, lens.methodName, implementations]
            };

        } catch (error) {
            getLogger().error('Error finding method implementations', error as Error);
            codeLens.command = {
                title: '$(error) Error finding implementations',
                command: ''
            };
        }

        return codeLens;
    }
}
