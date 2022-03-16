
/* util.js */

import { Status } from 'https://deno.land/x/oak@v6.5.1/mod.ts'
import { Base64 } from 'https://deno.land/x/bb64@1.1.0/mod.ts'
import { Md5 } from 'https://deno.land/std@0.129.0/hash/md5.ts'
import { create, verify, decode } from "https://deno.land/x/djwt@v2.2/mod.ts"

export const header = { alg: "HS512", typ: "JWT" }
export const signature  = "secret"

export function setHeaders(context, next) {
	console.log('setHeaders')
	context.response.headers.set('Content-Type', 'application/vnd.api+json')
	context.response.headers.set('charset', 'utf-8')
	context.response.headers.set('Access-Control-Allow-Origin', '*')
	context.response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
	context.response.headers.set('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
	context.response.headers.set('Access-Control-Allow-Credentials', true)
	next()
}

export function extractCredentials(token) {
	console.log('checkAuth')
	if(token === undefined) throw new Error('no auth header')
	const [type, hash] = token.split(' ')
	if(type !== 'Basic') throw new Error('wrong auth type')
	const str = atob(hash)
	if(str.indexOf(':') === -1) throw new Error('invalid auth format')
	const [username, password] = str.split(':')
	return { username, password }
}

// https://github.com/thecodeholic/deno-serve-static-files/blob/final-version/oak/staticFileMiddleware.ts
export async function staticFiles(context, next) {
	const path = `${Deno.cwd()}/static${context.request.url.pathname}`
  const isFile = await fileExists(path)
  if (isFile) {
		// file exists therefore we can serve it
    await context.send(context, context.request.url.pathname, {
      root: `${Deno.cwd()}/static`
    })
  } else {
    await next()
  }
}

export async function errorHandler(context, next) {
	try {
		const method = context.request.method
		const path = context.request.url.pathname
		console.log(`${method} ${path}`)
    await next()
  } catch (err) {
		console.log(err)
		context.response.status = Status.InternalServerError
		const msg = { err: err.message }
		context.response.body = JSON.stringify(msg, null, 2)
  }
}

// checks if file exists
export async function fileExists(path) {
  try {
    const stats = await Deno.lstat(path)
    return stats && stats.isFile
  } catch(e) {
    if (e && e instanceof Deno.errors.NotFound) {
      return false
    } else {
      throw e
    }
  }
}

export function saveFile(base64String, filename) {
	console.log('save file')
	const [ metadata, base64Image ] = base64String.split(';base64,')
	console.log(metadata)
	const extension = metadata.split('/').pop()
	const name = `${filename}.${extension}`
	console.log(name)
	Base64.fromBase64String(base64Image).toFile(`./spa/uploads/cover/${name}`)
	console.log('file saved')
	return name
}

export async function getEtag(path) {
	const stat = await Deno.stat(path)
	const mtime = stat.mtime
	const timestamp = Date.parse(mtime)
	const size = stat.size
	const uid = (`${path}:${timestamp}:${size}`)
	const md5 = new Md5()
	const etag = md5.update(uid).toString()
	return etag
}

export async function createJWT(payload) {
	const jwt = await create(header, payload, signature)
	return jwt
}

export async function verifyJWT(jwt) {
	try {
		const str = await verify(jwt, signature, header.alg)
		console.log(str)
		if(str.role.name === 'user') {
			return true;
		} else {
			return false;
		}
	} catch(e) {
		throw e
		return false
    }
}


