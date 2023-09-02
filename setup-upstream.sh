#!/bin/bash
# setting up template

# set upstream
UPSTREAM_REPO_URL=https://github.com/es-labs/express-template.git

## template clone or fork
echo
echo "setup-upstream.sh running..."
echo "You must clone new project from template or fork"
echo
echo "add chmod +x flag for this script to work"
echo

git remote add upstream $UPSTREAM_REPO_URL
git remote set-url --push upstream no_push
git remote -v

# copy the sample environment
echo "copying .env.deverlopment.sample to .env.development"
cp .env.development.sample .env.development

echo "1. continue your development in apps/app-sample folder, you can rename app-sample folder or make a copy and rename the copy"
echo "2. change only the package.json in apps/web-sample"
echo "3. do note any conflicts to resolve for anything outside the apps folder when merging from upstream"
echo "4. feedback for improvement is welcome"
echo
echo "to get upstream updates"
echo "git fetch upstream"
echo "git merge upstream/main"
echo
echo "done..."