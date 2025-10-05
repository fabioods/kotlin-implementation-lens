# ✅ TODO para Publicar

## ANTES de Publicar (30 min):

1. [ ] **Criar ícone** → Canva.com → 128x128px → roxo #7F52FF + 👁️
2. [ ] **GitHub**: Criar repo `kotlin-implementation-lens`
3. [ ] **Git**:
   ```bash
   cd ~/.cursor/extensions/kotlin-implementation-lens
   git init
   git add .
   git commit -m "Initial release v1.0.0"
   git remote add origin https://github.com/SEU-USER/kotlin-implementation-lens.git
   git push -u origin main
   ```
4. [ ] **Editar package.json**: Substituir "fabioods" por seu GitHub user

## Publicar (15 min):

5. [ ] **Instalar ferramentas**:
   ```bash
   npm install -g @vscode/vsce ovsx
   ```

6. [ ] **Criar conta Microsoft** → marketplace.visualstudio.com/manage
7. [ ] **Criar Publisher** no marketplace (nome: seu-nome)
8. [ ] **Gerar Token**: dev.azure.com → Personal Access Token → Marketplace: Manage

9. [ ] **Empacotar**:
   ```bash
   cd ~/.cursor/extensions/kotlin-implementation-lens
   vsce package
   ```

10. [ ] **Publicar VSCode**:
    ```bash
    vsce login SEU-PUBLISHER
    vsce publish
    ```

11. [ ] **Publicar Cursor** (Open VSX):
    ```bash
    ovsx login SEU-USER  
    ovsx publish kotlin-implementation-lens-1.0.0.vsix
    ```

## Pronto! 🎉

Marketplace: https://marketplace.visualstudio.com/items?itemName=SEU-PUBLISHER.kotlin-implementation-lens
