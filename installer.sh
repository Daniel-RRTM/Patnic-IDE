MACHINE_TYPE=`uname -m`


echo "---- STARTING INSTALLATION ----"
sleep 1
echo



echo "Creating Directories..."
sleep 1
cd ".."
mkdir "VSCode Insiders"
mkdir "Workspace"
echo "DONE"
echo



echo "---------------------"
echo "setting up VS Code..."
echo "---------------------"
echo



echo "copyying zip..."
sleep 1
cd "Patnic-IDE/ressources"
if [ ${MACHINE_TYPE} == 'x86_64' ]; then
  echo "64 Bit Operating System detected"
  cp -r "VSCode Insider 32.zip" "../../VSCode Insiders/VSCode Insider.zip"
else
  echo "32 Bit Operating System detected"
  cp -r "VSCode Insider 64.zip" "../../VSCode Insiders/VSCode Insider.zip"
fi
cd "../../VSCode Insiders/"
unzip -oqq "VSCode Insider.zip"
echo "DONE"
echo


echo "adding native extensions..."
cd "resources/app"
mkdir "extensions"
cd "extensions"
cp -r "../../../../Patnic-IDE/ressources/extensions.zip" "extensions.zip"
unzip -oqq "extensions.zip"
cd "../../.."
echo "DONE"
echo


echo "Importing Custome Settings..."
sleep 1
mkdir -p "data/user-data/User"
cp "../Patnic-IDE/ressources/keybindings.json" "data/user-data/User"
cp "../Patnic-IDE/ressources/settings.json" "data/user-data/User"
cp -r "../Patnic-IDE/ressources/snippets" "data/user-data/User"
echo "DONE"


echo
echo "Importing Cached Extensions..."
sleep 1
cp -r "../Patnic-IDE/ressources/extensions" "../VSCode Insiders/data"
echo "DONE"
echo


echo "---------------------"
echo "setting up VS Code..."
echo "---------------------"
echo



echo "Cloning Repositories..."
cd "../Workspace"
echo
mkdir "Cache"
echo "------ CLI ------"
git clone "https://github.com/Daniel-RRR/Patnic-CLI.git"
echo
echo "------ Doc ------"
git clone "https://github.com/Daniel-RRR/Patnic-Docs.git"
echo
echo "------ IDE ------"
git clone "https://github.com/Daniel-RRR/Patnic-IDE.git"
echo
echo "------ SRC ------"
git clone "https://github.com/Daniel-RRR/Patnic-Src.git"
echo "DONE"


echo "renaming repository to convetions..."
mv "Patnic-IDE" "IDE"
mv "Patnic-Docs" "Docs"
mv "Patnic-CLI" "CLI"
mv "Patnic-Src" "Src"
echo "DONE"




echo
echo
echo
echo
echo "FINISHED!"
echo "you can delete this directory now, you can find it again in your Workspaces"
echo "you can start your custome IDE via its executable in the directory VSCode Insiders!"
echo "Remeber to \" File -> open Workspace from File\" and select the directory \"Src\" "

read -p "press enter to close this window"
