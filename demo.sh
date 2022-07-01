#!/bin/bash

rm -rf demo
mkdir -p demo

run() {

  src="voice.wav"
  dst="demo/voice($@).wav"

  echo ${dst}

  ./stftpitchshift -r -w 2048 -v 32 -i "${src}" -o "${dst}" $@

}

run -q 0 -p 0.5
run -q 0 -p 0.75
run -q 0 -p 1.5
run -q 0 -p 2

run -q 1 -p 0.5
run -q 1 -p 0.75
run -q 1 -p 1.5
run -q 1 -p 2

run -q 0 -p 1,1.25,1.5
run -q 1 -p 1,1.25,1.5

run -q 1 -p 1 -t 0.8
run -q 1 -p 1 -t 1.2

run -q 1 -p 1,1.25,1.5 -t 0.8
run -q 1 -p 1,1.25,1.5 -t 1.2
