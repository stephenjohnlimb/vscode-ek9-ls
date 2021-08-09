# EK9 Language Server

![GitHub](https://img.shields.io/github/license/stephenjohnlimb/vscode-ek9-ls)
A vscode language server extension for the EK9 programming language.

## Usage

Set the `"ek9-ls.javaCommand"` configuration setting to the full path of Java ie (c:\jdk-15\bin\java).

Also set the `"ek9-ls.compilerPath"` configuration setting to the full path of the ek9.jar (that has the compiler). 

Now includes text mate syntax highlighting and code snippets for common operations.

Extension will work without the ek9.jar compiler, but the ek9.jar language server will provide additional hover text and diagnostics.

## Open Source
If you'd like improvements to the syntax highlighting or the snippets please [fork](https://github.com/stephenjohnlimb/vscode-ek9-ls)
and create a pull request. 
## Credits

This extension is based on [volpe-ls](https://github.com/ViliamVadocz/vscode-volpe-ls), the Generic LSP Client for Visual Studio Code.
