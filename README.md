# odt2md

_far from being perfect, far from being the fastest_

it extract styles, images

## installation

require `w2l` (_also know as `writer2latex`_) to work. As root under debian :
```bash
apt install writer2latex
```

clone the source code :
```bash
cd ~/scripts/  #or in another dir
git clone https://github.com/Drulac/odt2md.git
```
## run

got to a dir with an odt file an run the script from here :
```bash
cd ~/Document/dirWithOdtFile
node ~/scripts/odt2md/script.js ./file.odt
```

**be careful if you modify images, and then run the script again, the script will overwrite you modified images**
