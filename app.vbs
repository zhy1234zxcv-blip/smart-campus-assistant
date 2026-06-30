Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
Dim root: root = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = root
WshShell.Run "powershell -ExecutionPolicy Bypass -File """ & root & "\tray.ps1""", 0, False
