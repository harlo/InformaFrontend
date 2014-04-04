OLD_DIR=`pwd`
MASTER_PASSWORD=$1
GPG_PWD=$2
CONF_DIR=$OLD_DIR/conf

GEN_RANDOM="from lib.Frontend.lib.Core.Utils.funcs import generateSecureRandom;print generateSecureRandom();"
INFORMA_CONF=$CONF_DIR/informacam.config.yaml
INFORMA_SEC=$CONF_DIR/informacam.secrets.json
INFORMA_ICTD=$CONF_DIR/informacam.ictd.yaml
GPG_PRIV_KEY=$CONF_DIR/informacam.gpg.priv_key.file

IV=$(python -c "$GEN_RANDOM")
echo encryption.iv: '"'$IV'"' > $INFORMA_CONF

SALT=$(python -c "$GEN_RANDOM")
echo encryption.salt: '"'$SALT'"' >> $INFORMA_CONF

# split key gpg key into public and private
PARSE_PRIVATE_KEY="from Utils.funcs import parsePrivateKey; print parsePrivateKey('"$OLD_DIR/conf/informacam.gpg.priv_key.file"');"
FINGERPRINT=$(python -c "$PARSE_PRIVATE_KEY")

# append fingerprint to ictd
echo $FINGERPRINT
echo organizationFingerprint: $FINGERPRINT >> $INFORMA_ICTD

# append password to secrets.json
echo '{ "informacam.gpg.password" : "'$GPG_PWD'" }' > $INFORMA_SEC

# write any p12s or jsons to secrets.json and delete them, or mv forms to annex
ANNEX_DIR=$(python -c "from Utils.funcs import getAnnexDir; print getAnnexDir();")
echo $ANNEX_DIR
for f in $CONF_DIR/*
do
	echo $f
	if echo "$f" | grep '^informacam.repository.*' > /dev/null
	then
		SV=$(python -c "from Utils.funcs import saveInformaCamDirective; print saveInformaCamDirective('"$f"');")
	fi
	
	if echo "$f" | grep '^informacam.form*' > /dev/null
	then
		mv $CONF_DIR/$f $ANNEX_DIR/
	fi
done

# save ictd, gpg public key to local_remote
#mv $CONF_DIR/informacam.ictd.yaml $ANNEX_DIR/
#mv $CONF_DIR/informacam.gpg.pub_key.file $ANNEX_DIR/

# encrypt secrets.json to password with iv and salt

# delete private key; we don't need/want it on server and it's already in keyring
rm $GPG_PRIV_KEY