import React from 'react';

import { useParticipant } from '@livekit/react-core';
import type { Participant, Room } from 'livekit-client';
import ReactPlayer from 'react-player';

interface StreamerVideoProps {
  streamerinfo: Participant | undefined;
  room: Room | undefined;
}

export function ViewerVideo({ streamerinfo, room }: StreamerVideoProps) {
  const { cameraPublication, microphonePublication } = useParticipant(streamerinfo!);
  const didMountRef = React.useRef(false);

  React.useEffect(
    () => () => {
      if (didMountRef.current) {
        if (room) {
          room.disconnect();
        }
      }
      didMountRef.current = true;
    },
    []
  );

  const webcamMediaStream = React.useMemo(() => {
    if (!cameraPublication?.isMuted && cameraPublication?.videoTrack) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(cameraPublication.videoTrack?.mediaStreamTrack!);
      if (!microphonePublication?.isMuted && microphonePublication?.audioTrack) {
        mediaStream.addTrack(microphonePublication.audioTrack?.mediaStreamTrack!);
      }
      return mediaStream;
    }
  }, [
    cameraPublication?.videoTrack,
    cameraPublication?.isMuted,
    microphonePublication?.audioTrack,
    microphonePublication?.isMuted,
  ]);

  return (
    <>
      <div className="relative w-full h-full bg-gray-700 rounded-lg">
        {!cameraPublication?.isMuted ? (
          <ReactPlayer
            //
            className="absolute top-0 left-0 object-cover"
            playsinline // very very imp prop
            playIcon={<></>}
            //
            pip={false}
            light={false}
            controls={true}
            muted={true}
            playing={true}
            //
            url={webcamMediaStream}
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
              className={`z-10 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gray-800 2xl:h-[92px] 2xl:w-[92px]`}
            >
              <p className="text-2xl text-white">{String(streamerinfo?.identity).charAt(0).toUpperCase()}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
