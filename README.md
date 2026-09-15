# EK9 Language Server

![GitHub top language](https://img.shields.io/github/languages/top/stephenjohnlimb/vscode-ek9-ls)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/stephenjohnlimb/vscode-ek9-ls)
![GitHub](https://img.shields.io/github/license/stephenjohnlimb/vscode-ek9-ls)

A vscode language server extension for the EK9 programming language.

## How to build the extension
Clone the repo, then run `vsce package`; this will produce `ek9-ls-0.0.1.vsix`. You can now manually install that into VSCode.

## Altering
Main entery point for updating is `extension.ts` and also `package.json` for the visual configuration options.


## Usage

Set the `"ek9-ls.javaCommand"` configuration setting to the full path of Java i.e. (c:\jdk-21\bin\java).

Also set the `"ek9-ls.compilerPath"` configuration setting to the full path of the ek9.jar or the native executable (that has the compiler). 

If you want help on the EK9 language itself then set `"ek9-ls.languageHelp"` to true.

If you want the EK9 LSP to display verbose diagnostic logging in the VS Code output window then set
`"ek9-ls.debugVerbose"` to true. (This controls the *language server's* own logging — it is not the
same as debugging an EK9 program, see below.)

Now includes text mate syntax highlighting and code snippets for common operations.

## Debugging EK9 programs (in development)

The extension contributes an `ek9` debug type so you can set breakpoints in `.ek9` files, inspect the
call stack and local variables, and step through EK9 code. The breakpoint/variable/step mapping is
driven by the debug info the EK9 compiler emits (compile with debug info — the `ek9 -Cg` / `withDebug`
option — so the SMAP and `LocalVariableTable` are present).

An `attach` launch configuration connects to a running EK9 program started under JDWP
(`server=y,suspend=y`). Debugging is served by an EK9 debug adapter (a Debug Adapter Protocol server).
This is still being wired into the compiler distribution as `ek9 -dap`; until then the extension
connects to a debug adapter already listening on the TCP port given by `"ek9-ls.debugAdapterPort"`
(default `4711`).

Example `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "ek9",
      "request": "attach",
      "name": "EK9: Attach to debuggee (5005)",
      "hostName": "127.0.0.1",
      "port": 5005
    }
  ]
}
```

Extension will work without the ek9.jar/native compiler, language server will provide additional hover text and diagnostics.

NOTE the native compiler is still work in progress and does not function correctly at present.

## Open Source
If you'd like improvements to the syntax highlighting or the snippets please [fork](https://github.com/stephenjohnlimb/vscode-ek9-ls)
and create a pull request.
## Credits

This extension is based on [volpe-ls](https://github.com/ViliamVadocz/vscode-volpe-ls), the Generic LSP Client for Visual Studio Code.
