
/* routes.js */

import { Router } from 'https://deno.land/x/oak@v6.5.1/mod.ts'
import { moment } from "https://deno.land/x/deno_moment/mod.ts";

import { extractCredentials, saveFile, createJWT } from './modules/util.js'
import { login, rolesCheck, queryUsername, queryUserid } from './modules/users.js'
import { queryallGames, queryGameById, insertGame } from './modules/games.js'
import { queryallComments, queryCommentById, insertComment } from './modules/comments.js'

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
				name: 'comments',
				desc: 'a list of comments',
				href: `https://${context.host}/api/comments`,
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
		games.forEach(game => {
			game.user = queryUsername(game.user)
			game.links =[
				{
					herf: `https://${context.host}/api/games/${game.id}`,
					rel: "game",
					type: "GET"
				}
			]
			// delete game.id
		})
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

router.get('/api/comments', async context => {
	context.response.headers.set('Allow', 'GET, POST')
	console.log('GET /api/comments')
	try {
		const comments = await queryallComments()
		context.host = context.request.url.host
		comments.forEach(comment => {
			comment.user = queryUsername(comment.user)
			comment.game = queryGameById(comment.game)
			comment.links =[
				{
					herf: `https://${context.host}/api/comments/${comment.id}`,
					rel: "comment",
					type: "GET"
				}
			]
			// delete comment.id
		})
		context.response.body = JSON.stringify(comments, null, 2)
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

router.post('/api/comments', async context =>  {
	context.response.headers.set("Allow", 'GET, POST')
	console.log('POST /api/comments')
	try {
		const body = await context.request.body()
		const data = await body.value
		const userid = await queryUserid(data.username)
		const params = {content: data.content, date: moment().format('YYYY-MM-DD'), score: data.scoer, country: data.country, region: data.region,
						user: userid, game: data.game }
		await insertComment(params)
		context.response.status = 201
		context.response.body = JSON.stringify(
			{
				data: {
					message: 'comment added'
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

router.get('/api/comments/:id', async context => {
	context.response.headers.set('Allow', 'GET, PUT, DELETE')
	console.log('GET /api/comments/:id')
	try {
		const comment = await queryCommentById(context.params.id)
		context.host = context.request.url.host
		comment.user = queryUsername(comment.user)
		comment.game = queryGameById(comment.game)
		comment.links =[
			{
				herf: `https://${context.host}/api/comments/${comment.id}`,
				rel: "game",
				type: "GET"
			}
		]
		context.response.body = JSON.stringify(comment, null, 2)
	}catch(err) {
		if(err.message === `comment "${context.params.id}" not found`){
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
