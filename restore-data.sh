#!/bin/bash
set -e

echo 'Waiting for services to be ready...'
sleep 30
echo 'Starting data restoration...'
cd tasks
../node_modules/.bin/gulp create-mapping-es
../node_modules/.bin/gulp create-db-from-backup
../node_modules/.bin/gulp create-mock-db-users
../node_modules/.bin/gulp update-species-images
echo 'Data restoration completed!' 