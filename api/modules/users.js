
/* accounts.js */

import { compare, genSalt, hash } from 'https://deno.land/x/bcrypt@v0.2.4/mod.ts'
import { db } from './db.js'

const saltRounds = 10
const salt = await genSalt(saltRounds)

export async function login(credentials) {
	const { user, pass } = credentials
	console.log('salt password')
	let p = await hash('p455w0rd', salt)
	console.log(p)
	let sql = `SELECT count(id) AS count FROM users WHERE username="${user}";`
	let records = await db.query(sql)
	if(!records[0].count) throw new Error(`username "${user}" not found`)
	sql = `SELECT password FROM users WHERE username = "${user}";`
	records = await db.query(sql)
	const valid = await compare(pass, records[0].password)
	if(valid === false) throw new Error(`invalid password for user "${user}"`)
	return user
}

export async function register(credentials) {
	credentials.pass = await hash(credentials.pass, salt)
	const sql = `INSERT INTO users(username, password) VALUES("${credentials.user}", "${credentials.pass}")`
	console.log(sql)
	await db.query(sql)
	return true
}
