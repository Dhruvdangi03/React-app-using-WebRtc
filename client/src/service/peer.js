class PeerService{
    constructor(){
        if(!this.peer){
            this.peer = new RTCPeerConnection({
                iceServers: [{
                    urls: [
                        'stun:stun.l.google.com:19302',
                        'stun:global.stun.twilio.com:3478',
                    ],
                }]
            })
        }
    }

    async getAnswer(offer){
        if(this.peer){
            await this.peer.setRemoteDescription(offer);
            const ans = await this.peer.createAnswer();
            await this.peer.setLocalDescription(new RTCSessionDescription(ans));

            return ans;
        }
    }

    async setLocalDescription(ans){
        if(this.peer){
            await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
        }
    }

    async getOffer(){
        if(this.peer){
            const offer = await this.peer.createOffer();
            await this.peer.setLocalDescription(new RTCSessionDescription(offer));
            return offer;
        }
    }
}

// export default new PeerService();
const peerServiceInstance = new PeerService();
export default peerServiceInstance;

// class PeerService {
//     constructor() {
//         this.peer = new RTCPeerConnection({
//             iceServers: [{
//                 urls: [
//                     'stun:stun.l.google.com:19302',
//                     'stun:global.stun.twilio.com:3478',
//                 ],
//             }]
//         });
//     }

//     async getOffer() {
//         try {
//             if (this.peer) {
//                 const offer = await this.peer.createOffer();
//                 await this.peer.setLocalDescription(new RTCSessionDescription(offer));
//                 return offer;
//             }
//         } catch (error) {
//             console.error('Error generating offer:', error);
//             throw error;
//         }
//     }
// }

// export default new PeerService();
