import { config } from 'dotenv'
config()

import 'reflect-metadata'

import express from 'express'
import session from 'express-session'
import connectRedis from 'connect-redis'
import cors from 'cors'
import { ApolloServer } from 'apollo-server-express'
import { createConnection } from 'typeorm'
import { buildSchema } from 'type-graphql'
import { User, Address } from './Entities/Entitties'
import { UserQueryResolver, UserMutationResolver, AddressQueryResolver, AddressMutationResolver } from './Resolvers/Resolvers'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import { redisClient } from './Utils/Redis'

const PORT = process.env.PORT
const redisSecret = process.env.REDISSECRET
const __prod__ = process.env.PRODUCTION === `prod` ? true : false

const runServer = async () => {

  try {

    await createConnection({
        type: 'postgres',
        database: 'service-provider',
        username: process.env.DBUSERNAME,
        password: process.env.DBPASSWORD,
        logging: true,
        synchronize: true,
        entities: [User, Address]
    })

    const schema = await buildSchema({
      resolvers: [UserQueryResolver, UserMutationResolver, AddressQueryResolver, AddressMutationResolver],
      validate: false
    })

    const redisStore = connectRedis(session)

    const app = express()

    app.use(cors())

    app.use(
      session({
        store: new redisStore({ client: redisClient, disableTouch: true, disableTTL: true }),
        saveUninitialized: false,
        secret: redisSecret,
        resave: false,
        name: `qid`,
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 Years
          httpOnly: true,
          secure: __prod__,
          sameSite: 'lax'
        }
      }),
    )

    const apolloServer = new ApolloServer({ schema, context: ({ req, res }) => ({ req, res, redisClient }), plugins: [
      ApolloServerPluginLandingPageGraphQLPlayground
    ] })
    await apolloServer.start()

    apolloServer.applyMiddleware({ app })

    app.listen(PORT, () => {
      console.log(`Server Link: http://localhost:${PORT}`)
      console.log(`Playground Link: http://localhost:${PORT}/graphql`)
    })

  } catch (err) {
    console.log(err.message)
  }

}

runServer()