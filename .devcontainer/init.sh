set -x

# workaround after rebuilding the container
git config --global --add safe.directory /workspaces/docker-swarm-dashboard

cd app-src
yarn global add concurrently
yarn install


# Cypress
apt-get update
apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb xdg-utils
yarn cypress install