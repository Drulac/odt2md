//const src = './testsFiles/UE4.odt'
const src = process.argv[2]
const output = process.argv[3] || 'markdown.md'
const newFilepath = './'

const fs = require('fs')
const util = require('util')
const path = require('path')

const exec = require('./exec.js')

console.log(path.resolve(newFilepath))
console.log(process.argv)
console.log(output)

//TODO compliqué : mettre ce qui est entre paranthèses en italique

fs.access(
	path.resolve(output),
	fs.constants.F_OK,
	(err) => {
		if (!err) {
			//to avoid writing over an existing markdown.md file
			console.log(
				'output filename already exist, find another one please'
			)
			process.exit()
		}

		const cmdConvertToHTML =
			'w2l  -xhtml ' +
			JSON.stringify(src) +
			' ' +
			newFilepath +
			'/converted'

		/* const cmdConvertToLatex =
			'w2l -latex -ultraclean ' +
			JSON.stringify(src) +
			' /ramFile/output.tex'
		*/

		// loaded here because it's long and not neccessary if the program close before here
		const jsdom = require('jsdom')
		const { JSDOM } = jsdom
		//
		//
		;(async () => {
			await exec(cmdConvertToHTML)

			const html = await exec(
				'cat ' + newFilepath + '/converted.html'
			).catch(console.log)

			const dom = new JSDOM(html)
			const document = dom.window.document

			const print = (r = false) => {
				const decalage = 0

				const v = dom
					.serialize()
					.replace(/(\n\t){2,}/g, '\n')
					.replace(/&nbsp;/g, ' ')
					.replace(/ /g, ' ') //stranges spaces bug sometimes in titles

				if (r) return v
				else
					console.log(
						v
							.split('\n')
							.splice(decalage, decalage + 30)
							.join('\n')
					)
			}

			const removeAttrs = (attrs, element = '*') => {
				for (let el of document.querySelectorAll(
					attrs
						.map((e) => element + '[' + e + ']')
						.join(',')
				)) {
					attrs.forEach((a) => el.removeAttribute(a))
				}
			}

			const removeStyles = (
				styles,
				selector = 'body *:not(math)'
			) => {
				for (let el of document.querySelectorAll(
					selector
				)) {
					styles.forEach((s) => {
						try {
							el.style[s] = null
							el.style.removeProperty(s)
						} catch (error) {
							console.log(el.outerHTML)
							console.log(error)
						}
					})
				}
			}

			const deepestChild = (e) => {
				if (typeof e === 'undefined') {
					return undefined
				} else if (
					(typeof e.childNodes === 'undefined') |
					(e.nodeName === '#text')
				) {
					return e
				} else {
					//TODO : avec les <BR> c'est la merde, gérer le cas ou plusieurs sous childs
					return deepestChild(
						Array.from(e.children)
							.filter((c) => c.matches('p, font, u'))
							.shift()
					)
				}
			}

			const removeEmpty = (e) => {
				if (
					(typeof e === 'undefined') |
					require('util').isNull(e)
				) {
					return null
				} else if (
					(typeof e.childNodes === 'undefined') |
					(e.childNodes.length === 0)
				) {
					if (e.textContent === '') {
						e.parentNode.removeChild(e)
						removeEmpty(e.parentNode)
					} else {
						//console.log(JSON.stringify(e.textContent))
					}
				}
			}

			console.log(
				'\n===================================================================='
			)
			console.log(
				'====================================================================\n'
			)

			for (let e of document.querySelectorAll(
				'meta, title, doctype, head, div[title="header"], div[title="footer"]'
			)) {
				e.parentNode.removeChild(e)
			}

			for (let math of document.querySelectorAll('math')) {
				for (let e of math.childNodes) {
					math.removeChild(e)
				}
			}

			for (let el of document.querySelectorAll(
				'.Heading1, .Heading2, .Heading3, .Heading4, .Heading5, .Heading6'
			)) {
				const level = el
					.getAttribute('class')
					.replace('Heading', '')

				const title = document.createElement('h' + level)

				el.parentNode.insertAdjacentElement(
					'afterend',
					title
				)
				for (let c of el.childNodes) {
					title.appendChild(c)
				}

				for (let a of el.attributes) {
					if (a.name !== 'class')
						title.setAttribute(a.name, a.value)
				}

				el.insertAdjacentElement('afterend', title)
				el.parentNode.removeChild(el)
			}

			removeAttrs(['class'])
			removeAttrs(['xml:lang'])
			removeAttrs(['lang', 'dir'])
			removeAttrs(['face'], 'font')

			for (let e of document.querySelectorAll('p')) {
				e = deepestChild(e)
				if (typeof e !== 'undefined') {
					e.textContent = e.textContent.replace(/\n/g, ' ')
				}
			}

			console.log(
				'\n===================================================================='
			)
			console.log(
				'====================================================================\n'
			)

			Array.from(document.querySelectorAll('p')).map(
				removeEmpty
			)

			for (let el of document.querySelectorAll(
				'p[align="left"], p[align="justify"]'
			)) {
				el.removeAttribute('align')
			}

			removeStyles([
				'line-height',
				'margin-bottom',
				'margin-right',
				'margin-left',
				'margin-top',
				'margin',
				'text-align',
				'textAlign',
			])

			for (let el of document.querySelectorAll(
				'*[style=""]'
			)) {
				el.removeAttribute('style')
			}

			for (let el of document.querySelectorAll('p > br')) {
				try {
					const p = el.parentNode
					p.insertAdjacentElement('afterend', el)
					p.parentNode.removeChild(p)
				} catch (e) {
					console.error(e)
				}
			}

			while (
				Array.from(document.querySelectorAll('p > font'))
					.length > 0
			) {
				for (let el of document.querySelectorAll(
					'p > font'
				)) {
					const p = el.parentNode
					Array.from(el.attributes).map((a) =>
						p.setAttribute(a.name, a.value)
					)
					Array.from(el.childNodes).map((c) =>
						p.appendChild(c)
					)
					p.removeChild(el)
				}
			}

			console.log(
				'\n===================================================================='
			)
			console.log(
				'====================================================================\n'
			)

			for (let e of document.querySelectorAll('p')) {
				e = deepestChild(e)
				if (typeof e !== 'undefined') {
					e.textContent = e.textContent
						.replace(/\n/g, ' ')
						.trim()
				}
			}

			for (let el of document.querySelectorAll('br')) {
				el.parentNode.removeChild(el)
			}

			for (let e of document.querySelectorAll('p, u')) {
				e = deepestChild(e)
				if (typeof e !== 'undefined') {
					el.textContent = el.textContent
						.replace(/&nbsp;/g, ' ')
						.replace(/\n/g, ' ')
						.trim()

					if (el.textContent.trim() === '')
						el.parentNode.remove(el)
				}
			}

			for (let el of document.querySelectorAll('*')) {
				el.style['font-family'] = null
				el.style['margin-left'] = null
				el.style['margin-right'] = null
				el.style['text-indent'] = null
				el.style['text-decoration'] = null
				el.removeAttribute('id')
			}

			const sizes = Array.from(
				document.querySelectorAll('p, span')
			)
				.map((el) => el.style['font-size'])
				.filter((e) => e !== '')
				.filter(
					(value, index, arr) =>
						arr.indexOf(value) === index
				)
				.sort((a, b) => {
					const aa = Number.parseFloat(a.slice(0, -2))
					const bb = Number.parseFloat(b.slice(0, -2))
					return bb - aa
				})

			for (let el of document.querySelectorAll('p, span')) {
				if (
					el.style['background-color'] === 'transparent'
				) {
					if (
						el.parentNode.style['background-color'] !== ''
					) {
						for (let child of el.parentNode.childNodes) {
							if (child.style === undefined) {
								const newEl = document.createElement('p')
								newEl.textContent = child.textContent
								child.parentNode.insertBefore(newEl, child)

								child.parentNode.removeChild(child)
							}
						}

						//take in mind the new nodes
						for (let child of el.parentNode.childNodes) {
							if (child.style === undefined) {
								child.style['background-color'] =
									child.style['background-color'] !==
									'transparent'
										? el.parentNode.style[
												'background-color'
										  ]
										: ''
							}
						}

						el.parentNode.style['background-color'] = ''
					}
					el.style['background-color'] = ''
				}
			}

			for (let el of document.querySelectorAll('p, span')) {
				if (el.style['background-color'] !== '') {
					const newEl = document.createElement('i')
					el.insertAdjacentElement('afterend', newEl)
					Array.from(el.childNodes).map((c) =>
						newEl.appendChild(c)
					)

					el.parentNode.removeChild(el)
				}
			}

			for (let el of document.querySelectorAll('b kbd')) {
				const p = el.parentNode
				el.parentNode.insertAdjacentElement('afterend', el)

				el.parentNode.removeChild(p)
			}

			for (let el of document.querySelectorAll('b')) {
				if (el.textContent.trim() === '') {
					el.insertAdjacentText('afterend', el.textContent)
				} else {
					const strong = document.createElement('strong')
					el.insertAdjacentElement('afterend', strong)
					Array.from(el.childNodes).map((c) =>
						strong.appendChild(c)
					)
				}
				el.parentNode.removeChild(el)
			}

			for (let el of document.querySelectorAll('p, span')) {
				if (
					(el.style['font-style'] !== '') |
					(el.style['font-weight'] !== '')
				) {
					if (
						(el.style['font-style'] === 'bold') |
						(el.style['font-weight'] === 'bold')
					) {
						const newEl = document.createElement('strong')
						el.insertAdjacentElement('afterend', newEl)
						for (let c of el.childNodes) {
							newEl.appendChild(c)
						}

						el.parentNode.removeChild(el)
					} else if (el.style['font-style'] === 'italic') {
						const newEl = document.createElement('em')
						el.insertAdjacentElement('afterend', newEl)
						for (let c of el.childNodes) {
							newEl.appendChild(c)
						}

						el.parentNode.removeChild(el)
					}
				}
			}

			for (let el of document.querySelectorAll('p, span')) {
				el.style['font-size'] = null
				el.style['font-style'] = null
				el.style['font-weight'] = null
				el.style['margin'] = null
				el.style['color'] = null
			}

			for (let el of document.querySelectorAll(
				'*[style=""]'
			)) {
				el.removeAttribute('style')
			}

			console.log(
				'\n===================================================================='
			)
			console.log(
				'====================================================================\n'
			)

			for (let e of document.querySelectorAll('p')) {
				e = deepestChild(e)
				if (typeof e !== 'undefined') {
					e.textContent = e.textContent
						.replace(/\n/g, ' ')
						.trim()
				}
			}

			Array.from(
				document.querySelectorAll('document > *, p')
			).map(removeEmpty)

			console.log(
				'\n===================================================================='
			)
			console.log(
				'====================================================================\n'
			)

			for (let el of document.querySelectorAll('kbd')) {
				el.insertAdjacentText(
					'afterend',
					'$$' +
						el.textContent
							.replace(/(right|left)/g, '')
							.replace(/widevec/g, 'vec')
							.replace(/×/g, '*')
							.replace(/[ ]*rsub[ ]*/g, '_') +
						'$$'
				)
				el.parentNode.removeChild(el)
			}

			Array.from(
				document.querySelectorAll(
					'ol li:only-child strong:only-child, ul li:only-child strong:only-child'
				)
			)
				.filter((strong) => getLiLevel(strong) === 0)
				.forEach((strong) => {
					/*console.log(
						strong.outerHTML,
						'\n',
						strong.parentNode.parentNode.outerHTML
					)
					console.log('~'.repeat(30))*/
					const p = document.createElement('p')
					const title = document.createElement('h1')
					p.appendChild(title)
					title.textContent = strong.textContent

					strong.parentNode.parentNode.insertAdjacentElement(
						'afterend',
						p
					)

					strong.parentNode.parentNode.parentNode.removeChild(
						strong.parentNode.parentNode
					)

					/*console.log(
						title.outerHTML,
						'\n'
						//title.parentNode.outerHTML
					)
					console.log('^'.repeat(30))
			*/
				})

			for (let el of document.querySelectorAll(
				'strong, i, em'
			)) {
				if (el.textContent.trim() === '') {
					el.insertAdjacentText('afterend', el.textContent)
				} else {
					let trimedS = el.textContent.slice(
						0,
						el.textContent.length -
							el.textContent.trimStart().length
					)
					let trimedE = el.textContent.slice(
						el.textContent.trimEnd().length
					)
					let trimed = el.textContent.trim()

					if (
						/[.,]/.test(trimed.charAt(trimed.length - 1))
					) {
						trimedE = '.' + trimedE
						trimed = el.textContent.trim().slice(0, -1)
					}

					switch (el.tagName.toLowerCase()) {
						case 'strong':
							trimed = '**' + trimed + '**'

							break
						case 'i':
							if (trimedS === '') trimedS = ' '
							if (trimedE === '') trimedE = ' '

							trimed = '*' + trimed + '*'
							break
						case 'em':
							trimed = '_' + trimed + '_'
							break
					}

					const newEl = document.createElement('p')
					el.insertAdjacentElement('afterend', newEl)
					newEl.textContent = trimedS + trimed + trimedE
				}
				el.parentNode.removeChild(el)
			}

			for (let el of document.querySelectorAll('img')) {
				while (
					el.parentNode.tagName.toLowerCase() !== 'body'
				) {
					el.parentNode.parentNode.insertBefore(
						el,
						el.parentNode
					)
				}
			}

			for (let el of document.querySelectorAll('span')) {
				el.insertAdjacentText('afterend', el.textContent)
				el.parentNode.removeChild(el)
			}

			const newLineEscape =
				'#fdsghfdsqwfxgtrge(t-è_-(erfdvgd'
			const newLineEscapeRegex = new RegExp(
				newLineEscape.replace(/([\(\)\[\]])/g, '\\$1'),
				'g'
			)
			const espaceEscape = '#sdfghgfdsdgfbvuioler5°5°5YTHGF'
			const espaceEscapeRegex = new RegExp(
				espaceEscape.replace(/([\(\)\[\]])/g, '\\$1'),
				'g'
			)

			function getLiLevel(el) {
				let count = 0
				let p = el.parentNode.parentNode

				while (
					typeof p !== 'undefined' &&
					p.tagName.toLowerCase() === 'li'
				) {
					count++
					p = p.parentNode.parentNode || undefined
				}

				return count
			}

			function capitalize(str) {
				return str.charAt(0).toUpperCase() + str.slice(1)
			}

			function convertLi(el) {
				if (typeof el.textContent === 'undefined') {
					console.log('aaaaaaaaaaa')
					console.log(el)
					console.log('bbbbbbbbbbb')
				}

				if (el.textContent.trim() !== '') {
					if (el.textContent.trim().charAt(0) !== '#') {
						let level = getLiLevel(el)

						let str =
							newLineEscape +
							espaceEscape.repeat(2).repeat(level) +
							'- ' +
							capitalize(el.textContent.trim())

						if (level === 0) str = newLineEscape + str

						const newEl = document.createElement('p')
						el.insertAdjacentElement('afterend', newEl)
						newEl.textContent = str
					} else {
						const newEl = document.createElement('p')
						el.insertAdjacentElement('afterend', newEl)
						newEl.textContent = el.textContent.trim()
					}
				}
				el.parentNode.removeChild(el)
			}

			let stack = Array.from(
				document.querySelectorAll('ol li, ul li')
			)

			while (stack.length > 0) {
				for (let el of stack) {
					if (
						Array.from(el.querySelectorAll('li')).length ===
						0
					)
						convertLi(el)
				}

				stack = Array.from(
					document.querySelectorAll('ol li, ul li')
				)
			}

			for (let el of document.querySelectorAll('ol, ul')) {
				const newEl = document.createElement('p')
				el.insertAdjacentElement('afterend', newEl)
				newEl.textContent = el.textContent
					.replace(newLineEscapeRegex, '\n')
					.trim()
				el.parentNode.removeChild(el)
			}

			let levelRegExp = /^[0-9a-z][\).]/i
			Array.from(
				document.querySelectorAll('h1, h2, h3, h4, h5, h6')
			).forEach((el) => {
				let level = parseInt(
					el.tagName.toLowerCase().replace('h', '')
				)

				if (levelRegExp.test(el.textContent.trim())) {
					if (level === 1) level++

					el.textContent = el.textContent
						.trim()
						.replace(levelRegExp, '')
						.trim()
				}

				el.insertAdjacentText(
					'afterend',
					'\n' +
						'#'.repeat(level) +
						' ' +
						el.textContent +
						'\n'
				)
				el.parentNode.removeChild(el)
			})

			const convertImg = (el) => {
				const newEl = document.createElement('p')
				el.insertAdjacentElement('afterend', newEl)

				const widthInPourcent = (
					Math.round(
						(parseInt(el.style.width.replace('px', '')) /
							738) *
							10
					) * 10
				).toString()

				el.alt = el.alt.replace(
					/^(I|i)mage[s]?[ ]?[0-9]+$/,
					''
				)

				newEl.textContent =
					'\n![' +
					el.alt +
					'](' +
					el.src +
					' =' +
					+widthInPourcent +
					'%)\n'

				el.parentNode.removeChild(el)
			}

			if (
				Array.from(document.querySelectorAll('img')).some(
					(el) =>
						el.src.split('.').pop().toLowerCase() === 'wmf'
				)
			) {
				const extractImages = await require('./extractImages.js')(
					src
				)

				Array.from(
					document.querySelectorAll('img')
				).forEach((el, imageId) => {
					fs.unlinkSync(el.src)
					el.src = extractImages[imageId]
					fs.renameSync(
						'imagesExtractions/' + el.src,
						el.src
					)

					convertImg(el)
				})

				fs.rmdirSync('imagesExtractions/')
			} else {
				for (let el of document.querySelectorAll('img')) {
					convertImg(el)
				}
			}

			for (let el of document.querySelectorAll('div')) {
				const newEl = document.createElement('p')
				el.insertAdjacentElement('afterend', newEl)
				newEl.textContent = el.textContent

				el.parentNode.removeChild(el)
			}

			const html2md = require('html-to-md')
			const pandoc = require('pandoc')

			const DOM = new jsdom.JSDOM()

			const toMd = (str) =>
				new Promise((resolve, reject) => {
					pandoc.convert(
						'html',
						str,
						['markdown'],
						function (result, err) {
							if (err) {
								console.log(
									'pandoc exited with status code ' + err
								)
							}
							resolve(
								result.markdown.trim() /*
									.split('\n')
									.map((e) => e.trim())
									.join('\n')*/
							)
						}
					)
				})

			async function asyncForEach(array, callback) {
				for (let index = 0; index < array.length; index++) {
					await callback(array[index], index, array)
				}
			}

			function recursiveRemoveAttr(node) {
				if (
					node !== undefined &&
					node.attributes !== undefined
				) {
					while (node.attributes.length > 0)
						node.removeAttribute(node.attributes[0].name)

					Array.from(node.childNodes).forEach(
						recursiveRemoveAttr
					)
				}
			}

			function htmlTableToMd(table) {
				const headingRows = []
				const columns = []

				const rows = Array.from(
					table.querySelectorAll('tr')
				)

				columns.push(
					...Array.from(
						rows[0].querySelectorAll('td, th')
					).map((el) => ({ width: 0, cells: [] }))
				)

				rows.forEach((row, rowId) => {
					//const isHeader = row.querySelector('th').length > 0
					row
						.querySelectorAll('th, td')
						.forEach((cell, cellId) => {
							const content = cell.textContent
								.replace(/\*\*\*\*/g, '')
								.replace(/\*\* \*\*/g, ' ')
								.trim()

							console.log(content)

							columns[cellId].cells.push({
								content,
								isHeading:
									cell.tagName.toLowerCase() === 'th',
							})

							if (content.length > columns[cellId].width)
								columns[cellId].width = content.length
						})
				})

				columns.forEach((column) => (column.width += 2)) //space before&after

				const output = new Array(rows.length * 2 + 1)
					.fill(0)
					.map((e) => [])

				columns.forEach((column) => {
					column.cells.forEach((cell, cellId) => {
						let cellContent =
							' '.repeat(
								Math.floor(
									(column.width - cell.content.length) / 2
								)
							) +
							cell.content +
							' '.repeat(
								Math.floor(
									(column.width - cell.content.length) / 2
								) +
									((column.width - cell.content.length) % 2)
							)

						output[cellId * 2 + 1].push(cellContent)
						output[cellId * 2 + 2].push(
							(cell.isHeading ? '=' : '-').repeat(
								cellContent.length
							)
						)
					})
				})

				output[0] = output[1].map((str) =>
					'-'.repeat(str.length)
				)

				return output
					.map((line, lineId) =>
						lineId % 2 === 0
							? '+' + line.join('+') + '+'
							: '|' + line.join('|') + '|'
					)
					.join('\n')
			}

			const simplifyTable = require('./simplifyTable.js')

			await asyncForEach(
				Array.from(document.querySelectorAll('table')),
				async (el) => {
					recursiveRemoveAttr(el)

					let md = (await htmlTableToMd(el)) + '\n'
					//.replace(/\\*/g, '')
					//.replace(/([^\s])\|/g, '$1 |')
					//.replace(
					//	/\n(\+--------------------------)*\+/g,
					//	''
					//)

					const out =
						'\n' +
						simplifyTable(md).replace(/ /g, espaceEscape) +
						'\n'

					const newEl = document.createElement('p')
					el.insertAdjacentElement('afterend', newEl)
					newEl.textContent = out

					el.parentNode.removeChild(el)
				}
			)

			const textOutput = Array.from(
				document.querySelectorAll('body > *')
			)
				.filter(
					(el) => Array.from(el.attributes).length === 0
				)
				.map((el) => el.textContent)
				.join('\n')

			fs.writeFileSync(
				newFilepath + '/' + output,
				textOutput
					.replace(/&nbsp;/g, ' ')
					.replace(/&gt;/g, '>')
					.replace(/&lt;/g, '<')
					.replace(//g, '→')
					.replace(//g, '→')
					.replace(//g, '→')
					.replace(//g, '→')
					.replace(//g, '→')
					.replace(/→/g, '->')
					.replace(//g, ' ')
					.replace(//g, ' ')
					.replace(/½/g, '1/2')
					.replace(/¼/g, '1/4')
					.replace(/¾/g, '3/4')
					.replace(/²/g, '^2')
					.replace(/–/g, '-')
					.replace(/↔/g, '<->')
					.replace(/ꚙ/g, 'infinity')
					.replace(/&amp;/g, '&')
					.replace(/[\$][ ]*=[ ]*[\$]/g, ' = ')
					.replace(
						/^([ ]+)-/gm,
						(match, p1, offset, string) =>
							`${espaceEscape.repeat(parseInt(p1.length))}-`
					)
					//.replace(/\*  \*/g, '')
					.split('\n')
					.map((e) => e.trim())
					.join('\n')
					.trim()
					.replace(/\*\*([\t ]*)\*\*/g, '$1')
					.replace(/_([\t ]*)_/g, '$1')
					.replace(/[’]/g, "'")
					.replace(/[……]/g, '...')
					.replace(/[≠]/g, '!=')
					.replace(espaceEscapeRegex, ' ')
					.replace(
						/[\n]*(#+)/g,
						(match, p1, offset, string) =>
							`${'\n'.repeat(7 - parseInt(p1.length))}${p1}`
					)
					.replace(/^([#]+)[ ]{2,}/gm, '$1 ')
					.replace(/a partir/g, 'à partir')
					.replace(/A partir/g, 'À partir')
					.replace(/a cause/g, 'à cause')
					.replace(/A cause/g, 'À cause')
			)

			fs.unlinkSync(newFilepath + '/converted.html')
		})().catch(console.log)
	}
)
