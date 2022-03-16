
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
	console.log('GET /api/games')
	try {
		const games = await queryallGames()
		context.host = context.request.url.host
		for(let game of games) {
			game.user = await queryUsername(game.user)
			game.links =[
				{
					herf: `https://${context.host}/api/games/${game.id}`,
					rel: "game",
					type: "GET"
				}
			]
			// delete game.id
		}
		context.response.body = JSON.stringify(games, null, 2)
	}catch(err) {
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
	console.log('GET /api/games/:id')
	try {
		const game = await queryGameById(context.params.id)
		context.host = context.request.url.host
		game.user = await queryUsername(game.user)
		// console.log(game.add_date.format('YYYY-MM-DD'))
		game.links =[
			{
				herf: `https://${context.host}/api/games/${game.id}`,
				rel: "game",
				type: "GET"
			}
		]
		context.response.body = JSON.stringify(game, null, 2)
	}catch(err) {
		if(err.message === `game "${context.params.id}" not found`){
			context.response.status = 404
			context.response.body = JSON.stringify(
				{
					errors: [
						{
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
							title: '401 Unauthorized.',
							detail: err.message
						}
					]
				}
			, null, 2)
		}
	}
})

router.get('/api/reviews', async context => {
	context.response.headers.set('Allow', 'GET, POST')
	console.log('GET /api/reviews')
	try {
		const reviews = await queryallReviews()
		context.host = context.request.url.host
		for(let review of reviews) {
			review.user = await queryUsername(review.user)
			console.log(review.user)
			review.game = await queryGameById(review.game)
			review.links =[
				{
					herf: `https://${context.host}/api/reviews/${review.id}`,
					rel: "review",
					type: "GET"
				}
			]
		}
			// delete review.id
		console.log(reviews)
		context.response.body = JSON.stringify(reviews, null, 2)
	}catch(err) {
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

router.post('/api/reviews', async context =>  {
	context.response.headers.set("Allow", 'GET, POST')
	console.log('POST /api/reviews')
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
						title: 'a problem occurred',
						detail: err.message
					}
				]
			}
		)
	}
})

router.get('/api/reviews/:id', async context => {
	context.response.headers.set('Allow', 'GET, PUT, DELETE')
	console.log('GET /api/reviews/:id')
	try {
		const review = await queryReviewById(context.params.id)
		context.host = context.request.url.host
		review.user = await queryUsername(review.user)
		review.links =[
			{
				herf: `https://${context.host}/api/reviews/${review.id}`,
				rel: "review",
				type: "GET"
			}
		]
		context.response.body = JSON.stringify(review, null, 2)
	}catch(err) {
		if(err.message === `review "${context.params.id}" not found`){
			context.response.status = 404
			context.response.body = JSON.stringify(
				{
					errors: [
						{
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
