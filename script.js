//const src = './testsFiles/UE4.odt'
const src = process.argv[2]
const output = process.argv[3] || 'markdown.md'
const newFilepath = './'

const fs = require('fs')
const util = require('util')
const path = require('path')
const childProcess = require('child_process')

console.log(path.resolve(newFilepath))
console.log(process.argv)
console.log(output)

const exec = (cmd) =>
	new Promise((resolve, reject) => {
		childProcess.exec(cmd, function (
			error,
			stdout,
			stderr
		) {
			if (error !== null) {
				throw error
				reject(error)
			} else {
				resolve(stdout)
			}
		})
	})

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
				const decalage = 50

				const v = dom
					.serialize()
					.replace(/(\n\t){2,}/g, '\n')
					.replace(/&nbsp;/g, ' ')

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
				Array.from(
					document.querySelectorAll(
						attrs
							.map((e) => element + '[' + e + ']')
							.join(',')
					)
				).forEach((el) =>
					attrs.forEach((a) => el.removeAttribute(a))
				)
			}

			const removeStyles = (
				styles,
				selector = 'body *:not(math)'
			) => {
				Array.from(
					document.querySelectorAll(selector)
				).forEach((el) =>
					styles.forEach((s) => {
						try {
							el.style[s] = null
							el.style.removeProperty(s)
						} catch (error) {
							console.log(el.outerHTML)
							console.log(error)
						}
					})
				)
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

			Array.from(
				document.querySelectorAll(
					'meta, title, doctype, head, div[title="header"], div[title="footer"]'
				)
			).forEach((e) => e.parentNode.removeChild(e))

			Array.from(
				document.querySelectorAll('math')
			).map((el) =>
				Array.from(el.childNodes).forEach((e) =>
					el.removeChild(e)
				)
			)

			Array.from(
				document.querySelectorAll(
					'.Heading1, .Heading2, .Heading3, .Heading4, .Heading5, .Heading6'
				)
			).forEach((el) => {
				const level = el
					.getAttribute('class')
					.replace('Heading', '')

				const title = document.createElement('h' + level)
				el.parentNode.insertAdjacentElement(
					'afterend',
					title
				)
				Array.from(el.childNodes).map((c) =>
					title.appendChild(c)
				)
				Array.from(el.attributes)
					.filter((a) => a.name !== 'class')
					.map((a) => title.setAttribute(a.name, a.value))

				el.insertAdjacentElement('afterend', title)
				el.parentNode.removeChild(el)
			})

			removeAttrs(['class'])
			removeAttrs(['xml:lang'])
			removeAttrs(['lang', 'dir'])
			removeAttrs(['face'], 'font')

			Array.from(document.querySelectorAll('p'))
				.map((e) => deepestChild(e))
				.filter((e) => typeof e !== 'undefined')
				.forEach(
					(e) =>
						(e.textContent = e.textContent.replace(
							/\n/g,
							' '
						))
				)

			console.log(
				'\n===================================================================='
			)
			console.log(
				'====================================================================\n'
			)

			Array.from(document.querySelectorAll('p')).map((c) =>
				removeEmpty(c)
			)

			Array.from(
				document.querySelectorAll(
					'p[align="left"], p[align="justify"]'
				)
			).forEach((el) => el.removeAttribute('align'))
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
			Array.from(
				document.querySelectorAll('*[style=""]')
			).forEach((el) => el.removeAttribute('style'))

			Array.from(
				document.querySelectorAll('p > br')
			).forEach((el) => {
				try {
					const p = el.parentNode
					p.insertAdjacentElement('afterend', el)
					p.parentNode.removeChild(p)
				} catch (e) {
					console.error(e)
				}
			})

			while (
				Array.from(document.querySelectorAll('p > font'))
					.length > 0
			) {
				Array.from(
					document.querySelectorAll('p > font')
				).forEach((el) => {
					const p = el.parentNode
					Array.from(el.attributes).map((a) =>
						p.setAttribute(a.name, a.value)
					)
					Array.from(el.childNodes).map((c) =>
						p.appendChild(c)
					)
					p.removeChild(el)
				})
			}

			console.log(
				'\n===================================================================='
			)
			console.log(
				'====================================================================\n'
			)

			Array.from(document.querySelectorAll('p'))
				.map((e) => deepestChild(e))
				.filter((e) => typeof e !== 'undefined')
				.forEach((el) => {
					el.textContent = el.textContent
						.replace(/\n/g, ' ')
						.trim()
				})

			Array.from(
				document.querySelectorAll('br')
			).forEach((el) => el.parentNode.removeChild(el))

			Array.from(document.querySelectorAll('p, u'))
				.map((e) => deepestChild(e))
				.filter((e) => typeof e !== 'undefined')
				.map((el) => {
					el.textContent = el.textContent
						.replace(/&nbsp;/g, ' ')
						.replace(/\n/g, ' ')
						.trim()

					return el
				})
				.forEach((el) => {
					if (el.textContent.trim() === '')
						el.parentNode.remove(el)
				})

			Array.from(document.querySelectorAll('*')).forEach(
				(el) => {
					el.style['font-family'] = null
					el.style['margin-left'] = null
					el.style['margin-right'] = null
					el.style['text-indent'] = null
					el.style['text-decoration'] = null
					el.removeAttribute('id')
				}
			)

			const sizes = Array.from(
				document.querySelectorAll('p, span')
			)
				.map((el) => el.style['font-size'])
				.filter((e) => e !== '')
				.filter((value, index, arr) => {
					return arr.indexOf(value) === index
				})
				.sort((a, b) => {
					const aa = Number.parseFloat(a.slice(0, -2))
					const bb = Number.parseFloat(b.slice(0, -2))
					return bb - aa
				})

			Array.from(document.querySelectorAll('p, span'))
				.filter(
					(el) =>
						el.style['background-color'] === 'transparent'
				)
				.forEach((el) => {
					if (
						el.parentNode.style['background-color'] !== ''
					) {
						Array.from(el.parentNode.childNodes)
							.filter((child) => child.style === undefined)
							.forEach((child) => {
								const newEl = document.createElement('p')
								newEl.textContent = child.textContent
								child.parentNode.insertBefore(newEl, child)

								child.parentNode.removeChild(child)
							})

						Array.from(el.parentNode.childNodes)
							// TODO: check because seem's wtf
							.map((child) => {
								if (child.style === undefined) return child
							})
							.filter((child) => child.style !== undefined)
							.forEach((child) => {
								if (
									child.style['background-color'] !==
									'transparent'
								)
									child.style['background-color'] =
										el.parentNode.style['background-color']
								else child.style['background-color'] = ''
							})

						el.parentNode.style['background-color'] = ''
					}
					el.style['background-color'] = ''
				})

			Array.from(document.querySelectorAll('p, span'))
				.filter((el) => el.style['background-color'] !== '')
				.forEach((el) => {
					const newEl = document.createElement('i')
					el.insertAdjacentElement('afterend', newEl)
					Array.from(el.childNodes).map((c) =>
						newEl.appendChild(c)
					)

					el.parentNode.removeChild(el)
				})

			Array.from(
				document.querySelectorAll('b kbd')
			).forEach((el) => {
				const p = el.parentNode
				el.parentNode.insertAdjacentElement('afterend', el)

				el.parentNode.removeChild(p)
			})

			Array.from(document.querySelectorAll('b')).forEach(
				(el) => {
					if (el.textContent.trim() === '') {
						el.insertAdjacentText(
							'afterend',
							el.textContent
						)
					} else {
						const strong = document.createElement('strong')
						el.insertAdjacentElement('afterend', strong)
						Array.from(el.childNodes).map((c) =>
							strong.appendChild(c)
						)
					}
					el.parentNode.removeChild(el)
				}
			)

			Array.from(document.querySelectorAll('p, span'))
				.filter(
					(el) =>
						(el.style['font-style'] !== '') |
						(el.style['font-weight'] !== '')
				)
				.forEach((el) => {
					if (
						(el.style['font-style'] === 'bold') |
						(el.style['font-weight'] === 'bold')
					) {
						const strong = document.createElement('strong')
						el.insertAdjacentElement('afterend', strong)
						Array.from(el.childNodes).map((c) =>
							strong.appendChild(c)
						)

						el.parentNode.removeChild(el)
					} else if (el.style['font-style'] === 'italic') {
						const newEl = document.createElement('em')
						el.insertAdjacentElement('afterend', newEl)
						Array.from(el.childNodes).map((c) =>
							newEl.appendChild(c)
						)

						el.parentNode.removeChild(el)
					}
				})
			Array.from(
				document.querySelectorAll('p, span')
			).forEach((el) => {
				el.style['font-size'] = null
				el.style['font-style'] = null
				el.style['font-weight'] = null
				el.style['margin'] = null
				el.style['color'] = null
			})

			Array.from(
				document.querySelectorAll('*[style=""]')
			).forEach((el) => el.removeAttribute('style'))

			const rEmpty = (e) => {}

			rEmpty(document)

			console.log(
				'\n===================================================================='
			)
			console.log(
				'====================================================================\n'
			)

			Array.from(document.querySelectorAll('p'))
				.map((e) => deepestChild(e))
				.filter((e) => typeof e !== 'undefined')
				.forEach((el) => {
					el.textContent = el.textContent
						.replace(/\n/g, ' ')
						.trim()
				})
			Array.from(
				document.querySelectorAll('document > *')
			).forEach((el) => removeEmpty(el))

			Array.from(document.querySelectorAll('p')).map((c) =>
				removeEmpty(c)
			)

			console.log(
				'\n===================================================================='
			)
			console.log(
				'====================================================================\n'
			)

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
			Array.from(document.querySelectorAll('kbd')).forEach(
				(el) => {
					el.insertAdjacentText(
						'afterend',
						'$' +
							el.textContent
								.replace(/(right|left)/g, '')
								.replace(/widevec/g, 'vec')
								.replace(/×/g, '*')
								.replace(/[ ]*rsub[ ]*/g, '_') +
							'$'
					)
					el.parentNode.removeChild(el)
				}
			)
			Array.from(
				document.querySelectorAll('strong')
			).forEach((el) => {
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
					el.insertAdjacentText(
						'afterend',
						trimedS + '**' + trimed + '**' + trimedE
					)
				}
				el.parentNode.removeChild(el)
			})
			Array.from(document.querySelectorAll('i')).forEach(
				(el) => {
					if (el.textContent.trim() === '') {
						el.insertAdjacentText(
							'afterend',
							el.textContent
						)
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
						if (trimedS === '') trimedS = ' '
						if (trimedE === '') trimedE = ' '
						el.insertAdjacentText(
							'afterend',
							trimedS + '*' + trimed + '*' + trimedE
						)
					}
					el.parentNode.removeChild(el)
				}
			)
			Array.from(document.querySelectorAll('em')).forEach(
				(el) => {
					if (el.textContent.trim() === '') {
						el.insertAdjacentText(
							'afterend',
							el.textContent
						)
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
						el.insertAdjacentText(
							'afterend',
							trimedS + '_' + trimed + '_' + trimedE
						)
					}
					el.parentNode.removeChild(el)
				}
			)

			Array.from(document.querySelectorAll('span')).forEach(
				(el) => {
					el.insertAdjacentText('afterend', el.textContent)
					el.parentNode.removeChild(el)
				}
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

			function convertLi(el) {
				if (typeof el.textContent === 'undefined') {
					console.log('aaaaaaaaaaa')
					console.log(el)
					console.log('bbbbbbbbbbb')
				}
				if (el.textContent.trim() !== '') {
					if (el.textContent.trim().charAt(0) !== '#') {
						let level = getLiLevel(el)
						console.log('level :' + level)

						let str =
							newLineEscape +
							espaceEscape.repeat(2).repeat(level) +
							'- ' +
							el.textContent.trim()

						if (level === 0) str = newLineEscape + str

						el.insertAdjacentText('afterend', str)
					} else {
						el.insertAdjacentText(
							'afterend',
							el.textContent.trim()
						)
					}
				}
				el.parentNode.removeChild(el)
			}

			let stack = Array.from(
				document.querySelectorAll('ol li, ul li')
			)

			while (stack.length > 0) {
				let count = 0

				let children = stack.reduce(function iter(sum, el) {
					console.log(count)
					count++

					if (
						Array.from(el.querySelectorAll('li')).length > 0
					) {
						return sum
					} else {
						sum.push(el)
						return sum
					}
				}, [])

				children.forEach((el) => {
					convertLi(el)
				})

				stack = Array.from(
					document.querySelectorAll('ol li, ul li')
				)
			}

			Array.from(
				document.querySelectorAll('ol, ul')
			).forEach((el) => {
				el.insertAdjacentText(
					'afterend',
					el.textContent
						.replace(newLineEscapeRegex, '\n')
						.trim()
				)
				el.parentNode.removeChild(el)
			})

			Array.from(document.querySelectorAll('img')).forEach(
				(el) => {
					el.insertAdjacentText(
						'afterend',
						'\n![' +
							(el.alt | el.id) +
							'](' +
							el.src +
							' =' +
							parseInt(el.style.width.replace('px', '')) +
							')\n'
					)
					el.parentNode.removeChild(el)
				}
			)
			Array.from(document.querySelectorAll('div')).forEach(
				(el) => {
					el.insertAdjacentText('afterend', el.textContent)
					el.parentNode.removeChild(el)
				}
			)

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
							resolve(
								result.markdown
									.trim()
									.split('\n')
									.map((e) => e.trim())
									.join('\n')
							)
						}
					)
				})

			async function asyncForEach(array, callback) {
				for (let index = 0; index < array.length; index++) {
					await callback(array[index], index, array)
				}
			}

			await asyncForEach(
				Array.from(document.querySelectorAll('table')),
				async (el) => {
					const md = (await toMd(el.outerHTML))
						.replace(/\\*/g, '')
						.replace(/([^\s])\|/g, '$1 |')
						.replace(
							/\n(\+--------------------------)*\+/g,
							''
						)

					el.insertAdjacentText('afterend', '\n' + md)
					el.parentNode.removeChild(el)
				}
			)

			Array.from(document.querySelectorAll('p'))
				.filter(
					(el) => Array.from(el.attributes).length === 0
				)
				.forEach((el) => {
					el.insertAdjacentText(
						'afterend',
						el.textContent + '\n'
					)
					el.parentNode.removeChild(el)
				})

			dom
				.serialize()
				.replace(/&gt;/, '>')
				.replace(/&lt;/g, '<')
				.replace(/&nbsp;/g, ' ')
				.replace(/\s/gm, ' ')

			fs.writeFileSync(
				newFilepath + '/' + output,
				document
					.querySelector('body')
					.innerHTML.replace(/&nbsp;/g, ' ')
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
