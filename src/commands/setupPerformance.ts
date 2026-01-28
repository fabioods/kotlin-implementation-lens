/**
 * Setup Performance Optimization Command
 * Automatically configures VS Code/Cursor settings for optimal performance
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getLogger } from '../utils/logger';
import { getWorkspaceRoot } from '../utils/pathUtils';
import { getModuleDetector } from '../engine/moduleDetector';

interface SettingsConfig {
    [key: string]: unknown;
}

interface SetupOptions {
    enableAnnotationProcessing: boolean;
    includeJavaFiles: boolean;
    filterMocks: boolean;
    cacheTimeout: number;
}

export function registerSetupPerformanceCommand(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('kotlin-implementation-lens.setupPerformance', async () => {
            const logger = getLogger();
            logger.info('Starting performance optimization setup');

            // Step 1: Ask user which scope
            const scope = await vscode.window.showQuickPick([
                {
                    label: '🌍 Global Settings (Recommended)',
                    description: 'Configure for all projects - one time setup',
                    value: 'global'
                },
                {
                    label: '📁 Current Project Only',
                    description: 'Configure .vscode/settings.json for this project',
                    value: 'local'
                }
            ], {
                placeHolder: 'Step 1/5: Where do you want to apply settings?'
            });

            if (!scope) {
                return; // User cancelled
            }

            // Step 2: Ask about annotation processing (Lombok, Dagger, etc.)
            const annotationProcessing = await vscode.window.showQuickPick([
                {
                    label: '✅ Yes, I use Lombok/Dagger/MapStruct',
                    description: 'Keep annotation processing enabled for code generation',
                    value: true
                },
                {
                    label: '⚡ No, optimize for speed',
                    description: 'Disable annotation processing for faster imports',
                    value: false
                }
            ], {
                placeHolder: 'Step 2/5: Do you use annotation processors (Lombok, Dagger, MapStruct)?'
            });

            if (annotationProcessing === undefined) {
                return;
            }

            // Step 3: Ask about Java file inclusion
            const includeJava = await vscode.window.showQuickPick([
                {
                    label: '☕ Yes, include Java files',
                    description: 'Search both .kt and .java files for implementations',
                    value: true
                },
                {
                    label: '🎯 No, Kotlin only (faster)',
                    description: 'Only search .kt files - recommended for pure Kotlin projects',
                    value: false
                }
            ], {
                placeHolder: 'Step 3/5: Does your project have Java implementations?'
            });

            if (includeJava === undefined) {
                return;
            }

            // Step 4: Ask about mock filtering
            const filterMocks = await vscode.window.showQuickPick([
                {
                    label: '🧹 Yes, filter mocks (Recommended)',
                    description: 'Hide MockXxx, XxxMock, XxxStub, XxxFake from results',
                    value: true
                },
                {
                    label: '📋 No, show all implementations',
                    description: 'Include test doubles in implementation list',
                    value: false
                }
            ], {
                placeHolder: 'Step 4/5: Hide mock/stub/fake implementations from results?'
            });

            if (filterMocks === undefined) {
                return;
            }

            // Step 5: Ask about cache duration
            const cacheTimeout = await vscode.window.showQuickPick([
                {
                    label: '⚡ 5 minutes (Default)',
                    description: 'Good balance between freshness and performance',
                    value: 300000
                },
                {
                    label: '🚀 10 minutes (Recommended for large projects)',
                    description: 'Fewer re-scans, better performance',
                    value: 600000
                },
                {
                    label: '💨 2 minutes (Fresh results)',
                    description: 'More frequent re-scans, always up-to-date',
                    value: 120000
                }
            ], {
                placeHolder: 'Step 5/5: How long to cache implementation results?'
            });

            if (cacheTimeout === undefined) {
                return;
            }

            const options: SetupOptions = {
                enableAnnotationProcessing: annotationProcessing.value,
                includeJavaFiles: includeJava.value,
                filterMocks: filterMocks.value,
                cacheTimeout: cacheTimeout.value
            };

            try {
                if (scope.value === 'global') {
                    await setupGlobalSettings(options);
                } else {
                    await setupLocalSettings(options);
                }

                // Show success message with summary
                const summary = [
                    `Annotation Processing: ${options.enableAnnotationProcessing ? 'Enabled' : 'Disabled'}`,
                    `Java Files: ${options.includeJavaFiles ? 'Included' : 'Kotlin only'}`,
                    `Mock Filter: ${options.filterMocks ? 'On' : 'Off'}`,
                    `Cache: ${options.cacheTimeout / 60000} minutes`
                ].join(' | ');

                const action = await vscode.window.showInformationMessage(
                    `✅ Setup complete! ${summary}. Restart to activate.`,
                    'Restart Now',
                    'Later'
                );

                if (action === 'Restart Now') {
                    await vscode.commands.executeCommand('workbench.action.reloadWindow');
                }

            } catch (error) {
                logger.error('Failed to setup performance optimization', error as Error);
                vscode.window.showErrorMessage(`Failed to apply settings: ${(error as Error).message}`);
            }
        })
    );
}

/**
 * Setup global (user) settings
 */
async function setupGlobalSettings(options: SetupOptions) {
    const config = vscode.workspace.getConfiguration();

    // Java Language Server - Memory & Performance
    await config.update('java.jdt.ls.vmargs',
        '-XX:+UseParallelGC -XX:GCTimeRatio=4 -XX:AdaptiveSizePolicyWeight=90 -Dsun.zip.disableMemoryMapping=true -Xmx4G -Xms1G -Xlog:disable',
        vscode.ConfigurationTarget.Global);

    await config.update('java.autobuild.enabled', true, vscode.ConfigurationTarget.Global);
    await config.update('java.maxConcurrentBuilds', 2, vscode.ConfigurationTarget.Global);

    // Gradle - Reduce sync overhead
    await config.update('java.import.gradle.offline.enabled', false, vscode.ConfigurationTarget.Global);
    await config.update('java.import.gradle.wrapper.enabled', true, vscode.ConfigurationTarget.Global);

    // Gradle - Use local cache (if exists)
    const gradleHome = process.env.GRADLE_HOME || path.join(process.env.HOME || '', '.gradle');
    if (fs.existsSync(gradleHome)) {
        await config.update('java.import.gradle.home', gradleHome, vscode.ConfigurationTarget.Global);
    }

    // Java - Annotation processing (based on user preference)
    await config.update('java.import.gradle.annotationProcessing.enabled', options.enableAnnotationProcessing, vscode.ConfigurationTarget.Global);

    // Kotlin Implementation Lens
    await config.update('kotlinImplementationLens.cacheTimeout', options.cacheTimeout, vscode.ConfigurationTarget.Global);
    await config.update('kotlinImplementationLens.filterMocks', options.filterMocks, vscode.ConfigurationTarget.Global);
    await config.update('kotlinImplementationLens.includeJavaFiles', options.includeJavaFiles, vscode.ConfigurationTarget.Global);

    // File Watcher
    const watcherExclude = config.get<Record<string, boolean>>('files.watcherExclude') || {};
    const newExcludes = {
        ...watcherExclude,
        '**/.git/objects/**': true,
        '**/node_modules/**': true,
        '**/target/**': true,
        '**/build/**': true,
        '**/.gradle/**': true,
        '**/.idea/**': true
    };
    await config.update('files.watcherExclude', newExcludes, vscode.ConfigurationTarget.Global);

    getLogger().info('Global settings updated successfully');
}

/**
 * Setup local (workspace) settings
 */
async function setupLocalSettings(options: SetupOptions) {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
        throw new Error('No workspace folder open');
    }

    const vscodeDir = path.join(workspaceRoot, '.vscode');
    const settingsFile = path.join(vscodeDir, 'settings.json');

    // Create .vscode directory if it doesn't exist
    if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir, { recursive: true });
    }

    // Detect project structure using moduleDetector (avoid code duplication)
    const searchPaths = await getModuleDetector().detectModules();

    // Read existing settings or create new
    let settings: SettingsConfig = {};
    if (fs.existsSync(settingsFile)) {
        try {
            const content = fs.readFileSync(settingsFile, 'utf8');
            settings = JSON.parse(content);

            // Backup existing file
            fs.writeFileSync(settingsFile + '.backup', content);
            getLogger().info('Backup created: settings.json.backup');
        } catch (error) {
            getLogger().warn('Could not parse existing settings.json, will create new one');
        }
    }

    // Merge with performance settings
    settings = {
        ...settings,
        // Java Language Server - Memory & Performance
        'java.jdt.ls.vmargs': '-XX:+UseParallelGC -XX:GCTimeRatio=4 -XX:AdaptiveSizePolicyWeight=90 -Dsun.zip.disableMemoryMapping=true -Xmx4G -Xms1G -Xlog:disable',
        'java.autobuild.enabled': true,
        'java.maxConcurrentBuilds': 2,
        // Gradle - Reduce sync overhead
        'java.import.gradle.offline.enabled': false,
        'java.import.gradle.wrapper.enabled': true,
        'java.import.gradle.annotationProcessing.enabled': options.enableAnnotationProcessing,
        // Kotlin Implementation Lens
        'kotlinImplementationLens.cacheTimeout': options.cacheTimeout,
        'kotlinImplementationLens.searchPaths': searchPaths,
        'kotlinImplementationLens.excludePaths': getModuleDetector().getDefaultExcludePaths(),
        'kotlinImplementationLens.includeJavaFiles': options.includeJavaFiles,
        'kotlinImplementationLens.filterMocks': options.filterMocks,
        'files.exclude': {
            ...((settings['files.exclude'] as Record<string, boolean>) || {}),
            '**/.gradle': true,
            '**/build': true
        },
        'files.watcherExclude': {
            ...((settings['files.watcherExclude'] as Record<string, boolean>) || {}),
            '**/.git/objects/**': true,
            '**/target/**': true,
            '**/build/**': true,
            '**/.gradle/**': true
        }
    };

    // Write settings
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    getLogger().info(`Local settings updated: ${settingsFile}`);

    // Show info about detected paths
    vscode.window.showInformationMessage(
        `Detected ${searchPaths.length} source path(s): ${searchPaths.join(', ')}`
    );
}
