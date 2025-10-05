# Change Log

All notable changes to the "Kotlin Implementation Lens" extension will be documented in this file.

## [1.0.0] - 2024-10-04

### 🎉 Initial Release

#### Added
- CodeLens provider showing "👁️ implementations" above Kotlin interfaces
- Click to navigate functionality with Quick Pick menu
- Smart search using grep for fast results
- Multi-module Gradle project support
- Result caching for improved performance
- Command: "Kotlin: Show Implementations"
- Command: "Kotlin: Clear Implementation Lens Cache"
- Automatic interface detection in `.kt` files
- Visual feedback with progress notification during search
- Error handling for missing workspace or files

#### Features
- Works with interfaces in multi-line format:
  ```kotlin
  class MyClass(
      dependencies...
  ) : MyInterface {
  ```
- Searches in `application/src` and `core/src` directories
- Shows implementation location with file path and line number
- Highlights class name in Quick Pick for easy identification
- Centers cursor on class declaration after navigation

#### Technical
- Activation event: `*` (universal activation for instant availability)
- Search timeout: 5 seconds
- Buffer size: 1MB for large search results
- Compatible with VSCode 1.60.0+

---

## [Unreleased]

### Planned Features
- [ ] Configurable search directories
- [ ] Custom search pattern support
- [ ] Interface hierarchy visualization
- [ ] Show implementation count in CodeLens
- [ ] Support for abstract classes
- [ ] Multi-language support (Java interop)
- [ ] Settings UI for customization
- [ ] Keyboard shortcut customization
- [ ] Dark/Light theme icons

### Ideas Under Consideration
- Integration with Kotlin Language Server
- Support for inheritance chains
- Performance metrics dashboard
- Search history
- Favorite implementations

---

**Note**: Follow [Semantic Versioning](https://semver.org/) for version numbers.
