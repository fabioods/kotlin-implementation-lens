/**
 * Interface Implementation Lens Provider
 * Shows "👁️ N implementations" above interfaces and abstract classes
 */

import * as vscode from 'vscode';
import { SearchConfig } from '../types';
import { extractInterfaceName } from '../engine/patternBank';
import { getSearchEngine } from '../engine/searchEngine';
import { getFilterEngine } from '../engine/filterEngine';
import { getLogger } from '../utils/logger';
import { getLanguage } from '../utils/pathUtils';

export class InterfaceImplementationLensProvider implements vscode.CodeLensProvider {
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

        const language = getLanguage(document.fileName);
        if (!language) {
            return codeLenses;
        }

        const text = document.getText();
        const lines = text.split('\n');

        // Get configuration
        const config = vscode.workspace.getConfiguration('kotlinImplementationLens');
        const searchPaths = config.get<string[]>('searchPaths', ['src']);
        const excludePaths = config.get<string[]>('excludePaths', ['test', 'androidTest']);
        const includeJavaFiles = config.get<boolean>('includeJavaFiles', true);
        const filterMocks = config.get<boolean>('filterMocks', true);
        const includeAbstractClasses = config.get<boolean>('includeAbstractClasses', true);
        const annotationFilters = config.get<string[]>('annotationFilters', []);

        const searchConfig: SearchConfig = {
            searchPaths,
            excludePaths,
            fileExtensions: includeJavaFiles ? ['kt', 'java'] : ['kt'],
            filterMocks,
            includeJavaFiles,
            annotationFilters
        };

        // Scan document for interfaces and abstract classes
        for (let i = 0; i < lines.length; i++) {
            if (token.isCancellationRequested) {
                return codeLenses;
            }

            const line = lines[i];
            const trimmed = line.trim();

            // Skip comments
            if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
                continue;
            }

            // Extract interface name
            const interfaceName = extractInterfaceName(trimmed, language);
            if (!interfaceName) {
                continue;
            }

            // Check if it's an abstract class and if we should include it
            const isAbstract = trimmed.includes('abstract class');
            if (isAbstract && !includeAbstractClasses) {
                continue;
            }

            // Create range for CodeLens
            const range = new vscode.Range(i, 0, i, line.length);

            // Create CodeLens
            const codeLens = new vscode.CodeLens(range, {
                title: '$(loading~spin) Loading implementations...',
                command: ''
            });

            codeLenses.push(codeLens);

            // Async: Find implementations and update CodeLens
            this.findImplementations(interfaceName, searchConfig, codeLens, filterMocks);
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
        // CodeLens will be resolved asynchronously in findImplementations
        return codeLens;
    }

    /**
     * Find implementations and update CodeLens
     */
    private async findImplementations(
        interfaceName: string,
        searchConfig: SearchConfig,
        codeLens: vscode.CodeLens,
        filterMocks: boolean
    ): Promise<void> {
        try {
            // Search for implementations
            let implementations = await getSearchEngine().searchImplementations(
                interfaceName,
                searchConfig
            );

            // Filter mocks if enabled
            if (filterMocks) {
                implementations = getFilterEngine().filterMocks(implementations);
            }

            // Sort by annotation (Spring annotations first)
            implementations = getFilterEngine().sortByAnnotation(implementations);

            const count = implementations.length;

            // Update CodeLens with result
            codeLens.command = {
                title: count === 0
                    ? '$(search) No implementations found'
                    : count === 1
                        ? '$(eye) 1 implementation'
                        : `$(eye) ${count} implementations`,
                command: 'kotlin-implementation-lens.showImplementations',
                arguments: [interfaceName, implementations]
            };

        } catch (error) {
            getLogger().error('Error finding implementations', error as Error);
            codeLens.command = {
                title: '$(error) Error finding implementations',
                command: ''
            };
        }
    }
}
