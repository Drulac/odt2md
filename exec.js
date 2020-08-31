const childProcess = require('child_process')

module.exports = (cmd) =>
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
