/**
 * Method Implementation Lens Provider
 * Shows "→ N implementations" for each method in an interface
 */

import * as vscode from 'vscode';
import { SearchConfig } from '../types';
import { extractInterfaceName, extractMethodName, isCommentLine } from '../engine/patternBank';
import { getSearchEngine } from '../engine/searchEngine';
import { getFilterEngine } from '../engine/filterEngine';
import { getLogger } from '../utils/logger';
import { getLanguage } from '../utils/pathUtils';

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

            // Create range for CodeLens (at the end of the line)
            const range = new vscode.Range(i, line.length, i, line.length);

            // Create CodeLens
            const codeLens = new vscode.CodeLens(range, {
                title: '$(loading~spin) ...',
                command: ''
            });

            codeLenses.push(codeLens);

            // Async: Find method implementations and update CodeLens
            this.findMethodImplementations(
                currentInterface,
                methodName,
                searchConfig,
                codeLens,
                filterMocks
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
     * Find method implementations and update CodeLens
     */
    private async findMethodImplementations(
        interfaceName: string,
        methodName: string,
        searchConfig: SearchConfig,
        codeLens: vscode.CodeLens,
        filterMocks: boolean
    ): Promise<void> {
        try {
            // Search for method implementations
            let implementations = await getSearchEngine().searchMethodImplementations(
                interfaceName,
                methodName,
                searchConfig
            );

            // Filter mocks if enabled
            if (filterMocks) {
                implementations = getFilterEngine().filterMocks(implementations);
            }

            const count = implementations.length;

            // Update CodeLens with result
            codeLens.command = {
                title: count === 0
                    ? ''
                    : count === 1
                        ? '$(arrow-right) 1 impl'
                        : `$(arrow-right) ${count} impls`,
                command: count > 0 ? 'kotlin-implementation-lens.showMethodImplementations' : '',
                arguments: [interfaceName, methodName, implementations]
            };

        } catch (error) {
            getLogger().error('Error finding method implementations', error as Error);
            codeLens.command = {
                title: '',
                command: ''
            };
        }
    }
}
