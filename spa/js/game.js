/* game.js */

import { customiseNavbar } from '../util.js'

const converter = new showdown.Converter({'tables': true, 'tasklists': true, 'strikethrough': true})

export async function setup(node) {
	console.log('GAME: setup')
	try {
		document.querySelector('header p').innerText = 'Home'
		customiseNavbar(['home', 'add', 'logout']) // navbar if logged in
		const token = localStorage.getItem('authorization')
		console.log(token)
		if(token === null) customiseNavbar(['game', 'login']) //navbar if logged out
		node.querySelector('input[name=year]').addEventListener('input', await slide)
		node.querySelector('textarea').addEventListener('input', await markdownEditor)

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