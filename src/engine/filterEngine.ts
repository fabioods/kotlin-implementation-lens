/**
 * Filter Engine - Smart filtering of mock/test implementations
 */

import { Implementation, IFilterEngine } from '../types';
import { PathPatterns, TypeNamePatterns, AnnotationPatterns } from './patternBank';
import { normalizePath } from '../utils/pathUtils';
import { getLogger } from '../utils/logger';

export class FilterEngine implements IFilterEngine {
    private enabled: boolean;

    constructor(enabled: boolean = true) {
        this.enabled = enabled;
    }

    /**
     * Filter out mock/test implementations from the list
     */
    filterMocks<T extends Implementation>(implementations: T[]): T[] {
        if (!this.enabled) {
            return implementations;
        }

        const filtered = implementations.filter(impl => !this.shouldExclude(impl.filePath, impl.className));

        const removedCount = implementations.length - filtered.length;
        if (removedCount > 0) {
            getLogger().debug(`Filtered out ${removedCount} mock/test implementations`);
        }

        return filtered as T[];
    }

    /**
     * Check if an implementation should be excluded
     */
    shouldExclude(filePath: string, className: string): boolean {
        if (!this.enabled) {
            return false;
        }

        // Level 1: File path filtering
        if (this.isTestPath(filePath)) {
            getLogger().debug(`Excluded by path: ${filePath}`);
            return true;
        }

        // Level 2: Type name filtering
        if (this.isMockClassName(className)) {
            getLogger().debug(`Excluded by class name: ${className}`);
            return true;
        }

        return false;
    }

    /**
     * Check if file path is in a test directory
     */
    private isTestPath(filePath: string): boolean {
        const normalized = normalizePath(filePath);

        // Check test directories
        for (const pattern of PathPatterns.testDirs) {
            if (pattern.test(normalized)) {
                return true;
            }
        }

        // Check mock directories
        for (const pattern of PathPatterns.mockDirs) {
            if (pattern.test(normalized)) {
                return true;
            }
        }

        // Check build directories
        for (const pattern of PathPatterns.buildDirs) {
            if (pattern.test(normalized)) {
                return true;
            }
        }

        // Check test file suffixes
        for (const pattern of PathPatterns.testFiles) {
            if (pattern.test(normalized)) {
                return true;
            }
        }

        // Check mock file suffixes
        for (const pattern of PathPatterns.mockFiles) {
            if (pattern.test(normalized)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if class name indicates a mock/test
     */
    private isMockClassName(className: string): boolean {
        for (const pattern of TypeNamePatterns.mocks) {
            if (pattern.test(className)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if annotations indicate a test class
     */
    hasTestAnnotations(annotations: string[]): boolean {
        return annotations.some(annotation =>
            AnnotationPatterns.testAnnotations.includes(`@${annotation}`)
        );
    }

    /**
     * Check if annotations indicate a Spring Boot component
     */
    hasSpringAnnotations(annotations: string[]): boolean {
        return annotations.some(annotation =>
            AnnotationPatterns.springAnnotations.includes(`@${annotation}`)
        );
    }

    /**
     * Enable or disable filtering
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        getLogger().info(`Mock filtering ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get enabled status
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Filter implementations by annotation
     */
    filterByAnnotation<T extends Implementation>(implementations: T[], annotations: string[]): T[] {
        if (annotations.length === 0) {
            return implementations;
        }

        return implementations.filter(impl => {
            if (!impl.annotations || impl.annotations.length === 0) {
                return false;
            }

            // Check if implementation has any of the requested annotations
            return impl.annotations.some(ann => annotations.includes(ann));
        }) as T[];
    }

    /**
     * Sort implementations by annotation priority (Spring annotations first)
     */
    sortByAnnotation<T extends Implementation>(implementations: T[]): T[] {
        return implementations.sort((a, b) => {
            const aHasSpring = a.annotations && this.hasSpringAnnotations(a.annotations);
            const bHasSpring = b.annotations && this.hasSpringAnnotations(b.annotations);

            if (aHasSpring && !bHasSpring) return -1;
            if (!aHasSpring && bHasSpring) return 1;

            // Alphabetical by class name
            return a.className.localeCompare(b.className);
        }) as T[];
    }
}

// Global filter engine instance
let globalFilterEngine: FilterEngine | null = null;

export function getFilterEngine(): FilterEngine {
    if (!globalFilterEngine) {
        globalFilterEngine = new FilterEngine();
    }
    return globalFilterEngine;
}

export function setFilterEngine(filterEngine: FilterEngine): void {
    globalFilterEngine = filterEngine;
}
