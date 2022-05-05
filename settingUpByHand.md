Short Version

This is a summary, excepting of you to already know VS Code. Try the [verbose instruction]() if you get stuck.
1. Download the zip of [VS Code Insiders](https://code.visualstudio.com/insiders/), we cached here Version 1.65.0
2. Create a folder where you want to unzip it,this is our ``Root``
3. In ``Root``: create a directory called ``data`` to set into portable mode
4. in ``Root/data``: create the nested directory ``user-data/User``
5. in ``Root/data``: insert ``repo/ressources/extensions``
6. in ``Root/data/user-data/User``: insert from ``rep/ressources`` ``snippets``,``keybindings`` and ``settings``
7. Clone the [Game-Source]()
8. open it it as Workspace
9. Insert in ``Game-Source/workspaceSettings.code`` at key ``godot_tools.editor_path`` your filepath to Godot 3

**Your Structure should look like this**
![Structure](Media/Enviroment.PNG)



Verbose Version

* We dont recommend/use the @ or blankspaces in names
* We use the portable version of VS Code Insiders
* We instruct in very small steps to reduce mistakes
* We will start every filepath from the Root of the Enviroment

0.  Choose a Directory where you want to Install your Enviroment, like your Desktop
1.  Create a new Directory named `PatnicRoom-Enviroment`
2.  Enter `PatnicRoom-Enviroment` and...
    1.  create new Directory named `VSCode-Insiders`
    2.  create new Directory named `Workspaces`
    3.  clone this Repository into it.
3. Enter ``PatnicRoom-Enviroment/installer/ressources`` and...
    1. Copy the VS Code Insiders zip according to your Operatingsystem
4. Enter ``PatnicRoom-Enviroment/VSCode-Insiders`` and...
    1. unzip this file  into the Directory
    2. create new Directory named `data`
5. Enter ``PatnicRoom-Enviroment/installer/ressources`` and...
    1. copy the directory `extensions`
6. Enter ``PatnicRoom-Enviroment/VSCode-Insiders/data`` and...
    1. paste the directory `extensions` into it
    1. create new NESTED Directories named ``user-data/User``
7. Enter ``PatnicRoom-Enviroment/installer/ressources`` and...
    1. copy the directory `snippets` AND the files `keybindings` AND `settings`
8. Enter ``PatnicRoom-Enviroment/VSCode-Insiders/data/user-data/User`` and...
    1. paste your three copies into it
9. Clone the [Game-Source]() into your desired Directory
10. Enter ``PatnicRoom-Enviroment/VSCode-Insiders`` and...
    1. start ``Code - Insiders.exe``
    2. Enable extensions
    3. Select the Tab File -> open Workspace from File
    4. Navigate to the Game-Source and select the File ``workspaceSettings``
11. open in VSCode the last file in Explorer named ``Game-Source/workspaceSettings.code`` and...
    1. Jump to key "godot_tools.editor_path" (Line 13)
    2. insert in the value your filepath to godot.exe








