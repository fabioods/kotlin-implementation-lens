#!/usr/bin/env fish

echo "🔄 Atualizando Kotlin Implementation Lens"
echo ""

# 1. Perguntar tipo de versão
echo "Tipo de atualização?"
echo "1) patch (bug fixes) - 1.0.0 → 1.0.1"
echo "2) minor (features)  - 1.0.0 → 1.1.0"
echo "3) major (breaking)  - 1.0.0 → 2.0.0"
read -P "Escolha (1/2/3): " choice

switch $choice
    case 1
        npm version patch
    case 2
        npm version minor
    case 3
        npm version major
    case '*'
        echo "❌ Opção inválida"
        exit 1
end

set VERSION (node -p "require('./package.json').version")
echo ""
echo "📦 Nova versão: $VERSION"
echo ""

# 2. Commit e push
read -P "📝 Descrição das mudanças: " desc
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
if set -q OVSX_PAT
    ovsx publish "kotlin-implementation-lens-$VERSION.vsix" -p "$OVSX_PAT"
else
    read -P "Cole o token do Open VSX: " token
    ovsx publish "kotlin-implementation-lens-$VERSION.vsix" -p "$token"
end
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
echo "✅ Pronto! Arquivo gerado: kotlin-implementation-lens-$VERSION.vsix"
