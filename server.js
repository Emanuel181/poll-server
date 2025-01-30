const express = require('express');
const { Server } = require('socket.io');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize Firebase
const serviceAccount = require('firebase-key.json'); // From Firebase Console
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const app = express();
app.use(cors());
const server = app.listen(3000, () => console.log('Server running on 3000'));
const io = new Server(server, { cors: { origin: '*' } });

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create new poll
  socket.on('create-poll', async (poll) => {
    const pollRef = await db.collection('polls').add(poll);
    const newPoll = { id: pollRef.id, ...poll };
    io.emit('new-poll', newPoll); // Broadcast to all users
  });

  // Handle votes
  socket.on('vote', async ({ pollId, option }) => {
    const pollRef = db.collection('polls').doc(pollId);
    await pollRef.update({ [option]: admin.firestore.FieldValue.increment(1) });
    const updatedPoll = (await pollRef.get()).data();
    io.emit('update-poll', { id: pollId, ...updatedPoll }); // Broadcast updated poll
  });

  socket.on('disconnect', () => console.log('User disconnected'));
});