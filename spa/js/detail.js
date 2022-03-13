
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

const options = {
    'tables': true,
    'tasklists': true,
    'strikethrough': true
}

const converter = new showdown.Converter(options)

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
		node.querySelector('.mb-0[name=year]').innerText = game.year
		const html = converter.makeHtml(game.description)
		console.log(html)
		node.querySelector('.mb-0[name=description]').innerHTML = converter.makeHtml(game.description)
		node.querySelector('.mb-0[name=date]').innerText = game.add_date
		node.querySelector('.mb-0[name=user]').innerText = game.user
	} catch(err) {
		console.error(err)
	}
}