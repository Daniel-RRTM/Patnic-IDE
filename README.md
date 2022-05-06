![P@tnicroom](ressources//Title.png)

<h4 align="center">A entropic Sandbox Game in the Shadowrun universe</h4>

<p align="center">
    <a href="https://godotengine.org/download/windows">
    <img src="https://img.shields.io/badge/Godot-478CBF?style=for-the-badge&logo=GodotEngine&logoColor=white">
    <a href="https://github.com/Daniel-RRR/Patnic-IDE">
    <img src="https://img.shields.io/badge/Visual_Studio_Code-0078D4?style=for-the-badge&logo=visual%20studio%20code&logoColor=white">
    <a href="https://daniel-rrr.github.io">
    <img src="https://img.shields.io/badge/website-003366?style=for-the-badge&logoColor=white">
    <a href="https://daniel-rrr.github.io/docs">
    <img src="https://readthedocs.org/projects/pip/badge/?version=latest&style=for-the-badge">
</p> 



<p align="center">
    <a href="#Overview">Overview</a> •
    <a href="#Installation">Installation</a> •
    <a href="#Getting started">Getting started</a> •
    <a href="#Documentation">Documentation</a> •
    <a href="#contributing">Contributing</a> •
    <a href="#FAQ">FAQ</a> •
    <a href="#credits">Credits</a> •
    <a href="#License">License</a>
- </p>


---
<br>


## Overview
P@nicroom is more than a Game, its a Platform! By Installing this Enviroment, you get...

**The Base-game**
* Inspired by the **abstract but fascinating** ASCII-Rougelikes from the 80s
* Set in a World of **Shadowrun**: where Man meets **Magic and Machine**.
* **Experimental** design and **automated Wiki** which rewards Player who learn to exploit it.
* **Systemic Design** and **DOP** to enable emergent Gameplay and personal narratives.

**Its Content-creator**
* **read, write and share elements** of the Game without needing knowledge in Coding.
* **own Textformat for declaration**, the nearest comparrison is a mix of Markdown and JSON
* **Browsing and filtering by attributes** for Elements

**And our In-House setup**
* Improved Structure and Navigation by **Line-formatting, Bookmarking and Modulariced Implementations**
* Guided Implementation by  **flow-charts, IDE-shortcuts and Snippets**
* **CLI written in Rust** for pipelined processes and Workflow automation




Looking for more details?
* [**Webpage**](https://daniel-rrr.github.io) for generall info about the Game.
* [**Wiki**](https://daniel-rrr.github.io/wiki.html) for specific info about Features.
* [**API Docs**](https://daniel-rrr.github.io/docs.html) for in-depth knowldege about Implementation.


---
<br>


## Installation

### Prerequisites
* Windows 10, 32 and 64 bit are both fine
* [Godot 3](https://godotengine.org/download/windows)
* Internet connection
* We also recommend [mkDocs](https://www.mkdocs.org) for generating Wiki articles

### Installing by Script
1. clone the Repository into the directory where you want your IDE
2. run installer.sh  
  
You dont trust foreign bashs? wise decision! [feel free to take look on its content](installer.sh).  
It makes some directories, moves files and clones other Repositories of our project.    
  
If you still want to set it up manually, [click here for instructions.](settingUpByHand.md)



---
<br>


## Getting started
Coming soon!



---
<br>


## Documentation
Panicroom is big in size and quite complex.Thats why momentarily focuse on the **Documentation of the Base-game** alone.  
We also appreciate feedback to improve its wording, formatting and Navigation!

Visit our [**Wiki**](https://daniel-rrr.github.io/wiki.html) if you are a **player** and looking for some specific information on a Game-object like an item, abillity or race.

Visit our [**Docs**](https://daniel-rrr.github.io/docs.html) if you are a **modder** or **creator** and looking for explanations of Game-Systems like Tilemaps and their APIs with examples on how to use them.  
(The Wiki may still be interesting for you)



---
<br>


## Contributing
Coming soon


---
<br>


## FAQ
Q : **There are many Bugs,when do you plan to fix it?**  
A : We are currently Working on **Eventlogging and Unit-tests** this improve finding and fixing Bugs, we are appreciate everyone who **sends us a bugreport**.<br><br>

Q : **Where can I share my designed content?**  
A : There is currently no public way, this will change with our Webpage, we want to implement some kind of File-Storage/Cloud. 

Q : **When do you plan to add more game elements besides abstractions of Systems?**  
A : **The more basic Aspects we finsih, the faster we can add concrete content**.There are still some Fundamental things I, RRR, implement basically on my own. This takes a lot of time  and headspace.<br><br>

Q : **What are your next planned Milestones?**
A : Testing -> Event-Logging -> further implementation of guided content creation -> Enabling sharing of User-generated content<br><br>

Q : **How long do you plan to support/maintain the project.**  
A : This project is form of self-expression and experimental ideas, we invest as much and as long time as it feels comfortable. Our Head is since its start Overflowing with Ideas and there is no drought inside,  


---
<br>


## Credits
Panicroom is a project of RRR and friends:

1. **RedRastaRigger** for lead Game-design and -architecture
2. **K4r11l0w1tch** for QA Engineneering and Pair programming in generall
3. **R.I.C.H.A.R.D** for content design and music
4. **Kapitän Glavinka** for facillity management and catering

<br><br>

We dont want to appropriate the Extensions in this Repository!
They are here as **cached dependencies** and to **flatten the learning curve by a simple installer**.  
We greatly appreciate the Developer of every single one, and if some of them dont want to be associated we will remove them without any further discussion!
<br><br>
Essential Extensions will be written in italic:

| Extension               | Author                            | Usage                                           |
|-------------------------|-----------------------------------|-------------------------------------------------|
| Codesnap                | adpyke                            | Converts Codeblocks into PNG to Showcase        |
| docs-makdown            | Microsoft                         | UI for Markdown-syntax                          |
| *docs-preview*          | *Microsoft*                       | *realtime preview command for Markdown*         |
| *comment Anchors*       | *Starlane Studios*                | *Bookmarking and Line-formatting*               |
| *godot-tools*           | *Geequlim*                        | *Syntax-highlighting and Intellisense*          |
| Render Line Endings     | Joosip Medved                     | usefull for Parsing content of text-files       |
| One Dark Pro            | Binaryify                         | preferred Appearence                            |
| Live Server             | Ritwick Dey                       | realtime Webpage refreshing while designing     |
| *Rust*                  | *The Rust Programming Language*   | *Language support needed for CLI*               |
| *multi-command*         | *ryuta46**                        | *enable concated commands by Userinput*         |
| VS Code Counter         | Kentaro Ushiyama                  | detailed Statistics to Repo                     |
| *vscode-icons*          | *VSCode Icons Team*               | *improves Navigation of Filesystem*             |
| json                    | Zain Chen                         | Renders Tree of JSON-files                      |


---
<br>


## License
Panicroom uses the License of [CC-BY-NC-SA-4.0](creativecommons.org/licenses/by-nc-sa/4.0)

For Legal reasons: we dont guarantee the completeness and correctness of the following content:

This is a passion project and we support the idea of Open source and free ware!   **In Summary:**

>*You are allowed to copy and redistribute this material in any format.*
>*You are also allowd to adapt and build upon this material.*  <br><br>
>
>**Under following conditions**
>
>* You must give apropriate credit to our Team (RRR and Friends) as original creator
>* You must provide a link to its License
>* You must mention if you made changes
>* You must use this material for non-commercial use only
>* You must share your distribution under the same license (CC BY-NC-SA)


---
<br>






