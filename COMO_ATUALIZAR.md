# 🔄 Como Atualizar a Extensão

Guia completo para publicar novas versões da **Kotlin Implementation Lens**.

---

## 📝 Passo a Passo Completo

### 1️⃣ Fazer as Alterações no Código

Edite os arquivos necessários:
- `extension.js` - Código principal
- `README.md` - Documentação
- `CHANGELOG.md` - Histórico de mudanças

---

### 2️⃣ Atualizar Versão

Escolha o tipo de atualização:

```bash
cd /Users/santos.fabio/.cursor/extensions/kotlin-implementation-lens

# Para bug fixes (1.0.0 → 1.0.1)
npm version patch

# Para novas features (1.0.0 → 1.1.0)
npm version minor

# Para breaking changes (1.0.0 → 2.0.0)
npm version major
```

Ou edite manualmente o `package.json`:
```json
{
  "version": "1.0.1"  // ← Aumente aqui
}
```

---

### 3️⃣ Atualizar CHANGELOG.md

Adicione as mudanças no topo do arquivo:

```markdown
# Change Log

## [1.0.1] - 2025-10-XX

### Fixed
- Corrigido bug X
- Melhorado performance Y

### Added
- Nova feature Z

## [1.0.0] - 2025-10-05
...
```

---

### 4️⃣ Commit e Push para GitHub

```bash
git add .
git commit -m "Release v1.0.1: Descrição das mudanças"
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

---

### 5️⃣ Gerar Novo Pacote

```bash
cd /Users/santos.fabio/.cursor/extensions/kotlin-implementation-lens
vsce package
```

Isso cria: `kotlin-implementation-lens-1.0.1.vsix`

---

### 6️⃣ Publicar no VS Marketplace

#### Opção A: Upload Manual (Recomendado)

1. Acesse: https://marketplace.visualstudio.com/manage/publishers/fabioods
2. Clique na extensão **"Kotlin Implementation Lens"**
3. Clique em **"Update"** (ou "..." → "Update")
4. Faça upload do novo `.vsix`
5. Aguarde 5-15 minutos

#### Opção B: Via CLI (se o token funcionar)

```bash
vsce publish
```

---

### 7️⃣ Publicar no Open VSX (Cursor)

```bash
ovsx publish kotlin-implementation-lens-1.0.1.vsix -p SEU-TOKEN
```

**Seu token atual:** `6fbe2731-6d95-4820-87a6-55462a9e13d0`
(⚠️ Guarde em local seguro! Não comite no Git!)

Ou salve o token em variável de ambiente:
```bash
export OVSX_PAT="6fbe2731-6d95-4820-87a6-55462a9e13d0"
ovsx publish kotlin-implementation-lens-1.0.1.vsix
```

---

## 🚀 Script Rápido (Copy & Paste)

Salve isso como `publish.sh` e execute `bash publish.sh`:

```bash
#!/bin/bash

echo "🔄 Atualizando Kotlin Implementation Lens"
echo ""

# 1. Perguntar tipo de versão
echo "Tipo de atualização?"
echo "1) patch (bug fixes) - 1.0.0 → 1.0.1"
echo "2) minor (features)  - 1.0.0 → 1.1.0"
echo "3) major (breaking)  - 1.0.0 → 2.0.0"
read -p "Escolha (1/2/3): " choice

case $choice in
  1) npm version patch ;;
  2) npm version minor ;;
  3) npm version major ;;
  *) echo "❌ Opção inválida"; exit 1 ;;
esac

VERSION=$(node -p "require('./package.json').version")
echo ""
echo "📦 Nova versão: $VERSION"
echo ""

# 2. Commit e push
read -p "📝 Descrição das mudanças: " desc
git add .
git commit -m "Release v$VERSION: $desc"
git tag "v$VERSION"
git push origin main
git push origin "v$VERSION"

echo ""
echo "✅ Código commitado e tag criada!"
echo ""

# 3. Gerar pacote
echo "📦 Gerando pacote..."
vsce package
echo "✅ Pacote gerado!"
echo ""

# 4. Publicar Open VSX
echo "🚀 Publicando no Open VSX (Cursor)..."
ovsx publish "kotlin-implementation-lens-$VERSION.vsix" -p "6fbe2731-6d95-4820-87a6-55462a9e13d0"
echo "✅ Open VSX publicado!"
echo ""

# 5. Instruções VS Marketplace
echo "📋 PRÓXIMO PASSO MANUAL:"
echo ""
echo "1. Acesse: https://marketplace.visualstudio.com/manage/publishers/fabioods"
echo "2. Clique em 'Kotlin Implementation Lens'"
echo "3. Clique em 'Update'"
echo "4. Faça upload de: kotlin-implementation-lens-$VERSION.vsix"
echo ""
echo "✅ Pronto!"
```

---

## 🔐 Tokens Salvos

### VS Marketplace (Azure DevOps)
- URL: https://dev.azure.com/fahds/_usersSettings/tokens
- Não funcionou via CLI, use upload manual

### Open VSX (Cursor)
- Token: `6fbe2731-6d95-4820-87a6-55462a9e13d0`
- Válido para publicação via CLI

---

## 📊 Links Importantes

### Gerenciar Extensões
- **VS Marketplace**: https://marketplace.visualstudio.com/manage/publishers/fabioods
- **Open VSX**: https://open-vsx.org/user-settings/extensions

### Visualizar Extensões Publicadas
- **VS Marketplace**: https://marketplace.visualstudio.com/items?itemName=fabioods.kotlin-implementation-lens
- **Open VSX**: https://open-vsx.org/extension/fabioods/kotlin-implementation-lens
- **GitHub**: https://github.com/fabioods/kotlin-implementation-lens

### Estatísticas
- **VS Marketplace**: https://marketplace.visualstudio.com/manage/publishers/fabioods/extensions/kotlin-implementation-lens/hub
- Veja: downloads, avaliações, Q&A

---

## ⚡ Comandos Rápidos

```bash
# Atualizar versão
npm version patch

# Gerar pacote
vsce package

# Publicar Cursor
ovsx publish kotlin-implementation-lens-X.Y.Z.vsix -p 6fbe2731-6d95-4820-87a6-55462a9e13d0

# Commit tudo
git add . && git commit -m "Release vX.Y.Z" && git push
```

---

## 🐛 Solução de Problemas

### "Extension already published"
- Você precisa **aumentar a versão** no `package.json`

### "Invalid manifest"
- Execute `vsce package` e veja os erros
- Valide o JSON: https://jsonlint.com/

### "Publisher not found"
- Use upload manual no site
- Certifique-se de estar logado na conta correta

---

## 📝 Checklist Pré-Publicação

Antes de publicar, verifique:

- [ ] Versão aumentada no `package.json`
- [ ] `CHANGELOG.md` atualizado
- [ ] Código testado localmente
- [ ] README.md atualizado (se necessário)
- [ ] Commit e push para GitHub
- [ ] Tag de versão criada (`git tag vX.Y.Z`)
- [ ] Pacote `.vsix` gerado
- [ ] Publicado no Open VSX
- [ ] Upload manual no VS Marketplace
- [ ] Aguardar aprovação (5-30 min)
- [ ] Testar instalação

---

## 🎯 Exemplo Completo

```bash
# 1. Fazer mudanças no código
vim extension.js

# 2. Atualizar versão
npm version patch  # 1.0.0 → 1.0.1

# 3. Atualizar changelog
vim CHANGELOG.md

# 4. Commit
git add .
git commit -m "Release v1.0.1: Fix implementation search"
git tag v1.0.1
git push origin main --tags

# 5. Gerar pacote
vsce package

# 6. Publicar Cursor
ovsx publish kotlin-implementation-lens-1.0.1.vsix -p 6fbe2731-6d95-4820-87a6-55462a9e13d0

# 7. VS Marketplace (manual)
# → Acesse https://marketplace.visualstudio.com/manage/publishers/fabioods
# → Update → Upload .vsix
```

---

## 🎉 Pronto!

Sua atualização será publicada e disponível para todos os usuários!

**Lembre-se:**
- Open VSX: **Instantâneo** ⚡
- VS Marketplace: **5-30 minutos** de aprovação ⏱️

---

**Boa sorte com as atualizações! 🚀**
