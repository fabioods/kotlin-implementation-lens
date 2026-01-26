# Changelog

All notable changes to the Kotlin/Java Implementation Lens extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-26

### 🎉 Major Release - Complete Rewrite

This release represents a complete architectural overhaul and feature expansion of the extension.

### Added

#### Core Navigation Features
- **Interface-Level CodeLens**: Shows "👁️ N implementations" above interfaces and abstract classes
- **Method-Level CodeLens**: Shows "→ N impls" for each method in an interface
- **Reverse Navigation**: Shows "← InterfaceName" on implementation methods to navigate back to interface
- **Hierarchy Viewer**: New command to display interface hierarchy tree

#### Kotlin-Specific Features
- **Sealed Classes/Interfaces**: Full support for Kotlin 1.5+ sealed types
- **Data Classes**: Detects and highlights data class implementations
- **Delegation Pattern**: Supports `by` keyword delegation
- **Suspend Functions**: Full coroutines support
- **Companion Objects**: Detects companion object implementations
- **Object Declarations**: Supports object implementing interfaces

#### Java Support
- **Full Java Interop**: Extension now works with Java files (.java)
- **Abstract Classes**: Complete support for Java abstract classes
- **Default Methods**: Handles Java 8+ default methods correctly
- **Generic Types**: Better handling of generic type parameters
- **Extends + Implements**: Supports classes that both extend and implement

#### Spring Boot Integration
- **Annotation Detection**: Detects `@Component`, `@Service`, `@Repository`, `@Controller`, `@RestController`, `@Bean`, `@Configuration`
- **Annotation Display**: Shows annotations in quick pick results
- **Annotation Priority**: Spring-annotated implementations appear first in results
- **Configurable Filters**: Customize which annotations to detect

#### Smart Filtering
- **Mock Detection**: Automatically filters out test doubles and mocks
- **Path-Based Filtering**: Excludes test directories (`test`, `androidTest`, etc.)
- **Name-Based Filtering**: Excludes mock/stub/fake/test class names
- **Build Directory Exclusion**: Skips `build`, `target`, `.gradle` directories
- **Configurable Filtering**: Can be toggled on/off per user preference

#### Performance & Caching
- **TTL-Based Cache**: Intelligent caching with configurable timeout (default: 5 minutes)
- **File Watcher**: Auto-invalidates cache when files change
- **Periodic Cleanup**: Automatic cleanup of expired cache entries
- **Cache Statistics**: Track cache usage and performance
- **Manual Cache Clear**: New command to clear cache on demand

#### Configuration
- **Search Paths**: Configurable search directories (Spring Boot structure by default)
- **Exclude Paths**: Configurable exclusion patterns
- **Feature Toggles**: Enable/disable method lens, reverse navigation, abstract classes
- **File Type Selection**: Choose to include/exclude Java files
- **Annotation Filters**: Customize Spring annotations to detect
- **Cache Timeout**: Configurable cache TTL

#### Commands
- `Kotlin/Java: Show All Implementations` - Display all implementations
- `Kotlin/Java: Show Method Implementations` - Display method-specific implementations
- `Kotlin/Java: Goto Interface/Abstract Class` - Navigate to interface declaration
- `Kotlin/Java: Show Interface Hierarchy` - Show hierarchy tree
- `Kotlin/Java: Clear Cache` - Clear all cached results
- `Kotlin/Java: Open Settings` - Quick access to settings

### Changed

#### Architecture
- **TypeScript Migration**: Migrated from JavaScript to TypeScript for better type safety
- **Modular Architecture**: Refactored monolithic structure into reusable modules
- **Provider Pattern**: Separated concerns with dedicated providers for each feature
- **Engine Layer**: Extracted search, filter, and validation logic into engine modules
- **Command Pattern**: Commands moved to dedicated modules

#### File Structure
```
Old: extension.js (221 lines)
New: Modular structure (~2,000 lines total)
├── src/
│   ├── providers/ (3 providers)
│   ├── commands/ (6 commands)
│   ├── engine/ (4 engines)
│   ├── cache/ (cache manager)
│   ├── types/ (TypeScript definitions)
│   └── utils/ (logger, pathUtils)
```

#### Search Engine
- **Grep-Based**: Fast, workspace-wide searches using grep
- **Multi-Path Search**: Search across multiple configured directories
- **Exclusion Support**: Exclude paths from search
- **Annotation Extraction**: Extracts Spring Boot annotations from files
- **Method Location**: Finds exact method locations in classes

#### User Experience
- **Quick Pick Enhancement**: Shows annotations, data class badges, delegation indicators
- **Better Icons**: Uses VSCode icon font for better visual hierarchy
- **Relative Paths**: Shows workspace-relative paths in quick pick
- **Loading Indicators**: Shows loading spinners while searching
- **Error Handling**: Graceful error handling with user-friendly messages
- **Welcome Message**: First-time activation message with settings link

### Technical Improvements
- **Type Safety**: Full TypeScript types for all APIs
- **Error Handling**: Comprehensive error handling and logging
- **Output Channel**: Dedicated output channel for debugging
- **Performance**: < 500ms first search, < 50ms cached search
- **Memory Efficient**: Automatic cache cleanup prevents memory leaks
- **Workspace Aware**: Supports multi-folder workspaces

### Developer Experience
- **Build System**: TypeScript compilation with watch mode
- **Source Maps**: Full source map support for debugging
- **ESLint**: Code quality enforcement
- **Modular Imports**: Clean import structure
- **Documentation**: Comprehensive inline documentation

## [1.0.1] - 2024-XX-XX

### Initial Release
- Basic interface detection for Kotlin
- Simple CodeLens showing implementation count
- Basic navigation to implementations

---

## Migration Guide from 1.x to 2.0

### Breaking Changes
- **Configuration Keys**: Some configuration keys have changed
- **Minimum VS Code**: Now requires VS Code 1.60.0+
- **Node Modules**: Extension now uses TypeScript, may need to reinstall

### New Default Behavior
- Mock filtering is enabled by default (can be disabled)
- Search paths default to Spring Boot structure
- Method-level CodeLens is enabled by default

### Configuration Migration

Old configuration:
```json
{
  "kotlinImplementationLens.searchPath": "src"
}
```

New configuration:
```json
{
  "kotlinImplementationLens.searchPaths": [
    "src/main/kotlin",
    "src/main/java",
    "src"
  ]
}
```

### What to Expect
- **Faster Performance**: Caching dramatically improves performance
- **More Features**: Method-level navigation, reverse navigation, hierarchy view
- **Better Filtering**: Automatic mock exclusion reduces noise
- **Spring Boot First**: Optimized for Spring Boot projects

---

## Upgrade Instructions

1. Update extension from marketplace
2. Reload VS Code window
3. Open settings and configure search paths for your project structure
4. (Optional) Clear cache: `Kotlin/Java: Clear Cache`

## Support

For issues, questions, or feature requests:
- GitHub Issues: https://github.com/your-username/kotlin-implementation-lens/issues
- Documentation: https://github.com/your-username/kotlin-implementation-lens

---

**Note**: Version 2.0.0 maintains backward compatibility with 1.x CodeLens behavior but adds many new features. All new features can be disabled via settings to maintain 1.x-like experience if desired.
