/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ExtensionContext, workspace, commands } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient/node";
import { ChildProcess, spawn } from "child_process";

let client: LanguageClient;
let server: ChildProcess;

function startServer(serverPath : string, ek9Path : string) {

    if (serverPath && ek9Path) {
        console.log('EK9 extension active: lsp server is [' + serverPath + '] [' + ek9Path + ']');
        const serverOptions: ServerOptions = async (): Promise<ChildProcess> => {
            const args = [
                "-jar",
                ek9Path,
                "-ls"
            ];
            server = spawn(serverPath, args);
            return server;
        };

        const clientOptions: LanguageClientOptions = {
            documentSelector: [{ scheme: "file", language: "ek9" }],
            diagnosticCollectionName: "ek9-ls",
        };

        client = new LanguageClient("ek9-ls", "EK9 Language Server", serverOptions, clientOptions);

        client.start();
    }
    else {
        console.error('EK9 extension NOT active: lsp server configuration is incomplete');
    }
}

async function killServer() : Promise<void> {
    await client.stop();
    server.kill();
}

export function activate(context: ExtensionContext) {
    const config = workspace.getConfiguration("ek9-ls");
    const javaCommand : string | undefined = config.get("javaCommand");
    if(javaCommand)
    {
        console.log('EK9 extension: java command [' + javaCommand + ']');
    }
    else
    {
        console.error('EK9 extension: ek9-ls.javaCommand must be set to the path for a java');
    }

    const compilerPath : string | undefined = config.get("compilerPath");
    if(compilerPath)
    {
        console.log('EK9 extension: compiler [' + compilerPath + ']');
    }
    else
    {
        console.error('EK9 extension: ek9-ls.compilerPath must be set to the path for ek9.jar (the compiler)');
    }

    const serverPath : string = javaCommand ? javaCommand : "";
    const ek9Path : string = compilerPath ? compilerPath : "";

    startServer(serverPath, ek9Path);

    context.subscriptions.push(commands.registerCommand("ek9-ls.restartServer", async () => {
        await killServer();
        startServer(serverPath, ek9Path);
    }));

    context.subscriptions.push(commands.registerCommand("ek9-ls.killServer", async () => {
        await killServer();
    }));

}

export function deactivate(): Thenable<void> | undefined {
    console.log('EK9 extension deactivate: lsp server');
    return killServer();
}
