/**
 * Search Engine - Grep-based search for implementations
 */

import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
    Implementation,
    MethodImplementation,
    InterfaceDeclaration,
    SearchConfig,
    ISearchEngine
} from '../types';
import { extractImplementation, extractInterfaceName, extractMethodName, KotlinPatterns, JavaPatterns } from './patternBank';
import { getWorkspaceRoot, normalizePath, getLanguage, toAbsolute } from '../utils/pathUtils';
import { getLogger } from '../utils/logger';
import { getCacheManager } from '../cache/cacheManager';

export class SearchEngine implements ISearchEngine {
    /**
     * Search for all implementations of an interface
     */
    async searchImplementations(
        interfaceName: string,
        searchConfig: SearchConfig
    ): Promise<Implementation[]> {
        const cacheKey = `interface:${interfaceName}`;
        const cached = getCacheManager().get<Implementation[]>(cacheKey);
        if (cached) {
            return cached;
        }

        const implementations: Implementation[] = [];
        const workspaceRoot = getWorkspaceRoot();

        if (!workspaceRoot) {
            getLogger().warn('No workspace root found');
            return implementations;
        }

        try {
            // Build file extensions
            const extensions = searchConfig.includeJavaFiles ? ['kt', 'java'] : ['kt'];

            // Search for implementations in each search path
            for (const searchPath of searchConfig.searchPaths) {
                const absolutePath = toAbsolute(searchPath);

                // Check if path exists
                if (!fs.existsSync(absolutePath)) {
                    getLogger().debug(`Skipping non-existent path: ${absolutePath}`);
                    continue;
                }

                // Search in this path
                const pathImplementations = await this.searchInPath(
                    interfaceName,
                    absolutePath,
                    extensions,
                    searchConfig.excludePaths
                );

                implementations.push(...pathImplementations);
            }

            // Cache results
            getCacheManager().set(cacheKey, implementations);
            getLogger().info(`Found ${implementations.length} implementations of ${interfaceName}`);

        } catch (error) {
            getLogger().error('Search error', error as Error);
        }

        return implementations;
    }

    /**
     * Search for implementations in a specific path
     */
    private async searchInPath(
        interfaceName: string,
        searchPath: string,
        extensions: string[],
        excludePaths: string[]
    ): Promise<Implementation[]> {
        const implementations: Implementation[] = [];

        try {
            // Build grep command
            const grepCommand = this.buildGrepCommand(interfaceName, searchPath, extensions, excludePaths);
            getLogger().debug(`Executing: ${grepCommand}`);

            // Execute grep
            const result = await this.executeCommand(grepCommand);

            // Parse results
            const lines = result.split('\n').filter(line => line.trim());

            for (const line of lines) {
                const impl = await this.parseGrepLine(line, interfaceName);
                if (impl) {
                    implementations.push(impl);
                }
            }

        } catch (error) {
            // Grep returns non-zero exit code when no matches found - this is normal
            if ((error as any).code !== 1) {
                getLogger().debug(`Grep search completed: ${searchPath}`);
            }
        }

        return implementations;
    }

    /**
     * Build grep command for searching implementations
     */
    private buildGrepCommand(
        interfaceName: string,
        searchPath: string,
        extensions: string[],
        excludePaths: string[]
    ): string {
        const extPattern = extensions.map(ext => `*.${ext}`).join(' ');

        // Build exclude patterns
        let excludeArgs = '';
        for (const excludePath of excludePaths) {
            excludeArgs += ` --exclude-dir="${excludePath}"`;
        }

        // Patterns to search for:
        // 1. Kotlin: class X : InterfaceName
        // 2. Kotlin: data class X : InterfaceName
        // 3. Kotlin: object X : InterfaceName
        // 4. Java: class X implements InterfaceName
        const pattern = `(class|data class|object).*:.*${interfaceName}|class.*implements.*${interfaceName}`;

        return `grep -rn ${excludeArgs} -E "${pattern}" --include="${extPattern}" "${searchPath}"`;
    }

    /**
     * Parse a grep output line
     */
    private async parseGrepLine(line: string, interfaceName: string): Promise<Implementation | null> {
        // Grep output format: filepath:lineNumber:content
        const parts = line.split(':');
        if (parts.length < 3) return null;

        const filePath = parts[0];
        const lineNumber = parseInt(parts[1], 10) - 1; // Convert to 0-indexed
        const content = parts.slice(2).join(':');

        const language = getLanguage(filePath);
        if (!language) return null;

        // Extract class and interface names
        const extracted = extractImplementation(content, language);
        if (!extracted || extracted.interfaceName !== interfaceName) {
            return null;
        }

        // Extract annotations
        const annotations = await this.extractAnnotationsFromFile(filePath, lineNumber);

        // Check if it's a data class
        const isDataClass = content.includes('data class');

        // Check if it uses delegation
        const usesDelegation = content.includes(' by ');

        return {
            className: extracted.className,
            filePath,
            lineNumber,
            annotations,
            isDataClass,
            usesDelegation
        };
    }

    /**
     * Extract Spring Boot annotations from around the class declaration
     */
    private async extractAnnotationsFromFile(filePath: string, lineNumber: number): Promise<string[]> {
        const annotations: string[] = [];

        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            const text = document.getText();
            const lines = text.split('\n');

            // Look at the 5 lines before the class declaration
            const startLine = Math.max(0, lineNumber - 5);
            for (let i = startLine; i < lineNumber; i++) {
                const line = lines[i];

                // Check for Spring annotations
                const kotlinMatch = line.match(KotlinPatterns.springAnnotations);
                const javaMatch = line.match(JavaPatterns.springAnnotations);

                if (kotlinMatch) annotations.push(kotlinMatch[1]);
                if (javaMatch) annotations.push(javaMatch[1]);
            }
        } catch (error) {
            getLogger().debug(`Could not extract annotations from ${filePath}`);
        }

        return annotations;
    }

    /**
     * Search for method implementations
     */
    async searchMethodImplementations(
        interfaceName: string,
        methodName: string,
        searchConfig: SearchConfig
    ): Promise<MethodImplementation[]> {
        const cacheKey = `method:${interfaceName}:${methodName}`;
        const cached = getCacheManager().get<MethodImplementation[]>(cacheKey);
        if (cached) {
            return cached;
        }

        // First, find all implementations
        const implementations = await this.searchImplementations(interfaceName, searchConfig);

        // Then, find the method in each implementation
        const methodImplementations: MethodImplementation[] = [];

        for (const impl of implementations) {
            const methodLocation = await this.findMethodInClass(impl, methodName);
            if (methodLocation) {
                methodImplementations.push({
                    ...impl,
                    methodName,
                    lineNumber: methodLocation.lineNumber,
                    signature: methodLocation.signature
                });
            }
        }

        // Cache results
        getCacheManager().set(cacheKey, methodImplementations);
        getLogger().info(`Found ${methodImplementations.length} implementations of ${interfaceName}.${methodName}`);

        return methodImplementations;
    }

    /**
     * Find a specific method in a class
     */
    private async findMethodInClass(
        implementation: Implementation,
        methodName: string
    ): Promise<{ lineNumber: number; signature?: string } | null> {
        try {
            const document = await vscode.workspace.openTextDocument(implementation.filePath);
            const text = document.getText();
            const lines = text.split('\n');
            const language = getLanguage(implementation.filePath);

            if (!language) return null;

            let inClass = false;
            let braceCount = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmed = line.trim();

                // Find class start
                if (!inClass && trimmed.includes(`class ${implementation.className}`)) {
                    inClass = true;
                }

                if (!inClass) continue;

                // Track braces
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;

                // Check for method
                const extractedMethodName = extractMethodName(trimmed, language);
                if (extractedMethodName === methodName) {
                    return {
                        lineNumber: i,
                        signature: trimmed
                    };
                }

                // End of class
                if (braceCount === 0 && inClass) {
                    break;
                }
            }
        } catch (error) {
            getLogger().debug(`Could not find method ${methodName} in ${implementation.className}`);
        }

        return null;
    }

    /**
     * Find interface declarations
     */
    async findInterfaceDeclarations(
        className: string,
        searchConfig: SearchConfig
    ): Promise<InterfaceDeclaration[]> {
        const cacheKey = `interfaces:${className}`;
        const cached = getCacheManager().get<InterfaceDeclaration[]>(cacheKey);
        if (cached) {
            return cached;
        }

        const interfaces: InterfaceDeclaration[] = [];
        const workspaceRoot = getWorkspaceRoot();

        if (!workspaceRoot) {
            return interfaces;
        }

        try {
            const extensions = searchConfig.includeJavaFiles ? ['kt', 'java'] : ['kt'];

            for (const searchPath of searchConfig.searchPaths) {
                const absolutePath = toAbsolute(searchPath);

                if (!fs.existsSync(absolutePath)) {
                    continue;
                }

                const pathInterfaces = await this.searchInterfacesInPath(
                    className,
                    absolutePath,
                    extensions,
                    searchConfig.excludePaths
                );

                interfaces.push(...pathInterfaces);
            }

            // Cache results
            getCacheManager().set(cacheKey, interfaces);
            getLogger().info(`Found ${interfaces.length} interfaces for ${className}`);

        } catch (error) {
            getLogger().error('Interface search error', error as Error);
        }

        return interfaces;
    }

    /**
     * Search for interfaces in a specific path
     */
    private async searchInterfacesInPath(
        className: string,
        searchPath: string,
        extensions: string[],
        excludePaths: string[]
    ): Promise<InterfaceDeclaration[]> {
        const interfaces: InterfaceDeclaration[] = [];

        try {
            // Search for the class implementation
            const grepCommand = this.buildGrepCommand(className, searchPath, extensions, excludePaths);
            const result = await this.executeCommand(grepCommand);

            const lines = result.split('\n').filter(line => line.trim());

            for (const line of lines) {
                const parts = line.split(':');
                if (parts.length < 3) continue;

                const filePath = parts[0];
                const content = parts.slice(2).join(':');
                const language = getLanguage(filePath);

                if (!language) continue;

                // Extract interface name from implementation
                const extracted = extractImplementation(content, language);
                if (extracted) {
                    // Now search for the interface definition
                    const interfaceDecl = await this.findInterfaceDeclaration(
                        extracted.interfaceName,
                        searchPath,
                        extensions
                    );
                    if (interfaceDecl) {
                        interfaces.push(interfaceDecl);
                    }
                }
            }
        } catch (error) {
            getLogger().debug(`Interface search completed: ${searchPath}`);
        }

        return interfaces;
    }

    /**
     * Find a specific interface declaration
     */
    private async findInterfaceDeclaration(
        interfaceName: string,
        searchPath: string,
        extensions: string[]
    ): Promise<InterfaceDeclaration | null> {
        try {
            const extPattern = extensions.map(ext => `*.${ext}`).join(' ');
            const pattern = `(interface|abstract class|sealed interface|sealed class).*${interfaceName}`;
            const grepCommand = `grep -rn -E "${pattern}" --include="${extPattern}" "${searchPath}"`;

            const result = await this.executeCommand(grepCommand);
            const lines = result.split('\n').filter(line => line.trim());

            for (const line of lines) {
                const parts = line.split(':');
                if (parts.length < 3) continue;

                const filePath = parts[0];
                const lineNumber = parseInt(parts[1], 10) - 1;
                const content = parts.slice(2).join(':');
                const language = getLanguage(filePath);

                if (!language) continue;

                const extractedName = extractInterfaceName(content, language);
                if (extractedName === interfaceName) {
                    // Determine type
                    let type: 'interface' | 'abstract' | 'sealed' = 'interface';
                    if (content.includes('abstract class')) type = 'abstract';
                    else if (content.includes('sealed')) type = 'sealed';

                    return {
                        name: interfaceName,
                        filePath,
                        lineNumber,
                        type,
                        language,
                        methods: [] // Will be populated by validator if needed
                    };
                }
            }
        } catch (error) {
            getLogger().debug(`Interface declaration search completed`);
        }

        return null;
    }

    /**
     * Execute a shell command
     */
    private executeCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            child_process.exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
                if (error) {
                    // Grep returns exit code 1 when no matches found
                    if (error.code === 1) {
                        resolve('');
                    } else {
                        reject(error);
                    }
                    return;
                }
                resolve(stdout);
            });
        });
    }
}

// Global search engine instance
let globalSearchEngine: SearchEngine | null = null;

export function getSearchEngine(): SearchEngine {
    if (!globalSearchEngine) {
        globalSearchEngine = new SearchEngine();
    }
    return globalSearchEngine;
}

export function setSearchEngine(searchEngine: SearchEngine): void {
    globalSearchEngine = searchEngine;
}
