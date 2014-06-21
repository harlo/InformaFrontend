#! /bin/bash
THIS_DIR=`pwd`

pip install --upgrade fabric

cd lib/Frontend
./setup.sh $THIS_DIR/conf/informacam.secrets.json

cd $THIS_DIR/web
ln -s $THIS_DIR/web/ extras

cd $THIS_DIR
pip install --upgrade -r requirements.txt
python informa_frontend.py -firstuse