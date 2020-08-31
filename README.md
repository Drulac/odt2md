# odt2md

_far from being perfect, far from being the fastest_

it extract styles, images

## installation

require `w2l` (_also know as `writer2latex`_) to work. Under debian (_require root privilege_) :
```bash
sudo apt install writer2latex
```

then install `odt2md` (_require root privilege_) :
```bash
sudo npm install -g odt2md
```

## run

got to a dir with an odt file an run the script from here :
```bash
cd ~/Document/dirWithOdtFile
odt2md ./file.odt
```

It will produce an output `markdown.md` file, and extract all the images

**be careful if you modify images, and then run the script again, the script will overwrite you modified images**

# to use with

This was made to work with this [markdown-math-editor](https://github.com/Drulac/markdown-math-editor/), you should try it :-)


# developpement

clone the source code :
```bash
cd ~/scripts/  #or in another dir
git clone https://github.com/Drulac/odt2md.git
```

got to a dir with an odt file an run the script from here :
```bash
cd ~/Document/dirWithOdtFile
node ~/scripts/odt2md/script.js ./file.odt
```

