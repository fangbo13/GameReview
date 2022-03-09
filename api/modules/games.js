import { compare, genSalt, hash } from 'https://deno.land/x/bcrypt@v0.2.4/mod.ts'
import { db } from './db.js'

export async function queryall() {
	let sql = `SELECT * FROM games;`
	let records = await db.query(sql)
	return records
}

export async function query(id) {
	let sql = `SELECT count(id) AS count FROM games WHERE id="${id}";`
	let records = await db.query(sql)
	if(!records[0].count) throw new Error(`game "${id}" not found`)
	sql = `SELECT * FROM games WHERE id = "${id}";`
	records = await db.query(sql)
	return records[0]
}

export async function insert(params) {
	const sql = `INSERT INTO games(name, publisher, year, add_date, description, cover, user) VALUES(
		"${params.name}", "${params.publisher}", "${params.year}", "${params.add_date}", "${params.description}",
		"${params.cover}", "${params.user}")`
	await db.query(sql)
}