
/* home.js */

import { customiseNavbar, loadPage } from '../util.js'
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
		// document.querySelector('header p').innerText = 'Home'
		const token = localStorage.getItem('authorization')
		console.log(token)
		if(token === null) customiseNavbar(['home', 'login']) //navbar if logged out
		else customiseNavbar(['home', 'game', 'logout']) // navbar if logged in
		// add content to the page
		// node.querySelector('template#games').querySelector('a').addEventListener('click', await detail)
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
			'Content-Type': 'application/vnd.api+json',
			'host': 'https://taxi-mambo-8080.codio-box.uk/'
		},
	})
	const json = await response.json()
	const games = json.data
	const template = document.querySelector('template#games').cloneNode(true)
	const div = template.content.querySelector('.gx-0')
	const template_gameinfo = document.querySelector('template#games-info')
	for(const game of games) {
		const fragment = template_gameinfo.content.querySelector('.col-lg-4').cloneNode(true)
		fragment.querySelector('.gameinfo .h2').innerText = game.attributes.name
		fragment.querySelector('.gameinfo .mb-0').innerText = game.attributes.year
		fragment.querySelector('.img-fluid').src = 'uploads/cover/' + game.attributes.cover
		fragment.querySelector('a').href="javascript:void(0);" 
		fragment.querySelector('a').addEventListener('click', await detail)
		fragment.querySelector('.gameinfo').id = game.id
		div.appendChild(fragment)
	}
	node.appendChild(template.content.querySelector('section'))
}

async function detail() {
	localStorage.setItem('game', event.target.id)
	loadPage('detail')
}
