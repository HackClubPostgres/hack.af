import { PrismaClient } from "@prisma/client"
import express, { Request, Response } from "express"
import isBot from "isbot"
import querystring, { ParsedUrlQuery } from "querystring"

const prisma = new PrismaClient()
const app = express()

const cacheTimeout = process.env.CACHE_EXPIRATION ? parseInt(process.env.CACHE_EXPIRATION) : 600
require("dotenv").config()

app.get("/*", async (req, res) => {
	let slug = req.path.substring(1)
	const query = req.query

	// remove trailing slash
	if (slug.substring(slug.length - 1) == "/") {
		slug = slug.substring(0, slug.length - 1)
	}

	await logAccess(
		getClientIp(req) || "No client IP",
		req.headers["user-agent"] || "No user agent",
		slug,
		req.protocol + "://" + req.get("host") + req.originalUrl,
	)

	lookup(slug).then(
		async (destination) => {
			let resultQuery = combineQueries(
				querystring.parse(new URL(destination).searchParams.toString()),
				query as ParsedUrlQuery,
			)

			const parsedDestination = new URL(destination)
			const url = parsedDestination.origin + parsedDestination.pathname + resultQuery + parsedDestination.hash
			console.log({ url })
			res.redirect(302, url)
			
			// Increment clicks
			await prisma.link.update({
				where: {
					slug: slug,
				},
				data: {
					clicks: {
						increment: 1,
					},
				},
			})
		},
		(error) => {
			if (error == 404) {
				res.redirect(302, "https://goo.gl/" + slug)
			} else {
				res.status(error).end()
			}
		},
	)
})

const cache: Record<string, { dest: string, expires: number }> = {}
const lookup = async (slug: string): Promise<string> => {
	const timeNow = Math.round(new Date().getTime() / 1000)

	if (cache[slug] && timeNow < cache[slug].expires) {
		console.log(`Returning cached response for "${slug}"`)
		return cache[slug].dest
	} else {
		console.log(`No cache found for "${slug}", querying database...`)

		const result = await prisma.link.findUnique({
			where: {
				slug: slug,
			},
		})

		if (result) {
			cache[slug] = {
				dest: result.url,
				expires: timeNow + cacheTimeout,
			}
			return result.url
		} else {
			throw 404
		}
	}
}

const combineQueries = (q1: ParsedUrlQuery, q2: ParsedUrlQuery) => {
	const combinedQuery = { ...q1, ...q2 }
	let combinedQueryString = querystring.stringify(combinedQuery)
	if (combinedQueryString) {
		combinedQueryString = "?" + combinedQueryString
	}
	return combinedQueryString
}

const logAccess = async (ip: string, ua: string, slugRecord: string, url?: string) => {
	if (process.env.LOGGING == "off") return

	// UA strings to identify as bot
	const botUA = ["apex/ping/v1.0"]

	// do not log if the BOT_LOGGING flag is off
	if (process.env.BOT_LOGGING == "off" && (isBot(ua) || botUA.includes(ua))) {
		return
	}

	await prisma.log.create({
		data: {
			timestamp: new Date(),
			clientIP: ip,
			userAgent: ua,
			bot: isBot(ua),
			slug: slugRecord,
			url: url,
		},
	})
}

const getClientIp = (req: Request) => {
	const forwardedIpsStr = req.headers["x-forwarded-for"]
	return forwardedIpsStr ? (forwardedIpsStr as string).split(",")[0] : req.socket.remoteAddress
}

// middleware to force traffic to https
const forceHttps = (
	req: Request,
	res: Response,
	next: () => void,
) => {
	console.log(process.env.NODE_ENV)

	if (
		!req.secure
		&& req.get("x-forwarded-proto") !== "https"
		&& process.env.NODE_ENV !== "development"
	) {
		return res.redirect("https://" + req.get("host") + req.url)
	}
	next()
}

app.use(forceHttps)
app.use(express.json())
app.use(
	express.urlencoded({
		extended: true,
	}),
)

const port = process.env.PORT || 3000
app.listen(port, () => {
	console.log("Hack.af is up and running on port", port)
})