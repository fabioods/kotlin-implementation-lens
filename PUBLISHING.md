# Publishing Guide: Kotlin/Java Implementation Lens

This guide walks you through publishing the extension to VS Code Marketplace (which also makes it available for Cursor).

## Prerequisites

- [ ] GitHub account
- [ ] Azure DevOps account (for Personal Access Token)
- [ ] VS Code Extension Manager (`vsce`) installed ✅

## Step 1: Create a Publisher Account

### 1.1 Create Azure DevOps Organization

1. Go to https://dev.azure.com
2. Sign in with your Microsoft/GitHub account
3. Create a new organization (e.g., "your-name-extensions")

### 1.2 Create Personal Access Token (PAT)

1. In Azure DevOps, click on your profile picture → **Personal access tokens**
2. Click **+ New Token**
3. Configure:
   - **Name**: `vscode-marketplace-publish`
   - **Organization**: Select your organization
   - **Expiration**: 90 days (or custom)
   - **Scopes**: Select **Marketplace → Manage** (full access)
4. Click **Create**
5. **IMPORTANT**: Copy the token immediately (you won't see it again)
6. Save it securely (e.g., password manager)

### 1.3 Create VS Code Publisher

1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with the same account
3. Click **Create publisher**
4. Fill in:
   - **Publisher ID**: Choose a unique ID (e.g., `yourname`, `fabiosantos`)
     - This will be part of your extension ID: `publisher.extension-name`
     - Cannot be changed later!
   - **Publisher name**: Your display name
   - **Email**: Your contact email
5. Click **Create**

## Step 2: Update package.json

Update the `publisher` field in `package.json`:

```json
{
  "publisher": "your-publisher-id"
}
```

Replace `your-publisher-id` with the Publisher ID you created in Step 1.3.

Also update these fields:
```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR-USERNAME/kotlin-implementation-lens"
  },
  "bugs": {
    "url": "https://github.com/YOUR-USERNAME/kotlin-implementation-lens/issues"
  },
  "homepage": "https://github.com/YOUR-USERNAME/kotlin-implementation-lens#readme"
}
```

## Step 3: Create Extension Icon (Optional but Recommended)

Create a 128x128 PNG icon named `icon.png` in the root directory.

**Quick option**: Use this placeholder or create your own:
```bash
# Remove icon reference if you don't have one yet
# Edit package.json and remove the "icon": "icon.png" line
```

## Step 4: Test Extension Locally

```bash
# Package the extension
vsce package

# This creates kotlin-implementation-lens-2.0.0.vsix
```

Install and test:
1. Open VS Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Install from VSIX"
4. Select the generated `.vsix` file
5. Test all features

## Step 5: Login to vsce

```bash
vsce login YOUR-PUBLISHER-ID
```

When prompted, paste your Personal Access Token from Step 1.2.

## Step 6: Publish to Marketplace

```bash
# Publish the extension
vsce publish
```

This will:
1. Compile TypeScript
2. Package the extension
3. Upload to VS Code Marketplace
4. Make it available within ~5-10 minutes

## Step 7: Verify Publication

1. Go to https://marketplace.visualstudio.com/
2. Search for "Kotlin Implementation Lens"
3. Verify your extension appears
4. Check the listing looks correct

## For Cursor Users

Cursor uses VS Code extensions, so once published to VS Code Marketplace, it's automatically available in Cursor:

1. Open Cursor
2. Go to Extensions (Cmd+Shift+X)
3. Search "Kotlin Implementation Lens"
4. Install

## Manual Installation (Alternative)

If you want to share the extension before publishing:

1. Package: `vsce package`
2. Share the `.vsix` file
3. Users install via "Install from VSIX"

## Updating the Extension

When you make changes:

```bash
# Update version in package.json
# Then:
vsce publish minor  # 2.0.0 → 2.1.0
# or
vsce publish patch  # 2.0.0 → 2.0.1
# or
vsce publish major  # 2.0.0 → 3.0.0
```

## Troubleshooting

### "Missing publisher name"
- Update `publisher` field in package.json

### "Missing repository"
- Add repository URL in package.json

### "Icon not found"
- Remove `"icon": "icon.png"` from package.json, or create the icon

### "Authentication failed"
- Verify your PAT is correct
- Make sure PAT has "Marketplace → Manage" scope
- Try `vsce logout` then `vsce login` again

## Best Practices

1. **Test thoroughly** before publishing
2. **Semantic versioning**:
   - Patch (2.0.X): Bug fixes
   - Minor (2.X.0): New features (backward compatible)
   - Major (X.0.0): Breaking changes
3. **Update CHANGELOG.md** with each release
4. **Tag releases** in Git:
   ```bash
   git tag v2.0.0
   git push origin v2.0.0
   ```
5. **Monitor issues**: Check GitHub issues and marketplace Q&A

## Useful Commands

```bash
# Package without publishing
vsce package

# Show extension info
vsce show YOUR-PUBLISHER-ID.kotlin-implementation-lens

# Unpublish (BE CAREFUL!)
vsce unpublish YOUR-PUBLISHER-ID.kotlin-implementation-lens

# Publish specific version
vsce publish 2.0.1
```

## Resources

- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [Marketplace](https://marketplace.visualstudio.com/manage)

## Quick Checklist

Before publishing:
- [ ] Update `publisher` in package.json
- [ ] Add repository URL
- [ ] Create or remove icon reference
- [ ] Test extension locally
- [ ] Update README.md
- [ ] Update CHANGELOG.md
- [ ] Commit all changes to Git
- [ ] Create GitHub repository (optional but recommended)

## Next Steps After Publishing

1. **Add to README**: Installation instructions
2. **Create Screenshots**: Show CodeLens in action
3. **Write Tutorial**: Blog post or video
4. **Share**: Reddit, Twitter, LinkedIn
5. **Monitor**: GitHub issues, marketplace ratings

---

**Ready to publish?** Follow the steps above, and your extension will be live on VS Code Marketplace and available for Cursor users!
