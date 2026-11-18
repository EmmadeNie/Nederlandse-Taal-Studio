import { Composition, Still, registerRoot } from "remotion";
import { Demo, durationOf, FPS } from "./Demo";
import { MANIFESTS } from "./manifests";
import { Og } from "./Og";

function Root() {
  return (
    <>
      {Object.keys(MANIFESTS).flatMap((lang) => [
        // Desktop: 16:10. Phones: a taller 4:5 cut of the same video.
        <Composition key={lang} id={`demo-${lang}`} component={Demo} defaultProps={{ lang }} durationInFrames={durationOf()} fps={FPS} width={1920} height={1200} />,
        <Composition key={`${lang}-p`} id={`demo-${lang}-portrait`} component={Demo} defaultProps={{ lang }} durationInFrames={durationOf()} fps={FPS} width={1080} height={1350} />,
      ])}
      {/* The link preview for WhatsApp, LinkedIn & co. */}
      <Still id="og" component={Og} defaultProps={{ lang: "nl" }} width={1200} height={630} />
    </>
  );
}

registerRoot(Root);
