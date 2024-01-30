import React, { useEffect, useCallback, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import peer from "../service/peer";
import ReactPlayer from 'react-player';

const RoomPage = () => {
    const socket = useSocket();
    const [remoteSockedId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);     
    const [remoteStream, setRemoteStream] = useState(null);

    const handleUserJoined = useCallback(({ email, id }) => {
        console.log(`Email ${email} joined room`);
        setRemoteSocketId(id);
    }, []);

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });

        const offer = await peer.getOffer();
        socket.emit("user:call", { to: remoteSockedId, offer });        
        setMyStream(stream);
    }, [setMyStream, remoteSockedId, socket]);  

    const handleIncommingCall = useCallback(async ({ from, offer }) => {
        console.log(`Incoming Call`, from, offer);
        setRemoteSocketId(from);
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
        setMyStream(stream);

        const ans = await peer.getAnswer(offer);
        socket.emit("call:accepted", { to: from, ans });
    }, [socket]);

    const sendStreams = useCallback(() => {
        for(const track of myStream.getTracks()){
            peer.peer.addTrack(track, myStream);
        }
    }, [myStream]);

    const handleCallAccepted = useCallback(({ from, ans }) => {
        peer.setLocalDescription(ans);
        console.log('Call Accepted!');
        sendStreams();
    }, [sendStreams]);

    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit("peer:nego:needed", { offer, to: remoteSockedId });
    }, [remoteSockedId, socket]);

    const handleNegoNeedIncoming = useCallback(async ({from, offer}) => {
        const ans = await peer.getAnswer(offer);
        socket.emit("peer:nego:done", { to: from, ans });
    }, [socket]);

    const handleNegoNeedFinal = useCallback(async ({ ans }) => {
        await peer.setLocalDescription(ans);
    }, []);

    useEffect(() => {
        peer.peer.addEventListener('negotiationneeded', handleNegoNeeded);
        return () => {
            peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded);
        }
    }, [handleNegoNeeded]);

    useEffect(() => {
        peer.peer.addEventListener('track', async ev => {
            const remoteStream = ev.streams;
            console.log("Got Tracks!");
            setRemoteStream(remoteStream[0]);
        });
    }, [remoteStream]);

    useEffect(() => {
        socket.on("user:joined", handleUserJoined);
        socket.on("incomming:call", handleIncommingCall);
        socket.on("call:accepted", handleCallAccepted);
        socket.on("peer:nego:needed", handleNegoNeedIncoming);
        socket.on("peer:nego:final", handleNegoNeedFinal);

        return () => {
            // console.log(handleIncommingCall);
            socket.off("user:joined", handleUserJoined);
            socket.off("incomming:call", handleIncommingCall);
            socket.off("call:accepted", handleCallAccepted);
            socket.off("peer:nego:needed", handleNegoNeedIncoming);
            socket.off("peer:nego:final", handleNegoNeedFinal);
        }
    }, [socket, 
        handleUserJoined, 
        handleIncommingCall, 
        handleCallAccepted, 
        handleNegoNeedIncoming, 
        handleNegoNeedFinal]);

    return (
        <div>
            <h1>Room Page</h1>
            <h4>{remoteSockedId ? 'Connected' : 'No One in Room'}</h4>
            {myStream && <button onClick={sendStreams}>Start Stream</button>}
            {remoteSockedId && <button onClick={handleCallUser}>CALL</button>}
            {myStream && (
                <>
                    <h1>My Stream</h1>
                    <ReactPlayer playing muted 
                    height="200px" 
                    controls url={myStream} />
                </>
            )}
            {remoteStream && (
                <>
                    <h1>Remote Stream</h1>
                    <ReactPlayer playing muted 
                    height="200px" 
                    controls url={remoteStream} />
                </>
            )}
        </div>
    )
}

export default RoomPage;
