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
./restart.sh $THIS_DIR/informa_frontend.py

if $HAS_VENV; then
	deactivate $THIS_DIR/.venv
fi