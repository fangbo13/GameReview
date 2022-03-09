
/* routes.js */

import { Router } from 'https://deno.land/x/oak@v6.5.1/mod.ts'
import { moment } from "https://deno.land/x/deno_moment/mod.ts";

import { extractCredentials, saveFile, createJWT } from './modules/util.js'
import { login, rolesCheck, queryUsername, queryUserid } from './modules/users.js'
import { queryall, query, insert } from './modules/games.js'

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

// router.post('/api/users', async context => {
// 	console.log('POST /api/accounts')
// 	const body  = await context.request.body()
// 	const data = await body.value
// 	console.log(data)
// 	await register(data)
// 	context.response.status = 201
// 	context.response.body = JSON.stringify({ status: 'success', msg: 'account created' })
// })

router.get('/api/games', async context => {
	context.response.headers.set('Allow', 'GET, POST')
	console.log('GET /api/games')
	try {
		const games = await queryall()
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
		const userid = await queryUserid(data.username)
		const params = {name: data.name, publisher: data.publisher, year: data.year, add_date: moment().format('YYYY-MM-DD'),
						description: data.description, cover: data.cover, user: userid }
		await insert(params)
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
		const game = await query(context.params.id)
		context.host = context.request.url.host
		game.user = queryUsername(game.user)
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

router.post('/api/files', async context => {
	console.log('POST /api/files')
	try {
		const token = context.request.headers.get('Authorization')
		console.log(`auth: ${token}`)
		const body  = await context.request.body()
		const data = await body.value
		console.log(data)
		saveFile(data.base64, data.user)
		context.response.status = 201
		context.response.body = JSON.stringify(
			{
				data: {
					message: 'file uploaded'
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

router.get("/(.*)", async context => {      
// 	const data = await Deno.readTextFile('static/404.html')
// 	context.response.body = data
	console.log('GET', '/.(*)')
	const data = await Deno.readTextFile('spa/index.html')
	context.response.body = data
})

export default router
