import React from 'react';

import { useParticipant, useRoom } from '@livekit/react-core';
import type { LocalParticipant, Room } from 'livekit-client';
import ReactPlayer from 'react-player';

interface StreamerVideoProps {
  myinfo: LocalParticipant | undefined;
  room: Room | undefined;
}

export function StreamerVideo({ myinfo, room }: StreamerVideoProps) {
  const { cameraPublication, microphonePublication, isLocal } = useParticipant(myinfo!);
  const micRef = React.useRef<HTMLAudioElement>(null);
  const [isAudioEnabled, setIsAudioEnabled] = React.useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = React.useState(true);

  React.useEffect(() => {
    if (micRef.current) {
      if (!microphonePublication?.isMuted && microphonePublication?.audioTrack) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(microphonePublication.audioTrack.mediaStreamTrack);
        micRef.current.srcObject = mediaStream;
        micRef.current.play().catch((error) => console.error('videoElem.current.play() failed', error));
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [microphonePublication?.audioTrack, microphonePublication?.isMuted]);

  const webcamMediaStream = React.useMemo(() => {
    if (!cameraPublication?.isMuted && cameraPublication?.videoTrack) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(cameraPublication.videoTrack?.mediaStreamTrack!);
      return mediaStream;
    }
  }, [cameraPublication?.videoTrack, cameraPublication?.isMuted]);

  const toggleAudio = async () => {
    if (!room) return;
    const enabled = room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(!enabled);
    setIsAudioEnabled(!enabled);
  };

  const toggleVideo = async () => {
    if (!room) return;
    const enabled = room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(!enabled);
    setIsVideoEnabled(!enabled);
  };

  const leaveRoom = async () => {
    if (!room) return;
    await Promise.all([
      room.localParticipant.setCameraEnabled(false),
      room.localParticipant.setMicrophoneEnabled(false),
    ]);
    room.disconnect();
  };

  return (
    <>
      <div className={`h-full w-full  bg-gray-700 overflow-hidden rounded-lg`}>
        <audio ref={micRef} autoPlay muted={isLocal} />
        {!cameraPublication?.isMuted ? (
          <ReactPlayer
            //
            playsinline // very very imp prop
            playIcon={<></>}
            //
            pip={false}
            light={false}
            controls={false}
            muted={true}
            playing={true}
            //
            url={webcamMediaStream}
            style={{ transform: 'rotateY(180deg)' }}
            //
            height={'100%'}
            width={'100%'}
            // style={flipStyle}
            onError={(err) => {
              console.log(err, 'participant video error');
            }}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <div
              className={`z-10 flex items-center justify-center rounded-full bg-gray-800 2xl:h-[92px] h-[52px] 2xl:w-[92px] w-[52px]`}
            >
              <p className="text-2xl text-white">{String(myinfo?.identity).charAt(0).toUpperCase()}</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex space-x-2">
        <button className="p-1 border border-gray-500/50" onClick={toggleAudio}>
          {isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
        </button>
        <button className="p-1 border border-gray-500/50" onClick={toggleVideo}>
          {isVideoEnabled ? 'Mute Video' : 'Unmute Video'}
        </button>
        <button className="p-1 border border-gray-500/50" onClick={leaveRoom}>
          End Stream
        </button>
      </div>
    </>
  );
}
