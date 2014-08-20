#! /bin/bash
THIS_DIR=`pwd`

cd lib/Frontend
./reset.sh $THIS_DIR/informa_frontend.py

cd $THIS_DIR
sudo rm conf/informacam.init.json

python setup.py

chmod 0400 conf/informacam.init.json
chmod 0400 lib/Frontend/conf/unveillance.secrets.json
chmod 0400 lib/Frontend/conf/local.config.yaml
python informa_frontend.py -firstuse