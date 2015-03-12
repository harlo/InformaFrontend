#! /bin/bash
THIS_DIR=`pwd`
HAS_VENV=false

which virtualenv
if [ $? -eq 0 ]; then
	file $THIS_DIR/.venv | grep "cannot open"
	if [ $? -eq 1 ]; then
		HAS_VENV=true
	fi
fi

if $HAS_VENV; then
	source $THIS_DIR/.venv/bin/activate
fi

cd lib/Frontend
./reset.sh $THIS_DIR/informa_frontend.py

cd $THIS_DIR
sudo rm conf/informacam.init.json

python setup.py

chmod 0400 conf/informacam.init.json
chmod 0400 lib/Frontend/conf/unveillance.secrets.json
chmod 0400 lib/Frontend/conf/local.config.yaml
python informa_frontend.py -firstuse

if $HAS_VENV; then
	deactivate $THIS_DIR/.venv
fi