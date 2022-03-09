
/* accounts.js */

import { compare, genSalt, hash } from 'https://deno.land/x/bcrypt@v0.2.4/mod.ts'
import { db } from './db.js'

const saltRounds = 10
const salt = await genSalt(saltRounds)

export async function login(credentials) {
	const { username, password } = credentials
	let sql = `SELECT count(id) AS count FROM users WHERE username="${username}";`
	let records = await db.query(sql)
	if(!records[0].count) throw new Error(`username "${username}" not found`)
	sql = `SELECT password FROM users WHERE username = "${username}";`
	records = await db.query(sql)
	const valid = await compare(password, records[0].password)
	if(valid === false) throw new Error(`invalid password for user "${username}"`)
	return username
}

export async function rolesCheck(username) {
	let sql = `SELECT count(id) AS count FROM users WHERE username="${username}";`
	let records = await db.query(sql)
	if(!records[0].count) throw new Error(`username "${username}" not found`)
	sql = `select count(id) as count from roles where id=(select role_id from users where username ="${username}");`
	records = await db.query(sql)
	if(!records[0].count) throw new Error(`role for username "${username}" not found`)
	sql = `select name from roles where id=(select role_id from users where username ="${username}");`
	records = await db.query(sql)
	return records[0]
}

export async function register(credentials) {
	credentials.pass = await hash(credentials.pass, salt)
	const sql = `INSERT INTO users(username, password) VALUES("${credentials.user}", "${credentials.pass}")`
	console.log(sql)
	await db.query(sql)
	return true
}

export async function queryUsername(id) {
	let sql = `SELECT count(username) AS count FROM users WHERE id="${id}";`
	let records = await db.query(sql)
	if(!records[0].count) throw new Error(`user_id "${id}" not found`)
	sql = `SELECT username FROM users WHERE id = "${id}";`
	records = await db.query(sql)
	return records[0].username
}

export async function queryUserid(username) {
	let sql = `SELECT count(id) AS count FROM users WHERE username="${username}";`
	let records = await db.query(sql)
	if(!records[0].count) throw new Error(`username "${username}" not found`)
	sql = `SELECT id FROM users WHERE username = "${username}";`
	records = await db.query(sql)
	return records[0].id
}
