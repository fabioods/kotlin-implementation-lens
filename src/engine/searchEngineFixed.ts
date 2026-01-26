/**
 * Fixed Search Engine - Handles multiline class declarations
 *
 * This version reads full file content to detect implementations
 * that span multiple lines (common in Kotlin with primary constructors)
 */

import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
    Implementation,
    MethodImplementation,
    InterfaceDeclaration,
    SearchConfig
} from '../types';
import { extractImplementation, extractInterfaceName, extractMethodName, KotlinPatterns, JavaPatterns } from './patternBank';
import { getWorkspaceRoot, normalizePath, getLanguage, toAbsolute } from '../utils/pathUtils';
import { getLogger } from '../utils/logger';
import { getCacheManager } from '../cache/cacheManager';

export class SearchEngineFixed {
    /**
     * Search for all implementations of an interface
     * Handles multiline class declarations
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
            const extensions = searchConfig.includeJavaFiles ? ['kt', 'java'] : ['kt'];

            // Strategy: Find all files that mention the interface name,
            // then read each file to check if it's an implementation
            for (const searchPath of searchConfig.searchPaths) {
                const absolutePath = toAbsolute(searchPath);

                if (!fs.existsSync(absolutePath)) {
                    getLogger().debug(`Skipping non-existent path: ${absolutePath}`);
                    continue;
                }

                // Find files that mention the interface
                const candidateFiles = await this.findCandidateFiles(
                    interfaceName,
                    absolutePath,
                    extensions,
                    searchConfig.excludePaths
                );

                // Check each file for actual implementation
                for (const filePath of candidateFiles) {
                    const impls = await this.extractImplementationsFromFile(
                        filePath,
                        interfaceName
                    );
                    implementations.push(...impls);
                }
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
            const extPattern = extensions.map(ext => `*.${ext}`).join(' ');

            // Build exclude args
            let excludeArgs = '';
            for (const excludePath of excludePaths) {
                excludeArgs += ` --exclude-dir="${excludePath}"`;
            }

            // Search for files mentioning the interface name
            const grepCommand = `grep -rl ${excludeArgs} "${interfaceName}" --include="${extPattern}" "${searchPath}"`;
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
            const document = await vscode.workspace.openTextDocument(filePath);
            const text = document.getText();
            const lines = text.split('\n');
            const language = getLanguage(filePath);

            if (!language) return implementations;

            // Read file with multiline support
            let i = 0;
            while (i < lines.length) {
                const line = lines[i].trim();

                // Check if line starts a class/object declaration
                if (this.isClassDeclaration(line, language)) {
                    // Read the next few lines to find inheritance
                    const classBlock = this.readClassDeclaration(lines, i, 10);
                    const impl = this.extractImplementationFromBlock(
                        classBlock,
                        interfaceName,
                        filePath,
                        i,
                        language
                    );

                    if (impl) {
                        implementations.push(impl);
                    }
                }

                i++;
            }

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
        let braceCount = 0;
        let foundColon = false;

        for (let i = startIndex; i < Math.min(startIndex + maxLines, lines.length); i++) {
            const line = lines[i];
            block += line + '\n';

            // Track if we've found the inheritance part
            if (line.includes(':')) {
                foundColon = true;
            }

            // Track opening brace
            if (line.includes('{')) {
                braceCount++;
                // If we've found colon and opening brace, we have the full declaration
                if (foundColon) {
                    break;
                }
            }

            // Also stop at closing parenthesis + colon (Kotlin primary constructor)
            if (/\)\s*:/.test(line)) {
                // Read one more line to get the interface name
                if (i + 1 < lines.length) {
                    block += lines[i + 1] + '\n';
                }
                break;
            }
        }

        return block;
    }

    /**
     * Extract implementation from a multiline block
     */
    private extractImplementationFromBlock(
        block: string,
        interfaceName: string,
        filePath: string,
        lineNumber: number,
        language: 'kotlin' | 'java'
    ): Implementation | null {
        // Remove newlines and extra spaces for pattern matching
        const singleLine = block.replace(/\n/g, ' ').replace(/\s+/g, ' ');

        // Check if this block implements the interface
        if (!singleLine.includes(interfaceName)) {
            return null;
        }

        // Extract class name
        const classMatch = singleLine.match(/class\s+([A-Z]\w*)/);
        if (!classMatch) return null;

        const className = classMatch[1];

        // Verify it actually implements the interface (not just mentions it)
        const implementsPattern = language === 'kotlin'
            ? new RegExp(`class\\s+${className}[^{]*:\\s*[^{]*${interfaceName}`)
            : new RegExp(`class\\s+${className}[^{]*implements[^{]*${interfaceName}`);

        if (!implementsPattern.test(singleLine)) {
            return null;
        }

        // Extract annotations (from original block with newlines)
        const annotations = this.extractAnnotationsFromBlock(block);

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
    private extractAnnotationsFromBlock(block: string): string[] {
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
     * Execute a shell command
     */
    private executeCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            child_process.exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
                if (error) {
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
