# 🚀 Quick Start: Publishing Your Extension

Your extension is **ready to publish**! A package file has been created: `kotlin-implementation-lens-2.0.0.vsix`

## Option 1: Test Locally First (Recommended)

Install the extension in VS Code or Cursor to test it:

### For VS Code:
1. Open VS Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Extensions: Install from VSIX"
4. Select the file: `kotlin-implementation-lens-2.0.0.vsix`
5. Reload VS Code
6. Open a Kotlin or Java project to test

### For Cursor:
1. Open Cursor
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Extensions: Install from VSIX"
4. Select the file: `kotlin-implementation-lens-2.0.0.vsix`
5. Reload Cursor
6. Open a Kotlin or Java project to test

## Option 2: Publish to VS Code Marketplace

Publishing to VS Code Marketplace makes it available for both VS Code AND Cursor users.

### Prerequisites (5 minutes setup):

1. **Create Azure DevOps Account**: https://dev.azure.com
   - Sign in with Microsoft/GitHub account
   - Create organization

2. **Get Personal Access Token (PAT)**:
   - In Azure DevOps → Profile → Personal Access Tokens
   - New Token → Name: `vscode-publish`
   - Scopes: **Marketplace → Manage** (full access)
   - Copy the token (save it securely!)

3. **Create Publisher**:
   - Go to https://marketplace.visualstudio.com/manage
   - Create publisher
   - Choose a Publisher ID (e.g., `fabiosantos`, `yourname`)
   - **This becomes your extension ID**: `publisher-id.kotlin-implementation-lens`

### Update package.json:

Replace `"publisher": "your-publisher-name"` with your actual Publisher ID:

```json
{
  "publisher": "fabiosantos"  // Your actual publisher ID
}
```

Also update the repository URLs if you've created a GitHub repo:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR-GITHUB-USERNAME/kotlin-implementation-lens"
  },
  "bugs": {
    "url": "https://github.com/YOUR-GITHUB-USERNAME/kotlin-implementation-lens/issues"
  },
  "homepage": "https://github.com/YOUR-GITHUB-USERNAME/kotlin-implementation-lens#readme"
}
```

### Publish:

```bash
# 1. Login (paste your PAT when prompted)
vsce login YOUR-PUBLISHER-ID

# 2. Publish
vsce publish
```

### Verify:

Wait 5-10 minutes, then:
- VS Code Marketplace: https://marketplace.visualstudio.com/
- Search: "Kotlin Implementation Lens"

## Option 3: Share Privately

Share the `.vsix` file with others:
1. Send them `kotlin-implementation-lens-2.0.0.vsix`
2. They install via "Install from VSIX" in VS Code/Cursor

## What's Included

✅ Complete TypeScript implementation (~2,700 lines)
✅ Interface & method-level CodeLens
✅ Reverse navigation
✅ Spring Boot annotation support
✅ Kotlin-specific features (sealed classes, data classes, delegation)
✅ Java support
✅ Smart mock filtering
✅ TTL-based caching
✅ Comprehensive documentation

## Testing Checklist

Before publishing, test these scenarios:

1. **Interface Detection**:
   - Open a Kotlin interface file
   - Verify "👁️ N implementations" appears above interface
   - Click to see list of implementations

2. **Method Navigation**:
   - Check "→ N impls" appears on interface methods
   - Click to navigate to specific method implementation

3. **Reverse Navigation**:
   - Open an implementation class
   - Check "← InterfaceName" appears on override methods
   - Click to navigate back to interface

4. **Spring Boot**:
   - Test with `@Service`, `@Repository`, `@Component` classes
   - Verify annotations appear in quick pick

5. **Mock Filtering**:
   - Verify test mocks are excluded by default
   - Test toggling the filter in settings

## Troubleshooting

### "Missing publisher name"
Update `"publisher"` in package.json to your actual Publisher ID

### "Extension activation failed"
Check VS Code Output panel → "Kotlin/Java Implementation Lens" for errors

### "CodeLens not showing"
1. Check file is `.kt` or `.java`
2. Verify search paths in settings
3. Run command: "Kotlin/Java: Clear Cache"

## Next Steps After Publishing

1. **Add Screenshots**: Capture CodeLens in action for README
2. **Create GitHub Repo**: Version control and issue tracking
3. **Share**: Twitter, Reddit, LinkedIn
4. **Monitor**: Check marketplace ratings and issues

## Support

- 📖 **Full Publishing Guide**: See `PUBLISHING.md`
- 📝 **Documentation**: See `README.md`
- 🐛 **Issues**: Create issues on GitHub (once repo is created)

---

**Ready to go!** Choose Option 1 to test, or Option 2 to publish to the world! 🎉
