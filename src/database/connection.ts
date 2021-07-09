import mongoose from 'mongoose'
import log from '../logs'

const dbUri = process.env.MONGO_URI as string

const connection = () => mongoose.connect(dbUri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false
}).then(() => {
  log.info("Database connected")
}).catch(err => {
  log.error("Database error", err.message)
  process.exit(1)
})

export default connection