const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');

console.error('================================================');
console.error('🚀 KOTLIN IMPLEMENTATION LENS - MODULE LOADED');
console.error('================================================');

class KotlinImplementationLensProvider {
    constructor() {
        console.error('📦 KotlinImplementationLensProvider CONSTRUCTOR called');
        this._onDidChangeCodeLenses = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
        this.cache = new Map();
    }

    provideCodeLenses(document, token) {
        console.error(`👁️ provideCodeLenses called for: ${document.fileName}`);
        const codeLenses = [];
        const text = document.getText();
        const lines = text.split('\n');
        const interfaceRegex = /^\s*interface\s+(\w+)/;

        lines.forEach((line, index) => {
            const match = line.match(interfaceRegex);
            if (match) {
                const interfaceName = match[1];
                console.error(`✅ Found interface: ${interfaceName} at line ${index + 1}`);
                const range = new vscode.Range(index, 0, index, line.length);
                
                const codeLens = new vscode.CodeLens(range, {
                    title: "👁️ implementations",
                    command: 'kotlin-implementation-lens.showImplementations',
                    arguments: [interfaceName, document.uri]
                });
                
                codeLenses.push(codeLens);
            }
        });

        console.error(`📊 Returning ${codeLenses.length} CodeLens(es)`);
        return codeLenses;
    }

    resolveCodeLens(codeLens, token) {
        // Não fazemos o resolve - deixamos o título fixo e funcional
        // O usuário clica e vê as implementações direto!
        return codeLens;
    }
}

async function showImplementations(interfaceName, documentUri) {
    console.error(`🎯 showImplementations called for: ${interfaceName}`);
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri);
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
    }

    const workspacePath = workspaceFolder.uri.fsPath;
    const cmd = `cd "${workspacePath}" && grep -rn ") : ${interfaceName}" --include="*.kt" application/src core/src 2>/dev/null`;
    
    console.error(`📍 Finding implementations with: ${cmd}`);

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Searching ${interfaceName} implementations...`,
        cancellable: false
    }, async () => {
        return new Promise((resolve) => {
            exec(cmd, { timeout: 5000, maxBuffer: 1024 * 1024 }, async (error, stdout, stderr) => {
                console.error(`📤 stdout:`, stdout);
                
                if (error && !stdout) {
                    vscode.window.showWarningMessage(`No implementations found for ${interfaceName}`);
                    console.error(`❌ Error:`, error);
                    resolve();
                    return;
                }

                if (!stdout || stdout.trim().length === 0) {
                    vscode.window.showInformationMessage(`No implementations found for ${interfaceName}`);
                    resolve();
                    return;
                }

                const lines = stdout.trim().split('\n');
                console.error(`📊 Found ${lines.length} matches`);
                
                const items = [];
                
                for (const line of lines) {
                    const match = line.match(/^(.+):(\d+):(.*)$/);
                    if (match) {
                        const filePath = path.join(workspacePath, match[1]);
                        const lineNum = parseInt(match[2]) - 1;
                        const content = match[3].trim();
                        
                        const fileName = path.basename(filePath);
                        const dirName = path.basename(path.dirname(filePath));
                        
                        try {
                            const document = await vscode.workspace.openTextDocument(filePath);
                            const text = document.getText();
                            const textLines = text.split('\n');
                            
                            let className = fileName.replace('.kt', '');
                            for (let i = Math.max(0, lineNum - 10); i < lineNum; i++) {
                                const classMatch = textLines[i].match(/class\s+(\w+)/);
                                if (classMatch) {
                                    className = classMatch[1];
                                }
                            }
                            
                            items.push({
                                label: `$(symbol-class) ${className}`,
                                description: `${dirName}/${fileName}`,
                                detail: `Line ${lineNum + 1}: ${content}`,
                                filePath: filePath,
                                line: lineNum
                            });
                        } catch (err) {
                            console.error(`❌ Error reading file:`, err);
                        }
                    }
                }

                if (items.length === 0) {
                    vscode.window.showInformationMessage(`No implementations found for ${interfaceName}`);
                    resolve();
                    return;
                }

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: `${items.length} implementation(s) of ${interfaceName} - Select to navigate`,
                    matchOnDescription: true,
                    matchOnDetail: true
                });

                if (selected) {
                    try {
                        const document = await vscode.workspace.openTextDocument(selected.filePath);
                        const editor = await vscode.window.showTextDocument(document);
                        
                        const text = document.getText();
                        const lines = text.split('\n');
                        let classLine = selected.line;
                        
                        // Procura a linha com "class" nas 10 linhas anteriores
                        for (let i = Math.max(0, selected.line - 10); i < selected.line; i++) {
                            if (lines[i].includes('class ')) {
                                classLine = i;
                                break;
                            }
                        }
                        
                        const position = new vscode.Position(classLine, 0);
                        editor.selection = new vscode.Selection(position, position);
                        editor.revealRange(
                            new vscode.Range(position, position), 
                            vscode.TextEditorRevealType.InCenter
                        );
                    } catch (err) {
                        vscode.window.showErrorMessage(`Error opening file: ${err.message}`);
                    }
                }
                
                resolve();
            });
        });
    });
}

function activate(context) {
    console.error('================================================');
    console.error('🚀🚀🚀 KOTLIN IMPLEMENTATION LENS ACTIVATED! 🚀🚀🚀');
    console.error('================================================');
    
    vscode.window.showInformationMessage('🎉 Kotlin Implementation Lens is active!');

    const provider = new KotlinImplementationLensProvider();
    
    console.error('📝 Registering CodeLens provider...');
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            { language: 'kotlin', scheme: 'file' }, 
            provider
        )
    );

    console.error('⚙️ Registering commands...');
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'kotlin-implementation-lens.showImplementations', 
            showImplementations
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'kotlin-implementation-lens.clearCache',
            () => {
                provider.cache.clear();
                vscode.window.showInformationMessage('✅ Cache cleared!');
                provider._onDidChangeCodeLenses.fire();
            }
        )
    );
    
    console.error('✅ All components registered successfully!');
    console.error('================================================');
}

function deactivate() {
    console.error('👋 Kotlin Implementation Lens deactivated');
}

module.exports = {
    activate,
    deactivate
};
