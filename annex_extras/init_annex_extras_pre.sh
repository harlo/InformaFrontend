#! /bin/bash
OLD_DIR=$1

echo "**************************************************"
echo "Installing FFMPEG"
mv /home/unveillance/lib/FFmpeg /home/FFmpeg
cd /home/FFmpeg
./configure
make
make install

echo "**************************************************"
echo "Installing FFMPEG2THEORA"
apt-get install -y ffmpeg2theora

# build jpeg redaction
echo "**************************************************"
echo "Building JPEG Redaction library"
cd /home/unveillance/lib/jpeg-redaction-library/lib
make
g++ -L $OLD_DIR/lib/jpeg-redaction-library/lib -lredact jpeg.cpp jpeg_decoder.cpp jpeg_marker.cpp debug_flag.cpp byte_swapping.cpp iptc.cpp tiff_ifd.cpp tiff_tag.cpp j3mparser.cpp -o $OLD_DIR/lib/jpeg-redaction-library/jpeg_r.out

cd $OLD_DIR