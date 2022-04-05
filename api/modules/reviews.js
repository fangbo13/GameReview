import { db } from './db.js'

export async function queryallReviews(game) {
	let sql = `SELECT count(id) AS count FROM games WHERE id="${game}";`
	let records = await db.query(sql)
	if(!records[0].count) throw new Error(`game "${game}" not found`)
	sql = `SELECT * FROM reviews where game="${game}";`
	records = await db.query(sql)
	return records
}

export async function queryReviewById(id) {
	let sql = `SELECT count(id) AS count FROM reviews WHERE id="${id}";`
	let records = await db.query(sql)
	if(!records[0].count) throw new Error(`review "${id}" not found`)
	sql = `SELECT * FROM reviews WHERE id = "${id}";`
	records = await db.query(sql)
	return records[0]
}

export async function insertReview(params) {
	const sql = `INSERT INTO reviews(content, date, score, country, region, user, game) VALUES(
		"${params.content}", "${params.date}", ${params.score}, "${params.country}", "${params.region}",
		"${params.user}", "${params.game}")`
	await db.query(sql)
}