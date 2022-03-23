# nereid

Nereid is the 3rd largest moon of Neptune.

## Setup (Windows)

### One time setup to get a decent prompt/shell on Windows

Install [Git for Windows SDK](https://github.com/git-for-windows/build-extra/releases/latest) (do not install the normal git-bash!) (it takes a while, it's a 1.2 Gb download during the install.)

Install [FiraCode NerdFont](https://github.com/ryanoasis/nerd-fonts/releases/download/v2.1.0/FiraCode.zip) (unzip, select all, right-click, install)

Install the JetBrains [Toolbox](https://www.jetbrains.com/lp/toolbox/)

Run the Git SDK.

In the git-bash window, goto the system menu (upper left of the window) and select options, pick text, change the font to FiraCode Nerd Font, Mono. (up the font size if you like.)

**NOTE**: if during any of the following you find yourself in `vi` use `:wq` to get out. See [exiting vim](https://www.freecodecamp.org/news/one-out-of-every-20-000-stack-overflow-visitors-is-just-trying-to-exit-vim-5a6b6175e7b6/)

Run the following in the git shell:

```shell
cd
pacman –S tmux
pacman –S zsh
echo "set-option -g default-shell /usr/bin/zsh" >> ~/.tmux.conf
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
sed -i 's!ZSH_THEME=.*!ZSH_THEME="powerlevel10k/powerlevel10k"!' ~/.zshrc
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
tmux # this will start a new shell, configure oh-my-zsh as you like
nvm install 17
npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"
cd
mkdir work
cd work # checkout repos here
```

You'll want to run `tmux` after starting the git shell each time. Use `^Bc` to start new shells in `tmux`, and `^Bn` to cycle the active shell.

Create an ssh key pair (without a password):
```
ssh-keygen
cat ~/.ssh/id_rsa.pub
```
Copy the public key output (`ssh-rsa .....= user@host`) and add it in Azure DevOps. See [these instructions](https://docs.microsoft.com/en-us/azure/devops/repos/git/use-ssh-keys-to-authenticate?view=azure-devops)

Go to a repo, click the user settings icon to the immediate left of the user circle, pick SSH keys, and click the New Key Button. Give it a name based on the host you are using (eg. Work Laptop), and paste the public key in.

Make a work directory to clone into:
```
cd
mkdir work
```

Setup git config:
```
git config --global user.name "Your Name"
git config --global user.email you@example.com
git config --global core.autocrlf false
git config --global core.eol lf   
```

### Setup for Nereid

* `git clone` the repo
* `npm install` at the workspace root
* `npm run build_libs` as the error you get for an un-build workspace dependency is not clear.
* NOTE: Any time you change code in a workspace dependency you need to re-built it or the code used will be out of date. 
* postgres: https://www.postgresql.org/download/
  * testing with v14
  * use `postgres` as the password for the `postgres` account
  * install at C:\pg\14
  * use port 5414 (I use `54${major_version}` as I often run more than one version)
  * add pg to your path (eg: add `export PATH=$PATH:/c/pg/14/bin` to your `.zshrc` and restart your shell.)
* install the `eg` db.
  * `npm run reset_pgdb_eg`
* install https://mayakron.altervista.org/support/acrylic/Home.htm
  * Open Acrylic Hosts, change the 127.0.0.1 line at the bottom, add ` >xxx`:
  * `127.0.0.1 localhost localhost.localdomain >xxx`
* Set your network adapter properties to use 127.0.0.1 as your DNS.
  * Network & Sharing Center
  * Change Adapter Settings
  * Pick your Adapter (probably Wi-Fi), right click - properties
  * Pick Internet Protocol Version 4 (TCP/IPv4) - properties
  * enable "Use the following DNS server address" - set to 127.0.0.1 - press Okay
  * uncheck Internet Protocol Version 6 (TCP/IPv6)
  * click ok
  * in a shell do `ping whatever.xxx` - it should now resolve to 127.0.0.1

## Running nereid locally (on Windows)

* Create a shell to run nginx
  * `cd nginx; ./run.sh`
* Note: when you `^C` to stop nginx it might not actually stop.
  * this will stop all running nginx.exe tasks: `tasklist //v | grep nginx.exe | tr -s ' ' | cut -d ' ' -f 2 | xargs -n 1 taskkill //f //pid`
* Load up WebStorm, point it at the root of the project.
* Right-click on the `srv/exampls/package.json` and view the npm scripts.
* Select `dev` to run it in dev mode.
