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
import { getModuleDetector } from './moduleDetector';

export class SearchEngine implements ISearchEngine {
    /**
     * Resolve search paths: auto-detect or use configured
     */
    private async resolveSearchPaths(configuredPaths: string[]): Promise<string[]> {
        // Check if user has explicitly configured paths (not defaults)
        const defaultPaths = ['src/main/kotlin', 'src/main/java', 'src', 'app/src/main', 'core/src/main'];
        const isUsingDefaults = JSON.stringify(configuredPaths.sort()) === JSON.stringify(defaultPaths.sort());

        // If using defaults, try auto-detection (like IntelliJ)
        if (isUsingDefaults || configuredPaths.length === 0) {
            getLogger().info('Auto-detecting modules (IntelliJ-style)...');
            const detected = await getModuleDetector().detectModules();

            if (detected.length > 0) {
                getLogger().info(`Auto-detected ${detected.length} source paths`);
                return detected;
            }

            getLogger().info('No modules auto-detected, using defaults');
        }

        // Use configured paths
        return configuredPaths;
    }

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

            // Resolve search paths (auto-detect if using defaults)
            const searchPaths = await this.resolveSearchPaths(searchConfig.searchPaths);
            getLogger().debug(`Search paths: ${searchPaths.join(', ')}`);

            // Search for implementations in each search path
            for (const searchPath of searchPaths) {
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
     * Uses a two-phase approach to handle multiline class declarations:
     * 1. Find candidate files that mention the interface name
     * 2. Read each file to detect implementations (even multiline)
     */
    private async searchInPath(
        interfaceName: string,
        searchPath: string,
        extensions: string[],
        excludePaths: string[]
    ): Promise<Implementation[]> {
        const implementations: Implementation[] = [];

        try {
            // Phase 1: Find candidate files that mention the interface
            const candidateFiles = await this.findCandidateFiles(
                interfaceName,
                searchPath,
                extensions,
                excludePaths
            );

            getLogger().debug(`Found ${candidateFiles.length} candidate files for ${interfaceName}`);

            // Phase 2: Read each file to detect implementations
            for (const filePath of candidateFiles) {
                const impls = await this.extractImplementationsFromFile(filePath, interfaceName);
                implementations.push(...impls);
            }

        } catch (error) {
            getLogger().debug(`Search completed: ${searchPath}`);
        }

        return implementations;
    }

    /**
     * Find files that mention the interface name
     */
    private async findCandidateFiles(
        interfaceName: string,
        searchPath: string,
        extensions: string[],
        excludePaths: string[]
    ): Promise<string[]> {
        const files: string[] = [];

        try {
            // Build include args - each extension needs its own --include flag
            const includeArgs = extensions.map(ext => `--include="*.${ext}"`).join(' ');

            // Build exclude args
            let excludeArgs = '';
            for (const excludePath of excludePaths) {
                excludeArgs += ` --exclude-dir="${excludePath}"`;
            }

            // Search for files mentioning the interface name (not pattern matching)
            // This will find files even if class declaration spans multiple lines
            const grepCommand = `grep -rl ${excludeArgs} "${interfaceName}" ${includeArgs} "${searchPath}"`;
            getLogger().debug(`Finding candidates: ${grepCommand}`);

            const result = await this.executeCommand(grepCommand);
            const lines = result.split('\n').filter(line => line.trim());

            files.push(...lines);

        } catch (error) {
            getLogger().debug(`Candidate search completed: ${searchPath}`);
        }

        return files;
    }

    /**
     * Extract implementations from a file by reading its full content
     * This handles multiline class declarations
     */
    private async extractImplementationsFromFile(
        filePath: string,
        interfaceName: string
    ): Promise<Implementation[]> {
        const implementations: Implementation[] = [];

        try {
            getLogger().debug(`Extracting implementations from file: ${filePath}`);
            const document = await vscode.workspace.openTextDocument(filePath);
            const text = document.getText();
            const lines = text.split('\n');
            const language = getLanguage(filePath);

            if (!language) {
                getLogger().debug(`No language detected for ${filePath}`);
                return implementations;
            }

            getLogger().debug(`Processing ${lines.length} lines in ${filePath}`);

            // Read file with multiline support
            let i = 0;
            let classDeclarationsFound = 0;
            while (i < lines.length) {
                const line = lines[i].trim();

                // Check if line starts a class/object declaration
                if (this.isClassDeclaration(line, language)) {
                    classDeclarationsFound++;
                    getLogger().debug(`Found class declaration at line ${i}: ${line.substring(0, 60)}...`);
                    // Read the next few lines to find inheritance
                    // Increased from 10 to 20 to handle large constructor parameter lists
                    const classBlock = this.readClassDeclaration(lines, i, 20);
                    getLogger().debug(`Class block read (${classBlock.length} chars): ${classBlock.substring(0, 150).replace(/\n/g, ' ')}...`);
                    const impl = await this.extractImplementationFromBlock(
                        classBlock,
                        interfaceName,
                        filePath,
                        i,
                        language
                    );

                    if (impl) {
                        getLogger().debug(`✓ Found valid implementation: ${impl.className}`);
                        implementations.push(impl);
                    }
                }

                i++;
            }

            getLogger().debug(`Finished processing ${filePath}: found ${classDeclarationsFound} class declarations, ${implementations.length} implementations`);

        } catch (error) {
            getLogger().debug(`Could not read file: ${filePath}`);
        }

        return implementations;
    }

    /**
     * Check if a line starts a class declaration
     */
    private isClassDeclaration(line: string, language: 'kotlin' | 'java'): boolean {
        if (language === 'kotlin') {
            return /^\s*(data\s+)?class\s+[A-Z]/.test(line) ||
                   /^\s*object\s+[A-Z]/.test(line);
        } else {
            return /^\s*(public\s+)?class\s+[A-Z]/.test(line);
        }
    }

    /**
     * Read multiple lines to get the full class declaration
     */
    private readClassDeclaration(lines: string[], startIndex: number, maxLines: number): string {
        let block = '';
        let foundColon = false;

        for (let i = startIndex; i < Math.min(startIndex + maxLines, lines.length); i++) {
            const line = lines[i];
            block += line + '\n';

            // Track if we've found the inheritance part (: after class name)
            if (line.includes(':')) {
                foundColon = true;
            }

            // Stop when we find the opening brace of the class body
            // This brace comes AFTER the inheritance/implementation section
            if (line.includes('{') && foundColon) {
                break;
            }
        }

        return block;
    }

    /**
     * Extract implementation from a multiline block
     */
    private async extractImplementationFromBlock(
        block: string,
        interfaceName: string,
        filePath: string,
        lineNumber: number,
        language: 'kotlin' | 'java'
    ): Promise<Implementation | null> {
        // Remove newlines and extra spaces for pattern matching
        const singleLine = block.replace(/\n/g, ' ').replace(/\s+/g, ' ');

        // Check if this block implements the interface
        // Use word boundary regex to avoid matching substrings (e.g., "FooClient" shouldn't match "FooClientException")
        const interfaceRegex = new RegExp(`\\b${interfaceName}\\b`);
        if (!interfaceRegex.test(singleLine)) {
            return null;
        }

        // Extract class name
        const classMatch = singleLine.match(/class\s+([A-Z]\w*)/);
        if (!classMatch) return null;

        const className = classMatch[1];
        getLogger().debug(`Checking if ${className} implements ${interfaceName}...`);
        getLogger().debug(`Single line: ${singleLine.substring(0, 200)}...`);

        // Verify it actually implements the interface (not just mentions it)
        // For Kotlin, we need to distinguish between:
        // 1. Implementation: class Foo(...) : Interface or class Foo(...) : BaseClass, Interface
        // 2. Constructor param: class Foo(val x: Interface) - should NOT match
        // Strategy: Match if interface appears after ): in the inheritance section (not in constructor params)
        if (language === 'kotlin') {
            // Find the position of the closing parenthesis and colon (if they exist)
            const constructorCloseMatch = singleLine.match(/class\s+\w+\s*\([^)]*\)\s*:/);
            if (constructorCloseMatch) {
                getLogger().debug(`Found constructor with params, checking after ):`);
                // If there's a constructor, check if interface appears after it
                const afterConstructor = singleLine.substring(constructorCloseMatch.index! + constructorCloseMatch[0].length);
                getLogger().debug(`After constructor: ${afterConstructor.substring(0, 100)}...`);
                const interfaceInInheritance = new RegExp(`\\b${interfaceName}\\b`).test(afterConstructor);
                getLogger().debug(`Interface in inheritance section: ${interfaceInInheritance}`);
                if (!interfaceInInheritance) {
                    return null;
                }
            } else {
                getLogger().debug(`No constructor found, checking direct inheritance`);
                // No constructor with params, check if it's after class name and colon
                const noConstructorMatch = singleLine.match(new RegExp(`class\\s+${className}\\s*:\\s*[^{]*\\b${interfaceName}\\b`));
                getLogger().debug(`No constructor match result: ${noConstructorMatch ? 'FOUND' : 'NOT FOUND'}`);
                if (!noConstructorMatch) {
                    return null;
                }
            }
        } else {
            // Java: simple implements check
            const implementsPattern = new RegExp(`class\\s+${className}[^{]*implements[^{]*\\b${interfaceName}\\b`);
            if (!implementsPattern.test(singleLine)) {
                return null;
            }
        }

        // Extract annotations (from original block with newlines)
        const annotations = await this.extractAnnotationsFromBlock(block);

        // Check features
        const isDataClass = singleLine.includes('data class');
        const usesDelegation = singleLine.includes(' by ');

        getLogger().debug(`Found implementation: ${className} implements ${interfaceName} (multiline)`);

        return {
            className,
            filePath,
            lineNumber,
            annotations,
            isDataClass,
            usesDelegation
        };
    }

    /**
     * Extract annotations from a code block
     */
    private async extractAnnotationsFromBlock(block: string): Promise<string[]> {
        const annotations: string[] = [];
        const lines = block.split('\n');

        for (const line of lines) {
            const match = line.match(/@(Component|Service|Repository|Controller|RestController|Bean|Configuration)/);
            if (match) {
                annotations.push(match[1]);
            }
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
            getLogger().debug(`Looking for method ${methodName} in ${implementation.className} at ${implementation.filePath}`);

            const document = await vscode.workspace.openTextDocument(implementation.filePath);
            const text = document.getText();
            const lines = text.split('\n');
            const language = getLanguage(implementation.filePath);

            if (!language) {
                getLogger().debug(`No language detected for ${implementation.filePath}`);
                return null;
            }

            let inClass = false;
            let braceCount = 0;
            let methodsFound = 0;
            let foundOpeningBrace = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmed = line.trim();

                // Find class start
                if (!inClass && trimmed.includes(`class ${implementation.className}`)) {
                    inClass = true;
                    getLogger().debug(`Found class ${implementation.className} at line ${i}`);

                    // Check if opening brace is on this line
                    if (line.includes('{')) {
                        foundOpeningBrace = true;
                        braceCount = 1; // Start counting from the class opening brace
                        getLogger().debug(`Opening brace found on class declaration line, braceCount: ${braceCount}`);
                    }
                    continue; // Skip to next line
                }

                if (!inClass) continue;

                // If we haven't found the opening brace yet, keep looking
                if (!foundOpeningBrace) {
                    if (line.includes('{')) {
                        foundOpeningBrace = true;
                        braceCount = 1;
                        getLogger().debug(`Found opening brace at line ${i}, starting method scan`);
                    }
                    continue;
                }

                // Track braces
                const openBraces = (line.match(/{/g) || []).length;
                const closeBraces = (line.match(/}/g) || []).length;
                braceCount += openBraces - closeBraces;

                if (openBraces > 0 || closeBraces > 0) {
                    getLogger().debug(`Line ${i}: braceCount = ${braceCount} (opened: ${openBraces}, closed: ${closeBraces})`);
                }

                // Check for method
                const extractedMethodName = extractMethodName(trimmed, language);
                if (extractedMethodName) {
                    methodsFound++;
                    getLogger().debug(`Method #${methodsFound}: ${extractedMethodName} vs ${methodName}`);
                }
                if (extractedMethodName === methodName) {
                    getLogger().debug(`✓ Found method ${methodName} at line ${i}`);
                    return {
                        lineNumber: i,
                        signature: trimmed
                    };
                }

                // End of class (when we close the last brace)
                if (braceCount === 0) {
                    getLogger().debug(`End of class ${implementation.className} at line ${i}, found ${methodsFound} methods total`);
                    break;
                }
            }

            getLogger().debug(`Method ${methodName} not found in ${implementation.className} (scanned ${methodsFound} methods)`);
        } catch (error) {
            getLogger().error(`Error finding method ${methodName} in ${implementation.className}`, error as Error);
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
            // Find files that mention the class name
            const candidateFiles = await this.findCandidateFiles(
                className,
                searchPath,
                extensions,
                excludePaths
            );

            for (const filePath of candidateFiles) {
                const language = getLanguage(filePath);
                if (!language) continue;

                // Read file and check if it's an interface declaration
                const document = await vscode.workspace.openTextDocument(filePath);
                const text = document.getText();
                const lines = text.split('\n');

                // Look for interface/abstract class declaration
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const extractedName = extractInterfaceName(line, language);

                    if (extractedName === className) {
                        // Determine type
                        let type: 'interface' | 'abstract' | 'sealed' = 'interface';
                        if (line.includes('abstract class')) type = 'abstract';
                        else if (line.includes('sealed')) type = 'sealed';

                        interfaces.push({
                            name: className,
                            filePath,
                            lineNumber: i,
                            type,
                            language,
                            methods: []
                        });
                        break; // Found it, move to next file
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
            // Build include args - each extension needs its own --include flag
            const includeArgs = extensions.map(ext => `--include="*.${ext}"`).join(' ');
            const pattern = `(interface|abstract class|sealed interface|sealed class).*${interfaceName}`;
            const grepCommand = `grep -rn -E "${pattern}" ${includeArgs} "${searchPath}"`;

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
