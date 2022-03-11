/* index.js */

import { Application, send, Status } from "https://deno.land/x/oak@v6.5.1/mod.ts";
// status codes https://deno.land/std@0.82.0/http/http_status.ts
// import { Md5 } from 'https://deno.land/std@0.89.0/hash/md5.ts'
import { extractCredentials, getEtag, setHeaders, verifyJWT } from "./api/modules/util.js";
import { login, rolesCheck } from "./api/modules/users.js";

import router from "./api/routes.js";

const port = 8080;

const app = new Application();

/*
 * this middleware performs a series of checks on all API calls and sends the correct response
 * if a problem has been detected
 */
app.use(async (context, next) => {
	console.log('middleware running')
	// if the call is to the API it must include the correct Content-Type
	if(context.request.url.pathname.includes("/api/") && !(context.request.url.pathname.includes("/api/users") && context.request.method === 'POST')) {
		console.log('API CALL')
		console.log(context.request.headers.get('Content-Type'))
		context.response.headers.set('Content-Type', 'application/json')
		if(context.request.headers.get('Content-Type') !== 'application/json') {
			console.log('wrong Content-Type')
			context.response.status = 415
			context.response.body = JSON.stringify(
				{
					errors: [
						{
							title: '415 Unsupported Media Type',
							detail: 'This API supports the JSON:API specification, Content-Type must be application/json'
						}
					]
				}
				, null, 2)
			return
		}
		console.log(context.request.url.pathname)
		// unless the API call is to register an account, the auth data must match an account
		if(context.request.url.pathname.includes('/users')) {
			console.log('a call to /login or /logout')
			// if the authorization header is missing
			if(context.request.headers.get('authorization') === null) {
				console.log('missing authorization header')
				context.response.status = 401
				context.response.body = JSON.stringify(
					{
						errors: [
							{
								title: '401 Unauthorized',
								detail: 'the API uses HTTP Basic Auth and requires a correctly-formatted authorization header'
							}
						]
					}
				, null, 2)
				return
			}
			const token = context.request.headers.get('authorization')
			console.log(`auth: ${token}`)
			try {
				const credentials = extractCredentials(token)
				await login(credentials)
			} catch(err) {
				console.log('ERROR')
				console.log(err)
				console.log(`msg: ${err.message}`)
				context.response.status = 401
				context.response.body = JSON.stringify(
					{
						errors: [
							{
								title: '401 Unauthorized!',
								detail: err.message
							}
						]
					}
				, null, 2)
				return
			}
		} else if (context.request.url.pathname.includes('/games') || context.request.url.pathname.includes('/comments')) {
			// call to /api/game
			if(context.request.headers.get('authorization') === null) {
				console.log('missing authorization header')
				context.response.status = 401
				context.response.body = JSON.stringify(
					{
						errors: [
							{
								title: '401 Unauthorized',
								detail: 'the API uses HTTP Basic Auth and requires a correctly-formatted authorization header'
							}
						]
					}
				, null, 2)
				return
			}
			// role-based access control and Authentication uses JWT, 
			const token = context.request.headers.get('authorization')
			try {
				const auth = await verifyJWT(token)
				if(!auth){
					console.log('authorization error')
					context.response.status = 403
					context.response.body = JSON.stringify(
						{
							errors: [
								{
									title: '403 Forbidden',
									detail: 'User Role Forbidden'
								}
							]
						}
					, null, 2)
					return
				}
			}catch(err) {
				context.response.status = 401
				context.response.body = JSON.stringify(
					{
						errors: [
							{
								title: '401 Unauthorized',
								detail: err.message
							}
						]
					}
				, null, 2)
				return
			}
			// data validated using schemas
			try {
				const schemas = JSON.stringify(context.request.body())
			} catch(err) {
				console.log('invalid JSON')
			}
		} else {
			context.response.status = 400
				context.response.body = JSON.stringify(
					{
						errors: [
							{
								title: '400 Unsupported router',
								detail: 'Unsupported router'
							}
						]
					}
				, null, 2)
				return
		}
	}
	console.log('MIDDLEWARE ENDS')
  	await next();
});

// checks if file exists
async function fileExists(path) {
  try {
    const stats = await Deno.lstat(path);
    return stats && stats.isFile;
  } catch (e) {
    if (e && e instanceof Deno.errors.NotFound) {
      return false;
    } else {
      throw e;
    }
  }
}

async function staticFiles(context, next) {
	const path = `${Deno.cwd()}/spa/${context.request.url.pathname}`
	const isFile = await fileExists(path)
	if (isFile) {
		// file exists therefore we can serve it
		console.log(path)
		const etag = await getEtag(path)
		console.log(`etag: ${etag}`)
		context.response.headers.set('ETag', etag)
		await send(context, context.request.url.pathname, {
			root: `${Deno.cwd()}/spa`,
		})
	} else {
		await next()
	}
}

async function errorHandler(context, next) {
  try {
    const method = context.request.method;
    const path = context.request.url.pathname;
    console.log(`${method} ${path}`);
    await next();
  } catch (err) {
    console.log(err);
    context.response.status = Status.InternalServerError;
    const msg = { err: err.message };
    context.response.body = JSON.stringify(msg, null, 2);
  }
}

app.use(staticFiles);
app.use(router.routes());
app.use(router.allowedMethods());
// CORS headers
app.use(setHeaders);
app.use(errorHandler);

app.addEventListener(
  "listen",
  ({ port }) => console.log(`listening on port: ${port}`),
);
console.log(Deno.cwd())
await app.listen({ port });
