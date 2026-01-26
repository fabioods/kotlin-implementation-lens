/**
 * Type definitions for Kotlin/Java Implementation Lens
 */

import * as vscode from 'vscode';

/**
 * Represents a found implementation of an interface or abstract class
 */
export interface Implementation {
    /** Name of the implementing class */
    className: string;
    /** Full file path to the implementation */
    filePath: string;
    /** Line number where the class is declared */
    lineNumber: number;
    /** Optional: detected Spring Boot annotations */
    annotations?: string[];
    /** Optional: whether this is a data class */
    isDataClass?: boolean;
    /** Optional: whether this uses delegation */
    usesDelegation?: boolean;
}

/**
 * Represents a method implementation
 */
export interface MethodImplementation extends Implementation {
    /** Name of the method */
    methodName: string;
    /** Method signature (for validation) */
    signature?: string;
}

/**
 * Represents an interface or abstract class declaration
 */
export interface InterfaceDeclaration {
    /** Name of the interface/abstract class */
    name: string;
    /** Full file path */
    filePath: string;
    /** Line number */
    lineNumber: number;
    /** Type: 'interface', 'abstract', or 'sealed' */
    type: 'interface' | 'abstract' | 'sealed';
    /** Language: 'kotlin' or 'java' */
    language: 'kotlin' | 'java';
    /** List of methods declared */
    methods: MethodDeclaration[];
}

/**
 * Represents a method declaration in an interface/abstract class
 */
export interface MethodDeclaration {
    /** Method name */
    name: string;
    /** Line number */
    lineNumber: number;
    /** Method signature (return type + parameters) */
    signature: string;
    /** Whether this is an abstract method */
    isAbstract: boolean;
    /** Whether this is a default method (Java) */
    isDefault: boolean;
    /** Whether this is a suspend function (Kotlin) */
    isSuspend: boolean;
}

/**
 * Search configuration for finding implementations
 */
export interface SearchConfig {
    /** Paths to search in */
    searchPaths: string[];
    /** Paths to exclude */
    excludePaths: string[];
    /** File extensions to search */
    fileExtensions: string[];
    /** Whether to filter mocks */
    filterMocks: boolean;
    /** Whether to include Java files */
    includeJavaFiles: boolean;
    /** Spring Boot annotations to detect */
    annotationFilters: string[];
}

/**
 * Cache entry with TTL
 */
export interface CacheEntry<T> {
    /** Cached value */
    value: T;
    /** Timestamp when cached */
    timestamp: number;
}

/**
 * Validation result for implementation checking
 */
export interface ValidationResult {
    /** Whether the implementation is valid */
    valid: boolean;
    /** Missing methods if invalid */
    missingMethods?: string[];
    /** Extra details */
    details?: string;
}

/**
 * Pattern matching result
 */
export interface PatternMatch {
    /** Matched text */
    match: string;
    /** Capture groups */
    groups: string[];
    /** Line number */
    lineNumber: number;
}

/**
 * Interface hierarchy node
 */
export interface HierarchyNode {
    /** Interface/class name */
    name: string;
    /** Type */
    type: 'interface' | 'abstract' | 'sealed' | 'class';
    /** File path */
    filePath: string;
    /** Line number */
    lineNumber: number;
    /** Child nodes (implementations or sub-interfaces) */
    children: HierarchyNode[];
    /** Parent nodes (extended interfaces) */
    parents: HierarchyNode[];
}

/**
 * Quick pick item with additional metadata
 */
export interface ImplementationQuickPickItem extends vscode.QuickPickItem {
    /** Implementation data */
    implementation: Implementation;
}

/**
 * Configuration manager interface
 */
export interface IConfigManager {
    getSearchPaths(): string[];
    getExcludePaths(): string[];
    shouldShowMethodLens(): boolean;
    shouldShowReverseNavigation(): boolean;
    shouldFilterMocks(): boolean;
    shouldIncludeAbstractClasses(): boolean;
    shouldIncludeJavaFiles(): boolean;
    getAnnotationFilters(): string[];
    getCacheTimeout(): number;
}

/**
 * Search engine interface
 */
export interface ISearchEngine {
    searchImplementations(interfaceName: string, searchConfig: SearchConfig): Promise<Implementation[]>;
    searchMethodImplementations(interfaceName: string, methodName: string, searchConfig: SearchConfig): Promise<MethodImplementation[]>;
    findInterfaceDeclarations(className: string, searchConfig: SearchConfig): Promise<InterfaceDeclaration[]>;
}

/**
 * Filter engine interface
 */
export interface IFilterEngine {
    filterMocks<T extends Implementation>(implementations: T[]): T[];
    shouldExclude(filePath: string, className: string): boolean;
}

/**
 * Validator interface
 */
export interface IValidator {
    validateImplementation(implementation: Implementation, interfaceDecl: InterfaceDeclaration): Promise<ValidationResult>;
    extractInterfaceMethods(interfaceDecl: InterfaceDeclaration): Promise<MethodDeclaration[]>;
    extractClassMethods(className: string, filePath: string): Promise<MethodDeclaration[]>;
}

/**
 * Cache manager interface
 */
export interface ICacheManager {
    get<T>(key: string): T | null;
    set<T>(key: string, value: T): void;
    invalidate(key: string): void;
    invalidateByFile(filePath: string): void;
    clear(): void;
}

/**
 * Logger interface
 */
export interface ILogger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string, error?: Error): void;
    debug(message: string): void;
}
