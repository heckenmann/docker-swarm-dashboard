set -x

cd app-src
yarn global add concurrently react-scripts
yarn install


# Cypress
apt-get update
apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb
yarn cypress install