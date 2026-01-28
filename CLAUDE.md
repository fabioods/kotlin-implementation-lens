# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
# Compile TypeScript to JavaScript
npm run compile

# Watch mode for development (auto-recompile on changes)
npm run watch

# Run linter
npm run lint

# Run tests
npm run test

# Build for production (used before publishing)
npm run vscode:prepublish
```

## Testing the Extension

1. Open the project in VS Code/Cursor
2. Press `F5` to launch the Extension Development Host
3. Open a Kotlin or Java project in the new window
4. CodeLens should appear on interfaces and abstract classes

## Architecture

This is a VS Code extension that provides CodeLens navigation between Kotlin/Java interfaces and their implementations.

### Core Components

**Providers** (`src/providers/`): Three CodeLens providers registered for both Kotlin and Java files:
- `InterfaceImplementationLensProvider`: Shows "N implementations" above interfaces/abstract classes
- `MethodImplementationLensProvider`: Shows "N impls" next to interface methods
- `ReverseNavigationLensProvider`: Shows "← InterfaceName" on override methods

**Search Engine** (`src/engine/searchEngine.ts`): Grep-based search for implementations. Key features:
- Two-phase search: first finds candidate files mentioning interface name, then parses each file for actual implementations
- Handles multiline class declarations (up to 20 lines)
- **Pending search deduplication**: Maps track ongoing searches to avoid redundant grep calls when multiple CodeLens request same interface
- Uses `execFile` instead of `exec` for security (prevents shell injection)
- Validates search terms before execution
- Distinguishes between constructor parameter types (`: Interface` as param) vs inheritance (`: Interface` as implemented)
- Parallel method searches for better performance

**Pattern Bank** (`src/engine/patternBank.ts`): Regex patterns for Kotlin and Java syntax. Supports:
- Kotlin: `interface`, `fun interface` (SAM), `sealed interface`, `abstract class`, `sealed class`, `value class`, `enum class`
- Java: `interface`, `abstract class`, `record`, `enum`
- Method extraction, Spring Boot annotations, and more

**Module Detector** (`src/engine/moduleDetector.ts`): Auto-detects Gradle/Maven multi-module project structure (reads `settings.gradle[.kts]` and `pom.xml`)

**Filter Engine** (`src/engine/filterEngine.ts`): Excludes test doubles (Mock*, *Mock, *Stub, *Fake) and test directories

**Cache Manager** (`src/cache/cacheManager.ts`): TTL-based cache with file-change invalidation. Features:
- Separate TTL for negative cache entries (1 minute) vs positive results (configurable, default 10 minutes)
- Cache keys use prefixes: `interface:`, `method:`, `interfaces:`
- Automatic cleanup every 60 seconds
- Version-based cache invalidation (clears on extension update)

### Commands (`src/commands/`)

Each command is registered separately. The extension command prefix is `kotlin-implementation-lens`.

Available commands:
- `showImplementations`: Display all implementations of an interface
- `showMethodImplementations`: Display method-specific implementations
- `gotoInterface`: Navigate to interface/abstract class declaration
- `showHierarchy`: Display interface hierarchy tree
- `clearCache`: Clear all cached search results
- `openSettings`: Quick access to extension settings
- `setupPerformance`: **NEW** - Auto-configure performance optimization settings (Java heap, search paths, Gradle optimization)
- `refresh`: Refresh all CodeLens

### Type System (`src/types/index.ts`)

Key interfaces: `Implementation`, `MethodImplementation`, `InterfaceDeclaration`, `SearchConfig`

### Extension Lifecycle

- Activates on `onLanguage:kotlin` or `onLanguage:java`
- Clears cache on version updates
- Watches for `.kt` and `.java` file changes to invalidate cache
- Runs cache cleanup every 60 seconds

## Configuration Namespace

All settings use the `kotlinImplementationLens` namespace. Key settings:
- `searchPaths`: Directories to search (auto-detected if using defaults)
- `excludePaths`: Directories to exclude
- `cacheTimeout`: Cache TTL in milliseconds (default 10 min)
- `filterMocks`: Exclude test doubles
- `includeJavaFiles`: Include Java in searches
- `showMethodLens`: Show method-level CodeLens
- `showReverseNavigation`: Show reverse navigation CodeLens
- `includeAbstractClasses`: Support abstract classes
- `annotationFilters`: Spring Boot annotations to detect

## Recent Major Changes (v2.3.0 - v2.3.2)

### Version 2.3.2
- **Reverse Navigation Fix**: Correctly identifies interfaces when class extends parent class with constructor
  - Added `extractTypeNameFromInheritance()` helper in `ReverseNavigationLensProvider`
  - Filters out class constructors (with parentheses) and keeps interface names
  - Handles complex patterns like: `class Impl(...) : BaseClass(...), Interface {`
- **Parallel Search Execution**: All grep searches now run in parallel using `Promise.all()`
  - Applied to `executeImplementationSearch` and `executeInterfaceDeclarationSearch`
  - **2x performance improvement** for multi-module projects
  - Sequential: 3.3s + 2.4s = 6s total → Parallel: ~3.3s total

### Version 2.3.1
- **Extended Pattern Support**: Added support for modern Kotlin/Java constructs
  - Kotlin: `fun interface` (SAM), `value class`, `enum class`
  - Java: `record`, `enum`
- **Auto Cache Invalidation**: Cache clears automatically on version updates

### Version 2.3.0
- **Setup Performance Command**: One-click configuration for optimal performance
- **Search Deduplication**: Eliminates duplicate searches when multiple CodeLens request same interface
- **Improved Caching**: Separate TTL for negative results, better cleanup
- **Security**: Uses `execFile` instead of `exec` to prevent shell injection
- **CodeLens Resolution**: Moved from `provideCodeLenses` to `resolveCodeLens` for better performance

## Performance Characteristics

- **First search**: ~500ms (depends on project size)
- **Cached search**: < 50ms
- **Parallel duplicate searches**: < 10ms (reuses pending search)
- **Memory usage**: ~100-200MB
- **Cache cleanup**: Runs every 60 seconds
