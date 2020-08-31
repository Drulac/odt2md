const stringWidth = require('string-width')

const md = `+-----------------------+-----------------------+-----------------------+
|                       | Cellule procaryote    | Cellule eucaryote     |
+=======================+=======================+=======================+
| Membrane cellulaire   | \-                    | \+                    |
+-----------------------+-----------------------+-----------------------+
| Nombre de chromosomes | 1 (circulaire :       | \>1                   |
|                       | nucléoïde)            |                       |
+-----------------------+-----------------------+-----------------------+
| Taille ADN            | 104 à 105pb           | 107 à 1011pb          |
+-----------------------+-----------------------+-----------------------+
| Histone/ADN           | \-                    | \+                    |
+-----------------------+-----------------------+-----------------------+
| Nucléole              | \-                    | \+                    |
+-----------------------+-----------------------+-----------------------+
| Systèmes / organites  | \- (sauf exceptions)  | \+                    |
| endomembranaires      |                       |                       |
+-----------------------+-----------------------+-----------------------+
| Paroi cellulaire      | \+ (Peptidoglycanes)  | \-                    |
|                       |                       |                       |
|                       | (sauf mycoplasmes)    | (sauf cellules        |
|                       |                       | végétales : cellulose |
|                       |                       | champignons :         |
|                       |                       | chitine)              |
+-----------------------+-----------------------+-----------------------+
| Ribosomes             | 70S / cytoplasme      | 80S / cytoplasme ou   |
|                       |                       | REG                   |
+-----------------------+-----------------------+-----------------------+
| Phagocytose /         | \-                    | +/-                   |
| Pinocytose            |                       |                       |
+-----------------------+-----------------------+-----------------------+
`

module.exports = (md) => {
	const arraySeparatorReg = /^\+[\+\-=]+\+$\n/gm
	const arraySeparatorRegDontExclude = /(^\+[\+\-=]+\+$\n)/gm
	//  string.split documentation :   If separator is a regular expression that contains capturing parentheses, then each time separator is matched, the results (including any undefined results) of the capturing parentheses are spliced into the output array.

	const grid = md
		.split(arraySeparatorReg)
		.slice(1, -1)
		.map((e, id) => {
			//if (id % 2 === 0) {
			//row
			const row = e

			const lines = row
				.trim()
				.split('\n')
				.map((line) => line.split('|'))

			return lines.map((line) =>
				line.slice(1, -1).map((cell) => ({
					content: cell.trim(),
					cellWidth: 1,
					contentWidth: stringWidth(cell.trim()),
				}))
			)

			/*	} else {
								//separator
								const lineSeparator = e
								return lineSeparator
									.charAt(1)
									.repeat(lineSeparator.length)
							}*/
		})
		.flat()

	const numberOfColumns = Math.max(
		...grid.map((row) => {
			return (
				row
					//.filter((e) => typeof e.cellWidth !== 'undefined')
					.reduce((sum, cell) => sum + cell.cellWidth, 0)
			)
		})
	)

	grid.map((row) => {
		const rowWidth = row
			//.filter((e) => typeof e.cellWidth !== 'undefined')
			.reduce((sum, cell) => sum + cell.cellWidth, 0)

		/*console.log(
			rowWidth,
			numberOfColumns,
			row[row.length - 1].cellWidth
		)*/

		if (rowWidth !== numberOfColumns) {
			row[row.length - 1].cellWidth +=
				numberOfColumns - rowWidth
		}
		//console.log(row[row.length - 1].cellWidth)
	})

	const columnsWidth = Array(numberOfColumns).fill(0)

	Array(numberOfColumns)
		.fill(0)
		.map((_, columnId) => {
			columnsWidth[columnId] = getColumnWidth(
				grid,
				columnId,
				columnsWidth
			)
			//console.log(columnId, columnsWidth[columnId])
			//console.log('-'.repeat(10))
		})

	//console.log(grid)

	//console.log('|'.repeat(20))
	//console.log(columnsWidth)
	//console.log('|'.repeat(20))

	function joinFunc(arr, cb) {
		//function cb(a, b)
		return arr
			.map((e, id) => {
				if (id !== arr.length - 1) {
					return e + cb(e, arr[id + 1])
				} else {
					return e
				}
			})
			.join('')
	}

	function getCell(row, columnIndex) {
		let index = 0

		const cell = row
			//.filter((e) => typeof e.cellWidth !== 'undefined')
			.reduce((searchedCell, cell, value) => {
				//si on a déjà trouvé la bonne cellule on skip les suivantes
				if (typeof searchedCell === 'undefined') {
					if (index + cell.cellWidth - 1 === columnIndex)
						return cell
					else index += cell.cellWidth
				}

				return searchedCell
			}, undefined)

		//console.log(cell, columnIndex)

		return cell
	}

	// to use with joinFunc
	function joinWithAngles(a, b) {
		const lastA = a.charAt(a.length - 1)
		const firstB = b.charAt(0)

		/*console.log(
			JSON.stringify(lastA),
			JSON.stringify(firstB)
		)*/

		if (
			['-', '='].includes(lastA) ||
			['-', '='].includes(firstB)
		) {
			return '+'
		} else {
			return '|'
		}
	}

	function getColumnWidth(grid, columnIndex, columnsWidth) {
		const cells = grid
			.map((row) => getCell(row, columnIndex))
			.filter((e) => typeof e !== 'undefined')

		const cellsWidth = cells
			.map((cell) => {
				cell.col = columnIndex

				if (cell.cellWidth > 1) {
					// il faut soustraire la largeur des colonnes précédentes

					const previousColumnsWidth = columnsWidth
						.filter(
							(width, columnId) =>
								columnId < columnIndex &&
								columnId > columnIndex - cell.cellWidth
						)
						.reduce((sum, width) => sum + width + 1, 0) // +1 à cause du | entre les deux colonnes

					cell.inPreviousColumnsWidth = previousColumnsWidth
					cell.inThisColumnWidth =
						cell.contentWidth - previousColumnsWidth

					return cell.contentWidth - previousColumnsWidth
				}

				return cell.contentWidth
			})
			.map((w) => (isNaN(w) ? 0 : w))

		let width = Math.max(...cellsWidth)

		//console.log(columnIndex, cellsWidth, width)

		// une cellule doit faire au moins 3 caractères de large
		// on ajoute 2 de large : un espace de chaque côté du contenu
		width = width > 0 ? width + 2 : 3

		cells.forEach((cell) => {
			cell.renderWidth =
				width + (cell.inPreviousColumnsWidth | 0) // ajouter la largeur des colonnes précédentes
		})

		return width
	}

	const lines = grid
		.map((row) => {
			return joinFunc(
				[].concat(
					'',
					row.map((cell) => {
						if (typeof cell.content !== 'undefined') {
							const spaceLength =
								cell.renderWidth - cell.content.length

							const halfLen = Math.round(spaceLength / 2)

							const spaceBefore = halfLen < 1 ? 1 : halfLen
							const spaceAfter =
								spaceLength - halfLen < 1
									? 1
									: spaceLength - halfLen
							return (
								' '.repeat(spaceBefore) +
								cell.content +
								' '.repeat(spaceAfter)
							)
						} else {
							//console.log(cell.col, cell.cellWidth)

							let start = cell.col - cell.cellWidth + 1
							if (start < 0) start = 0

							const stop = start + cell.cellWidth

							//console.log(start, stop)

							const sizes = columnsWidth.slice(start, stop)
							//console.log(sizes)
							/*sizes.push(
								cell.renderWidth -
									sizes.reduce((sum, s) => sum + s, 0) -
									sizes.length
							)*/
							//console.log(sizes)
							//console.log('~'.repeat(20))

							return joinFunc(
								sizes.map((s) => cell.type.repeat(s)),
								joinWithAngles
							)
						}
					}),
					''
				),
				joinWithAngles
			)
		})
		.map((line) => line.slice(1, -1))

	const separators = md
		.split(arraySeparatorRegDontExclude)
		.slice(1, -1)
		.map((separator, id) => {
			if (id % 2 === 0) {
				return separator
			} else {
				return separator.split('\n').fill(0).slice(1)
			}
		})
		.flat()

	//console.log(separators)
	//console.log(lines)
	//process.exit()
	//	.map((separator) => separator[1])

	separators.forEach((separator, id) => {
		if (typeof separator === 'string')
			lines.splice(
				id,
				0,
				separator.charAt(1).repeat(separator.length)
			)
	})

	const out = lines
		//.concat(separators.pop().repeat(lines.pop().length))
		.flat()
		.join('\n')

	/*
const out = grid
	.map((cells) =>
		cells
			.map((cell) => cell.content)
			.join(' | ')
			.trim()
			.slice(1, -1)
	)
	.join('\n')
*/

	return out
}
/*
module.exports = (md) => {
	const arraySeparatorReg = /(^\+[\+\-=]+\+$\n)/gm

	//  string.split documentation :   If separator is a regular expression that contains capturing parentheses, then each time separator is matched, the results (including any undefined results) of the capturing parentheses are spliced into the output array.
	const grid = md.split(arraySeparatorReg).map((e, id) => {
		if (id % 2 === 0) {
			//row
			const row = e

			const lines = row
				//.trim()
				.split('\n')
				//.map((line) => line.slice(1, -1))
				.join('\n')

			return lines
		} else {
			//separator
			const lineSeparator = e
			return lineSeparator
				.charAt(1)
				.repeat(lineSeparator.length)
		}
	})

	return grid.join('\n')
}
*/
//console.log(module.exports(md))
