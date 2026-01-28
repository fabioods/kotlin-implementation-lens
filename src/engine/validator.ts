/**
 * Validator - Validates that implementations have all required methods
 */

import * as vscode from 'vscode';
import { Implementation, InterfaceDeclaration, MethodDeclaration, ValidationResult, IValidator } from '../types';
import { extractMethodName, isCommentLine } from './patternBank';
import { getLogger } from '../utils/logger';
import { getLanguage } from '../utils/pathUtils';

export class Validator implements IValidator {
    /**
     * Validate that an implementation has all required methods
     */
    async validateImplementation(
        implementation: Implementation,
        interfaceDecl: InterfaceDeclaration
    ): Promise<ValidationResult> {
        try {
            // Extract methods from interface
            const interfaceMethods = await this.extractInterfaceMethods(interfaceDecl);

            // For abstract classes, only validate abstract methods
            const requiredMethods = interfaceMethods.filter(m =>
                interfaceDecl.type === 'abstract' ? m.isAbstract : !m.isDefault
            );

            if (requiredMethods.length === 0) {
                return { valid: true, details: 'No methods to validate' };
            }

            // Extract methods from implementation
            const classMethods = await this.extractClassMethods(
                implementation.className,
                implementation.filePath
            );

            // Check each required method exists in class
            const missingMethods: string[] = [];
            for (const method of requiredMethods) {
                const found = classMethods.some(m => m.name === method.name);
                if (!found) {
                    missingMethods.push(method.name);
                }
            }

            if (missingMethods.length > 0) {
                getLogger().warn(
                    `Incomplete implementation: ${implementation.className} missing methods: ${missingMethods.join(', ')}`
                );
                return {
                    valid: false,
                    missingMethods,
                    details: `Missing ${missingMethods.length} method(s)`
                };
            }

            return { valid: true };
        } catch (error) {
            getLogger().error('Validation error', error as Error);
            return { valid: true, details: 'Validation skipped due to error' };
        }
    }

    /**
     * Extract all methods from an interface or abstract class
     */
    async extractInterfaceMethods(interfaceDecl: InterfaceDeclaration): Promise<MethodDeclaration[]> {
        const methods: MethodDeclaration[] = [];

        try {
            const document = await vscode.workspace.openTextDocument(interfaceDecl.filePath);
            const text = document.getText();
            const lines = text.split('\n');

            let inInterface = false;
            let braceCount = 0;
            let inBlockComment = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmed = line.trim();

                // Track block comments
                if (trimmed.includes('/*')) inBlockComment = true;
                if (trimmed.includes('*/')) inBlockComment = false;
                if (inBlockComment || isCommentLine(line)) continue;

                // Find interface/abstract class start
                if (!inInterface && i === interfaceDecl.lineNumber) {
                    inInterface = true;
                }

                if (!inInterface) continue;

                // Track braces
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;

                // Extract method
                const methodName = extractMethodName(trimmed, interfaceDecl.language);
                if (methodName) {
                    const method: MethodDeclaration = {
                        name: methodName,
                        lineNumber: i,
                        signature: this.extractSignature(line),
                        isAbstract: this.isAbstractMethod(line, interfaceDecl.language),
                        isDefault: this.isDefaultMethod(line, interfaceDecl.language),
                        isSuspend: this.isSuspendMethod(line)
                    };
                    methods.push(method);
                }

                // End of interface
                if (braceCount === 0 && inInterface) {
                    break;
                }
            }

            getLogger().debug(`Extracted ${methods.length} methods from ${interfaceDecl.name}`);
        } catch (error) {
            getLogger().error(`Failed to extract methods from ${interfaceDecl.name}`, error as Error);
        }

        return methods;
    }

    /**
     * Extract all methods from a class
     */
    async extractClassMethods(className: string, filePath: string): Promise<MethodDeclaration[]> {
        const methods: MethodDeclaration[] = [];

        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            const text = document.getText();
            const lines = text.split('\n');

            let inClass = false;
            let braceCount = 0;
            let inBlockComment = false;
            const language = getLanguage(filePath);

            if (!language) return methods;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmed = line.trim();

                // Track block comments
                if (trimmed.includes('/*')) inBlockComment = true;
                if (trimmed.includes('*/')) inBlockComment = false;
                if (inBlockComment || isCommentLine(line)) continue;

                // Find class start
                if (!inClass && trimmed.includes(`class ${className}`)) {
                    inClass = true;
                }

                if (!inClass) continue;

                // Track braces
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;

                // Extract method
                const methodName = extractMethodName(trimmed, language);
                if (methodName) {
                    const method: MethodDeclaration = {
                        name: methodName,
                        lineNumber: i,
                        signature: this.extractSignature(line),
                        isAbstract: false,
                        isDefault: false,
                        isSuspend: this.isSuspendMethod(line)
                    };
                    methods.push(method);
                }

                // End of class
                if (braceCount === 0 && inClass) {
                    break;
                }
            }

            getLogger().debug(`Extracted ${methods.length} methods from ${className}`);
        } catch (error) {
            getLogger().error(`Failed to extract methods from ${className}`, error as Error);
        }

        return methods;
    }

    /**
     * Extract method signature from line
     */
    private extractSignature(line: string): string {
        // Simple signature extraction - can be enhanced
        const match = line.match(/fun\s+\w+\s*\([^)]*\)|[\w<>.*[\]]+\s+\w+\s*\([^)]*\)/);
        return match ? match[0] : '';
    }

    /**
     * Check if method is abstract
     */
    private isAbstractMethod(line: string, _language: 'kotlin' | 'java'): boolean {
        return line.includes('abstract');
    }

    /**
     * Check if method is default (Java 8+)
     */
    private isDefaultMethod(line: string, language: 'kotlin' | 'java'): boolean {
        if (language === 'java') {
            return line.includes('default');
        }
        return false;
    }

    /**
     * Check if method is suspend (Kotlin)
     */
    private isSuspendMethod(line: string): boolean {
        return line.includes('suspend');
    }
}

// Global validator instance
let globalValidator: Validator | null = null;

export function getValidator(): Validator {
    if (!globalValidator) {
        globalValidator = new Validator();
    }
    return globalValidator;
}

export function setValidator(validator: Validator): void {
    globalValidator = validator;
}
