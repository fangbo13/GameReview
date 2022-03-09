
/* home.js */

import { customiseNavbar } from '../util.js'
// import { Ajv } from './ajv.min.js'

//schema for json
const schema = {
    title: "game",
    description: 'a simple object to demonstrate data types',
    type: 'object',
    properties: {
    game: { type: 'string' }
  }
}

// const validate = ajv.compile(schema)

export async function setup(node) {
	console.log('HOME: setup')
	try {
		console.log(node)
		document.querySelector('header p').innerText = 'Home'
		customiseNavbar(['home', 'game', 'logout']) // navbar if logged in
		const token = localStorage.getItem('authorization')
		console.log(token)
		if(token === null) customiseNavbar(['home', 'login']) //navbar if logged out
		// add content to the page
		await addContent(node)
	} catch(err) {
		console.error(err)
	}
}

// this example loads the data from a JSON file stored in the uploads directory
async function addContent(node) {
	const token = localStorage.getItem('authorization')
	const response = await fetch('/api/games', {
		headers: {
			'authorization': token,
			'Content-Type': 'application/json',
			'host': 'https://taxi-mambo-8080.codio-box.uk/'
		},
	})
	const games = await response.json()
	const template = document.querySelector('template#games')
	for(const game of games) {
		const fragment = template.content.cloneNode(true)
		fragment.querySelector('h2').innerText = game.name
		fragment.querySelector('p').innerText = game.year
		node.appendChild(fragment)
	}
}
