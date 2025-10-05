# Kotlin Implementation Lens

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/fabioods/kotlin-implementation-lens)
[![VSCode](https://img.shields.io/badge/VSCode-1.60+-green.svg)](https://code.visualstudio.com/)

> Show implementation count above Kotlin interfaces.

## ✨ Features

- 🔍 **Visual CodeLens** above every Kotlin interface showing "👁️ implementations"
- 📊 **Click to navigate** - Opens a quick pick with all implementations
- ⚡ **Fast search** using grep for instant results
- 🏗️ **Multi-module support** - Works perfectly with Gradle multi-module projects
- 💾 **Smart caching** - Results are cached for better performance

## 📸 Screenshots

### Interface with CodeLens
```kotlin
👁️ implementations                    ← Click here!
interface UserRepository {
    suspend fun findById(id: UUID): User?
    suspend fun save(user: User): User
}
```

### Quick Pick with Implementations
```
┌─────────────────────────────────────────────────────┐
│ Select implementation of UserRepository             │
├─────────────────────────────────────────────────────┤
│ ⚫ UserRepositoryImpl                                │
│    in repository/UserRepositoryImpl.kt              │
│    Line 29: ) : UserRepository {                    │
└─────────────────────────────────────────────────────┘
```

## 🚀 Usage

### Method 1: CodeLens (Recommended)
1. Open any Kotlin file with an interface
2. Look above the `interface` keyword
3. Click on **"👁️ implementations"**
4. Select the implementation from the list
5. Navigate automatically to the class!

### Method 2: Command Palette
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: **"Kotlin: Show Implementations"**
3. Enter the interface name
4. Select from the list

## 📋 Requirements

- **VSCode**: 1.60.0 or higher
- **Kotlin files**: `.kt` extension
- **Project structure**: Works best with Gradle multi-module projects
- **Search tool**: `grep` (pre-installed on macOS/Linux, Git Bash on Windows)

## ⚙️ How It Works

### CodeLens Provider
The extension registers a CodeLens provider that:
1. Scans all Kotlin files for `interface` declarations
2. Shows a clickable lens above each interface
3. On click, searches for implementations using pattern: `) : InterfaceName`

### Search Strategy
```bash
grep -rn ") : InterfaceName" --include="*.kt" application/src core/src
```

This pattern matches Kotlin implementation syntax:
```kotlin
class MyRepositoryImpl(
    private val dependency: Dependency
) : MyRepository {  // ← Found by grep!
    // implementation
}
```

### Performance
- **First search**: ~50-200ms (depending on project size)
- **Cached results**: Instant
- **Multi-module**: Searches only in `application/src` and `core/src` directories

## 🎨 Configuration

Currently, the extension works out-of-the-box with sensible defaults. Future versions will include:

- Configurable search directories
- Custom search patterns
- CodeLens appearance customization

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `Kotlin: Show Implementations` | Manually search for implementations |
| `Kotlin: Clear Implementation Lens Cache` | Clear cached search results |

## 🐛 Troubleshooting

### CodeLens not showing?
1. Make sure you're viewing a `.kt` file
2. Check that the file contains `interface` declarations
3. Reload window: `Cmd+Shift+P` → "Reload Window"

### "No implementations found"?
1. Verify the implementation exists
2. Check that it uses Kotlin syntax: `) : InterfaceName {`
3. Ensure implementation is in `application/src` or `core/src`
4. Try clearing cache: `Cmd+Shift+P` → "Kotlin: Clear Implementation Lens Cache"

### Extension not loading?
1. Check VSCode/Cursor version (must be 1.60+)
2. View Extension Host logs: `Cmd+Shift+P` → "Developer: Show Logs" → "Extension Host"
3. Look for errors related to `kotlin-implementation-lens`

## 📦 Installation

### From Marketplace (Coming Soon)
1. Open Extensions: `Cmd+Shift+X`
2. Search: "Kotlin Implementation Lens"
3. Click "Install"

### Manual Installation
1. Download `.vsix` file from [releases](https://github.com/fabioods/kotlin-implementation-lens/releases)
2. Open Extensions: `Cmd+Shift+X`
3. Click `...` → "Install from VSIX..."
4. Select downloaded file

### From Source
```bash
cd ~/.vscode/extensions/
git clone https://github.com/fabioods/kotlin-implementation-lens.git
cd kotlin-implementation-lens
npm install
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
```bash
# Clone the repository
git clone https://github.com/fabioods/kotlin-implementation-lens.git
cd kotlin-implementation-lens

# Install dependencies
npm install

# Open in VSCode
code .

# Press F5 to launch Extension Development Host
```

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the Kotlin community
- Special thanks to all contributors

## 🔗 Links

- [GitHub Repository](https://github.com/fabioods/kotlin-implementation-lens)
- [Issue Tracker](https://github.com/fabioods/kotlin-implementation-lens/issues)
- [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=fabio.kotlin-implementation-lens)

## 💡 Tips & Tricks

### Keyboard Shortcut
Add a custom keybinding for quick access:
```json
{
  "key": "cmd+shift+i",
  "command": "kotlin-implementation-lens.showImplementations"
}
```

### Task Integration
Create a VSCode task for terminal-based search:
```json
{
  "label": "Find Kotlin Implementations",
  "type": "shell",
  "command": "grep -rn ') : ${input:interfaceName}' --include='*.kt' ."
}
```

## 🌟 Star History

If you find this extension useful, please consider giving it a ⭐ on [GitHub](https://github.com/fabioods/kotlin-implementation-lens)!

---

**Made with ❤️ for the Kotlin community**
