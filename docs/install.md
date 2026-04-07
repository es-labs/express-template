### Brew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
brew –version
```

### XCode Select

installs git

```bash
xcode-select --install
xcode-select --version
```

### Podman

```
brew install podman
podman machine init && podman machine start && podman info
```

### nvm, node and npm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash

# restart shell required to use

# export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
# [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
```

### VS Code

```
brew install --cask visual-studio-code
brew uninstall --cask --zap visual-studio-code
$HOME/Library/Application\ Support/Code
~/.vscode
~/Library/Caches/com.microsoft.VSCode
brew list visual-studio-code 
brew autoremove
```

### VS Code Extensions

```bash
code --install-extension
cweijan.dbclient-jdbc
cweijan.vscode-mysql-client2
ms-azuretools.vscode-docker
ms-azuretools.vscode-containers
tobermory.es6-string-html
github.vscode-github-actions
github.copilot-chat
eamodio.gitlens
connor4312.nodejs-testing
ms-vscode-remote.remote-ssh
ms-vscode-remote.remote-ssh-edit
ms-vscode.remote-explorer
humao.rest-client
vue.volar
```