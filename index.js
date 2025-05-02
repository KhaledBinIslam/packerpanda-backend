const express = require('express');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000
const app = express();

app.use(express.json())
app.use(cors())



// TaskoMaster
// 8nzLuh6MnX9JxwOu



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aqbtto6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(process.env.DB_USER)
console.log(process.env.DB_PASS)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const taskCollection = client.db("taskoDB").collection("tasks");


    app.post('/tasks', async (req, res) => {
      const task = req.body
      const result = await taskCollection.insertOne(task)
      res.send(result)
    })
    app.get('/tasks', async (req, res) => {
      const result = await taskCollection.find().toArray()
      res.send(result)
    })

    app.get('/tasks', async (req, res) => {

      console.log(req.query.email)
     
      let query = {};
      if (req.query?.email) {
        query = { email:req.query.email}
      }
      const result = await taskCollection.find(query).toArray()
      res.send(result);
    })
   



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('tasko server is running')
})



app.listen(port, () => {
  console.log(`tasko server is running on port : ${port}`)
})