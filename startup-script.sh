#!/bin/bash
apt-get update
apt-get install -y git nodejs npm
git clone https://github.com/Ghost-Capital/lendex-evm-server.git /app
cd /app
npm install
npm start