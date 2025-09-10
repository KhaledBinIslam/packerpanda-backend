

const express = require('express');
const cors = require('cors');
// const { ObjectId } = require('mongodb');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aqbtto6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const ordersCollection = client.db("courierDB").collection("orders");
    const usersCollection = client.db("courierDB").collection("users");

    // Create order
    app.post('/orders', async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      res.send(result);
    });

    // Get all orders
    app.get('/orders', async (req, res) => {
      const result = await ordersCollection.find().toArray();
      res.send(result);
    });


    app.get('/orders/:id', async (req, res) => {
      const orderId = req.params.id;

      try {
        const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
        if (!order) {
          return res.status(404).send({ message: 'Order not found' });
        }
        res.send(order);
      } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).send({ message: 'Failed to fetch order' });
      }
    });


    app.put('/orders/:id', async (req, res) => {
      const orderId = req.params.id;
      const updatedOrder = req.body;

      try {
        const result = await ordersCollection.updateOne(
          { _id: new ObjectId(orderId) },
          { $set: updatedOrder }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Order not found' });
        }

        res.send({ message: 'Order updated successfully', result });
      } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).send({ message: 'Failed to update order' });
      }
    });

    // Bulk update orders from Excel data
    // app.post('/orders/bulk-update', async (req, res) => {
    //   const updates = req.body;

    //   try {
    //     const bulkOps = updates.map(update => ({
    //       updateOne: {
    //         filter: { orderId: update.orderId },
    //         update: {
    //           $set: {
    //             awbNumber: update.awbNumber,
    //             status: update.status
    //           }
    //         }
    //       }
    //     }));

    //     const result = await ordersCollection.bulkWrite(bulkOps);
    //     res.send({ message: 'Bulk update successful', result });
    //   } catch (error) {
    //     console.error('Bulk update error:', error);
    //     res.status(500).send({ error: 'Bulk update failed' });
    //   }
    // });
    app.post('/orders/bulk-update', async (req, res) => {
      const updates = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: 'No updates provided.' });
      }

      try {
        const bulkOps = updates.map(update => ({
          updateOne: {
            filter: { orderId: update.orderId },
            update: {
              $set: {
                awbNumber: update.awbNumber,
                status: update.status || 'Delivered'
              }
            }
          }
        }));

        const result = await ordersCollection.bulkWrite(bulkOps);
        res.status(200).json({ success: true, result });
      } catch (error) {
        console.error('Bulk update failed:', error);
        res.status(500).json({ error: 'Bulk update failed' });
      }
    });


    // Delete appointment by id
    // app.delete('/appointments/:id', async (req, res) => {
    //   const id = req.params.id;
    //   try {
    //     const result = await appointmentsCollection.deleteOne({ _id: new ObjectId(id) });
    //     if (result.deletedCount === 1) {
    //       res.send({ success: true });
    //     } else {
    //       res.status(404).send({ success: false, message: 'Appointment not found.' });
    //     }
    //   } catch (error) {
    //     res.status(500).send({ error: error.message });
    //   }
    // });

    // Update appointment status by id (PATCH)
    // app.patch('/appointments/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const { status } = req.body;

    //   if (!status) {
    //     return res.status(400).send({ error: 'Status field is required' });
    //   }

    //   try {
    //     const result = await appointmentsCollection.updateOne(
    //       { _id: new ObjectId(id) },
    //       { $set: { status: status } }
    //     );

    //     if (result.modifiedCount > 0) {
    //       res.send({ success: true });
    //     } else {
    //       res.status(404).send({ success: false, message: 'No change made or appointment not found.' });
    //     }
    //   } catch (error) {
    //     res.status(500).send({ error: error.message });
    //   }
    // });





    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });


    app.post('/users', async (req, res) => {
      try {
        const newUser = req.body;
        const result = await usersCollection.insertOne(newUser);
        res.send({ ...newUser, _id: result.insertedId });
      } catch (err) {
        res.status(500).send({ error: 'Failed to create user' });
      }
    });



    app.delete('/users/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: 'Failed to delete user' });
      }
    });


    // Add comment to an order
    app.post('/orders/:id/comment', async (req, res) => {
      const orderId = req.params.id;
      const { comment } = req.body;

      if (!comment || comment.trim() === "") {
        return res.status(400).send({ message: "Comment is required" });
      }

      try {
        const result = await ordersCollection.updateOne(
          { _id: new ObjectId(orderId) },
          {
            $push: {
              comments: { text: comment, createdAt: new Date() }
            }
          }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "Order not found" });
        }

        res.send({ message: "Comment added successfully" });
      } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).send({ message: "Failed to add comment" });
      }
    });

    // Get all comments for a specific order
    app.get('/orders/:id/comments', async (req, res) => {
      const orderId = req.params.id;

      try {
        const order = await ordersCollection.findOne(
          { _id: new ObjectId(orderId) },
          { projection: { comments: 1 } } // শুধু comments ফেরত দেবে
        );

        if (!order) {
          return res.status(404).send({ message: "Order not found" });
        }

        res.send(order.comments || []);
      } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).send({ message: "Failed to fetch comments" });
      }
    });


    app.put('/orders/:id/status', async (req, res) => {
      const orderId = req.params.id;
      const { status } = req.body;

      if (!status) return res.status(400).send({ message: "Status is required" });

      try {
        const result = await ordersCollection.updateOne(
          { _id: new ObjectId(orderId) },
          { $set: { status } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Order not found' });
        }

        res.send({ message: 'Status updated successfully', result });
      } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).send({ message: 'Failed to update status' });
      }
    });



    // Get order summary by customer phone
    // app.get('/orders/summary', async (req, res) => {
    //   const phone = req.query.phone;
    //   if (!phone) return res.status(400).json({ error: 'Phone is required' });

    //   const fullPhone = phone.startsWith('+') ? phone : '+880' + phone;

    //   try {
    //     const userOrders = await ordersCollection.find({ customerPhone: fullPhone }).toArray();
    //     const delivered = userOrders.filter(o => o.status === 'Delivered').length;
    //     const returned = userOrders.filter(o => o.status === 'Returned').length;

    //     res.json({ total: userOrders.length, delivered, returned });
    //   } catch (error) {
    //     console.error('Error fetching order summary:', error);
    //     res.status(500).json({ error: 'Failed to fetch order summary' });
    //   }
    // });

    // app.get('/orders', async (req, res) => {
    //   const { customerPhone } = req.query;
    //   let query = {};
    //   if (customerPhone) {
    //     query.customerPhone = customerPhone;
    //   }
    //   try {
    //     const result = await ordersCollection.find(query).toArray();
    //     res.send(result);
    //   } catch (err) {
    //     res.status(500).send({ error: 'Failed to fetch orders' });
    //   }
    // });







    // Ping to confirm connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // don't close client here, keep server running
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Courier management server is running');
});

app.listen(port, () => {
  console.log(`Courier management server is running on port: ${port}`);
});
