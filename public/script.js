const socket = io('/');
const videogrid = document.getElementById('video-grid');
const peers = {};
const newPeer = new Peer(undefined, {
    host: '/',
    port: ''
});
const myVideo = document.createElement('video');
myVideo.muted = true;

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideo(myVideo, stream);
    
    // Handle incoming calls
    newPeer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            addVideo(video, userVideoStream);
        });
    });

    // Handle user connection
    socket.on('user-connected', userId => {
        console.log('User connected:', userId);
        startCallWithNewUser(userId, stream);
    });

    // Handle user disconnection
    socket.on('user-disconnected', userId => {
        if (peers[userId]) peers[userId].close();
        console.log('User disconnected:', userId);
    });
}).catch(error => {
    console.error('Error accessing media devices.', error);
});

newPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
});

function addVideo(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videogrid.append(video);
}

function startCallWithNewUser(userId, stream) {
    const call = newPeer.call(userId, stream);
    const video = document.createElement('video');

    call.on('stream', userVideoStream => {
        addVideo(video, userVideoStream);
    });

    call.on('close', () => {
        video.remove();
    });

    peers[userId] = call;
}
