# Publishing Guide - Kotlin/Java Implementation Lens

Complete guide for deploying the extension to VS Code Marketplace and Open VSX Registry.

## Marketplaces

This extension is published on two platforms:
- **VS Code Marketplace**: https://marketplace.visualstudio.com/items?itemName=fabioods.kotlin-implementation-lens
- **Open VSX Registry**: https://open-vsx.org/extension/fabioods/kotlin-implementation-lens

## Prerequisites

### 1. Install Publishing Tools

```bash
# VS Code Extension Manager
npm install -g @vscode/vsce

# Open VSX CLI
npm install -g ovsx
```

### 2. Get Access Tokens

#### VS Code Marketplace Token

1. Go to https://dev.azure.com/
2. Click on your profile → Personal Access Tokens
3. Create new token:
   - **Name**: vsce-publish
   - **Organization**: All accessible organizations
   - **Scopes**: `Marketplace > Manage`
   - **Expiration**: Custom (1 year recommended)
4. Copy the token and store securely (you won't see it again!)

Store in environment:
```bash
export VSCE_PAT=your-azure-devops-token
```

#### Open VSX Token

1. Go to https://open-vsx.org/user-settings/tokens
2. Login with GitHub
3. Click "Generate new access token"
4. Give it a name (e.g., "kotlin-implementation-lens-publish")
5. Copy the token

Store in environment:
```bash
export OVSX_PAT=your-open-vsx-token
```

Add to `~/.bashrc` or `~/.zshrc` for persistence:
```bash
echo 'export VSCE_PAT=your-azure-devops-token' >> ~/.zshrc
echo 'export OVSX_PAT=your-open-vsx-token' >> ~/.zshrc
source ~/.zshrc
```

### 3. Create Publisher (First Time Only)

If you haven't created a publisher on VS Code Marketplace:

```bash
vsce create-publisher fabioods
```

Or create manually at: https://marketplace.visualstudio.com/manage/publishers/

## Publishing Workflow

### Manual Step-by-Step

#### 1. Update Version

Edit `package.json`:
```json
{
  "version": "2.3.0"
}
```

Edit `CHANGELOG.md`:
```markdown
## [2.3.0] - 2025-01-26

### Added
- New feature description

### Fixed
- Bug fix description
```

#### 2. Compile and Test

```bash
# Compile TypeScript
npm run compile

# Package extension
vsce package

# Test locally
code --install-extension kotlin-implementation-lens-2.3.0.vsix

# Open a Kotlin project and verify it works
```

#### 3. Commit and Tag

```bash
# Stage changes
git add -A

# Commit
git commit -m "Release v2.3.0: Brief description of changes"

# Push to GitHub
git push origin main

# Create git tag
git tag -a v2.3.0 -m "Release v2.3.0"

# Push tag
git push origin v2.3.0
```

#### 4. Publish to VS Code Marketplace

```bash
# Login (first time only)
vsce login fabioods

# Publish
vsce publish

# Or if behind corporate proxy with SSL issues
NODE_TLS_REJECT_UNAUTHORIZED=0 vsce publish
```

#### 5. Publish to Open VSX

```bash
# Publish using the .vsix file created earlier
ovsx publish kotlin-implementation-lens-2.3.0.vsix -p $OVSX_PAT
```

#### 6. Verify

Wait 5-10 minutes, then verify:

- VS Code Marketplace: https://marketplace.visualstudio.com/items?itemName=fabioods.kotlin-implementation-lens
- Open VSX: https://open-vsx.org/extension/fabioods/kotlin-implementation-lens

Test installation:
```bash
# Remove old version
code --uninstall-extension fabioods.kotlin-implementation-lens

# Install from marketplace
code --install-extension fabioods.kotlin-implementation-lens

# Verify version
code --list-extensions --show-versions | grep kotlin-implementation-lens
```

### Automated Publishing

Create `publish.sh` in project root:

```bash
#!/bin/bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: ./publish.sh X.Y.Z"
    exit 1
fi

echo "🚀 Publishing Kotlin/Java Implementation Lens v$VERSION"

# Update version
echo "📝 Updating version..."
npm version $VERSION --no-git-tag-version

# Update CHANGELOG.md
echo "📋 Don't forget to update CHANGELOG.md!"
read -p "Press enter when CHANGELOG.md is ready..."

# Compile
echo "🔨 Compiling TypeScript..."
npm run compile

# Commit
echo "💾 Committing changes..."
git add -A
git commit -m "Release v$VERSION"
git push origin main

# Tag
echo "🏷️  Creating git tag..."
git tag -a v$VERSION -m "Release v$VERSION"
git push origin v$VERSION

# Package
echo "📦 Packaging extension..."
vsce package

# Publish to VS Code Marketplace
echo "🌐 Publishing to VS Code Marketplace..."
if [ -z "$VSCE_PAT" ]; then
    NODE_TLS_REJECT_UNAUTHORIZED=0 vsce publish
else
    NODE_TLS_REJECT_UNAUTHORIZED=0 vsce publish -p $VSCE_PAT
fi

# Publish to Open VSX
echo "🌐 Publishing to Open VSX..."
if [ -z "$OVSX_PAT" ]; then
    echo "❌ OVSX_PAT not set. Skipping Open VSX publish."
    echo "   Run: ovsx publish kotlin-implementation-lens-$VERSION.vsix -p YOUR_TOKEN"
else
    ovsx publish kotlin-implementation-lens-$VERSION.vsix -p $OVSX_PAT
fi

echo ""
echo "✅ Successfully published v$VERSION!"
echo ""
echo "Verify at:"
echo "  VS Code: https://marketplace.visualstudio.com/items?itemName=fabioods.kotlin-implementation-lens"
echo "  Open VSX: https://open-vsx.org/extension/fabioods/kotlin-implementation-lens"
echo ""
echo "Test installation:"
echo "  code --install-extension fabioods.kotlin-implementation-lens"
```

Make it executable:
```bash
chmod +x publish.sh
```

Usage:
```bash
# Update CHANGELOG.md first, then run:
./publish.sh 2.3.0
```

## Publishing Checklist

Before publishing, ensure:

- [ ] **Version updated** in `package.json`
- [ ] **CHANGELOG.md updated** with release notes
- [ ] **TypeScript compiled** without errors (`npm run compile`)
- [ ] **Tests passing** (if applicable)
- [ ] **Extension tested locally** on real Kotlin/Java projects
- [ ] **Git committed** with descriptive message
- [ ] **Git tag created** and pushed
- [ ] **Published to VS Code Marketplace**
- [ ] **Published to Open VSX**
- [ ] **Verified on both marketplaces** (wait 5-10 minutes)
- [ ] **Installation tested** from marketplace

## Version Bump Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **Major (X.0.0)**: Breaking changes, major rewrites
  - Example: v1.0.0 → v2.0.0
  - Changes that break existing functionality

- **Minor (x.Y.0)**: New features, non-breaking changes
  - Example: v2.1.0 → v2.2.0
  - Adding new features
  - Adding new configuration options

- **Patch (x.y.Z)**: Bug fixes, small improvements
  - Example: v2.2.0 → v2.2.1
  - Fixing bugs
  - Performance improvements
  - Documentation updates

## Common Issues

### Issue: `Publisher 'fabioods' not found`

**Solution**: Create publisher first
```bash
vsce create-publisher fabioods
```

Or create at: https://marketplace.visualstudio.com/manage/publishers/

### Issue: `Extension already exists with this version`

**Solution**: Increment version number in `package.json`

The marketplace doesn't allow re-publishing the same version. Bump to next version:
```bash
npm version patch  # 2.2.0 → 2.2.1
```

### Issue: `Authentication failed`

**Solution**: Regenerate access token

1. Go to https://dev.azure.com/
2. Delete old token
3. Create new token with `Marketplace > Manage` scope
4. Login again:
   ```bash
   vsce login fabioods
   ```

### Issue: `self-signed certificate in certificate chain`

**Solution**: Disable SSL verification (behind corporate proxy)
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 vsce publish
```

### Issue: Open VSX shows old version

**Solution**: Wait for CDN cache to clear (10-15 minutes)

The Open VSX registry uses a CDN. After publishing, wait 10-15 minutes for the cache to clear before verifying.

### Issue: Icon not showing on marketplace

**Solution**: Ensure icon is in package.json and is 8-bit PNG
```json
{
  "icon": "icon.png"
}
```

Optimize icon:
```bash
magick icon.png -depth 8 -define png:color-type=6 icon-optimized.png
```

## Best Practices

1. **Test Thoroughly**: Always test the extension locally before publishing

2. **Descriptive Commit Messages**: Use conventional commits
   ```bash
   feat: Add new feature
   fix: Fix specific bug
   docs: Update documentation
   ```

3. **Detailed Changelog**: Keep CHANGELOG.md up to date with all changes

4. **Version Tags**: Always create git tags for releases

5. **Backup Tokens**: Store access tokens securely (password manager)

6. **Regular Updates**: Publish bug fixes and improvements regularly

7. **Monitor Issues**: Watch GitHub issues and marketplace reviews

8. **Breaking Changes**: Communicate breaking changes clearly in CHANGELOG

## Security

⚠️ **Never commit access tokens to git!**

Add to `.gitignore`:
```
.env
*.token
*secret*
```

Store tokens in environment variables or secure password managers.

## Resources

- **vsce Documentation**: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **Open VSX Documentation**: https://github.com/eclipse/openvsx/wiki/Publishing-Extensions
- **Semantic Versioning**: https://semver.org/
- **Azure DevOps PAT**: https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate

## Quick Reference

```bash
# Compile
npm run compile

# Package
vsce package

# Publish to VS Code Marketplace
NODE_TLS_REJECT_UNAUTHORIZED=0 vsce publish

# Publish to Open VSX
ovsx publish kotlin-implementation-lens-X.Y.Z.vsix -p $OVSX_PAT

# Test locally
code --install-extension kotlin-implementation-lens-X.Y.Z.vsix

# Install from marketplace
code --install-extension fabioods.kotlin-implementation-lens

# List installed extensions
code --list-extensions --show-versions | grep kotlin
```

---

**Happy Publishing! 🚀**
