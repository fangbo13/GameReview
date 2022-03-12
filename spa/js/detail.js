
/* detail.js */

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
	console.log('Detail: setup')
	try {
		// document.querySelector('header p').innerText = 'Home'
		const token = localStorage.getItem('authorization')
		console.log(token)
		if(token === null) customiseNavbar(['home', 'login']) //navbar if logged out
		else customiseNavbar(['home', 'game', 'comment', 'logout']) // navbar if logged in
		// modifyContent
		const id = localStorage.getItem('game')
		const response = await fetch('/api/games/'+id, {
			headers: {
				'authorization': token,
				'Content-Type': 'application/json',
				'host': 'https://taxi-mambo-8080.codio-box.uk/'
			},
		})
		const game = await response.json()
		node.querySelector('img').src = "uploads/cover/" + game.cover
		node.querySelector('.h2').innerText = game.name
		node.querySelector('.mb-0[name=publisher]').innerText = game.publisher
	} catch(err) {
		console.error(err)
	}
}