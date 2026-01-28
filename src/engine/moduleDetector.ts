/**
 * Module Detector - Automatically detects Gradle/Maven modules
 *
 * Mimics IntelliJ IDEA's behavior of auto-detecting project structure
 * by reading build files and finding all source directories
 */

import * as fs from 'fs';
import * as path from 'path';
import { getWorkspaceRoot } from '../utils/pathUtils';
import { getLogger } from '../utils/logger';

export interface ModuleInfo {
    name: string;
    path: string;
    sourceDirs: string[];
    testDirs: string[];
}

export class ModuleDetector {
    /**
     * Auto-detect all modules in the workspace (like IntelliJ)
     */
    async detectModules(): Promise<string[]> {
        const workspaceRoot = getWorkspaceRoot();
        if (!workspaceRoot) {
            getLogger().warn('No workspace root found for module detection');
            return this.getDefaultSearchPaths();
        }

        try {
            // Check if it's a Gradle project
            if (this.isGradleProject(workspaceRoot)) {
                getLogger().info('Detected Gradle project, scanning for modules...');
                return await this.detectGradleModules(workspaceRoot);
            }

            // Check if it's a Maven project
            if (this.isMavenProject(workspaceRoot)) {
                getLogger().info('Detected Maven project, scanning for modules...');
                return await this.detectMavenModules(workspaceRoot);
            }

            // Fallback: scan for any src/main/kotlin or src/main/java directories
            getLogger().info('No build system detected, scanning for source directories...');
            return await this.scanForSourceDirectories(workspaceRoot);

        } catch (error) {
            getLogger().error('Error detecting modules', error as Error);
            return this.getDefaultSearchPaths();
        }
    }

    /**
     * Check if it's a Gradle project
     */
    private isGradleProject(workspaceRoot: string): boolean {
        return fs.existsSync(path.join(workspaceRoot, 'settings.gradle')) ||
               fs.existsSync(path.join(workspaceRoot, 'settings.gradle.kts')) ||
               fs.existsSync(path.join(workspaceRoot, 'build.gradle')) ||
               fs.existsSync(path.join(workspaceRoot, 'build.gradle.kts'));
    }

    /**
     * Check if it's a Maven project
     */
    private isMavenProject(workspaceRoot: string): boolean {
        return fs.existsSync(path.join(workspaceRoot, 'pom.xml'));
    }

    /**
     * Detect Gradle modules by reading settings.gradle[.kts]
     */
    private async detectGradleModules(workspaceRoot: string): Promise<string[]> {
        const searchPaths: string[] = [];

        try {
            // Read settings.gradle or settings.gradle.kts
            const settingsFile = fs.existsSync(path.join(workspaceRoot, 'settings.gradle.kts'))
                ? path.join(workspaceRoot, 'settings.gradle.kts')
                : path.join(workspaceRoot, 'settings.gradle');

            if (fs.existsSync(settingsFile)) {
                const content = fs.readFileSync(settingsFile, 'utf8');

                // Extract module names from include() statements
                // Example: include(":core", ":application", ":domain")
                const includeMatches = content.matchAll(/include\s*\(\s*["'](:[^"']+)["']\s*\)/g);

                for (const match of includeMatches) {
                    const moduleName = match[1].replace(':', ''); // Remove leading :

                    // Add standard source paths for each module
                    searchPaths.push(`${moduleName}/src/main/kotlin`);
                    searchPaths.push(`${moduleName}/src/main/java`);
                }

                getLogger().info(`Found ${searchPaths.length / 2} Gradle modules`);
            }

            // Also scan for modules not in settings.gradle (fallback)
            if (searchPaths.length === 0) {
                return await this.scanForSourceDirectories(workspaceRoot);
            }

            // Add root module source paths
            searchPaths.push('src/main/kotlin');
            searchPaths.push('src/main/java');

        } catch (error) {
            getLogger().error('Error reading Gradle settings', error as Error);
        }

        return this.filterExistingPaths(workspaceRoot, searchPaths);
    }

    /**
     * Detect Maven modules by reading pom.xml
     */
    private async detectMavenModules(workspaceRoot: string): Promise<string[]> {
        const searchPaths: string[] = [];

        try {
            const pomFile = path.join(workspaceRoot, 'pom.xml');
            const content = fs.readFileSync(pomFile, 'utf8');

            // Extract module names from <module> tags
            // Example: <module>core</module>
            const moduleMatches = content.matchAll(/<module>([^<]+)<\/module>/g);

            for (const match of moduleMatches) {
                const moduleName = match[1];

                // Add standard source paths for each module
                searchPaths.push(`${moduleName}/src/main/kotlin`);
                searchPaths.push(`${moduleName}/src/main/java`);
            }

            getLogger().info(`Found ${searchPaths.length / 2} Maven modules`);

            // Add root module source paths
            searchPaths.push('src/main/kotlin');
            searchPaths.push('src/main/java');

        } catch (error) {
            getLogger().error('Error reading Maven pom.xml', error as Error);
        }

        return this.filterExistingPaths(workspaceRoot, searchPaths);
    }

    /**
     * Scan for any src/main/kotlin or src/main/java directories
     * This is the most robust fallback that works like IntelliJ's "scan for sources"
     */
    private async scanForSourceDirectories(workspaceRoot: string): Promise<string[]> {
        const searchPaths: string[] = [];

        try {
            // Find all directories matching **/src/main/kotlin or **/src/main/java
            const kotlinDirs = this.findDirectories(workspaceRoot, 'src/main/kotlin', 5);
            const javaDirs = this.findDirectories(workspaceRoot, 'src/main/java', 5);

            // Convert absolute paths to workspace-relative paths
            for (const dir of [...kotlinDirs, ...javaDirs]) {
                const relativePath = path.relative(workspaceRoot, dir);
                searchPaths.push(relativePath);
            }

            // Also add common Android/Kotlin Multiplatform patterns
            const commonDirs = this.findDirectories(workspaceRoot, 'src/commonMain/kotlin', 5);
            for (const dir of commonDirs) {
                const relativePath = path.relative(workspaceRoot, dir);
                searchPaths.push(relativePath);
            }

            getLogger().info(`Scanned workspace, found ${searchPaths.length} source directories`);

        } catch (error) {
            getLogger().error('Error scanning for source directories', error as Error);
        }

        // Fallback to defaults if nothing found
        if (searchPaths.length === 0) {
            return this.getDefaultSearchPaths();
        }

        return searchPaths;
    }

    /**
     * Recursively find directories matching a name pattern
     */
    private findDirectories(root: string, targetPath: string, maxDepth: number): string[] {
        const results: string[] = [];

        const scan = (dir: string, depth: number) => {
            if (depth > maxDepth) return;

            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });

                for (const entry of entries) {
                    if (!entry.isDirectory()) continue;

                    const fullPath = path.join(dir, entry.name);

                    // Skip common exclude directories
                    if (this.shouldExcludeDirectory(entry.name)) continue;

                    // Check if this matches our target path
                    if (fullPath.endsWith(targetPath)) {
                        results.push(fullPath);
                    }

                    // Recurse into subdirectory
                    scan(fullPath, depth + 1);
                }
            } catch (error) {
                // Permission denied or other errors - log at debug level and continue
                getLogger().debug(`Skipping directory during scan: ${dir}`, error as Error);
            }
        };

        scan(root, 0);
        return results;
    }

    /**
     * Check if directory should be excluded from scanning
     */
    private shouldExcludeDirectory(name: string): boolean {
        const excludes = [
            'build',
            'target',
            '.gradle',
            '.mvn',
            'node_modules',
            '.git',
            '.idea',
            'out',
            'dist'
        ];
        return excludes.includes(name) || name.startsWith('.');
    }

    /**
     * Filter paths to only include those that exist
     */
    private filterExistingPaths(workspaceRoot: string, paths: string[]): string[] {
        return paths.filter(p => {
            const fullPath = path.join(workspaceRoot, p);
            const exists = fs.existsSync(fullPath);
            if (!exists) {
                getLogger().debug(`Path does not exist, skipping: ${p}`);
            }
            return exists;
        });
    }

    /**
     * Get default search paths as fallback
     */
    private getDefaultSearchPaths(): string[] {
        return [
            'src/main/kotlin',
            'src/main/java',
            'src',
            'app/src/main',
            'core/src/main'
        ];
    }

    /**
     * Get exclude paths (build directories, etc.)
     */
    getDefaultExcludePaths(): string[] {
        return [
            'test',
            'androidTest',
            '**/build',
            '**/target',
            '**/mocks',
            '**/.gradle',
            '**/node_modules'
        ];
    }
}

// Global instance
let globalModuleDetector: ModuleDetector | null = null;

export function getModuleDetector(): ModuleDetector {
    if (!globalModuleDetector) {
        globalModuleDetector = new ModuleDetector();
    }
    return globalModuleDetector;
}
