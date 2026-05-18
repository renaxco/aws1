rm -rf ./dist
tsc
rm files.zip
cp -R node_modules dist/node_modules
cd ./dist/
zip -r ../files.zip *
cd ..
