/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ExtensionContext, workspace, commands, debug, DebugAdapterDescriptor,
         DebugAdapterServer, DebugAdapterExecutable, DebugSession, ProviderResult } from "vscode";
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

function getCommandLineArguments(languageHelp : boolean, debugVerbose: boolean): string[] {
  // Each flag MUST be its own argv element. Returning a single "-lsh -dv" string makes spawn pass it
  // as one argument, which the EK9 CLI rejects ("Option '-lsh -dv' not understood"), so the server
  // exits immediately and the LSP connection closes.
  const params : string[] = [languageHelp ? "-lsh" : "-ls"];
  if(debugVerbose) {
    params.push("-dv");
  }
  return params;
}


function startNativeLSPServer(ek9Path : string, languageHelp : boolean, debugVerbose: boolean) {
    if (ek9Path) {
      console.log('EK9 extension active: lsp server is [' + ek9Path + ']');
      const serverOptions: ServerOptions = async (): Promise<ChildProcess> => {
          const args = getCommandLineArguments(languageHelp, debugVerbose);
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
            const args = [
                "-jar",
                ek9Path,
                ...getCommandLineArguments(languageHelp, debugVerbose)
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

function registerDebugAdapter(context: ExtensionContext) {
    // The EK9 debug adapter ('ek9 -dap') owns setBreakpoints itself and maps a `.ek9` source line to a
    // JDI breakpoint via the SMAP EK9 stratum - the forward mapping stock java-debug can't do because
    // it resolves through jdt.ls. By default we SPAWN 'ek9 -dap' (java -jar the compiler, or the native
    // executable) reusing the same javaCommand/compilerPath as the language server. As a development
    // override, if ek9-ls.debugAdapterPort is set to a non-zero port we CONNECT to a standalone adapter
    // already listening there (so the adapter can be iterated without repackaging the extension).
    context.subscriptions.push(debug.registerDebugAdapterDescriptorFactory("ek9", {
        createDebugAdapterDescriptor(_session: DebugSession): ProviderResult<DebugAdapterDescriptor> {
            const cfg = workspace.getConfiguration("ek9-ls");
            const port: number = cfg.get("debugAdapterPort") ?? 0;
            if (port > 0) {
                return new DebugAdapterServer(port);
            }
            const useNative: boolean = cfg.get("useNative") ?? false;
            const compilerPath: string = cfg.get("compilerPath") ?? "";
            const javaCommand: string = cfg.get("javaCommand") || "java";
            if (useNative) {
                return new DebugAdapterExecutable(compilerPath, ["-dap"]);
            }
            // --add-modules jdk.jdi is needed on JDKs that do not resolve the JDI module for a
            // classpath app (harmless where it already is resolved).
            return new DebugAdapterExecutable(javaCommand, ["--add-modules", "jdk.jdi", "-jar", compilerPath, "-dap"]);
        }
    }));
    console.log("EK9 extension: debug adapter factory registered");
}

export function activate(context: ExtensionContext) {
    const config = workspace.getConfiguration("ek9-ls");

    // Register the debugger up front, independent of the LSP server configuration, so debugging works
    // even if the compiler path for the language server is not yet set.
    registerDebugAdapter(context);

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
