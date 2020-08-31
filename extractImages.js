const fs = require('fs')
const util = require('util')
const path = require('path')

const exec = require('./exec.js')

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

module.exports = async (filename) => {
	const cmd = `mkdir imagesExtractions ; soffice --headless --convert-to html "${filename}" --outdir imagesExtractions`

	await exec(cmd)

	console.log('conversion done')

	const filesList = fs.readdirSync('imagesExtractions')

	const htmlFilename = filesList.find(
		(file) => path.extname(file).toLowerCase() === '.html'
	)

	const imagesList = filesList.filter(
		(file) => file != htmlFilename
	)

	const html = fs
		.readFileSync(
			'imagesExtractions/' + htmlFilename,
			'utf-8'
		)
		.toString()

	const reg = new RegExp(
		'(' +
			imagesList
				.map(encodeURI)
				.map(escapeRegExp)
				.join('|') +
			')',
		'g'
	)

	//TODO : supprimmer ce qui n'est pas dans imagesOrdered mais dans imagesList (normalement rien)

	const imagesOrdered = html
		.match(reg)
		.map(decodeURI)
		.map((file, id) => {
			const dest =
				'converted-img' +
				'0'.repeat(3 - (id + 1).toString().length) +
				(id + 1).toString() +
				'.' +
				file.split('.').pop()

			fs.renameSync(
				'imagesExtractions/' + file,
				'imagesExtractions/' + dest
			)

			return dest
		})

	fs.unlinkSync('imagesExtractions/' + htmlFilename)

	return imagesOrdered
}

//module.exports('02 UE2 Generalites sur la cellule.odt')
