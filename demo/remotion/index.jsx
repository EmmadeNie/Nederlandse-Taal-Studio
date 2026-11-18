import { Composition, registerRoot } from "remotion";
import { Demo, durationOf, FPS } from "./Demo";
import { MANIFESTS } from "./manifests";

function Root() {
  return (
    <>
      {Object.keys(MANIFESTS).flatMap((lang) => [
        // Desktop: 16:10. Phones: a taller 4:5 cut of the same video.
        <Composition key={lang} id={`demo-${lang}`} component={Demo} defaultProps={{ lang }} durationInFrames={durationOf()} fps={FPS} width={1920} height={1200} />,
        <Composition key={`${lang}-p`} id={`demo-${lang}-portrait`} component={Demo} defaultProps={{ lang }} durationInFrames={durationOf()} fps={FPS} width={1080} height={1350} />,
      ])}
    </>
  );
}

registerRoot(Root);
