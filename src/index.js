const path=require('path')
const http=require('http')
const express=require('express')
const socketio=require('socket.io')
const {generateMessage,generateLocationMessage}=require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')

//const Filter = require('bad-words')

const app=express()
const server=http.createServer(app)
const io=socketio(server)

const port=process.env.PORT || 3000
const filePath=path.join(__dirname,'../public')

app.use(express.static(filePath))

io.on('connection',(socket)=>{
    console.log('New WebSocket connection')

    socket.on('join',(options,callback)=>{
        const {error,user}=addUser({id:socket.id,...options})
        if(error){callback(error)}
        socket.join(user.room)
        socket.emit('message', generateMessage('Welcome!','Admin'))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`,'Admin'))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('message',(message,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('message',generateMessage(message,user.username))
        callback()
    })

    socket.on('sendLocation',(position,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(`https://google.com/maps?q=${position.latitude},${position.longitude}`,user.username))
        callback()
    })

    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user){
        io.to(user.room).emit('message',generateMessage(`${user.username} has left`,'Admin'))
        }
    })
})

server.listen(port,()=>{
    console.log(`Sever is up on port ${port}!`)
})
