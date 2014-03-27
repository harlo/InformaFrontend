#! /bin/bash
OLD_DIR=`pwd`
ANNEX_ROOT=$1

git clone git@github.com:FFmpeg/FFmpeg.git $ANNEX_ROOT/lib/FFmpeg
cd $ANNEX_ROOT/lib/FFmpeg
git submodule update --init --recursive
git checkout master

git clone git@github.com:harlo/Jpeg-Redaction-Library.git $ANNEX_ROOT/lib/jpeg-redaction-library
cd $ANNEX_ROOT/lib/jpeg-redaction-library
git submodule update --init --recursive
git checkout master

git clone git@github.com:n8fr8/JavaMediaHasher.git $ANNEX_ROOT/lib/JavaMediaHasher
cd $ANNEX_ROOT/lib/JavaMediaHasher
git submodule update --init --recursive
git checkout master

git clone git@github.com:isislovecruft/python-gnupg.git $ANNEX_ROOT/lib/python-gnupg
cd $ANNEX_ROOT/lib/python-gnupg
git submodule update --init --recursive
git checkout master