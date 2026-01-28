# Kotlin/Java Implementation Lens

Navigate between Kotlin/Java interfaces and their implementations with powerful CodeLens integration.

## Features

### 🔍 Interface-Level CodeLens
Shows the number of implementations above each interface or abstract class:

```kotlin
👁️ 5 implementations
interface UserRepository {
    fun findById(id: String): User?
}
```

Click to see all implementations with Spring Boot annotations, file locations, and more.

### 🎯 Method-Level CodeLens
See implementations for each method in an interface:

```kotlin
interface UserRepository {
    → 5 impls
    fun findById(id: String): User?

    → 3 impls
    suspend fun findByEmail(email: String): User?
}
```

### ⬅️ Reverse Navigation
Navigate from implementation back to interface:

```kotlin
@Service
class UserRepositoryImpl : UserRepository {
    ← UserRepository
    override fun findById(id: String): User? {
        // implementation
    }
}
```

### 🌟 Advanced Features

#### Spring Boot Support
- Detects `@Component`, `@Service`, `@Repository`, `@Controller`, `@RestController`
- Shows annotations in quick pick: `UserServiceImpl [@Service]`
- Prioritizes Spring components in results

#### Kotlin-Specific
- **Sealed Classes/Interfaces**: Shows all permitted subtypes
- **Data Classes**: Detects and highlights data class implementations
- **Delegation**: Supports `by` keyword delegation pattern
- **Suspend Functions**: Full support for coroutines
- **Companion Objects**: Detects companion object implementations

#### Java Support
- Full Java interface and abstract class support
- Handles `default` methods (Java 8+)
- Supports generic type parameters
- Works with `implements` and `extends`

#### Smart Filtering
Automatically excludes test doubles:
- Mock implementations (`MockUserRepository`, `UserRepositoryMock`)
- Test directories (`test`, `androidTest`, `commonTest`)
- Test files (`*Test.kt`, `*Spec.java`)
- Stub and fake implementations

## Installation

1. **Install from VS Code Marketplace**
2. **Run the setup command** (Recommended):
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type: `Kotlin/Java: Setup Performance Optimization`
   - Choose **Global Settings** (applies to all projects) or **Current Project Only**
   - Restart VS Code/Cursor
3. **Done!** CodeLens will appear automatically on interfaces

> 💡 **Why run setup?** It configures Java Language Server memory, optimizes Gradle sync, and auto-detects search paths for better performance on large projects.

## Usage

### View Implementations
1. Open an interface or abstract class
2. Click on "👁️ N implementations" above the interface
3. Select an implementation from the quick pick
4. Navigate instantly to the implementation

### View Method Implementations
1. Open an interface
2. Click on "→ N impls" next to any method
3. Select a specific method implementation
4. Navigate to the exact method location

### Navigate to Interface
1. Open an implementation class
2. Click on "← InterfaceName" next to an override method
3. Navigate back to the interface declaration

### Commands

- **Kotlin/Java: Setup Performance Optimization** ⚡ - Auto-configure settings for optimal performance
- **Kotlin/Java: Show All Implementations** - Show implementations for current interface
- **Kotlin/Java: Show Method Implementations** - Show implementations for current method
- **Kotlin/Java: Goto Interface/Abstract Class** - Navigate to interface
- **Kotlin/Java: Show Interface Hierarchy** - Display hierarchy tree
- **Kotlin/Java: Clear Cache** - Clear all cached search results
- **Kotlin/Java: Open Settings** - Open extension settings

## Configuration

### ⚡ Quick Setup (Recommended)

**Just run this command:**
```
Cmd+Shift+P → Kotlin/Java: Setup Performance Optimization
```

This automatically configures everything for you! Choose:
- **Global Settings**: Applies to all projects (recommended for most users)
- **Current Project Only**: For project-specific configuration

---

### 📖 Manual Configuration (Optional)

If you prefer manual setup or need custom configuration:

For **large projects** with many files, it's crucial to configure both the **Java Language Server** and the **extension** for optimal performance.

#### 1. Java Language Server Memory (Required for large projects)

Add these settings to `.vscode/settings.json` in your project:

```json
{
  // ========================================
  // Java Language Server - Performance Optimization
  // ========================================
  "java.jdt.ls.vmargs": "-XX:+UseParallelGC -XX:GCTimeRatio=4 -XX:AdaptiveSizePolicyWeight=90 -Dsun.zip.disableMemoryMapping=true -Xmx4G -Xms1G -Xlog:disable",
  "java.autobuild.enabled": true,
  "java.maxConcurrentBuilds": 2
}
```

**What this does:**
- Increases JVM heap size to 4GB (adjust based on your RAM)
- Uses Parallel GC for better performance
- Disables unnecessary logging

**For systems with less RAM:**
- 8GB RAM: Use `-Xmx2G -Xms512M`
- 16GB RAM: Use `-Xmx4G -Xms1G` (recommended)
- 32GB+ RAM: Use `-Xmx6G -Xms2G`

#### 2. Extension Configuration (Recommended)

Add these settings to optimize the extension for your project structure:

```json
{
  // ========================================
  // Kotlin Implementation Lens - Performance
  // ========================================
  "kotlinImplementationLens.cacheTimeout": 600000,
  "kotlinImplementationLens.searchPaths": [
    "core/src/main/kotlin",
    "application/src/main/kotlin"
  ],
  "kotlinImplementationLens.excludePaths": [
    "test",
    "androidTest",
    "build",
    "target",
    ".gradle"
  ],
  "kotlinImplementationLens.includeJavaFiles": false,
  "kotlinImplementationLens.filterMocks": true
}
```

**Explanation:**
- `cacheTimeout`: Increases cache duration to 10 minutes (reduces repeated searches)
- `searchPaths`: Specify **only your source directories** (ignore tests, build outputs)
- `excludePaths`: Skip build directories, tests, and Gradle cache
- `includeJavaFiles`: Set to `false` if you only use Kotlin (speeds up searches)

#### 3. File Watcher Optimization

Reduce VS Code file watching overhead:

```json
{
  // ========================================
  // File Watching - Reduce Overhead
  // ========================================
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/target/**": true,
    "**/build/**": true,
    "**/.gradle/**": true,
    "**/.idea/**": true
  }
}
```

#### 4. Complete Example Configuration

Here's a complete `.vscode/settings.json` example for a **Gradle multi-module project**:

```json
{
  // Java Language Server
  "java.jdt.ls.vmargs": "-XX:+UseParallelGC -Xmx4G -Xms1G",
  "java.configuration.updateBuildConfiguration": "automatic",
  "java.autobuild.enabled": true,
  "java.maxConcurrentBuilds": 2,

  // Kotlin Implementation Lens
  "kotlinImplementationLens.cacheTimeout": 600000,
  "kotlinImplementationLens.searchPaths": [
    "core/src/main/kotlin",
    "application/src/main/kotlin",
    "domain/src/main/kotlin"
  ],
  "kotlinImplementationLens.excludePaths": [
    "test",
    "androidTest",
    "build",
    "target",
    ".gradle"
  ],
  "kotlinImplementationLens.includeJavaFiles": false,
  "kotlinImplementationLens.filterMocks": true,

  // File Watching
  "files.exclude": {
    "**/.gradle": true,
    "**/build": true
  },
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/target/**": true,
    "**/build/**": true,
    "**/.gradle/**": true
  }
}
```

### 🎯 Automatic Module Detection

**Just like IntelliJ IDEA**, the extension automatically detects your project structure!

**No configuration needed for:**
- ✅ Gradle multi-module projects (reads `settings.gradle[.kts]`)
- ✅ Maven multi-module projects (reads `pom.xml`)
- ✅ Any project with `src/main/kotlin` or `src/main/java` directories

**Example:** If you have:
```
my-project/
├── settings.gradle.kts  # include(":core", ":application", ":domain")
├── core/src/main/kotlin/
├── application/src/main/kotlin/
└── domain/src/main/kotlin/
```

The extension **automatically discovers** all 3 modules!

**Note:** If you manually set `searchPaths`, auto-detection is disabled.

### Feature Toggles

```json
{
  "kotlinImplementationLens.showMethodLens": true,
  "kotlinImplementationLens.showReverseNavigation": true,
  "kotlinImplementationLens.filterMocks": true,
  "kotlinImplementationLens.includeAbstractClasses": true,
  "kotlinImplementationLens.includeJavaFiles": true
}
```

### Spring Boot Annotations

```json
{
  "kotlinImplementationLens.annotationFilters": [
    "Component",
    "Service",
    "Repository",
    "Controller",
    "RestController"
  ]
}
```

## Performance

### Version 2.3.2+ Improvements:

- **⚡ Parallel Search Execution**: Grep searches now run in parallel across all search paths
  - **2x faster** for multi-module projects (6s → 3s typical improvement)
  - Dramatically improves first-time CodeLens loading
- **🔄 Enhanced Reverse Navigation**: Better detection of interfaces in complex inheritance chains
  - Correctly identifies interfaces when class extends parent class with constructor
  - Example: `class Impl(...) : BaseClass(...), Interface` now works perfectly

### Version 2.3.0+ Improvements:

- **⚡ Pending Search Deduplication**: Eliminates duplicate searches when multiple CodeLens request the same interface
- **🚀 Smart Caching**: 10-minute cache (configurable) with automatic invalidation
- **📊 Performance Metrics**:
  - First Search: < 500ms (depends on project size, **2x faster** in multi-module projects)
  - Cached Search: < 50ms
  - Subsequent searches for same interface: < 10ms (pending search reuse)

### Tips for Large Projects (1000+ files):

1. **Configure search paths** - Only include source directories, not tests
2. **Increase Java heap size** - Use `-Xmx4G` or more
3. **Exclude build directories** - Add `build`, `.gradle`, `target` to excludePaths
4. **Wait for Gradle indexing** - Let the Language Server finish before using the extension
5. **Clear cache periodically** - Use `Kotlin/Java: Clear Cache` if results seem stale

### Comparison: IntelliJ IDEA vs VS Code/Cursor

| Feature | IntelliJ IDEA | VS Code/Cursor + Extension |
|---------|---------------|----------------------------|
| **Index Type** | Binary PSI (in-memory) | Grep-based file search |
| **Initial Load** | 5-10 seconds | 0 seconds (on-demand) |
| **Search Speed** | < 50ms | 200-500ms (first), < 50ms (cached) |
| **Memory Usage** | 2-4GB+ | 100-200MB |
| **Accuracy** | 100% | 98%+ (may miss complex edge cases) |

**Why IntelliJ is faster:**
- Uses a pre-built binary index (PSI - Program Structure Interface)
- Gradle daemon always running
- Native Language Server optimized for JVM languages

**Why this extension is still useful:**
- Works in lightweight editors (VS Code, Cursor, VSCodium)
- No JetBrains license required
- Open source and customizable
- Good enough for most use cases

## Examples

### Multi-Module Gradle Project

```
my-app/
├── core/
│   └── src/main/kotlin/
│       └── com/example/
│           └── UserRepository.kt
├── impl/
│   └── src/main/kotlin/
│       └── com/example/
│           └── UserRepositoryImpl.kt
└── app/
    └── src/main/kotlin/
        └── com/example/
            └── Main.kt
```

Configure search paths:

```json
{
  "kotlinImplementationLens.searchPaths": [
    "core/src/main/kotlin",
    "impl/src/main/kotlin",
    "app/src/main/kotlin"
  ]
}
```

### Spring Boot Microservice

```kotlin
// UserRepository.kt
👁️ 2 implementations
interface UserRepository {
    → 2 impls
    fun findById(id: String): User?
}

// Quick pick shows:
├─ UserRepositoryImpl [@Service]
│  └─ impl/UserRepositoryImpl.kt:15
└─ CachedUserRepository [@Service]
   └─ cache/CachedUserRepository.kt:22
```

### Sealed Class Hierarchy

```kotlin
👁️ 3 implementations
sealed interface Result<out T>

// Shows all subtypes:
├─ Success (data class)
│  └─ result/Result.kt:12
├─ Error (data class)
│  └─ result/Result.kt:13
└─ Loading (object)
   └─ result/Result.kt:14
```

## Troubleshooting

### CodeLens not showing

1. Ensure file is Kotlin (`.kt`) or Java (`.java`)
2. Check that the interface/abstract class is detected
3. Verify search paths are correct: `Kotlin/Java: Open Settings`
4. Clear cache: `Kotlin/Java: Clear Cache`
5. Check Output panel: View → Output → Kotlin/Java Implementation Lens

### No implementations found

1. **Check search paths** - Make sure they include your implementation directories
2. **Verify exclude paths** - Ensure you're not excluding valid source directories
3. **Wait for Gradle** - Let the Language Server finish indexing
4. **Check logs** - Enable debug logging in Output panel
5. **Manual override** - Set `searchPaths` explicitly if auto-detection fails

### Performance issues / "Loading implementations..." takes forever

**Common causes:**
- Gradle still indexing (wait for it to finish - check bottom status bar)
- Java Language Server out of memory (increase heap size with `java.jdt.ls.vmargs`)
- Too many search paths (narrow down to only source directories)
- Not excluding build directories (add `build`, `.gradle`, `target` to `excludePaths`)

**Solutions:**

1. **Increase Java heap size** (most important):
   ```json
   {
     "java.jdt.ls.vmargs": "-Xmx4G -Xms1G"
   }
   ```

2. **Optimize search paths**:
   ```json
   {
     "kotlinImplementationLens.searchPaths": [
       "core/src/main/kotlin",
       "application/src/main/kotlin"
     ]
   }
   ```

3. **Exclude build directories**:
   ```json
   {
     "kotlinImplementationLens.excludePaths": [
       "test",
       "build",
       "target",
       ".gradle"
     ]
   }
   ```

4. **Restart VS Code/Cursor** after changing settings

5. **Clear all caches**:
   - Run: `Kotlin/Java: Clear Cache`
   - Restart the Java Language Server: `Java: Clean Java Language Server Workspace`

### Extension is slow compared to IntelliJ

This is expected! IntelliJ uses a pre-built binary index, while this extension uses grep-based search.

**To minimize the gap:**
- Follow all performance optimization steps above
- Ensure Gradle/Maven indexing is complete
- Use specific search paths (not entire project root)
- Increase Java heap size
- Disable Java file search if you only use Kotlin

## Requirements

- VS Code 1.60.0 or higher
- Kotlin and/or Java project
- (Recommended) At least 8GB RAM for large projects

## Known Limitations

- Grep-based search (not LSP) - fast but may miss complex cases
- Doesn't support dynamic class loading or reflection
- Limited support for generic type validation
- Requires file system access (doesn't work with virtual file systems)
- Performance depends on project size and Language Server readiness

## Changelog

### Version 2.3.0 (Latest)
- **Performance**: Added pending search deduplication - eliminates duplicate searches
- **Performance**: Smart caching with automatic cleanup
- **Documentation**: Complete performance tuning guide
- **Documentation**: IntelliJ IDEA comparison table
- **Fix**: Reduced redundant grep calls

### Version 2.2.3
- **Fix**: Improved interface matching with word boundaries
- **Fix**: Added comprehensive caching system

### Version 2.2.2
- **Fix**: Improved reverse navigation (implementation → interface)

### Version 2.2.1
- **Fix**: Improved method detection and CodeLens UX

### Version 2.2.0
- **Feature**: Support multiline class declarations

See [CHANGELOG.md](CHANGELOG.md) for complete history.

## Roadmap

- [ ] Mermaid diagram generation for hierarchies
- [ ] PlantUML export
- [ ] Call hierarchy integration
- [ ] Test coverage integration
- [ ] Multi-workspace support
- [ ] LSP-based indexing (faster, more accurate)

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## License

MIT License - see LICENSE file for details.

## Credits

Inspired by:
- [golang-implementation-lens](https://marketplace.visualstudio.com/items?itemName=jgusta.golang-implementation-lens)
- Go to Implementation features in JetBrains IDEs

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/fabioods/kotlin-implementation-lens/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/fabioods/kotlin-implementation-lens/discussions)
- 📖 **Documentation**: [GitHub Wiki](https://github.com/fabioods/kotlin-implementation-lens/wiki)

---

Made with ❤️ for the Kotlin/Java community
