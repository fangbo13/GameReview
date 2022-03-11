/* game.js */

import { customiseNavbar, file2DataURI, loadPage, showMessage } from '../util.js'

const converter = new showdown.Converter({'tables': true, 'tasklists': true, 'strikethrough': true})

let file = null

export async function setup(node) {
	console.log('GAME: setup')
	try {
		customiseNavbar(['home', 'logout']) // navbar if logged in
		const token = localStorage.getItem('authorization')
		console.log(token)
		if(token === null) customiseNavbar(['game', 'login']) //navbar if logged out
		node.querySelector('input[name=username]').value = localStorage.getItem('username')
		node.querySelector('form').addEventListener('submit', await add)
		node.querySelector('input[name=year]').addEventListener('input', await slide)
		node.querySelector('textarea').addEventListener('input', await markdownEditor)
		node.querySelector('input[type=file]').addEventListener('change', await upload)
	}catch(err) {
		console.error(err)
	}
}

async function markdownEditor() {
	const markup = converter.makeHtml(event.target.value)
	// markdown.value = markup
	document.querySelector('article[name=markdown]').innerHTML = markup
}

async function slide() {
	console.log('CHANGE')
	const output = document.querySelector('[name=year_val]')
	console.log(output)
	output.value = event.target.value
}

async function add() {
	event.preventDefault()
	console.log('form submitted')
	const formData = new FormData(event.target)
	const data = Object.fromEntries(formData.entries())
	console.log(data)
	const token = localStorage.getItem('authorization')
	console.log('making call to post')
	const response = await fetch('/api/games', {
		method: 'POST', // or 'PUT'
		headers: {
			'authorization': token,
			'Content-Type': 'application/json',
			'host': 'https://taxi-mambo-8080.codio-box.uk/'
		},
		body: JSON.stringify(data)
	})
	console.log(response)
	if(response.status === 201) {
		showMessage(`you are successfully add a game`)
		await loadPage('home')
	} else {
		const error = await response.json()
		showMessage(error.errors[0].detail)
	}
}

async function upload() {
	file = document.querySelector('#cover').files[0]
	switch(file.type) {
		case 'image/jpg':case 'image/png':case 'image/jpeg':
			file.base64 = await file2DataURI(file)
			break
		default:
			showMessage('Unsupport file type')
	}
}