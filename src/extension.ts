/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ExtensionContext, workspace, commands } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient/node";
import { ChildProcess, spawn } from "child_process";

let client: LanguageClient;
let server: ChildProcess;

function getLanguageClientOptions() : LanguageClientOptions {
    const clientOptions: LanguageClientOptions = {
      documentSelector: [{ scheme: "file", language: "ek9" }],
      synchronize: {
        fileEvents: workspace.createFileSystemWatcher('**/*.ek9')
      },
      diagnosticCollectionName: "ek9-ls",
  };
  return clientOptions;
}

function getCommandLineArguments(languageHelp : boolean, debugVerbose: boolean): string {
  var params : string = languageHelp ? "-lsh" : "-ls";
  if(debugVerbose) {
    params += " -dv"
  }
  return params;
}


function startNativeLSPServer(ek9Path : string, languageHelp : boolean, debugVerbose: boolean) {
    if (ek9Path) {
      console.log('EK9 extension active: lsp server is [' + ek9Path + ']');
      const serverOptions: ServerOptions = async (): Promise<ChildProcess> => {
          const params : string = getCommandLineArguments(languageHelp, debugVerbose);
          const args = [
              params
          ];
          server = spawn(ek9Path, args);
          return server;
      };

      const clientOptions: LanguageClientOptions = getLanguageClientOptions();

      client = new LanguageClient("ek9-ls", "Java EK9 Language Server", serverOptions, clientOptions);

      client.start();
  }
  else {
      console.error('EK9 extension NOT active: native lsp server configuration is incomplete');
  }
}

function startJavaBasedLSPServer(serverPath : string, ek9Path : string, languageHelp : boolean, debugVerbose: boolean) {

    if (serverPath && ek9Path) {
        console.log('EK9 extension active: lsp server is [' + serverPath + '] [' + ek9Path + ']');
        const serverOptions: ServerOptions = async (): Promise<ChildProcess> => {
          const params : string = getCommandLineArguments(languageHelp, debugVerbose);
            const args = [
                "-jar",
                ek9Path,
                params
            ];
            server = spawn(serverPath, args);
            return server;
        };

        const clientOptions: LanguageClientOptions = getLanguageClientOptions();

        client = new LanguageClient("ek9-ls", "Java EK9 Language Server", serverOptions, clientOptions);

        client.start();
    }
    else {
        console.error('EK9 extension NOT active: Java lsp server configuration is incomplete');
    }
}

async function killServer() : Promise<void> {
    await client.stop();
    server.kill();
}

export function activate(context: ExtensionContext) {
    const config = workspace.getConfiguration("ek9-ls");

    const useNative : boolean | undefined = config.get("useNative")
    const javaCommand : string | undefined = config.get("javaCommand");

    if(javaCommand)
    {
        console.log('EK9 extension: java command [' + javaCommand + ']');
    }
    else if(!useNative)
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
        console.error('EK9 extension: ek9-ls.compilerPath must be set to the path for ek9.jar/native command (the compiler)');
    }

    const languageHelp : boolean | undefined = config.get("languageHelp")
    if(languageHelp)
    {
      console.log('EK9 extension: languageHelp [' + languageHelp + ']');
    }

    const debugVerbose : boolean | undefined = config.get("debugVerbose")
    if(debugVerbose)
    {
      console.log('EK9 extension: debugVerbose [' + debugVerbose + ']');
    }

    const serverPath : string = javaCommand ? javaCommand : "";
    const ek9Path : string = compilerPath ? compilerPath : "";
    const ek9LanguageHoverHelp : boolean = languageHelp ? languageHelp : false;
    const ek9DebugVerbose : boolean = debugVerbose ? debugVerbose : false;

    if(!useNative) {
      startJavaBasedLSPServer(serverPath, ek9Path, ek9LanguageHoverHelp, ek9DebugVerbose);
    } else {
      startNativeLSPServer(ek9Path, ek9LanguageHoverHelp, ek9DebugVerbose);
    }

    context.subscriptions.push(commands.registerCommand("ek9-ls.restartServer", async () => {
        await killServer();
        if(!useNative) {
          startJavaBasedLSPServer(serverPath, ek9Path, ek9LanguageHoverHelp, ek9DebugVerbose);
        } else {
          startNativeLSPServer(ek9Path, ek9LanguageHoverHelp, ek9DebugVerbose);
        }

    }));

    context.subscriptions.push(commands.registerCommand("ek9-ls.killServer", async () => {
        await killServer();
    }));

}

export function deactivate(): Thenable<void> | undefined {
    console.log('EK9 extension deactivate: lsp server');
    return killServer();
}
