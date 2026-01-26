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

### 🎯 Automatic Module Detection (NEW!)

**Just like IntelliJ IDEA**, the extension now automatically detects your project structure!

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

The extension **automatically discovers** all 3 modules - **no manual configuration required!**

### Search Paths (Manual Override)

Only customize if you have a non-standard structure:

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

**Note:** If you set custom paths, auto-detection is disabled.

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

## Publishing

### How to Deploy Extensions

This extension is published on two marketplaces:
- **VS Code Marketplace**: https://marketplace.visualstudio.com/items?itemName=fabioods.kotlin-implementation-lens
- **Open VSX Registry**: https://open-vsx.org/extension/fabioods/kotlin-implementation-lens

#### Prerequisites

1. **Install vsce** (VS Code Extension Manager):
   ```bash
   npm install -g @vscode/vsce
   ```

2. **Install ovsx** (Open VSX CLI):
   ```bash
   npm install -g ovsx
   ```

3. **Get Access Tokens**:
   - **VS Code Marketplace**: Create Personal Access Token at https://dev.azure.com/
     - Organization: All accessible organizations
     - Scopes: `Marketplace > Manage`
     - Copy the token and store securely

   - **Open VSX**: Create Access Token at https://open-vsx.org/user-settings/tokens
     - Login with GitHub
     - Generate token with publish permissions

#### Step 1: Update Version

```bash
# Edit package.json and CHANGELOG.md with new version
vim package.json  # Update "version" field
vim CHANGELOG.md  # Add release notes
```

#### Step 2: Compile and Test

```bash
# Compile TypeScript
npm run compile

# Test extension locally
code --install-extension kotlin-implementation-lens-X.Y.Z.vsix

# Verify it works in your projects
```

#### Step 3: Commit and Tag

```bash
# Commit changes
git add -A
git commit -m "Release vX.Y.Z: Brief description"

# Push to GitHub
git push origin main

# Create and push tag
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

#### Step 4: Publish to VS Code Marketplace

```bash
# Package extension
vsce package

# Login (first time only)
vsce login fabioods

# Publish
vsce publish

# Or combine package + publish
vsce publish minor  # or major/patch
```

**Note**: If you get SSL certificate errors behind a corporate proxy:
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 vsce publish
```

#### Step 5: Publish to Open VSX

```bash
# Set access token (first time only)
export OVSX_PAT=your-open-vsx-token

# Publish (uses the .vsix file created by vsce)
ovsx publish kotlin-implementation-lens-X.Y.Z.vsix -p $OVSX_PAT
```

#### Automated Publishing Script

Create `publish.sh`:
```bash
#!/bin/bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: ./publish.sh X.Y.Z"
    exit 1
fi

# Update version
npm version $VERSION --no-git-tag-version

# Compile
npm run compile

# Commit
git add -A
git commit -m "Release v$VERSION"
git push origin main

# Tag
git tag -a v$VERSION -m "Release v$VERSION"
git push origin v$VERSION

# Package
vsce package

# Publish to VS Code Marketplace
NODE_TLS_REJECT_UNAUTHORIZED=0 vsce publish

# Publish to Open VSX
ovsx publish kotlin-implementation-lens-$VERSION.vsix -p $OVSX_PAT

echo "✅ Published v$VERSION to both marketplaces!"
```

Make it executable:
```bash
chmod +x publish.sh
```

Usage:
```bash
./publish.sh 2.3.0
```

#### Verification

After publishing, verify on both marketplaces:
- **VS Code Marketplace**: Check https://marketplace.visualstudio.com/items?itemName=fabioods.kotlin-implementation-lens
- **Open VSX**: Check https://open-vsx.org/extension/fabioods/kotlin-implementation-lens

Wait 5-10 minutes for updates to appear.

#### Troubleshooting

**Issue**: `Publisher 'fabioods' not found`
- Solution: Create publisher at https://marketplace.visualstudio.com/manage/publishers/

**Issue**: `Extension already exists with this version`
- Solution: Increment version number in package.json

**Issue**: `Authentication failed`
- Solution: Regenerate access token and login again with `vsce login fabioods`

**Issue**: Open VSX shows old version
- Solution: Wait 10-15 minutes for CDN cache to clear

#### Publishing Checklist

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with release notes
- [ ] Compile TypeScript: `npm run compile`
- [ ] Test extension locally
- [ ] Commit changes
- [ ] Create git tag
- [ ] Push to GitHub (including tag)
- [ ] Publish to VS Code Marketplace: `vsce publish`
- [ ] Publish to Open VSX: `ovsx publish`
- [ ] Verify on both marketplaces
- [ ] Test installation from marketplace: `code --install-extension fabioods.kotlin-implementation-lens`

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
