#! /bin/bash
OLD_DIR=$1
ICTD=/home/unveillance/conf/ictd.yaml
GNUPG_HOME=/root/.gpg
FORMS_ROOT=/home/unveillance/forms

cd /home/inc
echo "**************************************************"
echo "Adding extra config files..."
for f in config_extras/*
do
	chmod 400 $f
	if echo "$f" | grep '^config_extras/gpg_public.asc' >/dev/null ; then
		mv $f /home/unveillance/conf
		echo publicKey: /home/unveillance/conf/public.asc >> $ICTD
	fi
	
	if echo "$f" | grep '^config_extras/gpg_private.asc' >/dev/null ; then
		echo informacam.private_key.file: $OLD_DIR/$f >> $USER_CONFIG
	fi

	if echo "$f" | grep '^config_extras/gpg_password.txt' >/dev/null ; then
		echo informacam.private_key.password: $OLD_DIR/$f >> $USER_CONFIG
	fi
	
	if echo "$f" | grep '^config_extras/ictd.yaml' >/dev/null ; then
		mv $f /home/unveillance/conf
	fi
done

echo "**************************************************"
echo "Adding extra forms..."
mkdir $FORMS_ROOT
echo forms: >> $ICTD

for f in form_extras/*
do
	mv $f $FORMS_ROOT
	echo ' - '$f >> $ICTD
done

echo informacam.forms_root: $FORMS_ROOT >> $USER_CONFIG
python -c "from init_annex_extra import initForms;initForms('"$FORMS_ROOT"')"

echo "**************************************************"
echo "Initing keys..."
mkdir $GNUPG_HOME
chown -R root:root $GNUPG_HOME
echo informacam.gnupg_home: $GNUPG_HOME >> $USER_CONFIG
gpg --homedir $GNUPG_HOME --allow-secret-key-import --import config_extras/private.asc
echo $(gpg --homedir $GNUPG_HOME --fingerprint) >> fingerprint_readout.txt

# set fingerprint
echo organizationFingerprint: $(python -c "from init_annex_extra import scrapeFingerprint;scrapeFingerprint('"$OLD_DIR/fingerprint_readout.txt"')") >> $ICTD

# create ICTD
source /home/unveillance/.bashrc
python -c "from init_annex_extra import initICTD;initICTD()"

cd $OLD_DIR