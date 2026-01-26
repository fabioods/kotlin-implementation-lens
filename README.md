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

1. Install from VS Code Marketplace
2. Open a Kotlin or Java project
3. CodeLens will appear automatically on interfaces

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

- **Kotlin/Java: Show All Implementations** - Show implementations for current interface
- **Kotlin/Java: Show Method Implementations** - Show implementations for current method
- **Kotlin/Java: Goto Interface/Abstract Class** - Navigate to interface
- **Kotlin/Java: Show Interface Hierarchy** - Display hierarchy tree
- **Kotlin/Java: Clear Cache** - Clear all cached search results
- **Kotlin/Java: Open Settings** - Open extension settings

## Configuration

### Search Paths
Customize where to search for implementations (default: Spring Boot structure):

```json
{
  "kotlinImplementationLens.searchPaths": [
    "src/main/kotlin",
    "src/main/java",
    "src",
    "app/src/main",
    "core/src/main"
  ]
}
```

### Exclude Paths
Exclude directories from search:

```json
{
  "kotlinImplementationLens.excludePaths": [
    "test",
    "androidTest",
    "**/mocks",
    "**/build",
    "**/target"
  ]
}
```

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

### Cache Timeout

```json
{
  "kotlinImplementationLens.cacheTimeout": 300000
}
```

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

## Performance

- **First Search**: < 500ms (depends on project size)
- **Cached Search**: < 50ms
- **TTL Cache**: Auto-invalidates after 5 minutes (configurable)
- **File Watcher**: Auto-invalidates on file changes

## Troubleshooting

### CodeLens not showing
1. Ensure file is Kotlin (`.kt`) or Java (`.java`)
2. Check that the interface/abstract class is detected
3. Verify search paths are correct: `Kotlin/Java: Open Settings`
4. Clear cache: `Kotlin/Java: Clear Cache`

### No implementations found
1. Check search paths include implementation directories
2. Verify exclude paths aren't hiding implementations
3. Check if mock filtering is excluding valid implementations
4. Enable logging: View → Output → Kotlin/Java Implementation Lens

### Performance issues
1. Reduce search paths to only necessary directories
2. Add build directories to exclude paths
3. Reduce cache timeout
4. Disable method-level CodeLens if not needed

## Requirements

- VS Code 1.60.0 or higher
- Kotlin and/or Java project

## Known Limitations

- Grep-based search (not LSP) - fast but may miss complex cases
- Doesn't support dynamic class loading or reflection
- Limited support for generic type validation
- Requires file system access (doesn't work with virtual file systems)

## Roadmap

- [ ] Mermaid diagram generation for hierarchies
- [ ] PlantUML export
- [ ] Call hierarchy integration
- [ ] Test coverage integration
- [ ] Multi-workspace support

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## License

MIT License - see LICENSE file for details.

## Credits

Inspired by:
- [golang-implementation-lens](https://marketplace.visualstudio.com/items?itemName=jgusta.golang-implementation-lens)
- Go to Implementation features in JetBrains IDEs

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed release history.

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/fabioods/kotlin-implementation-lens/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/fabioods/kotlin-implementation-lens/discussions)
- 📖 **Documentation**: [GitHub Wiki](https://github.com/fabioods/kotlin-implementation-lens/wiki)
