#! /bin/bash
THIS_DIR=`pwd`

if [ $# -eq 0 ]
then
	echo "{}" > $THIS_DIR/lib/Frontend/conf/informa.secrets.json
	WITH_CONFIG=$THIS_DIR/lib/Frontend/conf/informa.secrets.json
else
	WITH_CONFIG=$1
fi

mkdir conf

HAS_VENV=$(which virtualenv)
if [ $? -eq 0 ]; then
	HAS_VENV=true
else
	HAS_VENV=false
fi

if $HAS_VENV; then
	virtualenv $THIS_DIR/.venv
	source $THIS_DIR/.venv/bin/activate
fi

cd lib/Frontend
./setup.sh $WITH_CONFIG

cd $THIS_DIR
python setup.py

cd $THIS_DIR/lib/Frontend/web
ln -s $THIS_DIR/web/ extras

cd $THIS_DIR
pip install -r requirements.txt

chmod 0400 conf/informacam.init.json
chmod 0400 lib/Frontend/conf/unveillance.secrets.json
chmod 0400 lib/Frontend/conf/local.config.yaml
python informa_frontend.py -firstuse

if $HAS_VENV; then
	deactivate $THIS_DIR/.venv
fi