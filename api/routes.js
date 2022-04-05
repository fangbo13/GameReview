
/* routes.js */

import { Router } from 'https://deno.land/x/oak@v6.5.1/mod.ts'
import { moment } from "https://deno.land/x/deno_moment/mod.ts";

import { extractCredentials, saveFile, createJWT } from './modules/util.js'
import { login, rolesCheck, queryUsername, queryUserid } from './modules/users.js'
import { queryallGames, queryGameById, insertGame } from './modules/games.js'
import { queryallReviews, queryReviewById, insertReview } from './modules/reviews.js'

const router = new Router()

// the routes defined here
router.get('/', async context => {
	console.log('GET /')
	let data = {
		name: 'Games API',
		desc: 'API for games',
		links: [
			{
				name: 'games',
				desc: 'a list of games',
				href: `https://${context.host}/api/games`,
			},
			{
				name: 'reviews',
				desc: 'a list of reviews',
				href: `https://${context.host}/api/reviews`,
			}
		]
	}
	data = await Deno.readTextFile('spa/index.html')
	context.response.body = data
})

router.get('/api/users', async context => {
	console.log('GET /api/users')
	const token = context.request.headers.get('authorization')
	console.log(`auth: ${token}`)
	try {
		// generate jwt after user login
		const credentials = extractCredentials(token)
		const username = await login(credentials)
		const role = await rolesCheck(credentials.username)
		const payload = {'username': username, "role": role}
		const jwt = await createJWT(payload)
		context.response.status = 200
		context.response.body = JSON.stringify(
			{
				data: { 
					username: username,
					token: jwt
				}
			}, null, 2)
	} catch(err) {
		context.response.status = 401
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: '401 Unauthorized.',
						detail: err.message
					}
				]
			}
		, null, 2)
	}
})

router.get('/api/games', async context => {
	context.response.headers.set('Allow', 'GET, POST')
	context.host = context.request.url.host
	console.log('GET /api/games')
	try {
		const collections = []
		const games = await queryallGames()
		for(let game of games) {
			let collection = {}
			game.user = await queryUsername(game.user)
			collection.id = game.id
			collection.type = "game"
			delete game.id
			collection.attributes = game
			collection.relationships = {
				reviews: {
					links: {
						self: `https://${context.host}/api/games/${collection.id}/reviews`
					}
				}
			}
			collection.links = {
				self: `https://${context.host}/api/games/${collection.id}`
			}
			// delete game.id

			collections.push(collection)
		}
		context.response.body = JSON.stringify(
			{
				data: collections
			}
		, null, 2)
	}catch(err) {
		context.response.status = 401
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						status: '401',
						title: '401 Unauthorized.',
						detail: err.message
					}
				]
			}
		, null, 2)
	}
})

router.post('/api/games', async context =>  {
	context.response.headers.set("Allow", 'GET, POST')
	console.log('POST /api/games')
	try {
		const body = await context.request.body()
		const data = await body.value
		console.log(data)
		const covername = saveFile(data.cover.base64, data.name.replace(/ /g,"_"))
		const userid = await queryUserid(data.username)
		const params = {name: data.name, publisher: data.publisher, year: data.year, add_date: moment().format('YYYY-MM-DD'),
						description: data.description, cover: covername, user: userid }
		await insertGame(params)
		console.log('game added')
		context.response.status = 201
		context.response.body = JSON.stringify(
			{
				data: {
					message: 'game added'
				}
			}
		)
	} catch(err) {
		context.response.status = 400
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						status: '400',
						title: 'a problem occurred',
						detail: err.message
					}
				]
			}
		)
	}
})

router.get('/api/games/:id', async context => {
	context.response.headers.set('Allow', 'GET, PUT, DELETE')
	context.host = context.request.url.host
	console.log('GET /api/games/:id')
	try {
		const res = {}
		res.id = context.params.id
		res.type = "game"

		const game = await queryGameById(context.params.id)
		game.user = await queryUsername(game.user)
		delete game.id
		res.attributes = game
		
		res.relationships = {
			reviews: {
				links: {
					self: `https://${context.host}/api/games/${res.id}/reviews`
				}
			}
		}

		res.links = {
			self: `https://${context.host}/api/games/${res.id}`
		}
		context.response.body = JSON.stringify(
			{
				data: res
			}
		, null, 2)
	}catch(err) {
		if(err.message === `game "${context.params.id}" not found`){
			context.response.status = 404
			context.response.body = JSON.stringify(
				{
					errors: [
						{
							status: '404',
							title: '404 not found.',
							detail: err.message
						}
					]
				}
			, null, 2)
		} else {
			context.response.status = 401
			context.response.body = JSON.stringify(
				{
					errors: [
						{
							status: '401',
							title: '401 Unauthorized.',
							detail: err.message
						}
					]
				}
			, null, 2)
		}
	}
})

router.get('/api/games/:game/reviews', async context => {
	context.response.headers.set('Allow', 'GET, POST')
	context.host = context.request.url.host
	console.log('GET /api/games/:game/reviews')
	try {
		const collections = []
		const reviews = await queryallReviews(`${context.params.game}`)
		for(let review of reviews) {
			let collection = {}
			review.user = await queryUsername(review.user)
			review.game = await queryGameById(review.game)
			review.game = review.game.name
			collection.id = review.id
			collection.type = "review"
			delete review.id

			collection.attributes = review
			collection.relationships = {
				game: {
					links: {
						self: `https://${context.host}/api/games/${context.params.game}`
					}
				}
			}
			collection.links = {
				self: `https://${context.host}/api/games/${context.params.game}/reviews/${collection.id}`
			}
			collections.push(collection)
		}
		context.response.body = JSON.stringify(
			{
				data: collections
			}
		, null, 2)
	}catch(err) {
		if(err.message === `game "${context.params.game}" not found`){
			context.response.status = 404
			context.response.body = JSON.stringify(
				{
					errors: [
						{
							status: '404',
							title: '404 not found.',
							detail: err.message
						}
					]
				}
			, null, 2)
		} else {
			context.response.status = 401
			context.response.body = JSON.stringify(
				{
					errors: [
						{
							status: '401',
							title: '401 Unauthorized.',
							detail: err.message
						}
					]
				}
			, null, 2)
		}
	}
})

router.post('/api/games/:game/reviews', async context =>  {
	context.response.headers.set("Allow", 'GET, POST')
	console.log('POST /api/games/:game/reviews')
	try {
		const body = await context.request.body()
		const data = await body.value
		const userid = await queryUserid(data.username)
		if(data.country === undefined) {
			data.country = ""
		} 
		if(data.region === undefined) {
			data.region = ""
		} 
		const params = {content: data.content, date: moment().format('YYYY-MM-DD'), score: data.score, country: data.country, region: data.region,
						user: userid, game: data.game }
		console.log(params)
		await insertReview(params)
		context.response.status = 201
		context.response.body = JSON.stringify(
			{
				data: {
					message: 'review added'
				}
			}
		)
	} catch(err) {
		context.response.status = 400
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						status: '400',
						title: 'a problem occurred',
						detail: err.message
					}
				]
			}
		)
	}
})

router.get('/api/games/:game/reviews/:id', async context => {
	context.response.headers.set('Allow', 'GET, PUT, DELETE')
	context.host = context.request.url.host
	console.log('GET /api/games/:game/reviews/:id')
	try {
		const res = {}
		const review = await queryReviewById(context.params.id)
		review.user = await queryUsername(review.user)
		review.game = await queryGameById(review.game)
		review.game = review.game.name
		res.id = review.id
		res.type = "review"
		delete review.id
		res.attributes = review
		res.relationships = {
			game: {
				links: {
					self: `https://${context.host}/api/games/${context.params.game}`
				}
			}
		}
		res.links = {
			self: `https://${context.host}/api/games/${context.params.game}/reviews/${res.id}`
		}
		context.response.body = JSON.stringify(
			{
				data: res
			}
		, null, 2)
	}catch(err) {
		if(err.message === `review "${context.params.id}" not found`){
			context.response.status = 404
			context.response.body = JSON.stringify(
				{
					errors: [
						{
							status: '404',
							title: '404 not found.',
							detail: err.message
						}
					]
				}
			, null, 2)
		} else {
			context.response.status = 401
			context.response.body = JSON.stringify(
				{
					errors: [
						{
							status: '401',
							title: '401 Unauthorized.',
							detail: err.message
						}
					]
				}
			, null, 2)
		}
	}
})

router.get("/(.*)", async context => {      
// 	const data = await Deno.readTextFile('static/404.html')
// 	context.response.body = data
	console.log('GET', '/.(*)')
	const data = await Deno.readTextFile('spa/index.html')
	context.response.body = data
})

export default router
