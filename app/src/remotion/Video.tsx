import { Composition } from 'remotion'
import { FaktoryDemo } from './FaktoryDemo'
import { ProductDemo } from './ProductDemo'
import { InteractiveDemo } from './InteractiveDemo'

export const RemotionVideo = () => {
  return (
    <>
      <Composition
        id="FaktoryDemo"
        component={FaktoryDemo}
        durationInFrames={2700} // 90 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ProductDemo"
        component={ProductDemo}
        durationInFrames={1440} // 48 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="InteractiveDemo"
        component={InteractiveDemo}
        durationInFrames={2700} // 90 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  )
}
