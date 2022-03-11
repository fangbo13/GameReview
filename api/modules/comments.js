import { db } from './db.js'

export async function queryallComments() {
	let sql = `SELECT * FROM comments;`
	let records = await db.query(sql)
	return records
}

export async function queryCommentById(id) {
	let sql = `SELECT count(id) AS count FROM comments WHERE id="${id}";`
	let records = await db.query(sql)
	if(!records[0].count) throw new Error(`commnet "${id}" not found`)
	sql = `SELECT * FROM comments WHERE id = "${id}";`
	records = await db.query(sql)
	return records[0]
}

export async function insertComment(params) {
	const sql = `INSERT INTO comments(content, date, score, country, region, user, game) VALUES(
		"${params.content}", "${params.date}", ${params.score}, "${params.country}", "${params.region}",
		"${params.user}", "${params.game}")`
	await db.query(sql)
}