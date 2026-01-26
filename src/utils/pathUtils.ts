/**
 * Path utility functions
 */

import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Get the workspace root path
 */
export function getWorkspaceRoot(): string | undefined {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        return vscode.workspace.workspaceFolders[0].uri.fsPath;
    }
    return undefined;
}

/**
 * Convert absolute path to relative workspace path
 */
export function toWorkspaceRelative(absolutePath: string): string {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
        return absolutePath;
    }
    return path.relative(workspaceRoot, absolutePath);
}

/**
 * Convert relative workspace path to absolute path
 */
export function toAbsolute(relativePath: string): string {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
        return relativePath;
    }
    if (path.isAbsolute(relativePath)) {
        return relativePath;
    }
    return path.join(workspaceRoot, relativePath);
}

/**
 * Normalize path separators to forward slashes
 */
export function normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

/**
 * Check if a path matches any of the exclude patterns
 */
export function matchesExcludePattern(filePath: string, excludePatterns: RegExp[]): boolean {
    const normalizedPath = normalizePath(filePath);
    return excludePatterns.some(pattern => pattern.test(normalizedPath));
}

/**
 * Get file extension
 */
export function getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
}

/**
 * Check if file is Kotlin
 */
export function isKotlinFile(filePath: string): boolean {
    return getFileExtension(filePath) === '.kt';
}

/**
 * Check if file is Java
 */
export function isJavaFile(filePath: string): boolean {
    return getFileExtension(filePath) === '.java';
}

/**
 * Check if file is Kotlin or Java
 */
export function isKotlinOrJavaFile(filePath: string): boolean {
    const ext = getFileExtension(filePath);
    return ext === '.kt' || ext === '.java';
}

/**
 * Get language from file path
 */
export function getLanguage(filePath: string): 'kotlin' | 'java' | null {
    const ext = getFileExtension(filePath);
    if (ext === '.kt') return 'kotlin';
    if (ext === '.java') return 'java';
    return null;
}

/**
 * Build glob pattern for searching files
 */
export function buildGlobPattern(searchPaths: string[], fileExtensions: string[]): string {
    if (searchPaths.length === 0) {
        return `**/*.{${fileExtensions.join(',')}}`;
    }

    if (searchPaths.length === 1) {
        return `${searchPaths[0]}/**/*.{${fileExtensions.join(',')}}`;
    }

    return `{${searchPaths.join(',')}}/**/*.{${fileExtensions.join(',')}}`;
}

/**
 * Extract directory from file path
 */
export function getDirectory(filePath: string): string {
    return path.dirname(filePath);
}

/**
 * Extract filename from file path
 */
export function getFilename(filePath: string): string {
    return path.basename(filePath);
}

/**
 * Extract filename without extension
 */
export function getFilenameWithoutExtension(filePath: string): string {
    const filename = getFilename(filePath);
    const ext = getFileExtension(filePath);
    return filename.substring(0, filename.length - ext.length);
}

/**
 * Check if path exists and is within workspace
 */
export function isWithinWorkspace(filePath: string): boolean {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
        return false;
    }
    const normalizedPath = normalizePath(path.resolve(filePath));
    const normalizedRoot = normalizePath(workspaceRoot);
    return normalizedPath.startsWith(normalizedRoot);
}

/**
 * Create URI from file path
 */
export function createUri(filePath: string): vscode.Uri {
    return vscode.Uri.file(filePath);
}

/**
 * Create position from line number (0-indexed)
 */
export function createPosition(lineNumber: number): vscode.Position {
    return new vscode.Position(lineNumber, 0);
}

/**
 * Create range from line number
 */
export function createRange(lineNumber: number): vscode.Range {
    const position = createPosition(lineNumber);
    return new vscode.Range(position, position);
}

/**
 * Create location from file path and line number
 */
export function createLocation(filePath: string, lineNumber: number): vscode.Location {
    return new vscode.Location(createUri(filePath), createRange(lineNumber));
}
