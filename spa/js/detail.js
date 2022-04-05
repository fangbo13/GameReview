
/* detail.js */

import { customiseNavbar, showMessage, loadPage } from '../util.js'
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
		else {
			customiseNavbar(['home', 'game', 'logout']) // navbar if logged in
		}
		// modifyContent
		const id = localStorage.getItem('game')
		let response = await fetch('/api/games/'+id, {
			headers: {
				'authorization': token,
				'Content-Type': 'application/vnd.api+json',
				'host': 'https://taxi-mambo-8080.codio-box.uk/'
			},
		})
		let json = await response.json()
		const game = json.data
		node.querySelector('img').src = "uploads/cover/" + game.attributes.cover
		node.querySelector('.h2').innerText = game.attributes.name
		node.querySelector('.mb-0[name=publisher]').innerText = game.attributes.publisher
		node.querySelector('.mb-0[name=year]').innerText = game.attributes.year
		node.querySelector('.mb-0[name=description]').innerHTML = converter.makeHtml(game.attributes.description)
		node.querySelector('.mb-0[name=date]').innerText = game.attributes.add_date
		node.querySelector('.mb-0[name=user]').innerText = game.attributes.user

		node.querySelector('input[name=username]').value = localStorage.getItem('username')
		node.querySelector('input[name=game]').value = localStorage.getItem('game')

		response = await fetch('/api/games/'+id+'/reviews', {
			headers: {
				'authorization': token,
				'Content-Type': 'application/vnd.api+json',
				'host': 'https://taxi-mambo-8080.codio-box.uk/'
			},
		})
		json = await response.json()
		const reviews = json.data
		console.log(reviews)
		const div = node.querySelector('#reviews')
		let fragment = div.querySelector('.review-item').cloneNode(true)
		div.removeChild(div.querySelector('.review-item'))
		console.log(fragment)
		for(const review of reviews) {
			fragment = fragment.cloneNode(true)
			fragment.querySelector('.review-score').innerText = review.attributes.score
			fragment.querySelector('.review-user').innerText = review.attributes.user
			fragment.querySelector('.review-date').innerText = review.attributes.date
			fragment.querySelector('.review-content').innerHTML = converter.makeHtml(review.attributes.content)
			div.appendChild(fragment)
		}

		if(token !== null) {
			node.querySelector('#review').style.display = "block"
			node.querySelector('form').addEventListener('submit', await add)
			node.querySelector('input[name=score]').addEventListener('input', await slide)
			node.querySelector('textarea').addEventListener('input', await markdownEditor)
		} else {
			node.querySelector('#review').style.display = "none"
		}
	} catch(err) {
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
	const output = document.querySelector('[name=score_val]')
	console.log(output)
	output.value = event.target.value
}

async function add() {
	const game = localStorage.getItem('game')
	event.preventDefault()
	console.log('form submitted')
	const formData = new FormData(event.target)
	const data = Object.fromEntries(formData.entries())
	console.log(data)
	const token = localStorage.getItem('authorization')
	console.log('making call to post')
	const response = await fetch('/api/games/'+game+'/reviews', {
		method: 'POST', // or 'PUT'
		headers: {
			'authorization': token,
			'Content-Type': 'application/vnd.api+json',
			'host': 'https://taxi-mambo-8080.codio-box.uk/'
		},
		body: JSON.stringify(data)
	})
	console.log(response)
	if(response.status === 201) {
		alert(`you are successfully add a review`)
		await loadPage('detail')
	} else {
		const error = await response.json()
		showMessage(error.errors[0].detail)
	}
}


async function addContent(node) {
	const token = localStorage.getItem('authorization')
	const response = await fetch('/api/reviews', {
		headers: {
			'authorization': token,
			'Content-Type': 'application/vnd.api+json',
			'host': 'https://taxi-mambo-8080.codio-box.uk/'
		},
	})
	const reviews = await response.json()
	const template = document.querySelector('template#detail')
	const div = template.content.querySelector('#reviews')
	for(const review of reviews) {
		const fragment = template.content.querySelector('#reviews').cloneNode(true)
		console.log(fragment)
		fragment.querySelector('[name=review-user]').innerText = review.user
		fragment.querySelector('[name=review-date]').innerText = review.date
		fragment.querySelector('[name=review]').innerHTML = converter.makeHtml(review.content)
		div.appendChild(fragment)
	}
	node.appendChild(div)
}