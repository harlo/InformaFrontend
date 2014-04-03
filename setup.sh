#! /bin/bash
OLD_DIR=`pwd`
LOCAL_CONFIG=$OLD_DIR/conf/informa.config.yaml

echo "**************************************************"
echo "************** INFORMACAM SETUP **************"


#cd lib/Server
#./setup.sh
#cd $OLD_DIR

cd lib/Frontend
./setup.sh $OLD_DIR
cd web
ln -s ../../../web/ extras
cd $OLD_DIR

cd lib/python-gnupg
make install
cd $OLD_DIR

pip install --upgrade -r requirements.txt

echo "**************************************************"
echo "Launching frontend..."
python informa_frontend.py -firstuse