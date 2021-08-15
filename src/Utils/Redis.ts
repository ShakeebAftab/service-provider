import { createClient } from 'redis'
export const redisClient = createClient()

export const SetRedisValue = (key: string, ttl: number, value: string) => redisClient.setex(key, ttl, value)

export const GetRedisValue = (key: string): Promise<string | null> => new Promise((res, rej) => {
  redisClient.get(`${key}`, async (err, data) => {
    if (err) rej(err)
      res(data)
  })
})

export const DelRedisKey = (key: string) => redisClient.DEL(key)